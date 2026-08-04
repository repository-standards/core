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
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/cycle-guard.mjs");
const TEMPLATE = join(process.cwd(), "standard/docs/cycles/_template.md");

const table = (...ids) =>
  `| id | title |\n|----|-------|\n${ids.map((i) => `| ${i} | something |`).join("\n")}\n`;

// Rows carrying a real status cell, for the `blocked:<id>` checks. The status is read as
// the last cell whatever the column count, so this deliberately uses a different width
// from `table` above - a guard that only worked at one width would pass its own tests and
// fail on the shipped ten-column table.
const statusTable = (...pairs) =>
  `| id | title | owner | status |\n|----|-------|-------|--------|\n${pairs
    .map(([id, s]) => `| ${id} | something | dev | ${s} |`)
    .join("\n")}\n`;

// A cycle file, as `cycle-open` writes one: the rows live under `## Intents`, because that
// heading is what the guard scopes to. A file without it yields no rows, and no rows reads
// exactly like a clean cycle - so these helpers exist to keep the fixtures honest about the
// shape, and the cases below assert that the missing heading is an error rather than a pass.
const cycle = (...ids) => `# Cycle\n\n## Intents\n\n${table(...ids)}`;
const cycleStatus = (...pairs) => `# Cycle\n\n## Intents\n\n${statusTable(...pairs)}`;

// A closed cycle carrying an `## Outcome` block, for the returned-id checks.
const closedCycle = (ids, outcome) =>
  `# Cycle\n\n| | |\n| --- | --- |\n| **Status** | closed |\n\n## Intents\n\n${table(...ids)}\n## Outcome\n\n${outcome}\n`;

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
  expect: ["no cycles in use"],
});

check("pool and one cycle, no overlap", {
  files: { [POOL]: table("SPEC-1", "SPEC-2"), [CYC_A]: cycle("PAY-9") },
  code: 0,
  expect: ["OK", "3 intent(s)"],
});

check("an intent in the pool and a cycle at once fails", {
  files: { [POOL]: table("SPEC-1", "PAY-9"), [CYC_A]: cycle("PAY-9") },
  code: 1,
  expect: ["PAY-9 is in 2 places", "belongs to the pool or to one cycle"],
});

check("the same intent in two teams' cycles fails", {
  files: { [POOL]: table("SPEC-1"), [CYC_A]: cycle("PAY-9"), [CYC_B]: cycle("PAY-9") },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("every violation is reported, not just the first", {
  files: { [POOL]: table("A-1", "B-2"), [CYC_A]: cycle("A-1", "B-2") },
  code: 1,
  expect: ["A-1 is in 2 places", "B-2 is in 2 places"],
});

check("advisory without --block: reports and exits 0", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: cycle("PAY-9") },
  block: false,
  code: 0,
  expect: ["PAY-9 is in 2 places"],
});

check("rows inside an HTML comment do not count", {
  files: {
    [POOL]: table("PAY-9"),
    [CYC_A]: `# Cycle\n\n## Intents\n\n<!-- an example, not real rows:\n${table("PAY-9")}-->\n`,
  },
  code: 0,
  expect: ["OK"],
});

check("prose in the first cell is not mistaken for an id", {
  files: { [POOL]: `| Doc | For |\n|---|---|\n| something | else |\n`, [CYC_A]: cycle("PAY-9") },
  code: 0,
  expect: ["OK", "1 intent(s)"],
});

check("a cycle with no rows yet is valid", {
  files: { [POOL]: table("SPEC-1"), [CYC_A]: "# Cycle\n\n## Intents\n\nnothing pulled in yet.\n" },
  code: 0,
  expect: ["OK"],
});

