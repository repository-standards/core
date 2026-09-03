#!/usr/bin/env node
// elicitation-check-test - proves the detector detects, and does not merely refuse.
//
// A checker validated only against a run that failed is half a checker: it cannot distinguish
// "this run was dishonest" from "I understand nothing and say no". Both directions are asserted
// here, against fixtures small enough to read.
//
// The case that matters most is laundered-quote. Compaction summaries are written by the model
// and replayed by the harness as user turns, so an agent's own fabrication comes back wearing a
// human's clothes: agent invents a quote -> context is compacted -> the summary restates it ->
// the summary parses as speech -> the quote finds coverage -> the gate passes. The first version
// of this checker counted five human turns in a run that had one, for exactly this reason.
//
// Usage: node tools/elicitation-check-test.mjs
// Exit: 0 all cases behave | 1 any case behaves differently
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";

const F = "tools/fixtures/elicitation";
const PASS = 0, FAIL = 1, UNVERIFIED = 2;

const CASES = [
  {
    name: "the falsified run fails on its fabricated quote",
    args: [`--transcript`, `${F}/falsified-adoption.jsonl`],
    exit: FAIL,
    expect: "quote-coverage",
    why: "the run this whole mechanism exists because of",
  },
  {
    name: "an honest run passes",
    args: [`--transcript`, `${F}/honest-adoption.jsonl`],
    exit: PASS,
    why: "without this the checker could be blind and still look strict",
  },
  {
    name: "a quote laundered through a compaction summary still fails",
    args: [`--transcript`, `${F}/laundered-quote.jsonl`],
    exit: FAIL,
    expect: "quote-coverage",
    why: "the model's own summary is not testimony, however much it parses like a user turn",
  },
  {
    name: "a missing transcript is UNVERIFIED, never PASS",
    args: [`--transcript`, `${F}/does-not-exist.jsonl`],
    exit: UNVERIFIED,
    why: "a guard that says ok with no data is the defect it was built to catch",
  },
  {
    name: "no transcript argument at all is UNVERIFIED",
    args: [],
    exit: UNVERIFIED,
    why: "same fail-close rule, reached by the likelier mistake",
  },
  {
    name: "point coverage passes when the asked point is the required one",
    args: [`--transcript`, `${F}/honest-adoption.jsonl`, `--points`, `${F}/points-one.json`],
    exit: PASS,
    why: "the id travels in the question header, as in every transcript before 1.0.4; this proves the header is read, not the count",
  },
  {
    name: "point coverage reads the id from metadata.source",
    args: [`--transcript`, `${F}/honest-adoption-metadata.jsonl`, `--points`, `${F}/points-one.json`],
    exit: PASS,
    why: "the carrier every call since 1.0.4 uses; the guard test proves it, this checker had only the header",
  },
  {
    name: "point coverage fails on a required point that was never asked",
    args: [`--transcript`, `${F}/honest-adoption.jsonl`, `--points`, `${F}/points-two.json`],
    exit: FAIL,
    expect: "point-coverage",
    why: "the gap this layer exists to name",
  },
];

let bad = 0;
for (const c of CASES) {
  const run = spawnSync("node", ["tools/elicitation-check.mjs", ...c.args, "--json"], {
    encoding: "utf8",
  });
  const out = run.stdout || "";
  const exitOk = run.status === c.exit;
  const checkOk = !c.expect || out.includes(c.expect);
  const ok = exitOk && checkOk;
  if (!ok) {
    bad++;
    const why = !exitOk ? `exit ${run.status}, expected ${c.exit}` : `no "${c.expect}" in output`;
    console.log(`  FAIL  ${c.name}\n          ${why}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

console.log(
  bad
    ? `\nelicitation-check-test: FAIL - ${bad}/${CASES.length} case(s)`
    : `\nelicitation-check-test: OK - ${CASES.length} cases, both directions`,
);
process.exit(bad ? 1 : 0);
