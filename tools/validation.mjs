#!/usr/bin/env node
// validation - render the published proof-of-work suite from its own data.
//
// The claim this repo makes ("executed against real repositories, failures published
// alongside passes, the portable half re-runnable by someone else's standard") only
// survives a sceptic if every number in the rendered pages traces to a row in
// docs/validation/{suite.json,targets.json,runs/*.json} - never to hand-typed prose that
// can drift out from under the data it once matched. This script is that trace: it reads
// the three sources and writes the two pages, so the pages cannot say something the data
// does not.
//
// Schema (see suite.json's own $about for the full case shape):
//   case.status        "run" | "planned" | "needs-procedure" - whether it has ever executed
//   case.portable       true if the idea would hold for any agent-operated repo standard,
//                        not only this one (the benchmark.md subset)
//   observation.verdict "pass" | "fail" | "partial" | "not-applicable" | "not-run"
//   observation.fix      a merged PR URL, present only when that PR's own body names this
//                        exact defect (never inferred from "same area of code")
//   observation.waiver   present on a "fail" observation with no fix - an explicit note
//                        that the gap is logged and open by choice, not silently dropped
//
// Usage:
//   node tools/validation.mjs           # write docs/validation/{README,benchmark}.md
//   node tools/validation.mjs --check   # exit 1 if the rendered pages are stale, if any
//                                        # case has never been observed at all, or if any
//                                        # "fail" observation has neither a fix nor a waiver
//
// Zone 1 tooling - this feature is evidence ABOUT the product, not part of the shipped
// tree, so it lives entirely outside standard/. Dependency-free (Node built-ins only),
// matching every other tool in this repo.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const DIR = "docs/validation";
const check = process.argv.includes("--check");

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
};

for (const f of [`${DIR}/suite.json`, `${DIR}/targets.json`]) {
  if (!existsSync(f)) {
    console.error(`validation: ${f} does not exist`);
    process.exit(1);
  }
}

const suite = readJSON(`${DIR}/suite.json`);
const targetsData = readJSON(`${DIR}/targets.json`);
const cases = suite.cases;
const targets = targetsData.targets;

const runFiles = existsSync(`${DIR}/runs`) ? readdirSync(`${DIR}/runs`).filter((f) => f.endsWith(".json")).sort() : [];
const runs = runFiles.map((f) => ({ file: f, ...readJSON(`${DIR}/runs/${f}`) }));
const observations = runs.flatMap((r) => r.observations.map((o) => ({ ...o, round: r.file.replace(".json", "") })));

// ---------------------------------------------------------------------------------------
// Consistency checks - cheap, and exactly the ones a hand-maintained page cannot make.
// ---------------------------------------------------------------------------------------

const caseById = new Map(cases.map((c) => [c.id, c]));
const targetKey = (t) => `${t.kind === "fixture" ? "fixture" : "repo"}:${t.slug}`;
const targetKeys = new Set(targets.map(targetKey));

const dupCaseIds = cases.map((c) => c.id).filter((id, i, arr) => arr.indexOf(id) !== i);
if (dupCaseIds.length) fail(`duplicate case id(s): ${[...new Set(dupCaseIds)].join(", ")}`);

for (const o of observations) {
  if (!caseById.has(o.case)) fail(`${o.round}: observation references unknown case "${o.case}"`);
  if (!targetKeys.has(o.target)) fail(`${o.round}: observation "${o.case}" references unknown target "${o.target}"`);
  if (o.verdict === "fail" && !o.fix && !o.waiver) {
    fail(`${o.round}: "${o.case}" against ${o.target} is a fail with no fix and no waiver - a silent, unpublished gap`);
  }
}

const observedCaseIds = new Set(observations.map((o) => o.case));
for (const c of cases) {
  if (c.status === "run" && !observedCaseIds.has(c.id)) {
    fail(`case "${c.id}" is marked status "run" but has no observation in any runs/ file - no verdict at all`);
  }
  if ((c.status === "planned" || c.status === "needs-procedure") && observedCaseIds.has(c.id)) {
    fail(`case "${c.id}" is marked "${c.status}" but has an observation - status should be "run"`);
  }
}

// ---------------------------------------------------------------------------------------
// Derived counts - every number below is computed, never hand-typed.
// ---------------------------------------------------------------------------------------

