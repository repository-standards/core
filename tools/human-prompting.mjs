#!/usr/bin/env node
// human-prompting - hold the second suite to its own rows.
//
// The mechanical suite has `tools/validation.mjs`: every published number is rendered from the
// data behind it, and `--check` fails CI when a page drifts from its rows. The human suite had
// nothing. Its README names three fractions as "the headline number this suite produces", and
// until now every wave counted its own by hand and wrote the result into prose.
//
// Two things went wrong that way, both found the same week:
//
//   - Three separate branches minted the same prompt ids, because nothing said an id was taken.
//     One of them cited its own `A21` five times, so merging it would have silently reattached
//     a round's observations to a stranger's prompt. Caught by a manual grep during integration,
//     which is not a control.
//   - A run's stated headline disagreed with its own turns: it published `asked 27/33` where the
//     rows say 27/31, because two turns were legitimately unscorable for `asked` and the count
//     rounded them into the wrong bucket.
//
// So this does for the human suite what facts-check does for the repo: the fractions are
// computed from the rows, and a run that states a fraction in its own prose must agree with
// them. It cannot decide whether a verdict was fair - nothing can, that is the suite's premise.
// It can decide whether the arithmetic and the wiring hold.
//
// Two units, both defined, both computed. A run may report in either:
//   - per agent turn - the unit all live runs share, and the finer one. An agent that asks well
//     at turn two and then executes in silence is visible here and invisible per observation.
//   - per observation - one row per prompt run, present when a run scored at that level.
// A stated fraction passes if it matches either unit, because both are honest readings.
//
// Usage:
//   node tools/human-prompting.mjs           # write the results page
//   node tools/human-prompting.mjs --check   # exit 1 if stale, or if any check fails
//
// Zone 1 tooling - never shipped. Dependency-free (Node built-ins only).

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";

const DIR = "docs/validation/human-prompting";
const RUNS = `${DIR}/runs`;
const PROMPTS = `${DIR}/prompts.md`;
const OUT = `${DIR}/results.md`;
const check = process.argv.includes("--check");

const VERDICTS = ["pass", "partial", "fail", "not-applicable", "not-run"];
const FLAGS = ["asked", "checked", "suggested"];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
};

// ---------------------------------------------------------------- the corpus

// A row is `| A1 | ... |`. The id column is the only thing parsed - the rest is prose for
// people, and deliberately not machine-read.
const promptsBody = readFileSync(PROMPTS, "utf8");
const ids = [];
for (const line of promptsBody.split("\n")) {
  const m = /^\|\s*([A-Z]+)(\d+)\s*\|/.exec(line);
  if (m) ids.push({ id: m[1] + m[2], series: m[1], n: Number(m[2]) });
}

const seen = new Map();
for (const { id } of ids) {
  seen.set(id, (seen.get(id) ?? 0) + 1);
}
for (const [id, n] of seen) {
  if (n > 1) {
    fail(`prompt id ${id} is used by ${n} rows in prompts.md - an observation citing it cannot say which prompt it ran, and a merge that renumbers the wrong one reattaches a whole round to a stranger's sentence`);
  }
}

// A series with a hole means a renumbering dropped a row, or a row was deleted. The README is
// explicit that a prompt is never removed for having been fixed - it is the regression test.
const bySeries = new Map();
for (const { series, n } of ids) {
  if (!bySeries.has(series)) bySeries.set(series, new Set());
  bySeries.get(series).add(n);
}
for (const [series, nums] of bySeries) {
  const max = Math.max(...nums);
  const holes = [];
  for (let i = 1; i <= max; i++) if (!nums.has(i)) holes.push(`${series}${i}`);
  if (holes.length) {
    fail(`${series} series has no row for ${holes.join(", ")} while ${series}${max} exists - a prompt is never removed once it lands, so a hole is a renumbering that lost one`);
  }
}

const known = new Set([...seen.keys(), "INVARIANT"]);

// ------------------------------------------------------------------ the runs

