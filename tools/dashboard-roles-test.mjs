#!/usr/bin/env node
// dashboard-roles-test - drive the shipped dashboard generator over fixture repos and read the
// data it embedded, for the model ADR-064 introduced: a backlog row names the role it serves
// (under `role`, or the `persona` column a repo has not renamed yet), and a spec shows its job
// stories with the acceptance criteria that prove them, or is counted as having none.
//
// Usage: node tools/dashboard-roles-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GEN = join(process.cwd(), "standard/scripts/generate-dashboard/index.mjs");

const pool = (col, value) =>
  `# Backlog\n\n## Epic: booking\n\n| id | title | ${col} | why | status |\n|---|---|---|---|---|\n| BK-1 | Book tonight | ${value} | revenue | todo |\n`;

const spec = (status, stories = "") =>
  `# Booking\n\n**Serves:** \`Guest\` (spontaneous weekend)\n**Status:** ${status}\n\n## Purpose\n\nTake a booking.\n\n${stories}## Acceptance criteria\n\n- **One-flow booking.** GIVEN a place free tonight WHEN booked THEN confirmed.\n`;

const STORIES =
  "## Job stories\n\n- **JS-1.** When I find a place for tonight, I want to book it in one flow, so I can stop searching.\n  - GIVEN a place free tonight WHEN booked from a phone THEN confirmed in one flow. (AC: One-flow booking)\n\n";

const build = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "dashboard-roles-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  const out = join(dir, "out/index.html");
  const r = spawnSync("node", [GEN, dir, "--out", out], { encoding: "utf8" });
  try {
    if ((r.status ?? 1) !== 0) throw new Error(`generator exited ${r.status}: ${r.stderr ?? ""}`);
    const raw = readFileSync(out, "utf8").match(/<script type="application\/json" id="work-data">([\s\S]*?)<\/script>/);
    if (!raw) throw new Error("built page carries no work-data payload");
    return JSON.parse(raw[1].replace(/\\u003c/g, "<"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const CASES = [
  {
    name: "a backlog row's role column reaches the item",
    files: { "docs/backlog.md": pool("role", "Guest") },
    assert: (D) => D.items[0]?.role === "Guest" || `role was ${JSON.stringify(D.items[0]?.role)}`,
  },
  {
    name: "a backlog still using the persona column is read as the role",
    files: { "docs/backlog.md": pool("persona", "Guest") },
    assert: (D) => D.items[0]?.role === "Guest" || `role was ${JSON.stringify(D.items[0]?.role)}`,
  },
  {
    name: "a spec's job stories carry the criteria that prove them",
    files: { "specs/booking/spec.md": spec("in-refinement", STORIES) },
    assert: (D) => {
      const j = D.specs[0]?.jobStories?.[0];
      if (!j || j.id !== "JS-1") return `job stories were ${JSON.stringify(D.specs[0]?.jobStories)}`;
      if (j.proves.join() !== "One-flow booking") return `proves was ${JSON.stringify(j.proves)}`;
      return D.counts.specsNoStories === 0 || `specsNoStories was ${D.counts.specsNoStories}`;
    },
  },
  {
    name: "a spec with no job stories is counted",
    files: { "specs/booking/spec.md": spec("in-refinement") },
    assert: (D) => D.counts.specsNoStories === 1 || `specsNoStories was ${D.counts.specsNoStories}`,
  },
  {
    name: "a spec saved with CRLF and a differently cased heading still shows its stories",
    files: { "specs/booking/spec.md": spec("in-refinement", STORIES.replace("## Job stories", "## Job Stories")).replace(/\n/g, "\r\n") },
    assert: (D) => D.specs[0]?.jobStories?.[0]?.proves?.join() === "One-flow booking" || `job stories were ${JSON.stringify(D.specs[0]?.jobStories)}`,
  },
  {
    name: "a retired spec with a reason and the template's comment is not counted",
    files: { "specs/booking/spec.md": spec("retired - superseded by billing   <!-- see BDR-004 -->") },
    assert: (D) => D.counts.specsNoStories === 0 || `specsNoStories was ${D.counts.specsNoStories}`,
  },
  {
    name: "a retired spec is not counted as missing job stories",
    files: { "specs/booking/spec.md": spec("retired") },
    assert: (D) => D.counts.specsNoStories === 0 || `specsNoStories was ${D.counts.specsNoStories}`,
  },
];

let failures = 0;
for (const c of CASES) {
  let problem;
  try {
    const verdict = c.assert(build(c.files));
    problem = verdict === true ? null : verdict;
  } catch (e) {
    problem = e.message;
  }
  if (problem) {
    failures++;
    console.error(`  FAIL ${c.name}\n       ${problem}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}
if (failures) {
  console.error(`\ndashboard-roles-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\ndashboard-roles-test: OK - ${CASES.length} cases, a row shows the role it serves and a spec shows what that role needs`);
