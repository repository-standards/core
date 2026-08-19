#!/usr/bin/env node
// elicitation-replay - run a recorded session past the guard, write by write.
//
// The checks around this one are each true in isolation and prove nothing together: the
// points check says a question exists in a skill, the guard's unit cases say it refuses a
// synthetic payload, the transcript checker says a finished run was thin. None of them
// answers the only question that matters - if the mechanism had existed when the run
// happened, would it have stopped it?
//
// So this replays a real transcript. Every write in it is fed to the guard exactly as
// the hook would receive it, with the transcript truncated to what had actually been said
// by that moment - because a guard handed the whole session would see questions asked
// after the write it is judging, and pass writes that were unasked-for at the time.
//
// Reported per write: STOPPED (the guard refuses), or through, with the point that let it.
//
//   node tools/elicitation-replay.mjs <transcript.jsonl> [--json]
//
// Exit 0 always: this measures a run, it does not judge one. The test file next to it is
// what asserts particular runs come out a particular way.
//
// Zone 1 tooling - never shipped.

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const GUARD = resolve("standard/.claude/hooks/elicitation-guard.mjs");
const AS_JSON = process.argv.includes("--json");

export function replay(transcriptPath) {
  const lines = readFileSync(transcriptPath, "utf8").split("\n").filter((l) => l.trim());
  const dir = mkdtempSync(join(tmpdir(), "replay-"));
  const prefix = join(dir, "prefix.jsonl");
  const writes = [];

  // The guard runs in a tree holding the points and nothing else, on purpose. Run from this
  // repository it would read our own docs/adoption-provenance.md, and a row someone set to
  // `absent` here would start waving writes through in a replay of somebody else's session.
  // What is being measured is the transcript; this repo's state must not be able to move it.
  mkdirSync(join(dir, ".claude/elicitation"), { recursive: true });
  copyFileSync(resolve("standard/.claude/elicitation/points.json"), join(dir, ".claude/elicitation/points.json"));

  for (let i = 0; i < lines.length; i++) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const content = entry.message?.content;
    if (entry.message?.role !== "assistant" || !Array.isArray(content)) continue;

    for (const b of content) {
      if (b.type !== "tool_use" || !["Write", "Edit", "NotebookEdit"].includes(b.name)) continue;

      // Everything said strictly before this turn. Including the turn itself would let a
      // question asked in the same breath as the write vouch for it.
      writeFileSync(prefix, lines.slice(0, i).join("\n") + "\n");

      const call = {
        tool_name: b.name,
        tool_input: b.input,
        transcript_path: prefix,
      };
      const run = spawnSync("node", [GUARD], { input: JSON.stringify(call), encoding: "utf8", cwd: dir });
      let verdict = "through", reason = null;
      if (run.status !== 0) verdict = `BROKEN:exit ${run.status}`;
      else if (run.stdout.trim()) {
        try {
          const out = JSON.parse(run.stdout).hookSpecificOutput || {};
          if (out.permissionDecision === "deny") {
            verdict = "STOPPED";
            reason = (out.permissionDecisionReason || "").split("\n")[0];
          } else verdict = "BROKEN:not a deny verdict";
        } catch { verdict = "BROKEN:stdout is not JSON"; }
      }
      writes.push({ path: b.input?.file_path || "(no path)", tool: b.name, verdict, reason });
    }
  }

  rmSync(dir, { recursive: true, force: true });
  const stopped = writes.filter((w) => w.verdict === "STOPPED");
  return { transcript: transcriptPath, writes, stopped: stopped.length, through: writes.length - stopped.length };
}

// Imported by its test, which calls replay() directly; only the direct run has a CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

function main() {
  const TRANSCRIPT = process.argv[2];
  if (!TRANSCRIPT) {
    console.error("usage: node tools/elicitation-replay.mjs <transcript.jsonl> [--json]");
    process.exit(2);
  }
  const result = replay(TRANSCRIPT);
  if (AS_JSON) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`replay of ${TRANSCRIPT}`);
    for (const w of result.writes) {
      console.log(`  ${w.verdict === "STOPPED" ? "STOPPED" : "through"}  ${w.tool} ${w.path}`);
      if (w.reason) console.log(`           ${w.reason}`);
    }
    console.log(`\n  ${result.stopped} of ${result.writes.length} write(s) would have been refused`);
  }
}
