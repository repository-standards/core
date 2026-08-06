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
// Corrected 2026-08-05: a fixed-and-re-verified defect is a "pass" that keeps its "fix"
// field as provenance - it no longer stays "fail" forever. A "fail" that still carries a
// "fix" is not resolved - it means a real attempt landed and a later re-run found it did
// not actually hold; the evidence field says what was found. That is rarer than an untried
// gap, and it is the most useful thing this suite can surface, so it is never treated as
// equivalent to a waiver.
//
// Corrected again 2026-08-06: the punch list reads the CURRENT observation per case+target,
// not every observation ever recorded. Filtering the raw verdict across all rounds double
// counted a defect found in one round and fixed in a later one - it appeared both as "fixed
// and re-verified" and, simultaneously, on the punch list as open. Latent until the first
// cross-round fix landed, so the numbers had been right by accident rather than by
// construction. Ordering therefore matters: runs are read in filename order, and --check
// refuses two same-day rounds that disagree unless the filenames carry an explicit
// sequence letter (<date>-a-<slug>), because "same date" is not "known order".
//
// Usage:
//   node tools/validation.mjs           # write docs/validation/{README,benchmark}.md
//   node tools/validation.mjs --check   # exit 1 if the rendered pages are stale, if any
//                                        # case has never been observed at all, if any
//                                        # observation has no evidence, or if any "fail"
//                                        # observation has neither a fix nor a waiver
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

