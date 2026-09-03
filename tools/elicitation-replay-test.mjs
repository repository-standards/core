#!/usr/bin/env node
// elicitation-replay-test - the counterfactual, asserted.
//
// The one thing worth knowing about this mechanism is whether it would have stopped the run
// that made it necessary. Every other check answers a question about itself: is a call site
// present, does the guard refuse a payload, was a finished record thin. This one replays the
// real session past the real guard and asserts the answer.
//
// It asserts the other direction just as hard. A guard that refuses everything scores
// perfectly on every negative case here and is worthless, so the run that did ask must come
// through untouched - the positive fixtures are the ones that catch a guard gone paranoid.
//
// Usage: node tools/elicitation-replay-test.mjs
// Zone 1 tooling - never shipped.

import { replay } from "./elicitation-replay.mjs";

const F = "tools/fixtures/elicitation";

const CASES = [
  // The run this whole mechanism exists because of. One question in eleven hundred lines,
  // an invented owner quote, and the repository's directory naming replaced unasked.
  ["the stayget adoption is stopped at every artifact it wrote", `${F}/falsified-adoption.jsonl`, (r) => r.stopped === r.writes.length && r.writes.length === 5],

  // Saying you asked is not asking. Both mentions here are the model's own prose, one of
  // them replayed as a user turn by compaction - the shape a textual scan would believe.
  ["a run that only claims to have asked is stopped", `${F}/claimed-question.jsonl`, (r) => r.stopped === 1 && r.writes.length === 1],

  // The other direction, and the reason it is here: without it, a guard that denies
  // unconditionally passes every case above.
  ["a run that asked before each write is never refused", `${F}/asked-then-wrote.jsonl`, (r) => r.stopped === 0 && r.writes.length === 3],

  // The division of labour, pinned. This run really did ask, so the guard really does let
  // it through - the fabricated quote in what it wrote is the transcript checker's catch,
  // and elicitation-check-test asserts that it makes it. Neither layer covers the other,
  // and the day someone "fixes" one of them to cover both, one of these two fails.
  ["a run that asked but then invented the answer is not the guard's catch", `${F}/laundered-quote.jsonl`, (r) => r.stopped === 0],

  // An honest run can still write past a point it never asked about. Same fixture the
  // quote checker passes - honest about what it quotes, incomplete about what it covered.
  ["asking one point does not license writing an artifact gated by another", `${F}/honest-adoption.jsonl`, (r) => r.stopped === 1],

  // STACK-OFFER-2's known limitation, asserted rather than left to be discovered again. The
  // h run filed its stack offer under green.stack because no brownfield point existed;
  // adopt.stack now does, with its own call site in intake.md, but it carries no gate_globs -
  // giving it green.stack's would make the guard's AND-of-every-matching-point rule demand a
  // greenfield-only point on a brownfield run too, refusing legitimate greenfield writes (see
  // adopt.stack's `gates` field in points.json). So this hook still passes a stack answer
  // filed under green.stack alone: it is caught by elicitation-points-check.mjs (adopt.stack
  // has no call site if the offer is never asked under its own id) and by the provenance
  // ledger a human reads, never by this hook. `through`, not `STOPPED`, is the correct and
  // expected result here - the day this fixture starts failing is the day someone "fixed" it
  // by recreating the greenfield regression the gates field explains.
  ["a stack answer filed under green.stack is still a hook-level pass-through, not this layer's catch", `${F}/stack-offer-wrong-point.jsonl`, (r) => r.stopped === 0],
];

let bad = 0;
for (const [name, file, ok] of CASES) {
  let result;
  try { result = replay(file); } catch (err) {
    bad++; console.log(`  FAIL  ${name} (${err.message})`); continue;
  }
  const broken = result.writes.filter((w) => w.verdict.startsWith("BROKEN"));
  const pass = broken.length === 0 && ok(result);
  if (!pass) bad++;
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}`);
  if (!pass) console.log(`          ${result.stopped}/${result.writes.length} stopped${broken.length ? `, ${broken.length} broken: ${broken[0].verdict}` : ""}`);
}

console.log(bad ? `\nelicitation-replay-test: FAIL - ${bad}/${CASES.length}` : `\nelicitation-replay-test: OK - ${CASES.length} recorded runs replayed past the guard`);
process.exit(bad ? 1 : 0);
