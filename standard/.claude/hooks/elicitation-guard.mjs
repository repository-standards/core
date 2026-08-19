#!/usr/bin/env node
// elicitation-guard - a write to a gated artifact is refused until its question was asked.
//
// PreToolUse hook. Reads the tool call on stdin, and refuses Write/Edit to a path some
// elicitation point gates unless that point's question already fired in this session.
//
// This exists because the two weaker mechanisms are not enough on their own. A sentence in
// a skill telling the agent to ask has no force: the rule was written in onboard.md, in the
// right place and in plain words, and a full adoption ignored it. A gate on the artifact
// catches the omission at review, which is after the personas were invented and after the
// owner's directory naming was replaced across seventy-eight files. Only a hook refuses
// before the write lands, and only a hook is not the model's decision to make.
//
// It cannot cover everything, and says so rather than implying it does. Twelve of eighteen
// points gate a path. adopt.layout gates a rename and adopt.continue a phase boundary -
// neither is a file write, so the static check and human review carry those two.
//
// Fail-close. No transcript means the question cannot be shown to have happened, and a
// guard that waves work through when it has no evidence is the exact defect it was built
// to catch. The refusal says which point is missing and what the three answers are, so the
// remedy is one call away rather than a puzzle.
//
// One thing it deliberately does NOT forbid: writing a stub. A run with nobody watching
// cannot ask, and a guard that only accepts an answered question would leave such a run no
// legal move at all - which in practice means the guard gets taken out rather than obeyed.
// So the write is also allowed when the content itself declares that point `absent` (or
// `inferred`, where the point permits it): visibly not claiming an answer is honest, and it
// is guessing that this exists to stop. What it costs is paid later and in the open - the
// artifact gate checks a declared stub really is one, and the run reads as incomplete
// rather than as done.
//
// Ships to adopting repos. Node built-ins only.
//
// Speaks the same contract as the other hooks here, and for the same reason: a refusal is
// well-formed deny JSON on stdout with exit 0, never a nonzero exit. verifyAgentGuards.sh
// scores a nonzero exit as BROKEN, and it is right to - the hooks are silent when they
// allow, so an exit code is the one signal that cannot be told apart from a crash.

import { readFileSync } from "node:fs";

// Core keeps the shipped tree under standard/; an adopting repo unpacks it at the root.
// Try both rather than assume, so the guard behaves the same on either side of adoption.
const POINTS = [
  "standard/.claude/elicitation/points.json",
  ".claude/elicitation/points.json",
];

function allow() { process.exit(0); }
function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let payload = "";
process.stdin.on("data", (c) => (payload += c));
process.stdin.on("end", () => {
  let call;
  try { call = JSON.parse(payload); } catch { allow(); }

  const tool = call.tool_name || "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "NotebookEdit") allow();

  const target = (call.tool_input?.file_path || "").replace(/\\/g, "/");
  if (!target) allow();

  let declared = null;
  for (const p of POINTS) {
    try { declared = JSON.parse(readFileSync(p, "utf8")); break; } catch { /* try the next */ }
  }
  if (!declared) allow();

  // A glob here is deliberately small: ** spans directories, * does not span a slash.
  const rx = (g) =>
    new RegExp("(^|/)" + g.split("**").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")).join(".*") + "$");

  const gating = (declared.points || []).filter((p) =>
    (p.gate_globs || []).some((g) => rx(g).test(target)),
  );
  if (!gating.length) allow();

  // Two places a declaration can live, and both count. The ledger is the real record - one
  // table a reviewer reads in a single pass - and the content of the write itself is the
  // bootstrap case, for the write that creates the ledger or precedes it.
  const ledger = ["docs/adoption-provenance.md", "standard/docs/adoption-provenance.md"]
    .map((f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } })
    .join("\n");
  const written = String(call.tool_input?.content ?? call.tool_input?.new_string ?? "") + "\n" + ledger;
  // Three spellings, one pattern: YAML `id: state`, JSON `"id": "state"`, and the ledger's
  // `| \`id\` | state |`. A repo should not have to learn a notation to be honest.
  const declares = (id, state) => {
    const k = id.replace(/\./g, "\\.");
    return new RegExp(`(^|[\\s"'])${k}["']?\\s*:\\s*["']?${state}\\b`, "m").test(written)
      || new RegExp(`\\|\\s*\`?${k}\`?\\s*\\|\\s*${state}\\s*\\|`, "m").test(written);
  };
  const stubbed = (p) =>
    (p.allowed_provenance || []).some((state) => state !== "human" && state !== "provisional" && declares(p.id, state));

  // Ahead of the transcript check on purpose. A stub asserts nothing about a human, so
  // requiring evidence of one would leave a run with no witness no legal move at all.
  const unmet = gating.filter((p) => !stubbed(p));
  if (!unmet.length) allow();

  const transcript = call.transcript_path;
  if (!transcript) {
    deny(
      `Refused: ${target} is gated by ${unmet.map((p) => p.id).join(", ")} and this guard has no\n` +
      `transcript to check the question against. It fails closed on purpose - a guard that\n` +
      `passes without evidence is indistinguishable from no guard at all.`,
    );
  }

  let asked = new Set();
  try {
    for (const line of readFileSync(transcript, "utf8").split("\n")) {
      if (!line.includes("AskUserQuestion")) continue;
      for (const m of line.matchAll(/\[([a-z0-9.\-]+)\]/gi)) asked.add(m[1]);
    }
  } catch {
    deny(`Refused: cannot read the session transcript, so ${target} cannot be shown to have been asked about.`);
  }

  const missing = unmet.filter((p) => !asked.has(p.id));
  if (!missing.length) allow();

  const p = missing[0];
  const stubStates = (p.allowed_provenance || []).filter((s) => s === "absent" || s === "inferred");
  deny(
    `Refused: writing ${target} needs [${p.id}] answered first.\n\n` +
    `  ${p.asks}\n\n` +
    `Call AskUserQuestion with the header [${p.id}]. Three answers, always:\n` +
    `  - they answer now                      -> provenance human\n` +
    `  - you suggest, they verify later       -> provisional, plus a backlog row naming the point\n` +
    `  - a stub, and you do not guess         -> absent, with a visible gap marker\n\n` +
    (stubStates.length
      ? `With nobody to ask, write the stub instead of a guess: put \`${p.id}: ${stubStates[0]}\` in the\n` +
        `artifact's provenance and leave the gap visible. That passes here and reads as unfinished later.\n`
      : `This one has no stub form: ${p.why || "the answer is a preference, not a fact about the repo."}\n` +
        `It has to be answered by a person, so an unattended run stops here rather than inventing it.\n`),
  );
});