// The shipped backlog template, verbatim - its in-flight pointer table lists cycles, not
// intents, and its example row must not read as one.
{
  const dir = fixture({ [CYC_A]: cycle("PAY-2", "PAY-3") });
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

check("the backlog at its primary manifest path is still read", {
  files: { "backlog.md": table("PAY-9"), [CYC_A]: cycle("PAY-9") },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("cycles with no backlog anywhere is reported, not passed", {
  files: { [CYC_A]: cycle("PAY-9") },
  code: 1,
  expect: ["no backlog at", "cannot be checked"],
});

check("the derived timeline is not a cycle", {
  files: { [POOL]: table("SPEC-1"), [CYC_A]: cycle("PAY-9"), "docs/cycles/TIMELINE.md": table("PAY-9") },
  code: 0,
  expect: ["OK"],
});

check("a template directory is skipped like a template file", {
  files: { [POOL]: table("PAY-9"), "docs/cycles/_drafts/x.md": table("PAY-9") },
  code: 0,
  // Skipping `_drafts/` leaves no cycle files at all, so the guard takes the
  // not-using-cycles branch rather than reporting OK. Either way PAY-9 is not duplicated,
  // which is what this asserts.
  expect: ["no cycles in use"],
});

check("an inline comment inside a row does not delete the row", {
  files: {
    [POOL]: `| id | title |\n|----|-------|\n| PAY-7 | fix <!-- was PAY-4 --> the export |\n`,
    [CYC_A]: cycle("PAY-7"),
  },
  code: 1,
  expect: ["PAY-7 is in 2 places"],
});

// `-->` ends an HTML comment wherever it appears - that is the spec, and every markdown
// renderer does it. So an example block containing `migrate A --> B` really is un-commented
// from that point on, in the reader's browser as much as in this guard. Matching HTML here
// is correct; deviating would make the guard disagree with what the author sees rendered.
// The hazard is real, so it is asserted rather than left to be rediscovered: a commented
// block must not contain an arrow, and none of the shipped templates does.
check("an arrow in commented prose ends the comment, exactly as a renderer would", {
  files: {
    [POOL]: table("PAY-9"),
    [CYC_A]: `# Cycle\n\n## Intents\n\n<!-- example:\nmigrate A --> B\n${table("PAY-9")}-->\n`,
  },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("a table inside a fenced block is illustration, not rows", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: "# Cycle\n\n## Intents\n\n```\n" + table("PAY-9") + "```\n" },
  code: 0,
  expect: ["OK"],
});

// The shipped cycle template, instantiated the way cycle-open tells a user to instantiate
// it - at a real cycle path, without the `_` prefix. The earlier version of this case
// copied it to `_template.md` and so proved only the filename rule, while its comment
// claimed the comment-skipping rule. That gap hid an entity-escaped template whose
// "comment" was not one.
{
  const dir = fixture({ [POOL]: table("PAY-2", "PAY-3") });
  mkdirSync(join(dir, "docs/cycles/payments"), { recursive: true });
  cpSync(TEMPLATE, join(dir, "docs/cycles/payments/august.md"));
  const { code, out } = run(dir, true);
  rmSync(dir, { recursive: true, force: true });
  if (code !== 0) {
    failures++;
    console.error(`  FAIL the shipped template, instantiated as a real cycle, does not trip the guard\n       exit ${code}: ${out.trim()}`);
  } else {
    console.log("  ok    the shipped template, instantiated as a real cycle, does not trip the guard");
  }
}

check("a block naming a live intent is fine", {
  files: { [POOL]: statusTable(["PAY-1", "todo"], ["PAY-2", "blocked:PAY-1"]) },
  code: 0,
  expect: ["OK", "1 live block(s)"],
});

check("a block naming an intent that exists nowhere is stale", {
  files: { [POOL]: statusTable(["PAY-2", "blocked:PAY-9"]) },
  code: 1,
  expect: ["PAY-9 exists nowhere", "no longer applies"],
});

check("a block naming a finished intent is stale", {
  files: { [POOL]: statusTable(["PAY-1", "done"], ["PAY-2", "blocked:PAY-1"]) },
  code: 1,
  expect: ["PAY-1 is done", "no longer applies"],
});

check("an intent blocked by itself fails", {
  files: { [POOL]: statusTable(["PAY-1", "blocked:PAY-1"]) },
  code: 1,
  expect: ["blocked by itself"],
});

check("a block reaches across the pool into a cycle", {
  files: {
    [POOL]: statusTable(["PAY-2", "blocked:PAY-1"]),
    [CYC_A]: cycleStatus(["PAY-1", "doing"]),
  },
  code: 0,
  expect: ["OK"],
});

check("plain `blocked` with no reference stays legal", {
  files: { [POOL]: statusTable(["PAY-2", "blocked"]) },
  code: 0,
  expect: ["OK"],
});

// Scoping the scan to `## Intents` is also how the check switches itself off. Every case
// below produced zero rows and a green `OK - each in exactly one` over a real duplicate.
check("a cycle with no Intents heading is an error, not an empty cycle", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: `# Cycle\n\n${table("PAY-9")}` },
  code: 1,
  expect: ["no `## Intents` heading", "the format is the interface"],
});

check("a deeper heading level is not the Intents heading", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: `# Cycle\n\n### Intents\n\n${table("PAY-9")}` },
  code: 1,
  expect: ["no `## Intents` heading"],
});

