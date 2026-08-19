#!/usr/bin/env node
// elicitation-points-check-test - the point check fails a tree it should fail.
//
// It exists for the recommendation rule specifically. That rule was written because an agent
// left to pick its own recommendation picks the cautious one: on stayget four of five
// recommendations pointed at the least convergent answer, and the layout question recommended
// keeping the repository's own - an adoption recommending against adopting. A rule like that is
// worth exactly as much as the check behind it, and a check that only ever runs against a tree
// that satisfies it cannot tell agreement from blindness.
//
// Usage: node tools/elicitation-points-check-test.mjs
// Exit: 0 all cases behave | 1 any case behaves differently
// Zone 1 tooling - never shipped.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = mkdtempSync(`${tmpdir()}/points-check-`);
const skills = `${root}/skills`;
mkdirSync(`${skills}/t`, { recursive: true });

const skill = (options, preamble = []) =>
  writeFileSync(
    `${skills}/t/q.md`,
    [
      ...preamble,
      "### `[t.one]` A question",
      "",
      "Call `AskUserQuestion` with the header `[t.one]`.",
      "",
      `Options, in order: ${options}`,
      "",
    ].join("\n"),
  );

const points = (point) => {
  const file = `${root}/points.json`;
  writeFileSync(file, JSON.stringify({ points: [{ id: "t.one", skill: "t", file: "q.md", required: true, ...point }] }));
  return file;
};

const run = (pointsFile) =>
  spawnSync("node", ["tools/elicitation-points-check.mjs", "--points", pointsFile, "--skills", skills], { encoding: "utf8" });

const CONVERGENT = "**move ours into the standard's layout** (recommended) / **keep ours** / **suggest it**";
const CAUTIOUS = "**keep ours** / **move ours into the standard's layout** / **suggest it**";

const CASES = [
  {
    name: "the declared recommendation is offered first",
    options: CONVERGENT,
    point: { recommended: "move ours into the standard's layout" },
    exit: 0,
    why: "without this the check could be refusing everything and look strict",
  },
  {
    name: "the cautious answer is offered first while the declaration says otherwise",
    options: CAUTIOUS,
    point: { recommended: "move ours into the standard's layout" },
    exit: 1,
    expect: "offers",
    why: "the stayget failure, reduced to two lines of prose",
  },
  {
    name: "a point that declares no recommendation at all",
    options: CONVERGENT,
    point: {},
    exit: 1,
    expect: "no `recommended` key",
    why: "omission is how a rule dies quietly - it has to be a failure, not a default",
  },
  {
    name: "a prose mention of the id before its heading is not the call site",
    options: CONVERGENT,
    preamble: ["### Another question", "", "Answer this one before `[t.one]`, below.", "", "Options, in order: **keep ours** / **move ours**", ""],
    point: { recommended: "move ours into the standard's layout" },
    exit: 0,
    why: "skills cite these ids in prose; anchoring on the citation reads the wrong question's list",
  },
  {
    name: "null is a legal declaration, for a question with no such axis",
    options: "**mine** / **somebody else's** / **do not record it**",
    point: { recommended: null },
    exit: 0,
    why: "consent has no convergent answer and must not be nudged into one",
  },
];

let bad = 0;
for (const c of CASES) {
  skill(c.options, c.preamble);
  const r = run(points(c.point));
  const out = `${r.stdout}${r.stderr}`;
  const wrongExit = r.status !== c.exit;
  const wrongText = c.expect && !out.includes(c.expect);
  if (wrongExit || wrongText) {
    bad++;
    console.log(`  FAIL  ${c.name}`);
    console.log(`        expected exit ${c.exit}${c.expect ? ` and text containing "${c.expect}"` : ""}, got exit ${r.status}`);
    console.log(`        ${out.trim().split("\n").join("\n        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

rmSync(root, { recursive: true, force: true });

console.log(
  bad === 0
    ? `\nelicitation-points-check-test: OK - ${CASES.length} case(s)`
    : `\nelicitation-points-check-test: FAIL - ${bad} of ${CASES.length} case(s)`,
);
process.exit(bad === 0 ? 0 : 1);