// Runs are read in filename order and a later run supersedes an earlier one for the same
// case+target. That is only safe while filename order IS chronological order - which it stops
// being the moment two rounds land on the same date, because "2026-08-06-adr032" sorts before
// "2026-08-06-planning-loop" whatever order they actually ran in. It happened: a re-run
// recording a fix was silently overridden by the earlier run that had found the defect, and
// the page kept showing the defect as open. Same failure shape this suite keeps finding
// elsewhere - silence looked like coverage - so it is a hard check rather than a convention.
const seenPair = new Map();
for (const o of observations) {
  const pair = `${o.case} ${o.target}`;
  const prev = seenPair.get(pair);
  if (prev && prev.round !== o.round) {
    const sameDay = prev.round.slice(0, 10) === o.round.slice(0, 10);
    // A same-day pair is fine once the filenames carry an explicit sequence letter
    // (<date>-a-<slug>), because then filename order IS declared run order. It is only
    // ambiguous when either side lacks one.
    const seq = (round) => /^\d{4}-\d{2}-\d{2}-([a-z])-/.exec(round)?.[1] ?? null;
    const ordered = seq(prev.round) !== null && seq(o.round) !== null;
    if (sameDay && !ordered && prev.verdict !== o.verdict) {
      fail(
        `"${o.case}" against ${o.target} has different verdicts in two rounds dated the same day ` +
          `(${prev.round}: ${prev.verdict}, ${o.round}: ${o.verdict}) - filename order decides which wins, ` +
          `and filename order is not run order. Add an explicit sequence to the run filenames ` +
          `(<date>-a-<slug>, <date>-b-<slug>, ...) so the later run is unambiguously later.`,
      );
    }
  }
  seenPair.set(pair, o);

  if (!caseById.has(o.case)) fail(`${o.round}: observation references unknown case "${o.case}"`);
  if (!targetKeys.has(o.target)) fail(`${o.round}: observation "${o.case}" references unknown target "${o.target}"`);
  if (!o.evidence || !o.evidence.trim()) {
    fail(`${o.round}: "${o.case}" against ${o.target} has no evidence - a verdict with nothing behind it is a claim, not a finding`);
  }
  // A "fail" with no explanation at all is the silent gap this suite exists to rule out.
  // "waiver" covers the untried case (logged, not built this round); "fix" alone still
  // counts here too - a fail carrying a fix is an attempted defect a re-run found did not
  // hold, which is explained by definition (the evidence field says what was found), not
  // silent. What it is NOT is grounds to call the defect resolved - see the render below.
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

// The punch list is every observation currently reading "fail" - full stop. A fail that
// still carries a "fix" field is not a fixed defect wearing a stale label; it is an
// attempted fix that a re-run showed did not actually hold (kept, corrected, rather than
// silently dropped - the finding is worth more than the tidy number). "Confirmed fixed"
// is the opposite shape: a "pass" that carries a "fix" field, meaning it used to fail,
// something merged to address it, and a later run actually re-verified it holds now -
// never inferred from the verdict flipping alone.
// ...and it is the CURRENT reading that counts, not every reading ever taken. Runs are read
// in order, so the last observation for a case+target pair is the state of that pair today.
// Before this was explicit, a defect found in one round and fixed in a later one was counted
// twice - once as "fixed and re-verified" and again on the punch list as open - which is the
// suite reporting a defect it had itself already closed. Latent until the first cross-round
// fix landed (2026-08-06), which is exactly why it is computed rather than assumed.
const currentByPair = new Map();
for (const o of observations) currentByPair.set(`${o.case} ${o.target}`, o);
const current = [...currentByPair.values()];

const openFailures = current.filter((o) => o.verdict === "fail");
const attemptedNotHolding = current.filter((o) => o.verdict === "fail" && o.fix);
const confirmedFixed = current.filter((o) => o.verdict === "pass" && o.fix);
// Superseded fails - found in one round, a later round records the fix. Not open, and not
// silently vanished either: the count is stated so the punch list shrinking is legible.
const supersededFails = observations.filter(
  (o) => o.verdict === "fail" && currentByPair.get(`${o.case} ${o.target}`) !== o,
);
const distinctFixPRs = new Set(confirmedFixed.map((o) => o.fix));

const byDepth = {};
for (const t of targets) byDepth[t.depth] = (byDepth[t.depth] ?? 0) + 1;

const repoTargets = targets.filter((t) => t.kind === "repo");
// Third-party repos actually adopted, not just read. The honesty paragraph is computed from
// this rather than asserted, so it stops claiming "nobody's repo has been adopted" the moment
// one has - and stops claiming otherwise if a row is ever removed.
const adoptedRepos = repoTargets.filter((t) => t.depth === "L3" || t.depth === "L4");
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

// The punch list: everything reading "fail" right now, no ambiguity, no "resolved but
// still labelled fail" mixed in - that convention is exactly what this table stopped
// doing (2026-08-05). A fail that still carries a "fix" is not fixed - it is an attempted
// fix a re-run found insufficient, and it is worded as such rather than "fixed".
const failuresTable = openFailures
  .map((o) => {
    const c = caseById.get(o.case);
    const status = o.fix
      ? `attempted, still open - [${o.fix.split("/").slice(-3).join("/")}](${o.fix}) did not fully hold (see evidence in \`runs/${o.round}.json\`)`
      : "**open** (logged, not fixed)";
    return `| \`${o.case}\` | ${c ? c.title : "(unknown case)"} | \`${o.target}\` | ${status} |`;
  })
  .join("\n");

// The credibility half of the same claim: passes that used to fail, with the PR that
// fixed them and a later round's re-run confirming the fix actually holds today - kept
// visibly separate from the punch list above, never blended into one bucket where "fail"
// stopped meaning "currently broken".
const fixedTable = confirmedFixed
  .map((o) => {
    const c = caseById.get(o.case);
    return `| \`${o.case}\` | ${c ? c.title : "(unknown case)"} | \`${o.target}\` | [${o.fix.split("/").slice(-3).join("/")}](${o.fix}) |`;
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
  is named here rather than left for a fourth round to find.
- **From the 2026-08-05 re-verification pass:** every "fail" observation carrying a "fix" field was
  re-run against the current tree rather than trusted from the PR that claimed it. \`TRACK-10\`'s
  cited PR added the \`split:<id>\` status value to the template's vocabulary but never touched
  \`cycle-guard.mjs\`'s staleness check, so a live re-run reproduced the exact original failure (a
  finished-but-split item's block still reads "live") - the fix was real and half-landed, and it
  stays \`fail\` rather than being counted as resolved because it read as landed.`;

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

What counts as a case, what a depth level means, and which claims this data is **not**
permitted to support are defined in [\`method.md\`](method.md) - the one page here that is
written rather than generated.

## What this does not prove - read this before the numbers

- **Assessment is not adoption.** ${targets.filter((t) => t.depth === "L1").length} of ${targets.length} targets were assessed at
  depth **L1** - a read-only clone, method passes applied, nothing changed. "We assessed
  ${repoTargets.length} public repositories" and "we adopted ${repoTargets.length} repositories" are different
  claims, and only the first one is true.
  ${
    adoptedRepos.length === 0
      ? "No repository this project did not write has been adopted at all. `FIELD-1` in `backlog.md` names the gap: until the align router is run against somebody else's repo, \"walks a messy repo back to health\" is a design claim supported by dry runs."
      : `**${adoptedRepos.length} third-party ${adoptedRepos.length === 1 ? "repository has" : "repositories have"} been adopted for real** (depth L3 or better, listed by slug in \`targets.json\`): ${adoptedRepos.map((t) => `\`${t.slug}\``).join(", ")}. That is what moves this from a design claim to a demonstrated one - and ${adoptedRepos.length === 1 ? "one repository is one repository" : `${adoptedRepos.length} repositories are still a small sample`}. ${adoptedRepos.length < 3 ? "`FIELD-1` asks for three, of different sizes and stack situations, and stays open until it has them." : "`FIELD-1` asked for three of different sizes and stack situations and has them; what it still lacks is a *programme* - every adoption so far is one wave, not a counted backlog drained over weeks - and an adopting agent that is not this project's own. `EXHIBIT-1` is unaffected by the count: every adoption lives on a local branch, so there is still nothing a sceptic can open."}`
  }
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
| Failures found | **${openFailures.length + confirmedFixed.length}** - **${confirmedFixed.length} fixed and re-verified** (across ${distinctFixPRs.size} merged pull requests), **${openFailures.length} still open right now** (of which ${attemptedNotHolding.length} were attempted and a re-run found the fix did not fully hold), logged and named below, not hidden${supersededFails.length ? `; ${supersededFails.length} earlier fail${supersededFails.length === 1 ? "" : "s"} superseded by a later re-run and no longer counted open` : ""} |

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

## The punch list - what is actually still broken

Filtered on \`verdict === "fail"\` alone, nothing else - this is the real, current set of
open defects, the thing a sceptic (or the maintainer) actually wants from this page. A row
that also names a PR was attempted and a later re-run found the attempt did not fully hold
(see that observation's evidence in \`runs/\`) - it is still broken, not "fixed":

| Case | What it tests | Where it failed | Status |
|---|---|---|---|
${failuresTable}

## Fixed and re-verified this round

The other half of the same credibility claim, kept in its own table so it is never read as
part of the list above: cases that used to fail, a merged PR that addressed the defect, and
a later round's independent re-run confirming the fix actually holds today - not inferred
from the PR merging, not inferred from the verdict flipping:

| Case | What it tests | Target | Fix |
|---|---|---|---|
${fixedTable}

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
}** of them at least once and has fixed-and-re-verified **${
  new Set(observations.filter((o) => o.verdict === "pass" && o.fix && portableCases.some((c) => c.id === o.case)).map((o) => o.case)).size
}** so far; the rest are logged as open (which includes any case where an attempted fix
was itself re-verified and found not to fully hold - see \`README.md\` for that distinction).
The runs are in [\`runs/\`](runs/), and the full catalogue (including the cases specific to
this project's own paths) is in [\`README.md\`](README.md).

If you maintain a different standard: pick a case below, translate "given" into your own
fixture and "when"/"then" into your own tooling's command, and see whether it holds. That is
the whole benchmark - there is no separate runner to install.

${Object.entries(portableByArea).map(([area, list]) => benchmarkSection(area, list)).join("\n\n")}
`;

// ---------------------------------------------------------------------------------------
// write or check
// ---------------------------------------------------------------------------------------

// A tiny generated summary, in the same spirit as tools/file-map.mjs's output: the one
// place docs/facts.json can point a "match" pattern at for a headline number that would
// otherwise have no single-file home (an observation count spans every file in runs/,
// and facts-check.mjs's home mechanisms are single-file by design). Regenerated here,
// never hand-edited, and checked for staleness the same way README.md and benchmark.md are.
const countsJSON = `${JSON.stringify(
  {
    $about: "GENERATED by tools/validation.mjs - the headline numbers docs/facts.json points at, so a hand-written restatement elsewhere can be checked against real data.",
    totalCases: cases.length,
    portableCases: portableCount,
    totalObservations: observations.length,
    totalTargets: targets.length,
    reposTested: repoTargets.length,
  },
  null,
  2,
)}\n`;

const targetsForOutput = { "README.md": readme, "benchmark.md": benchmark, "counts.json": countsJSON };

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