const tally = () => ({ true: 0, false: 0, "n/a": 0, unscored: 0 });
const emptyUnit = () => Object.fromEntries(FLAGS.map((f) => [f, tally()]));
const scoreInto = (unit, source) => {
  for (const f of FLAGS) {
    const v = source[f];
    if (v === true) unit[f].true++;
    else if (v === false) unit[f].false++;
    else if (v === "n/a") unit[f]["n/a"]++;
    else unit[f].unscored++;
  }
};

const runFiles = existsSync(RUNS) ? readdirSync(RUNS).filter((f) => f.endsWith(".json")).sort() : [];
const runs = [];

for (const file of runFiles) {
  const path = `${RUNS}/${file}`;
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${file} is not valid JSON: ${e.message}`);
    continue;
  }
  if (typeof data.$about !== "string" || !data.$about.trim()) {
    fail(`${file} has no $about - a run with no record of who ran it, against what, in which mode is not evidence`);
  }
  if (!Array.isArray(data.observations)) {
    fail(`${file} has no observations array`);
    continue;
  }

  const perTurn = emptyUnit();
  const perObservation = emptyUnit();
  let agentTurns = 0;
  let flaggedObservations = 0;
  const verdicts = {};
  const modes = new Set();

  for (const [i, o] of data.observations.entries()) {
    const where = `${file} observation ${i + 1}${o.prompt ? ` (${o.prompt})` : ""}`;
    for (const req of ["prompt", "target", "mode", "verdict", "evidence"]) {
      if (!o[req]) fail(`${where} has no ${req}`);
    }
    if (o.prompt && !known.has(o.prompt)) {
      fail(`${where} cites ${o.prompt}, which is not a row in prompts.md - either the row was renumbered without the run following, or the run invented an id`);
    }
    if (o.verdict && !VERDICTS.includes(o.verdict)) {
      fail(`${where} has verdict "${o.verdict}" - allowed: ${VERDICTS.join(", ")}`);
    }
    if (o.verdict) verdicts[o.verdict] = (verdicts[o.verdict] ?? 0) + 1;
    if (o.mode) modes.add(o.mode);

    for (const f of FLAGS) {
      if (f in o && ![true, false, "n/a", null].includes(o[f])) {
        fail(`${where} has ${f}: ${JSON.stringify(o[f])} - allowed: true, false, "n/a", null`);
      }
    }
    if (FLAGS.some((f) => f in o)) {
      flaggedObservations++;
      scoreInto(perObservation, o);
    }

    if ("live_turns" in o && typeof o.live_turns !== "boolean") {
      fail(`${where} has live_turns: ${JSON.stringify(o.live_turns)} - allowed: true, false`);
    }

    if ("turns" in o) {
      if (!Array.isArray(o.turns) || !o.turns.length) {
        fail(`${where} has a turns field that is not a non-empty array`);
        continue;
      }
      for (const [j, t] of o.turns.entries()) {
        if (!["user", "agent"].includes(t.who)) {
          fail(`${where} turn ${j + 1} has who: ${JSON.stringify(t.who)} - allowed: "user", "agent"`);
        }
        if (!t.said) fail(`${where} turn ${j + 1} has no said`);
        if (t.who !== "agent") continue;
        agentTurns++;
        for (const f of FLAGS) {
          if (f in t && ![true, false, "n/a", null].includes(t[f])) {
            fail(`${where} turn ${j + 1} has ${f}: ${JSON.stringify(t[f])} - allowed: true, false, "n/a", null`);
          }
        }
        scoreInto(perTurn, t);
      }
    }
  }

  runs.push({ file, data, perTurn, perObservation, agentTurns, flaggedObservations, verdicts, modes: [...modes] });
}

// ------------------------------------------- a run's own prose must match its rows
//
// The same rule facts-check applies to the repo: a number restated somewhere else has to keep
// agreeing with the thing it restates. Runs state their headline in prose because a reader
// needs it in words, and prose is exactly where a hand count goes stale.

const stated = /\b(asked|checked|suggested)\s+(\d+)\s*(?:\/|of)\s*(\d+)\b/gi;

for (const run of runs) {
  const prose = Object.entries(run.data)
    .filter(([k, v]) => k.startsWith("$") && typeof v === "string")
    .map(([k, v]) => [k, v]);

  for (const [key, text] of prose) {
    for (const m of text.matchAll(stated)) {
      const flag = m[1].toLowerCase();
      const num = Number(m[2]);
      const den = Number(m[3]);
      const byTurn = run.perTurn[flag];
      const byObs = run.perObservation[flag];
      const matches = (u) => u.true === num && u.true + u.false === den;
      if (matches(byTurn) || matches(byObs)) continue;
      fail(
        `${run.file} ${key} states ${flag} ${num}/${den}, which is neither unit: ` +
          `per agent turn it is ${byTurn.true}/${byTurn.true + byTurn.false} ` +
          `(${byTurn["n/a"]} n/a, ${byTurn.unscored} unscored), ` +
          `per observation ${byObs.true}/${byObs.true + byObs.false} ` +
          `(${byObs["n/a"]} n/a, ${byObs.unscored} unscored)`,
      );
    }
  }
}

// ------------------------------------------------------------- the scenarios
//
// A fraction cannot be argued with. The conversation behind it can, and until now the only way
// to read one was to open a JSON file and reconstruct the dialogue by eye. These pages render
// each observation as what it is - a conversation - so a reader can disagree with a verdict
// instead of taking it.
//
// One honesty rule shapes the whole renderer: **a user turn is quoted, an agent turn is not.**
// The user turns are the text that was actually typed, so they render as speech. The agent turns
// in these runs are descriptions of what the agent did, written afterwards by whoever scored the
// run - so they render as description, labelled, never styled to look like the agent talking.
// Anything the scorer did quote sits inside their sentence and keeps its quotation marks.

const FLAG_MARK = (v) => (v === true ? "yes" : v === false ? "no" : v === "n/a" ? "n/a" : "not scored");

// The corpus text behind each id, so a rendered opening line can be checked against the row it
// claims to be rather than trusted.
const promptText = new Map(
  [...promptsBody.matchAll(/^\|\s*([A-Z]+\d+)\s*\|\s*`([^`]+)`/gm)].map((m) => [m[1], m[2]]),
);

