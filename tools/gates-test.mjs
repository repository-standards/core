#!/usr/bin/env node
// gates-test - the local gate runner reads the whole workflow, or says it could not.
//
// `tools/gates.mjs` exists to stop one thing: a pre-push run that is a subset of CI. Its
// own failure mode is therefore the failure it was built to prevent - a parser that quietly
// reads twenty steps out of twenty-five reports OK on a green subset while the gate it
// skipped is the one that would have failed. Nothing about that looks wrong from the
// outside, which is why the count is asserted here against the workflow itself rather than
// against a number written down.
//
// Usage: node tools/gates-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUNNER = join(process.cwd(), "tools/gates.mjs");
const WORKFLOW = join(process.cwd(), ".github/workflows/checks.yml");

let failures = 0;
const check = (label, ok, detail) => {
  if (ok) {
    console.log(`  ok    ${label}`);
    return;
  }
  failures++;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const list = (workflow) =>
  spawnSync("node", [RUNNER, "--list", ...(workflow ? ["--workflow", workflow] : [])], {
    encoding: "utf8",
  });

const dir = mkdtempSync(join(tmpdir(), "gates-test-"));
const fixture = (name, body) => {
  const path = join(dir, name);
  writeFileSync(path, body);
  return path;
};

try {
  // The real workflow, counted two ways. The runner's own count has to equal the number of
  // `run:` keys in the file - if a gate is added tomorrow and the parser cannot see it, this
  // is what says so.
  const workflowText = readFileSync(WORKFLOW, "utf8");
  const runKeys = workflowText.split("\n").filter((l) => /^ {8}run:/.test(l)).length;
  const real = list();
  const counted = real.stdout.match(/gates --list: (\d+) step\(s\)/);
  check("the runner reads every run: step in the real workflow", Number(counted?.[1]) === runKeys, `runner ${counted?.[1]}, workflow ${runKeys}`);
  check("every gate in the real workflow is named", !real.stdout.includes("(unnamed step)"));

  // A block scalar and an inline command are both steps; a `uses:` setup action is not.
  const mixed = fixture(
    "mixed.yml",
    [
      "jobs:",
      "  gates:",
      "    steps:",
      "      - uses: actions/checkout@abc",
      "        with:",
      "          fetch-depth: 0",
      "      - name: block",
      "        run: |",
      "          echo one",
      "          echo two",
      "      - name: inline",
      "        run: echo three",
      "",
    ].join("\n"),
  );
  const mixedOut = list(mixed);
  check("a block scalar and an inline run are both read, a uses: step is not", /gates --list: 2 step\(s\)/.test(mixedOut.stdout), mixedOut.stdout.trim());
  check("a block scalar keeps both of its lines", mixedOut.stdout.includes("echo one\necho two"));

  // base_ref is the one expression the runner can supply.
  const based = fixture(
    "based.yml",
    ["jobs:", "  gates:", "    steps:", "      - name: diffed", '        run: guard --base "origin/${{ github.base_ref }}"', ""].join("\n"),
  );
  check("github.base_ref is substituted with the branch name", list(based).stdout.includes('guard --base "origin/main"'));
  const custom = spawnSync("node", [RUNNER, "--list", "--workflow", based, "--base", "release"], { encoding: "utf8" });
  check("--base overrides it", custom.stdout.includes('guard --base "origin/release"'));

  // The refusals. Each one exits non-zero rather than running a partial list.
  const unknown = fixture(
    "unknown.yml",
    ["jobs:", "  gates:", "    steps:", "      - name: secret", "        run: deploy --token ${{ secrets.TOKEN }}", ""].join("\n"),
  );
  const unknownOut = list(unknown);
  check("an expression the runner cannot supply is refused, not guessed", unknownOut.status === 2 && /secrets\.TOKEN/.test(unknownOut.stderr), `status ${unknownOut.status}`);

  const conditional = fixture(
    "conditional.yml",
    ["jobs:", "  gates:", "    steps:", "      - name: push only", "        if: github.event_name == 'push'", "        run: node tools/thing.mjs", ""].join("\n"),
  );
  const conditionalOut = list(conditional);
  check("a step CI may skip is refused, not run as if it were unconditional", conditionalOut.status === 2 && /conditional/.test(conditionalOut.stderr), `status ${conditionalOut.status}`);

  const noSteps = fixture("nosteps.yml", ["jobs:", "  gates:", "    runs-on: ubuntu-24.04", ""].join("\n"));
  const noStepsOut = list(noSteps);
  check("a workflow with no steps: block is an error, not an empty pass", noStepsOut.status === 2, `status ${noStepsOut.status}`);

  const emptySteps = fixture(
    "empty.yml",
    ["jobs:", "  gates:", "    steps:", "      - uses: actions/checkout@abc", ""].join("\n"),
  );
  const emptyOut = list(emptySteps);
  check("a steps: block holding nothing runnable is an error, not an empty pass", emptyOut.status === 2, `status ${emptyOut.status}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures) {
  console.log(`\ngates-test: FAIL - ${failures} case(s)`);
  process.exit(1);
}
console.log("\ngates-test: OK - the runner reads the whole workflow or refuses, and never a subset of it");
