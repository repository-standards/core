#!/usr/bin/env node
// elicitation-check - did a human actually answer, or did the agent write both sides?
//
// Every other record of the adoption is authored by the agent being checked: the intake, the
// assessment, the personas, the backlog. A gate that reads them can tell a well-shaped document
// from a malformed one, and cannot tell eight passes that ran from eight rows that were typed.
// The session transcript is the one record the agent does not author, so it is the only place
// this question can be answered at all.
//
// Measured on the run that made this necessary (stayget, 2026-08-19): 1140 transcript lines,
// one user turn, one question - about agent hooks - and an intake record whose "Pytania
// i odpowiedzi" table quotes the owner saying a sentence he never said.
//
// Checks, in order of strength:
//   1. Quote coverage - every quoted span of >= MIN_QUOTE_WORDS words in an adoption record
//      must appear in the human corpus. This is the fabricated-quote detector.
//   2. Human presence - at least one question with a recorded answer.
//   3. Point coverage - with --points, every required elicitation point was asked.
//
// The human corpus is built from the two things a human authors: user turns that are not tool
// results, and the answers the harness records against an AskUserQuestion call.
//
// Fail-close: an unreadable or absent transcript exits UNVERIFIED (2), never PASS. A guard that
// says "ok" when it has no data is the same defect as no guard, and this whole tool exists
// because that defect went unnoticed for months.
//
//   node tools/elicitation-check.mjs --transcript <path> [--points <path>] [--json]
//
// Exit: 0 pass | 1 fail | 2 unverified

import { readFileSync } from "node:fs";

const MIN_QUOTE_WORDS = 5;

// Records whose prose speaks for the human, so their quotes must be provable.
const RECORD = /(adoption-intake|adoption-assessment|personas|PRODUCT|backlog)\.md$/;