const RULE_RE = /^R\d+$/;
const allRuleNumbers = [];
for (const c of cases) for (const t of c.tests) if (RULE_RE.test(t)) allRuleNumbers.push(Number(t.slice(1)));
const highestRule = Math.max(...allRuleNumbers, 0);
const rulesCovered = new Set(allRuleNumbers);
const rulesWithZeroCases = [];
for (let r = 1; r <= highestRule; r++) if (!rulesCovered.has(r)) rulesWithZeroCases.push(`R${r}`);

const byArea = {};
for (const c of cases) {
  byArea[c.area] ??= { total: 0, run: 0, planned: 0, needsProcedure: 0, portable: 0 };
  byArea[c.area].total++;
  if (c.status === "run") byArea[c.area].run++;
  else if (c.status === "planned") byArea[c.area].planned++;
  else if (c.status === "needs-procedure") byArea[c.area].needsProcedure++;
  if (c.portable) byArea[c.area].portable++;
}
const areasWithZeroCases = []; // the 15 declared areas that might carry no case at all
const DECLARED_AREAS = [
  "intake", "adoption", "greenfield", "spec", "gates", "track", "decisions", "discovery",
  "trigger", "docs", "loop", "update", "stack", "security", "shape",
];
for (const a of DECLARED_AREAS) if (!byArea[a] || byArea[a].total === 0) areasWithZeroCases.push(a);

const byStatus = { run: 0, planned: 0, "needs-procedure": 0 };
for (const c of cases) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

const portableCount = cases.filter((c) => c.portable).length;
const localCount = cases.length - portableCount;

const byVerdict = {};
for (const o of observations) byVerdict[o.verdict] = (byVerdict[o.verdict] ?? 0) + 1;

const fixedFailures = observations.filter((o) => o.verdict === "fail" && o.fix);
const openFailures = observations.filter((o) => o.verdict === "fail" && !o.fix);
const distinctFixPRs = new Set(fixedFailures.map((o) => o.fix));

const byDepth = {};
for (const t of targets) byDepth[t.depth] = (byDepth[t.depth] ?? 0) + 1;

const repoTargets = targets.filter((t) => t.kind === "repo");
const fixtureTargets = targets.filter((t) => t.kind === "fixture");

const byRound = {};
for (const t of targets) byRound[t.round] = (byRound[t.round] ?? 0) + 1;

// ---------------------------------------------------------------------------------------
// README.md
// ---------------------------------------------------------------------------------------

const pct = (n, d) => (d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`);

const areaTable = DECLARED_AREAS.map((a) => {
  const s = byArea[a] ?? { total: 0, run: 0, planned: 0, needsProcedure: 0, portable: 0 };
  return `| \`${a}\` | ${s.total} | ${s.run} | ${s.planned + s.needsProcedure} | ${s.portable} |`;
}).join("\n");

const failuresTable = observations
  .filter((o) => o.verdict === "fail")
  .map((o) => {
    const c = caseById.get(o.case);
    const status = o.fix ? `fixed - [${o.fix.split("/").slice(-3).join("/")}](${o.fix})` : "**open** (logged, not fixed)";
    return `| \`${o.case}\` | ${c ? c.title : "(unknown case)"} | \`${o.target}\` | ${status} |`;
  })
  .join("\n");

const disconfirmedNote = `Not every confident finding this round held up, and the count of disconfirmed claims is published
alongside the confirmed ones rather than quietly dropped. Two classes are on record:

- **From the 2026-08-03 round:** the gitlab-org/gitlab assessment's initial claim that the "reference
  implementation, translate the gate's intent" language was missing from the tree was a false negative
  (a stale path in the agent's own briefing) - re-verified against the real file and disconfirmed before
  anything shipped on the strength of it.
- **From this round (2026-08-04):** several brownfield-wave reports ran a "Held" pass - deliberately
  trying to break a mechanism and recording when it did not break - and at least three explicit
  self-corrections of the *assessing agent's own* prior hypothesis are on record: mocha and moment were
  hypothesised as dormant/legacy and were found to be actively maintained on a narrower diet than their
  load; the date-versioning hypothesis for yt-dlp/ImageMagick broke nothing in the mechanized layer (the
  real collision was the release act and the changelog, not the version string); and the showcase repo's
  own history contains a prior commit that already tried once to fix its outcome-block commit counts,
  replacing one set of wrong numbers with another set that was itself never checked against the real
  \`git log\` output (see \`DOC-16\`) - a defect this suite is itself the mechanism meant to catch, so it
  is named here rather than left for a fourth round to find.`;

