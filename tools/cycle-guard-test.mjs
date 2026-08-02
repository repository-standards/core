#!/usr/bin/env node
// cycle-guard-test - drive the shipped work-cycle guard over real fixtures.
//
// The guard's whole job is one invariant: an intent is in the backlog pool or in exactly
// one cycle. It reports nothing when a repo has no cycles, which is correct behaviour and
// also what a broken version looks like - so the cases below assert both directions.
//
// The template case is the one worth naming: the shipped `_template.md` carries example
// ids, and if the guard read them the tree would violate its own invariant the moment it
// landed in a repo whose backlog uses the same ids.
//
// Usage: node tools/cycle-guard-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/cycle-guard.mjs");
const TEMPLATE = join(process.cwd(), "standard/docs/cycles/_template.md");

const table = (...ids) =>
  `| id | title |\n|----|-------|\n${ids.map((i) => `| ${i} | something |`).join("\n")}\n`;

// spawnSync, not execFileSync: the guard reports violations on stderr and advisory runs
// still exit 0, so a success-only capture loses exactly the output the advisory case is
// asserting. The first version of this test did that and reported a false failure.
const run = (dir, block) => {
  const r = spawnSync("node", [GUARD, ...(block ? ["--block"] : [])], { cwd: dir, encoding: "utf8" });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

// files: { "docs/backlog.md": "...", "docs/cycles/team/x.md": "..." }
const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "cycle-guard-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return dir;
};

let failures = 0;
const check = (name, { files, block = true, code, expect }) => {
  const dir = fixture(files);
  const { code: got, out } = run(dir, block);
  rmSync(dir, { recursive: true, force: true });
  const wrong = got !== code || (expect && !expect.every((s) => out.includes(s)));
  if (wrong) {
    failures++;
    console.error(`  FAIL ${name}\n       expected exit ${code}${expect ? ` containing ${expect.join(" + ")}` : ""}, got ${got}\n       ${out.trim().split("\n").join("\n       ")}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const POOL = "docs/backlog.md";
const CYC_A = "docs/cycles/payments/august.md";
const CYC_B = "docs/cycles/growth/august.md";

check("a repo with no cycles directory is not using cycles", {
  files: { [POOL]: table("SPEC-1", "SPEC-2") },
  code: 0,
  expect: ["does not use work cycles"],
});

check("pool and one cycle, no overlap", {
  files: { [POOL]: table("SPEC-1", "SPEC-2"), [CYC_A]: table("PAY-9") },
  code: 0,
  expect: ["OK", "3 intent(s)"],
});

check("an intent in the pool and a cycle at once fails", {
  files: { [POOL]: table("SPEC-1", "PAY-9"), [CYC_A]: table("PAY-9") },
  code: 1,
  expect: ["PAY-9 is in 2 places", "in more than one place"],
});

check("the same intent in two teams' cycles fails", {
  files: { [POOL]: table("SPEC-1"), [CYC_A]: table("PAY-9"), [CYC_B]: table("PAY-9") },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("every violation is reported, not just the first", {
  files: { [POOL]: table("A-1", "B-2"), [CYC_A]: table("A-1", "B-2") },
  code: 1,
  expect: ["A-1 is in 2 places", "B-2 is in 2 places"],
});

check("advisory without --block: reports and exits 0", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: table("PAY-9") },
  block: false,
  code: 0,
  expect: ["PAY-9 is in 2 places"],
});

check("rows inside an HTML comment do not count", {
  files: {
    [POOL]: table("PAY-9"),
    [CYC_A]: `# Cycle\n\n<!-- an example, not real rows:\n${table("PAY-9")}-->\n`,
  },
  code: 0,
  expect: ["OK"],
});

check("prose in the first cell is not mistaken for an id", {
  files: { [POOL]: `| Doc | For |\n|---|---|\n| something | else |\n`, [CYC_A]: table("PAY-9") },
  code: 0,
  expect: ["OK", "1 intent(s)"],
});

check("a cycle with no rows yet is valid", {
  files: { [POOL]: table("SPEC-1"), [CYC_A]: "# Cycle\n\nnothing pulled in yet.\n" },
  code: 0,
  expect: ["OK"],
});

// The shipped backlog template, verbatim - its in-flight pointer table lists cycles, not
// intents, and its example row must not read as one.
{
  const dir = fixture({ [CYC_A]: table("PAY-2", "PAY-3") });
  cpSync(join(process.cwd(), "standard/docs/backlog.md"), join(dir, POOL));
  const { code, out } = run(dir, true);
  rmSync(dir, { recursive: true, force: true });
  if (code !== 0) {
    failures++;
    console.error(`  FAIL the shipped backlog template does not trip the guard\n       exit ${code}: ${out.trim()}`);
  } else {
    console.log("  ok    the shipped backlog template does not trip the guard");
  }
}

// The shipped cycle template, verbatim - its example ids must not collide with a real backlog.
{
  const dir = fixture({ [POOL]: table("PAY-2", "PAY-3") });
  mkdirSync(join(dir, "docs/cycles"), { recursive: true });
  cpSync(TEMPLATE, join(dir, "docs/cycles/_template.md"));
  const { code, out } = run(dir, true);
  rmSync(dir, { recursive: true, force: true });
  if (code !== 0) {
    failures++;
    console.error(`  FAIL the shipped template does not trip the guard\n       exit ${code}: ${out.trim()}`);
  } else {
    console.log("  ok    the shipped template does not trip the guard");
  }
}

console.log();
if (failures) {
  console.error(`cycle-guard-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log("cycle-guard-test: OK - 11 cases, one intent lives in exactly one place");
