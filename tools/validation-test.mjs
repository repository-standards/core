#!/usr/bin/env node
// Cases for the validation renderer's arithmetic (tools/validation.mjs).
//
// The renderer produces the numbers this project publishes about itself - how many failures
// were found, how many are fixed, how many are open. Every mechanical guard in this tree has
// a test; this generator did not, and a defect lived in it: `confirmedFixed` required a `fix`
// field, so an observation that failed in one round and passed in a later one WITHOUT a pull
// request cited left the punch list (it passes) and never entered the fixed count (no link) -
// silently shrinking "failures found". Measured on real data before the fix: 167 became 164.
//
// Each case builds a throwaway suite/targets/runs tree and runs the real renderer against it
// with --root, then asserts on the rendered README.
//
// Usage: node tools/validation-test.mjs

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

let failures = 0;
const check = (name, cond, detail) => {
  if (cond) console.log(`  ok    ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
};

const CASE = (id) => ({
  id,
  title: `case ${id}`,
  area: "gates",
  tests: ["R1"],
  promise: "the guard fires",
  status: "run",
  portable: false,
  severity_if_failed: "moderate",
  given: "a fixture",
  when: "the guard runs",
  then: "it fires",
  procedure: "run it",
});

// Build a tree and render it. `runs` is [[filename, [observation, ...]], ...].
const render = (cases, runs) => {
  const dir = mkdtempSync(join(tmpdir(), "validation-test-"));
  mkdirSync(join(dir, "runs"));
  writeFileSync(join(dir, "suite.json"), JSON.stringify({ cases }));
  writeFileSync(
    join(dir, "targets.json"),
    JSON.stringify({ targets: [{ slug: "t", kind: "fixture", depth: "L2", note: "n" }] }),
  );
  for (const [file, observations] of runs) {
    writeFileSync(join(dir, "runs", file), JSON.stringify({ round: file.replace(".json", ""), observations }));
  }
  execFileSync("node", ["tools/validation.mjs", "--root", dir], { encoding: "utf8" });
  const out = readFileSync(join(dir, "README.md"), "utf8");
  rmSync(dir, { recursive: true, force: true });
  const m = /\| Failures found \| \*\*(\d+)\*\* - \*\*(\d+) fixed and re-verified\*\* \(([^)]*)\), \*\*(\d+) still open/.exec(out);
  if (!m) throw new Error(`headline row not found in rendered README:\n${out.slice(0, 900)}`);
  return { found: +m[1], fixed: +m[2], provenance: m[3], open: +m[4], out };
};

// An open fail with neither a fix nor a waiver is itself a rendering failure ("a silent,
// unpublished gap"), so a fixture that means to leave one open carries a waiver.
const OB = (id, verdict, extra = {}) => ({
  case: id,
  target: "fixture:t",
  verdict,
  evidence: "e",
  ...(verdict === "fail" && !extra.fix ? { waiver: "fixture" } : {}),
  ...extra,
});
const PR = "https://github.com/repository-standards/core/pull/99";

console.log("validation-test: the published arithmetic");

// 1. Baseline: a fail in one round, a pass with a cited PR in a later one.
{
  const r = render(
    [CASE("A-01")],
    [
      ["2026-01-01-a-first.json", [OB("A-01", "fail")]],
      ["2026-01-01-b-second.json", [OB("A-01", "pass", { fix: PR })]],
    ],
  );
  check("a pass citing a pull request counts as fixed", r.fixed === 1 && r.open === 0 && r.found === 1,
    `found=${r.found} fixed=${r.fixed} open=${r.open}`);
}

// 2. The defect. Same shape, no PR cited: the finding must not evaporate.
{
  const r = render(
    [CASE("A-01")],
    [
      ["2026-01-01-a-first.json", [OB("A-01", "fail")]],
      ["2026-01-01-b-second.json", [OB("A-01", "pass")]],
    ],
  );
  check("a pass with no pull request still counts as fixed", r.fixed === 1,
    `fixed=${r.fixed}`);
  check("the failure stays in the found total", r.found === 1,
    `found=${r.found} - a finding that failed and was fixed must remain on the record`);
  check("the headline says the fix cites no pull request", /without a pull request cited/.test(r.provenance),
    r.provenance);
}

// 3. The other direction: a pass that never failed is not a fix. Without this, every
//    green observation would inflate the fixed count and the failures-found total.
{
  const r = render([CASE("A-01")], [["2026-01-01-a-first.json", [OB("A-01", "pass")]]]);
  check("a pass that never failed is not counted as a fix", r.fixed === 0 && r.found === 0,
    `found=${r.found} fixed=${r.fixed}`);
}

// 4. A fail that is still a fail stays open, whether or not an attempt is recorded.
{
  const r = render(
    [CASE("A-01"), CASE("A-02")],
    [["2026-01-01-a-first.json", [OB("A-01", "fail"), OB("A-02", "fail", { fix: PR })]]],
  );
  check("an unfixed failure stays open", r.open === 2 && r.fixed === 0 && r.found === 2,
    `found=${r.found} fixed=${r.fixed} open=${r.open}`);
}

// 5. The pull-request count is distinct PRs among the fixes that cite one - an uncited fix
//    must not be counted as its own pull request.
{
  const r = render(
    [CASE("A-01"), CASE("A-02"), CASE("A-03")],
    [
      ["2026-01-01-a-first.json", [OB("A-01", "fail"), OB("A-02", "fail"), OB("A-03", "fail")]],
      [
        "2026-01-01-b-second.json",
        [OB("A-01", "pass", { fix: PR }), OB("A-02", "pass", { fix: PR }), OB("A-03", "pass")],
      ],
    ],
  );
  check("three fixes across one cited pull request", r.fixed === 3 && /across 1 merged pull request/.test(r.provenance),
    `fixed=${r.fixed} provenance=${r.provenance}`);
  check("the uncited fix is reported separately", /plus 1 re-verified/.test(r.provenance), r.provenance);
  check("the fixed table names the round when there is no link",
    /re-verified in `runs\/2026-01-01-b-second\.json`/.test(r.out),
    "the provenance column should name the run file instead of an empty link");
}

console.log(
  failures === 0
    ? "\nvalidation-test: OK - the ledger conserves every finding it ever recorded"
    : `\nvalidation-test: ${failures} case(s) failed`,
);
process.exit(failures === 0 ? 0 : 1);