// Straight, curly and Polish quotation marks. A fabricated quote is still a quote.
const QUOTED = /[""„]([^""„"]{12,600})["""]/g;

function argValue(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const TRANSCRIPT = argValue("--transcript");
const POINTS = argValue("--points");
const AS_JSON = process.argv.includes("--json");

function unverified(reason) {
  const out = { verdict: "UNVERIFIED", reason };
  console.log(AS_JSON ? JSON.stringify(out, null, 2) : `UNVERIFIED: ${reason}`);
  process.exit(2);
}

if (!TRANSCRIPT) unverified("no --transcript given; this check has nothing to read");

let raw;
try {
  raw = readFileSync(TRANSCRIPT, "utf8");
} catch (err) {
  unverified(`cannot read ${TRANSCRIPT}: ${err.message}`);
}

// Normalise for substring matching: quote shape and whitespace differ between what a person
// typed and what a document reproduces, and neither difference makes a quote less real.
const norm = (s) =>
  String(s)
    .replace(/[""„"']/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const humanCorpus = [];

// The harness injects text into user turns that no person typed: system reminders, slash
// command wrappers, hook output. Counting it as speech would widen the corpus and let a
// fabricated quote find cover in text the owner never wrote.
// The compact summary is the dangerous one: the model writes it, the harness replays it as a
// user turn, and it restates the agent's own claims. Left in, a fabricated quote finds cover in
// the agent's summary of having made it up - the laundering path this whole check exists to cut.
const INJECTED =
  /^\s*(<(system-reminder|command-name|command-message|local-command|user-prompt-submit-hook)|This session is being continued from a previous conversation|Review target:|Caveat: The messages below were generated)/;
function pushHuman(text) {
  const t = String(text || "").trim();
  if (!t || INJECTED.test(t)) return;
  humanCorpus.push(t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, " "));
}

const questions = [];
const metaPointIds = new Set();
const records = new Map();
const askIds = new Set();
const answeredIds = new Set();

for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }
  if (entry.$fixture) continue; // fixture header, not a turn

  const msg = entry.message || {};
  const content = msg.content;

  if (msg.role === "user") {
    if (typeof content === "string") pushHuman(content);
    else if (Array.isArray(content)) {
      for (const b of content) {
        if (b.type === "text") pushHuman(b.text || "");
        // The harness records the answer against the question's own tool_use id.
        else if (b.type === "tool_result" && askIds.has(b.tool_use_id)) {
          const text = typeof b.content === "string" ? b.content : JSON.stringify(b.content);
          // Shape: The user answered: "<question>"="<answer>". Only the answer is human.
          let any = false;
          for (const m of text.matchAll(/"[^"]*"="([^"]*)"/g)) { pushHuman(m[1]); any = true; }
          if (any) answeredIds.add(b.tool_use_id);
        }
      }
    }
    continue;
  }

  if (msg.role === "assistant" && Array.isArray(content)) {
    for (const b of content) {
      if (b.type !== "tool_use") continue;
      if (b.name === "AskUserQuestion") {
        askIds.add(b.id);
        for (const id of String(b.input?.metadata?.source || "").split(/[\s,]+/)) if (id) metaPointIds.add(id);
        for (const q of b.input?.questions || []) {
          questions.push({ id: b.id, header: q.header || "", question: q.question || "" });
        }
      } else if (b.name === "Write" || b.name === "Edit") {
        const path = b.input?.file_path || "";
        if (!RECORD.test(path)) continue;
        const body = b.input?.content ?? b.input?.new_string ?? "";
        records.set(path, (records.get(path) || "") + "\n" + body);
      }
    }
  }
}

const corpus = norm(humanCorpus.join("\n"));
// An asked question is not an answered one. Keying this on askIds made every question its
// own evidence, which is the shape of the defect: the agent authors the asking, the human
// authors only the reply, so the reply is the only part worth counting.
const answered = questions.some((q) => answeredIds.has(q.id));

const failures = [];

// 1. Quote coverage. A quote the human never uttered is worse than an absent record: it reads
// as evidence of consent, in a format that invites belief.
const uncovered = [];
for (const [path, body] of records) {
  for (const m of body.matchAll(QUOTED)) {
    const quote = m[1].trim();
    if (quote.split(/\s+/).length < MIN_QUOTE_WORDS) continue;
    if (/^[A-Za-z0-9_.\-/]+$/.test(quote)) continue; // a path or identifier, not speech
    if (!corpus.includes(norm(quote))) uncovered.push({ path, quote });
  }
}
if (uncovered.length) {
  failures.push({
    check: "quote-coverage",
    detail: `${uncovered.length} quoted passage(s) attributed in an adoption record have no coverage in anything the human said`,
    items: uncovered.slice(0, 10),
  });
}

// 2. Human presence.
if (!answered) {
  failures.push({
    check: "human-presence",
    detail: `no question with a recorded answer: ${questions.length} asked, ${answeredIds.size} answered, ${humanCorpus.length} human turn(s) in the whole run`,
  });
}

// 3. Point coverage, when the declared points are supplied.
let pointReport = null;
if (POINTS) {
  let declared;
  try {
    declared = JSON.parse(readFileSync(POINTS, "utf8"));
  } catch (err) {
    unverified(`cannot read --points ${POINTS}: ${err.message}`);
  }
  const required = (declared.points || []).filter((p) => p.required);
  // metadata.source is where the id travels since 1.0.3; the bracketed header is what every
  // transcript before that carries, and both are read - see the guard, which reads the same two.
  const askedIds = new Set([
    ...metaPointIds,
    ...questions.map((q) => (q.header.match(/\[([a-z0-9.\-]+)\]/i) || [])[1]).filter(Boolean),
  ]);
  const missing = required.filter((p) => !askedIds.has(p.id)).map((p) => p.id);
  pointReport = { required: required.length, asked: askedIds.size, missing };
  if (missing.length) {
    failures.push({
      check: "point-coverage",
      detail: `${missing.length} required elicitation point(s) never asked`,
      items: missing,
    });
  }
}

const result = {
  verdict: failures.length ? "FAIL" : "PASS",
  transcript: TRANSCRIPT,
  human_turns: humanCorpus.length,
  questions_asked: questions.length,
  records_written: [...records.keys()].length,
  points: pointReport,
  failures,
};

if (AS_JSON) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`${result.verdict} - ${TRANSCRIPT}`);
  console.log(
    `  wypowiedzi czlowieka: ${result.human_turns} | pytan: ${result.questions_asked} | rekordow adopcji: ${result.records_written}`,
  );
  for (const f of failures) {
    console.log(`  [${f.check}] ${f.detail}`);
    for (const it of f.items || []) {
      console.log(`    - ${typeof it === "string" ? it : `${it.path}: "${it.quote.slice(0, 110)}"`}`);
    }
  }
}

process.exit(failures.length ? 1 : 0);