const scenarioPage = (run) => {
  const meta = Object.entries(run.data)
    .filter(([k, v]) => k.startsWith("$") && typeof v === "string")
    .map(([k, v]) => `**\`${k}\`** - ${v}`);

  const blocks = run.data.observations.map((o, i) => {
    const head = `### ${i + 1}. \`${o.prompt}\` against ${o.target}`;
    const facts = [
      `**Mode:** ${o.mode}`,
      o.fixture ? `**Fixture:** ${o.fixture}` : null,
      o.cohort ? `**Cohort:** ${o.cohort}` : null,
      `**Verdict:** ${o.verdict}`,
    ].filter(Boolean).join(" | ");

    // Who typed each user turn, derived rather than asserted. The opening line of an observation
    // is the corpus row it cites, verbatim - that is attributable by construction. Everything
    // after it was written by whoever was running the round, improvising a person who does not
    // know the product - unless the observation itself declares `live_turns: true`, meaning every
    // turn in it was typed by one real person for real, not simulated by whoever scored it. Nine
    // of eighty-eight turns said so by hand; the rest read as though a stranger had typed them,
    // which is the one thing this page must never let a reader assume.
    let seenUserTurn = false;
    const corpusText = promptText.get(o.prompt);

    const turns = (o.turns || []).map((t) => {
      if (t.who === "user") {
        const first = !seenUserTurn;
        seenUserTurn = true;
        const fromCorpus = first && corpusText && t.said.trim() === corpusText.trim();
        const who = fromCorpus
          ? `the corpus, row \`${o.prompt}\` verbatim`
          : first
            ? `the corpus row \`${o.prompt}\`, adapted for this run`
            : o.live_turns
              ? `the same live person as the opening turn - not simulated, not the scorer`
              : `**the person scoring this run**, improvising a user who does not know the product`;
        return `> **Typed** *(${who})***:** ${t.said}`;
      }
      const flags = FLAGS.map((f) => `${f} ${FLAG_MARK(t[f])}`).join(", ");
      const note = t.note ? `\n>\n> *Scorer's note: ${t.note}*` : "";
      return `**What the agent did** *(described by the scorer, not quoted)*\n>\n> ${t.said}\n>\n> \`${flags}\`${note}`;
    }).join("\n\n");

    const tail = [
      o.outcome ? `**Where it ended up:** ${o.outcome}` : null,
      o.abandon_risk ? `**Where a person would give up:** ${o.abandon_risk}` : null,
      o.evidence ? `**Why this verdict:** ${o.evidence}` : null,
    ].filter(Boolean).join("\n\n");

    return `${head}\n\n${facts}\n\n${turns || "_No turn trace - this observation records a single exchange only._"}\n\n${tail}`;
  }).join("\n\n---\n\n");

  return `<!-- GENERATED by tools/human-prompting.mjs from runs/${run.file}. Do not edit by hand. -->

# ${run.file.replace(/\.json$/, "")} - the conversations

Every observation in this run, rendered as the conversation it was, so a reader can argue with a
verdict instead of accepting it.

**Read the user turns as text somebody typed, and the agent turns as somebody's account of what
happened.** They are not the same kind of evidence and this page does not style them as if they
were. Where the scorer quoted the agent, the quotation marks are theirs.

**Who typed the user turns matters more than anything else on this page.** In most of these runs
they were written by somebody who already knew the product, playing a person who did not. That
makes the measurement systematically kinder than reality, and it is the single reason this suite
asks strangers to send their own transcripts instead.

${meta.length ? `## What this run says about itself\n\n${meta.join("\n\n")}\n` : ""}
## The conversations

${blocks}
`;
};

// ------------------------------------------------------------------- the page

const live = runs.filter((r) => r.agentTurns > 0);
const totalTurn = emptyUnit();
const totalObs = emptyUnit();
for (const r of live) {
  for (const f of FLAGS) {
    for (const k of ["true", "false", "n/a", "unscored"]) {
      totalTurn[f][k] += r.perTurn[f][k];
      totalObs[f][k] += r.perObservation[f][k];
    }
  }
}

const frac = (u) => {
  const den = u.true + u.false;
  if (!den) return "-";
  const pct = Math.round((u.true / den) * 100);
  const notes = [];
  if (u["n/a"]) notes.push(`${u["n/a"]} n/a`);
  if (u.unscored) notes.push(`${u.unscored} unscored`);
  return `**${u.true}/${den}** (${pct}%)${notes.length ? ` <br><sub>${notes.join(", ")}</sub>` : ""}`;
};

const verdictLine = (v) =>
  VERDICTS.filter((k) => v[k]).map((k) => `${v[k]} ${k}`).join(", ") || "-";

// A run's caveats are its author's own, declared as top-level keys. Listing the key names is
// derived from the file; summarising them here would be a second source of truth, and the run
// that scores 100% on all three flags is precisely the one whose caveat has to be read.
const CAVEAT = /caveat|weakness|limitation|hide|not_run|not_reached|contamina/i;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const runRows = runs
  .map((r) => {
    const u = r.agentTurns > 0 ? r.perTurn : r.perObservation;
    const unit = r.agentTurns > 0 ? plural(r.agentTurns, "agent turn") : plural(r.flaggedObservations, "observation");
    const caveats = Object.keys(r.data).filter((k) => k.startsWith("$") && CAVEAT.test(k));
    const caveatCell = caveats.length ? caveats.map((c) => `\`${c}\``).join("<br>") : "-";
    return `| [\`${r.file}\`](runs/${r.file}) | ${r.data.observations.length} | ${unit} | ${frac(u.asked)} | ${frac(u.checked)} | ${frac(u.suggested)} | ${verdictLine(r.verdicts)} | ${caveatCell} |`;
  })
  .join("\n");

