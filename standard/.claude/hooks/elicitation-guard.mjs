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
// It cannot cover everything, and says so rather than implying it does. Most points gate a
// path, and adopt.layout gates a rename - which arrives as a shell command
// rather than a write, so this hook reads Bash too. Renaming what a repository already has
// is the single most destructive thing an adoption does, because it looks like tidying: one
// unasked move put seventy-eight files under different names and broke fifty-three links.
// Only paths git already tracks count - a file the adoption itself created a minute ago is
// its own to move. The rest gate something this hook cannot see - a phase boundary, a commit,
// a layout that does not exist yet; the static check and human review carry those.
//
// Fail-close. No transcript means the question cannot be shown to have happened, and a
// guard that waves work through when it has no evidence is the exact defect it was built
// to catch. The refusal says which point is missing and what the three answers are, so the
// remedy is one call away rather than a puzzle.
//
// Two things settle a point besides asking in this session. A repository-scoped question -
// who the product is for, how the records are kept, which profile it runs at - is asked once,
// and a committed row in docs/adoption-provenance.md answers it for every session after. Work-
// scoped questions get none of that: the scope of a specification is not answered by a row
// about a different one, so those are asked every time. Without the distinction this guard is
// not strict but unlivable, refusing an ordinary decision record months after adoption until
// the run re-asks an adoption question - and a guard nobody can work under gets deleted.
//
// The other thing it deliberately does NOT forbid: writing a stub. A run with nobody watching
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
import { spawnSync } from "node:child_process";

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
  const WRITE_TOOLS = ["Write", "Edit", "NotebookEdit"];
  if (!WRITE_TOOLS.includes(tool) && tool !== "Bash") allow();

  let declared = null;
  for (const p of POINTS) {
    try { declared = JSON.parse(readFileSync(p, "utf8")); break; } catch { /* try the next */ }
  }
  if (!declared) allow();

  // A glob here is deliberately small: ** spans directories, * does not span a slash.
  const rx = (g) =>
    new RegExp("(^|/)" + g.split("**").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")).join(".*") + "$");

  // Tracked means the repository had it before this session started caring. That is the whole
  // distinction worth drawing: moving somebody's directory needs their say-so, moving the file
  // you wrote two steps ago does not. Outside a git work tree there is no repository naming to
  // overwrite, so nothing to refuse - this is the one place passing is the correct answer to
  // an unanswerable question rather than a hole in a fail-closed guard.
  //
  // Asked in the right repository, which is not always this one. An adoption is driven from a
  // checkout of the standard and writes into a different tree, so it spells the move either
  // `git -C <target> mv` or with absolute paths. Asking git here about a path over there gets
  // "untracked" for everything - the answer that waves the whole thing through.
  const trackedIn = (dir, path) =>
    spawnSync("git", ["-C", dir, "ls-files", "--error-unmatch", "--", path], { encoding: "utf8" }).status === 0;
  const tracked = (path, cd) => {
    if (cd) return trackedIn(cd, path);
    if (path.startsWith("/")) {
      const cut = path.lastIndexOf("/");
      return trackedIn(path.slice(0, cut) || "/", path.slice(cut + 1));
    }
    return trackedIn(".", path);
  };

  // Segment-by-segment, like the other guards here, so a harmless command chained before a
  // move cannot vouch for it. `git -C <dir> mv` is spelled out because it is the form an agent
  // reaches for when it does not want to cd.
  const movedFromUnder = (cmd) => {
    const out = [];
    for (const segment of cmd.split(/\n|;|&&|\|\||\|/)) {
      const m = /^\s*(?:git\s+(?:-C\s+(\S+)\s+)?)?mv\s+(.+)$/.exec(segment);
      if (!m) continue;
      const cd = m[1] ? m[1].replace(/^["']|["']$/g, "") : null;
      const tokens = (m[2].match(/"[^"]*"|'[^']*'|\S+/g) || []).map((a) => a.replace(/^["']|["']$/g, ""));
      // `mv -t DIR src...` names its destination first, so the usual last-argument rule reads
      // the only source as a destination and finds nothing to check.
      const sources = [];
      let target = true;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t) continue;
        if (t === "-t" || t === "--target-directory") { i++; target = false; continue; }
        if (t.startsWith("-")) continue;
        sources.push(t);
      }
      if (target) sources.pop();
      for (const src of sources) if (tracked(src, cd) && !out.includes(src)) out.push(src);
    }
    return out;
  };

  let target, verb, gating;
  if (tool === "Bash") {
    const moved = movedFromUnder(String(call.tool_input?.command || ""));
    if (!moved.length) allow();
    target = moved.join(", ");
    verb = "moving";
    gating = (declared.points || []).filter((p) => p.gate_renames);
  } else {
    target = (call.tool_input?.file_path || "").replace(/\\/g, "/");
    if (!target) allow();
    verb = "writing";
    gating = (declared.points || []).filter((p) => (p.gate_globs || []).some((g) => rx(g).test(target)));
  }
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

  // A repository-scoped question is asked once and the answer belongs to the repository, so a
  // committed answered row is what satisfies it from then on. Without this the guard is
  // unlivable rather than strict: every point gating `docs/decision-records/**` or
  // `docs/personas.md` was answered during the adoption, and demanding transcript evidence
  // again would refuse an ordinary `adr-write` months later until it re-asked how the
  // repository wants its records handled. A guard nobody can work under gets removed, and a
  // removed guard catches nothing.
  //
  // Committed, not merely written. Reading the file on disk would let a run add the row and
  // the artifact in one breath, which is the laundering path the transcript check exists to
  // close. `git show HEAD:` means the answer was recorded in a commit somebody can review, in
  // a session that had to satisfy this guard to write the row at all.
  //
  // Work-scoped points are never settled this way. The scope of *this* specification is not
  // answered by a row somebody wrote about a different one.
  let committed = null;
  const committedLedger = () => {
    if (committed !== null) return committed;
    committed = ["docs/adoption-provenance.md", "standard/docs/adoption-provenance.md"]
      .map((f) => spawnSync("git", ["show", `HEAD:${f}`], { encoding: "utf8" }))
      .map((r) => (r.status === 0 ? r.stdout : ""))
      .join("\n");
    return committed;
  };
  const settled = (p) => {
    if (p.scope !== "repository") return false;
    const led = committedLedger();
    const k = p.id.replace(/\./g, "\\.");
    // An answer, not any recorded state: `absent` is a stub and `inferred` is a conclusion the
    // agent drew, and neither is somebody having decided. A recorded stub still passes, but one
    // line up, through the content declaration - which is where it belongs, because that path
    // says out loud that the write is standing on a gap rather than on an answer.
    return ["human", "provisional"]
      .filter((state) => (p.allowed_provenance || []).includes(state))
      .some((state) => new RegExp(`\\|\\s*\`?${k}\`?\\s*\\|\\s*${state}\\s*\\|`, "m").test(led));
  };

  // Ahead of the transcript check on purpose. A stub asserts nothing about a human, so
  // requiring evidence of one would leave a run with no witness no legal move at all.
  const unmet = gating.filter((p) => !stubbed(p) && !settled(p));
  if (!unmet.length) allow();

  const transcript = call.transcript_path;
  if (!transcript) {
    deny(
      `Refused: ${target} is gated by ${unmet.map((p) => p.id).join(", ")} and this guard has no\n` +
      `transcript to check the question against. It fails closed on purpose - a guard that\n` +
      `passes without evidence is indistinguishable from no guard at all.`,
    );
  }

  // Structural, not textual. A question counts when an assistant turn really called the
  // tool - not when the model wrote the tool's name. Compaction replays the model's own
  // summary of a session back as a user turn, so a summary saying it asked about personas
  // would otherwise vouch for the write it is summarising. That is the laundering path,
  // and it is the one an agent under pressure to finish would find first.
  let asked = new Set();
  try {
    for (const line of readFileSync(transcript, "utf8").split("\n")) {
      if (!line.includes("AskUserQuestion")) continue; // cheap prefilter; transcripts are large
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const msg = entry.message || {};
      if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
      for (const b of msg.content) {
        if (b.type !== "tool_use" || b.name !== "AskUserQuestion") continue;
        for (const q of b.input?.questions || []) {
          const m = /\[([a-z0-9.\-]+)\]/i.exec(q.header || "");
          if (m) asked.add(m[1]);
        }
      }
    }
  } catch {
    deny(`Refused: cannot read the session transcript, so ${target} cannot be shown to have been asked about.`);
  }

  const missing = unmet.filter((p) => !asked.has(p.id));
  if (!missing.length) allow();

  const p = missing[0];
  const stubStates = (p.allowed_provenance || []).filter((s) => s === "absent" || s === "inferred");
  deny(
    `Refused: ${verb} ${target} needs [${p.id}] answered first.\n\n` +
    `  ${p.asks}\n\n` +
    `Call AskUserQuestion with the header [${p.id}]. Three answers, always:\n` +
    `  - they answer now                      -> provenance human\n` +
    `  - you suggest, they verify later       -> provisional, plus a backlog row naming the point\n` +
    `  - a stub, and you do not guess         -> absent, with a visible gap marker\n\n` +
    (stubStates.length
      ? `With nobody to ask, write the stub instead of a guess: put \`${p.id}: ${stubStates[0]}\` in the\n` +
        `artifact's provenance and leave the gap visible. That passes here and reads as unfinished later.\n`
      : `This one has no stub form: ${p.why || "the answer is a preference, not a fact about the repo."}\n` +
        `It has to be answered by a person, so an unattended run stops here rather than inventing it.\n`) +
    (p.scope === "repository"
      ? `\nThis question belongs to the repository, not to this piece of work: it is asked once, and\n` +
        `docs/adoption-provenance.md is where the answer lives. If it was already answered, the row\n` +
        `has not been committed yet - commit it and this write goes through without asking again.\n`
      : ""),
  );
});