check("another heading over the same table is an error", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: `# Cycle\n\n## Work\n\n${table("PAY-9")}` },
  code: 1,
  expect: ["no `## Intents` heading"],
});

check("rows carrying the id and title in one cell are reported, not skipped", {
  files: {
    [POOL]: table("SPEC-1"),
    [CYC_A]: "# Cycle\n\n## Intents\n\n| Intent | Holder | Status |\n|---|---|---|\n| INV-2 Reassign an active route | Maja | doing |\n",
  },
  code: 1,
  expect: ["no intent id in the first cell"],
});

check("an id in backticks is the same intent", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: "# Cycle\n\n## Intents\n\n| id | title |\n|---|---|\n| `PAY-9` | something |\n" },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("a bold id is the same intent", {
  files: { [POOL]: table("PAY-9"), [CYC_A]: "# Cycle\n\n## Intents\n\n| id | title |\n|---|---|\n| **PAY-9** | something |\n" },
  code: 1,
  expect: ["PAY-9 is in 2 places"],
});

check("a blocked status in backticks is still read", {
  files: { [POOL]: statusTable(["PAY-2", "`blocked:PAY-9`"]) },
  code: 1,
  expect: ["PAY-9 exists nowhere"],
});

// The folder manual is what an author reads before writing a cycle by hand, and it
// documented a shape this guard cannot read - the defect and its documentation agreeing
// would have made the whole check decoration. Asserted against the page itself, not a copy.
{
  const manual = readFileSync(join(process.cwd(), "docs/tree/docs-cycles.md"), "utf8");
  const example = manual.match(/```markdown\n([\s\S]*?)```/);
  if (!example) {
    failures++;
    console.error("  FAIL docs/tree/docs-cycles.md has no ```markdown cycle example to check");
  } else {
    const dir = fixture({ [POOL]: table("SPEC-1"), [CYC_A]: example[1] });
    const { code, out } = run(dir, true);
    rmSync(dir, { recursive: true, force: true });
    if (code !== 0 || !out.includes("3 intent(s)")) {
      failures++;
      console.error(`  FAIL the documented cycle format is what the guard reads\n       exit ${code}: ${out.trim()}`);
    } else {
      console.log("  ok    the documented cycle format is what the guard reads");
    }
  }
}

check("an id written in backticks is still read", {
  files: { [POOL]: "| id | title |\n|----|-------|\n| `PAY-2` | something |\n", [CYC_A]: cycle("PAY-2") },
  code: 1,
  expect: ["PAY-2 is in 2 places"],
});

check("a column prepended before id does not disarm the guard", {
  files: {
    [POOL]: "| priority | id | title |\n|----|----|-------|\n| P1 | PAY-2 | something |\n",
    [CYC_A]: cycle("PAY-2"),
  },
  code: 1,
  expect: ["PAY-2 is in 2 places"],
});

check("a returned-to-pool id missing from the backlog is caught", {
  files: {
    [POOL]: table("PAY-1"),
    [CYC_A]: closedCycle(["PAY-2"], "Planned 1, finished 0, returned to the pool 1.\nReturned to the pool: PAY-9"),
  },
  code: 1,
  expect: ["says PAY-9 was returned to the pool", `not in ${POOL}`],
});

check("a returned-to-pool id that is actually in the backlog passes", {
  files: {
    [POOL]: table("PAY-1", "PAY-9"),
    [CYC_A]: closedCycle(["PAY-2"], "Planned 1, finished 0, returned to the pool 1.\nReturned to the pool: PAY-9"),
  },
  code: 0,
  expect: ["OK"],
});

check("a returned-to-pool line only matters when the cycle is closed", {
  files: {
    [POOL]: table("PAY-1"),
    [CYC_A]: `# Cycle\n\n| | |\n| --- | --- |\n| **Status** | open |\n\n## Intents\n\n${table("PAY-2")}\n## Outcome\n\nReturned to the pool: PAY-9\n`,
  },
  code: 0,
  expect: ["OK"],
});

console.log();
if (failures) {
  console.error(`cycle-guard-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(
  "cycle-guard-test: OK - one intent lives in exactly one place, blocks point at something real, a cycle the guard cannot read is an error, and a return actually lands",
);
