#!/usr/bin/env node
// dashboard-status-test - drive the shipped dashboard generator over status cells written the
// way people actually write them.
//
// This parser can only fail quietly, and it did. Every status word was matched anchored at the
// first character of the raw cell, so `**done**: ...` - emphasis being how a human writes a
// status they mean - matched nothing and fell through to the `todo` default. The page then
// reported finished work as not started, in a layout that looked entirely healthy. Found on a
// real adopted repo where 16 of 17 rows read "agreed, not started" while the file said done.
//
// So the cases below assert the parse, not the render: the shapes that broke it, the two
// directions a cell naming two states can be read in, and the bare shapes that must not move.
//
// Usage: node tools/dashboard-status-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GEN = join(process.cwd(), "standard/scripts/generate-dashboard/index.mjs");

// id, the status cell verbatim, the state it must parse to, why that is the right answer, and
// the row's type where it is not a plain task - open-question and idea rows carry their own
// vocabulary (ADR-046) and are deliberately outside the task counters.
const ROWS = [
  ["BARE-1", "done", "done", "the one shape that always worked, and must keep working"],
  ["BARE-2", "todo", "todo", "likewise"],
  ["BARE-3", "doing", "doing", "likewise"],
  ["EMPH-1", "**done**: 22/22 pass locally", "done", "emphasis is how a human writes a status they mean"],
  ["EMPH-2", "*done*", "done", "single asterisks are emphasis too"],
  ["EMPH-3", "`todo`", "todo", "and so are code ticks"],
  ["EMPH-4", "__blocked__ - waiting on review", "blocked", "underscores, and a note after the state"],
  ["EMPH-5", "   **done**", "done", "a cell can be indented; the anchor used to care"],
  ["PHRASE-1", "**done, scoped**: the note follows", "done", "the emphasis wraps a phrase, not just the word"],
  ["PHRASE-2", "**unblocked, todo**: it is now startable", "todo", "`unblocked` is not `blocked`, and `todo` is the only state named"],
  ["PHRASE-3", "**done, and the crop premise was half wrong**", "done", "`half` here qualifies `wrong`, not `done` - this row is finished"],
  ["PARTLY-1", "**partly done, one real gap found (2026-08-04)**. Checked live", "doing", "work remains, so it is neither done nor untouched"],
  ["PARTLY-2", "**mostly done**", "doing", "same qualifier family"],
  ["PARTLY-3", "nearly-done", "doing", "hyphenated, still not done"],
  ["TWO-1", "doing (site confirmed live 2026-08-09; listings submission still todo)", "doing", "the state is first, the parenthetical is commentary about a part of it"],
  ["TWO-2", "todo (downgraded from `doing` 2026-08-09, pending owner confirmation)", "todo", "the same shape pointing the other way - a last-word rule reads both backwards"],
  ["VOCAB-1", "**decided**: ADR-014 settled it", "decided", "the open-question vocabulary needs the same tolerance", "open-question"],
  ["VOCAB-2", "**exploring**", "exploring", "and so does the idea vocabulary", "idea"],
  ["FALL-1", "waiting on the owner", "todo", "an unrecognised lead still falls back, as it always did"],
  ["FALL-2", "", "todo", "and so does an empty cell"],
];

// Parsed out separately because they are not a status word: what the row says about who blocks
// it, when it last moved, and what is left of the cell once the state is taken off it.
const FIELDS = [
  ["BLOCK-1", "blocked:STD-2 (2026-08-01) - waiting on the schema", { status: "blocked", blockedBy: "STD-2", statusDate: "2026-08-01", statusNote: "waiting on the schema" }],
  ["BLOCK-2", "**blocked:STD-2**: waiting on the schema", { status: "blocked", blockedBy: "STD-2", statusNote: "waiting on the schema" }],
  ["NOTE-1", "**done**: 22/22 pass locally", { statusNote: "22/22 pass locally" }],
  ["NOTE-2", "done", { statusNote: "" }],
  // The qualifier is the reason the badge says `doing`, so dropping it would leave the page
  // unable to explain itself. A bare state has nothing to keep and keeps nothing.
  ["NOTE-3", "**partly done, one real gap found**. Checked live", { statusNote: "partly done, one real gap found. Checked live" }],
];