const totalVerdicts = {};
for (const r of runs) for (const [k, n] of Object.entries(r.verdicts)) totalVerdicts[k] = (totalVerdicts[k] ?? 0) + n;

const page = `<!-- GENERATED by tools/human-prompting.mjs from the run files in runs/. Do not edit by
     hand. Every number here is counted from rows; \`--check\` fails CI on a stale page, on a
     corpus whose ids collide, on an observation citing a prompt that does not exist, and on a
     run whose own prose states a fraction its rows do not support. -->

# What the human-prompting runs measured

The corpus asks whether somebody who does not know this product can get a result by typing what
they would naturally type. It has no pass rate, on purpose. What it has is
[the invariant](README.md#the-three-things-every-run-scores): on every prompt, did the agent
**ask**, **check** and **suggest** - or did it only execute.

These are those three fractions, counted from the runs rather than asserted.

## The headline

| | Per agent turn | Per observation |
|---|---|---|
| \`asked\` | ${frac(totalTurn.asked)} | ${frac(totalObs.asked)} |
| \`checked\` | ${frac(totalTurn.checked)} | ${frac(totalObs.checked)} |
| \`suggested\` | ${frac(totalTurn.suggested)} | ${frac(totalObs.suggested)} |

Two units, because a run may score at either and both are honest. **Per agent turn** is the
finer one and the one every live run shares: an agent that asks well at turn two and then
executes four steps in silence is visible here and invisible per observation. Neither is
rounded, and neither is a pass rate - a low \`asked\` is not automatically bad, because
[asking is not automatically a pass](README.md#the-three-things-every-run-scores).

\`n/a\` is a prompt with nothing underdetermined. **Unscored** is a turn whose flag could not be
read at all - most often because the run was recorded from the repository state it left behind
rather than from the agent's own words, which shows what it did and not what it asked. Both stay
out of the numerator and the denominator, and both are printed rather than absorbed.

Verdicts across every run: ${verdictLine(totalVerdicts)}.

## Run by run

| Run | Observations | Scored over | \`asked\` | \`checked\` | \`suggested\` | Verdicts | Run's own caveats |
|---|---|---|---|---|---|---|---|
${runRows}

**Every conversation behind these numbers is readable.** One page per run under
[\`scenarios/\`](scenarios/), rendered from the same rows: what was typed, what the agent did,
where it ended up, and why the verdict says what it says. A number nobody can argue with is not
evidence, so the argument is published next to it.

**Read the caveats before the fractions.** The last column lists, verbatim, the keys each run
declares about the limits of its own measurement - not a summary, because summarising them here
would put a second version of the run's own words on a page it cannot correct. A run scoring
100% on all three flags is the one whose caveat matters most, and at least one of these files
opens its caveat by calling its own perfect score a measurement failure rather than a result.

The run with no agent turns is the static reading taken before any prompt was executed. It is
scored per observation and excluded from the headline, because a keyword search over the shipped
procedures measures what they instruct, not what an agent did.

## What this page is not

It is not evidence that the product works. Every number here is a count of judgements a person
made while reading a transcript, and the suite says plainly that
[a single run does not generalise](README.md#what-this-suite-cannot-tell-you) and that
[the corpus was written by people who know the product](README.md#what-this-suite-cannot-tell-you).
What the counting buys is narrower and worth having: no fraction on this page can drift from
the rows underneath it, and no round can quietly reuse another round's prompt id.

The arguable part - whether a verdict was fair, whether the evidence supports it - stays where
it belongs, in the run files, quotable and open to disagreement.
`;

if (failures) {
  console.error(`\nhuman-prompting: ${failures} problem(s)`);
  process.exit(1);
}

const summary = `${runs.length} runs, ${runs.reduce((n, r) => n + r.data.observations.length, 0)} observations, ${live.reduce((n, r) => n + r.agentTurns, 0)} agent turns, ${seen.size} corpus rows`;

const scenarios = runs
  .filter((r) => (r.data.observations || []).some((o) => o.turns))
  .map((r) => [`${DIR}/scenarios/${r.file.replace(/\.json$/, "")}.md`, scenarioPage(r)]);

const wanted = [[OUT, page], ...scenarios];

if (check) {
  const stale = wanted.filter(([p, body]) => !existsSync(p) || readFileSync(p, "utf8") !== body);
  if (stale.length) {
    console.error(`human-prompting: stale - run \`node tools/human-prompting.mjs\`:`);
    for (const [p] of stale) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`human-prompting: OK - ${summary}, ${scenarios.length} scenario page(s)`);
} else {
  mkdirSync(`${DIR}/scenarios`, { recursive: true });
  for (const [p, body] of wanted) writeFileSync(p, body);
  console.log(`human-prompting: wrote ${OUT} and ${scenarios.length} scenario page(s) - ${summary}`);
}