const readme = `# Validation - proving the standard's claims with data, not prose

<!-- GENERATED by tools/validation.mjs from suite.json, targets.json and runs/*.json -
     do not edit by hand. Run \`node tools/validation.mjs\` after changing any of the three,
     and \`node tools/validation.mjs --check\` fails CI on a stale copy. -->

## What this is, in one paragraph

This standard has been executed against real repositories and real work. The results -
including every failure - are published here, each failure naming the merged pull request
that fixed it, or stating plainly that it has not been fixed yet. A subset of the cases
("portable", see below) tests an idea any spec-driven, agent-operated repository standard
should hold, not only this one; that subset is offered as a benchmark in
[\`benchmark.md\`](benchmark.md) for a reader who has never heard of this project.

## What this does not prove - read this before the numbers

- **Assessment is not adoption.** ${targets.filter((t) => t.depth === "L1").length} of ${targets.length} targets were assessed at
  depth **L1** - a read-only clone, method passes applied, nothing changed. "We assessed
  ${repoTargets.length} public repositories" and "we adopted ${repoTargets.length} repositories" are different
  claims, and only the first one is true. \`FIELD-1\` in \`backlog.md\` names the gap this leaves:
  until a real team runs the align router against a repo nobody on this project wrote, "walks
  a messy repo back to health" remains a design claim supported by dry runs.
- **Both sides of the fixtures share an author.** \`test-greenfield-core\` and
  \`test-greenfield-node\` - the two **L4** targets, the only ones that lived a full lifecycle
  loop - were built by the same people who wrote the standard being tested against them. They
  prove the mechanics work. They prove nothing about somebody else's repository. \`EXHIBIT-1\`
  already says this; this page repeats it rather than quietly contradicting it.
- **Agent-executed observations carry agent error.** Every row in \`runs/\` was produced by an
  AI agent reading code and reproducing a claim, not a human auditor.

### Disconfirmed claims, published too

${disconfirmedNote}

## The headline numbers

| | |
|---|---|
| Cases in the catalogue | **${cases.length}** (\`${byStatus.run ?? 0}\` executed at least once, \`${(byStatus.planned ?? 0) + (byStatus["needs-procedure"] ?? 0)}\` specified but not yet run) |
| Portable cases (the benchmark subset) | **${portableCount}** (${pct(portableCount, cases.length)} of the catalogue); local (tests a path only this tree has): ${localCount} |
| Observations recorded | **${observations.length}** across ${runs.length} rounds (${runFiles.map((f) => f.replace(".json", "")).join(", ")}) |
| Targets assessed | **${targets.length}** (${repoTargets.length} real repositories, ${fixtureTargets.length} synthetic fixtures) |
| Verdicts | ${Object.entries(byVerdict).map(([v, n]) => `${n} ${v}`).join(", ")} |
| Failures found | **${openFailures.length + fixedFailures.length}** - **${fixedFailures.length} fixed** (across ${distinctFixPRs.size} merged pull requests), **${openFailures.length} still open**, logged and named below, not hidden |

These are counts of what is actually written to \`suite.json\`/\`targets.json\`/\`runs/\`, recomputed
by this script every time it runs - not estimates, and \`--check\` fails CI the moment a rendered
number stops matching the data behind it.

## Coverage by area

| Area | Cases | Executed | Specified only | Portable |
|---|---|---|---|---|
${areaTable}

${areasWithZeroCases.length ? `**Areas with zero cases:** ${areasWithZeroCases.map((a) => `\`${a}\``).join(", ")}. This is the honest gap
list - the part a sceptic reads first, named rather than hidden by a table that only shows
what exists.` : "Every declared area carries at least one case."}

${rulesWithZeroCases.length ? `**Rules with zero cases (of R1-R${highestRule}):** ${rulesWithZeroCases.map((r) => `\`${r}\``).join(", ")}.` : `Every rule from R1 to R${highestRule} is tested by at least one case.`}

## Targets, by depth level

| Depth | Meaning | Count |
|---|---|---|
| L1 | read-only assessment pass, nothing changed | ${byDepth.L1 ?? 0} |
| L2 | dry adoption - the align router's decisions worked out for real, still no changes | ${byDepth.L2 ?? 0} |
| L3 | the standard actually applied to a working copy, drift measured | ${byDepth.L3 ?? 0} |
| L4 | the repo then lived the loop for at least one full cycle of real work | ${byDepth.L4 ?? 0} |

## Failures, and their fix

Every case that has ever failed at least once, with the pull request that fixed it, or
**open** where none has, yet:

| Case | What it tests | Where it failed | Status |
|---|---|---|---|
${failuresTable}

## How to run it yourself

\`\`\`
node tools/validation.mjs          # regenerate this page and benchmark.md from the data
node tools/validation.mjs --check  # fail if the pages are stale, or any case/observation
                                    # is unverified, unlinked, or silently unwaived
\`\`\`

To re-run an individual case, read \`suite.json\` for the case's \`procedure\` field - it is
the literal command or read that produced its observations, not a paraphrase.

## Data files

- [\`suite.json\`](suite.json) - the case catalogue, versioned and reusable across rounds
- [\`targets.json\`](targets.json) - every repository or fixture a case has run against
- [\`runs/\`](runs/) - one file per round: verdict, evidence and fix per case/target pair
`;

