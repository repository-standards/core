#!/usr/bin/env node
// validation-claims-check - a run record says what it can evidence, or it is not evidence.
//
// Thirty-eight run records, four hundred and eighty-six observations, all green, and none
// of them said which of two very different things it had measured: whether the tooling
// conforms, or whether the standard asks a person anything. Read together they made the
// second claim on the strength of the first, and nothing in the format made that visible -
// the corpus with 377 passing observations had never prompted anybody at all.
//
// So every record carries `$elicitation`, and the states are the ones in
// .claude/elicitation/README.md rather than a private vocabulary:
//   none        - no person was prompted and none was meant to be; measures tooling only
//   unverified  - claims a person was prompted, with no transcript to check it against
//   human       - claims it and names the transcript, which must exist
//
// The rule with teeth is the last: `human` needs a file on disk. A corpus that could
// promote itself to validated by editing a string is the corpus this repo already had.
//
// Usage: node tools/validation-claims-check.mjs
// Zone 1 tooling - never shipped.

import { readFileSync, existsSync, readdirSync } from "node:fs";

const ROOT = "docs/validation";
const STATES = new Set(["none", "unverified", "human"]);
const problems = [];
let checked = 0;

for (const corpus of readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const dir = `${ROOT}/${corpus.name}/runs`;
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const file = `${dir}/${name}`;
    checked++;
    let run;
    try { run = JSON.parse(readFileSync(file, "utf8")); } catch (err) { problems.push(`${file}: unreadable - ${err.message}`); continue; }

    const e = run.$elicitation;
    if (!e) {
      problems.push(`${file}: no $elicitation block - the record does not say whether anybody was prompted, which is how a conformance run comes to read as a validated one`);
      continue;
    }
    if (!STATES.has(e.provenance)) {
      problems.push(`${file}: provenance "${e.provenance}" is not one of ${[...STATES].join(", ")}`);
      continue;
    }
    if (e.provenance === "human") {
      if (!e.transcript) problems.push(`${file}: claims a person was prompted but names no transcript - that is "unverified", not "human"`);
      else if (!existsSync(e.transcript)) problems.push(`${file}: names transcript ${e.transcript}, which is not there`);
    }

    const claims = run.observations?.filter((o) => o.asked === true).length ?? 0;
    if (claims && e.provenance === "none") {
      problems.push(`${file}: ${claims} observation(s) assert asked=true while the record says nobody was prompted`);
    }
    if (e.asked_claims !== claims) {
      problems.push(`${file}: says ${e.asked_claims} asked-claims, the observations hold ${claims} - a count that drifts from what it counts is worse than no count`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.log(`  FAIL  ${p}`);
  console.log(`\nvalidation-claims-check: FAIL - ${problems.length} problem(s) across ${checked} run record(s)`);
  process.exit(1);
}
console.log(`validation-claims-check: OK - ${checked} run record(s), each says what it can and cannot evidence`);