const row = (id, status, type = "task") => `| ${id} | ${type} | ${id} title | because | it is done | ${status} |`;

const BACKLOG = `# Backlog

## Epic: Parsing statuses the way they are written

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
${[...ROWS.map(([id, cell, , , type]) => row(id, cell, type)), ...FIELDS.map(([id, cell]) => row(id, cell))].join("\n")}
`;

// A record whose Status cell is emphasised is the same defect on another surface: page.js maps
// the value onto a colour by exact word and prints it as written.
const ADR = `# ADR-001: Something was decided

| | |
|---|---|
| **Status** | **Accepted - one gateway** |
| **Date** | 2026-08-09 |

## Context

It needed deciding.
`;

const repo = mkdtempSync(join(tmpdir(), "dashboard-status-test-"));
const out = join(repo, "out.html");
for (const [rel, body] of Object.entries({
  "backlog.md": BACKLOG,
  "docs/decision-records/ADR-001-something.md": ADR,
})) {
  mkdirSync(dirname(join(repo, rel)), { recursive: true });
  writeFileSync(join(repo, rel), body);
}

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

let data;
try {
  execFileSync("node", [GEN, repo, "--out", out], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const html = readFileSync(out, "utf8");
  data = JSON.parse(/<script type="application\/json" id="work-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
} catch (e) {
  console.log(`dashboard-status-test: FAIL - the generator did not produce a page\n${e.stdout ?? ""}${e.stderr ?? e.message}`);
  rmSync(repo, { recursive: true, force: true });
  process.exit(1);
}

const byId = new Map(data.items.map((i) => [i.id, i]));

for (const [id, cell, want, why] of ROWS) {
  const got = byId.get(id);
  if (!got) fail(`${id} never reached the page at all`);
  else if (got.status !== want) fail(`${id} "${cell}" parsed as ${got.status}, expected ${want} - ${why}`);
  else console.log(`  ok    ${JSON.stringify(cell)} -> ${want}`);
}

for (const [id, cell, want] of FIELDS) {
  const got = byId.get(id);
  if (!got) {
    fail(`${id} never reached the page at all`);
    continue;
  }
  const wrong = Object.entries(want).filter(([k, v]) => (got[k] ?? "") !== v);
  if (wrong.length) fail(`${id} "${cell}" - ${wrong.map(([k, v]) => `${k} is ${JSON.stringify(got[k])}, expected ${JSON.stringify(v)}`).join("; ")}`);
  else console.log(`  ok    ${JSON.stringify(cell)} -> ${Object.keys(want).join(", ")}`);
}

const adr = data.decisions[0];
if (!adr) fail("the decision record never reached the page");
else if (adr.status !== "Accepted - one gateway") fail(`the record's status is ${JSON.stringify(adr.status)}, expected "Accepted - one gateway" - emphasis is not part of the value`);
else console.log(`  ok    "**Accepted - one gateway**" -> ${JSON.stringify(adr.status)}`);

// The counters are what a reader actually looks at, and they are the thing the bug corrupted:
// before the fix every emphasised row landed in `todo` and these four numbers were fiction.
// Counted from the rows above, task and bug only - the two vocabulary rows sit outside them.
const want = { done: 8, doing: 6, blocked: 3, todo: 6 };
for (const [k, v] of Object.entries(want)) {
  if (data.counts[k] !== v) fail(`counts.${k} is ${data.counts[k]}, expected ${v}`);
  else console.log(`  ok    counts.${k} = ${v}`);
}

rmSync(repo, { recursive: true, force: true });

const total = ROWS.length + FIELDS.length + 1 + Object.keys(want).length;
if (failures) {
  console.log(`\ndashboard-status-test: FAIL - ${failures} of ${total} checks`);
  process.exit(1);
}
console.log(`\ndashboard-status-test: OK - ${total} checks, a hand-written status cell is read as the state it names`);