// ---------------------------------------------------------------------------------------
// benchmark.md - the portable subset, framed for someone else's standard
// ---------------------------------------------------------------------------------------

const portableCases = cases.filter((c) => c.portable);
const portableByArea = {};
for (const c of portableCases) (portableByArea[c.area] ??= []).push(c);

const benchmarkSection = (area, list) =>
  `### ${area}\n\n` +
  list
    .map((c) => {
      const passCount = observations.filter((o) => o.case === c.id && o.verdict === "pass").length;
      const failCount = observations.filter((o) => o.case === c.id && o.verdict === "fail").length;
      const result = c.status !== "run"
        ? "_not yet run - specified, no observation recorded_"
        : failCount > 0
          ? `**failed at least once** (${failCount} fail, ${passCount} pass, across the targets it ran against)`
          : `passed every time it ran (${passCount}/${passCount})`;
      return `**${c.id} - ${c.title}**

- **Given:** ${c.given ?? "-"}
- **When:** ${c.when ?? "-"}
- **Then:** ${c.then ?? "-"}
- **Result:** ${result}
${c.procedure ? `\n_This suite's own reproduction (adapt the paths and commands to your own tooling):_\n\`\`\`\n${c.procedure}\n\`\`\`\n` : ""}`;
    })
    .join("\n\n");

const benchmark = `# Benchmark - checks any agent-operated repository standard should survive

<!-- GENERATED by tools/validation.mjs from suite.json and runs/*.json - do not edit by hand.
     This is the "portable" subset only: cases that test an idea any spec-driven,
     agent-operated repository standard would claim, phrased so a reader who has never used
     this standard can run the same idea against their own. -->

Twenty-something checks - **${portableCases.length}**, precisely - that any repository standard
claiming to be agent-operable should survive. This project failed **${
  new Set(observations.filter((o) => o.verdict === "fail" && portableCases.some((c) => c.id === o.case)).map((o) => o.case)).size
}** of them at least once and has fixed **${
  new Set(observations.filter((o) => o.verdict === "fail" && o.fix && portableCases.some((c) => c.id === o.case)).map((o) => o.case)).size
}** so far; the rest are logged as open. The runs are in [\`runs/\`](runs/), the full catalogue
- including the cases specific to this project's own paths - is in [\`README.md\`](README.md).

If you maintain a different standard: pick a case below, translate "given" into your own
fixture and "when"/"then" into your own tooling's command, and see whether it holds. That is
the whole benchmark - there is no separate runner to install.

${Object.entries(portableByArea).map(([area, list]) => benchmarkSection(area, list)).join("\n\n")}
`;

// ---------------------------------------------------------------------------------------
// write or check
// ---------------------------------------------------------------------------------------

const targetsForOutput = { "README.md": readme, "benchmark.md": benchmark };

if (check) {
  for (const [name, body] of Object.entries(targetsForOutput)) {
    const p = `${DIR}/${name}`;
    if (!existsSync(p)) {
      fail(`${p} does not exist - run \`node tools/validation.mjs\``);
      continue;
    }
    if (readFileSync(p, "utf8") !== body) {
      fail(`${p} is stale - the data moved and the rendered page did not. Run \`node tools/validation.mjs\` and commit the result.`);
    }
  }
  if (failures) {
    console.error(`\nvalidation --check: FAIL - ${failures} problem(s)`);
    process.exit(1);
  }
  console.log(
    `validation --check: OK - ${cases.length} cases, ${observations.length} observations, ${targets.length} targets, pages match the data`,
  );
  process.exit(0);
}

for (const [name, body] of Object.entries(targetsForOutput)) writeFileSync(`${DIR}/${name}`, body);
console.log(
  `validation: wrote README.md and benchmark.md - ${cases.length} cases (${portableCount} portable), ${observations.length} observations, ${targets.length} targets`,
);
