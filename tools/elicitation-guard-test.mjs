#!/usr/bin/env node
// elicitation-guard-test - the guard prints only when it refuses, so a broken one is silent.
//
// Silence is the failure mode that matters here. A guard that has stopped refusing looks
// exactly like a guard with nothing to refuse, and the standard already lost months to a
// check that passed because it was measuring nothing. These cases assert both answers:
// what must be refused, and what must not be, including a path that merely resembles a
// gated one.
//
// It scores the same way verifyAgentGuards.sh scores the bash guards, and for the same
// reason: a refusal is well-formed deny JSON on stdout with exit 0. Judging by exit code
// alone would read a crashed guard as a refusal, which is how a dead guard keeps passing
// its own test.
//
// Usage: node tools/elicitation-guard-test.mjs
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const GUARD = "standard/.claude/hooks/elicitation-guard.mjs";
const dir = mkdtempSync(join(tmpdir(), "elicit-"));

const line = (ids) =>
  JSON.stringify({
    message: {
      role: "assistant",
      content: ids.map((id) => ({
        type: "tool_use", name: "AskUserQuestion",
        input: { questions: [{ header: `[${id}] asked`, question: "?" }] },
      })),
    },
  });

const withAsked = (name, ids) => {
  const p = join(dir, `${name}.jsonl`);
  writeFileSync(p, line(ids) + "\n");
  return p;
};

const ALLOW = "allow", DENY = "DENY";

// Mirrors verifyAgentGuards.sh's score(): nonzero exit or anything on stderr is BROKEN,
// empty stdout is allow, and only a well-formed deny verdict counts as a refusal.
function score(call) {
  const run = spawnSync("node", [GUARD], { input: JSON.stringify(call), encoding: "utf8" });
  if (run.status !== 0) return `BROKEN:exit ${run.status}`;
  if (run.stderr.trim()) return `BROKEN:stderr ${run.stderr.trim().split("\n")[0]}`;
  if (!run.stdout.trim()) return ALLOW;
  let parsed;
  try { parsed = JSON.parse(run.stdout); } catch { return `BROKEN:stdout is not JSON: ${run.stdout.slice(0, 80)}`; }
  const out = parsed.hookSpecificOutput || {};
  if (out.permissionDecision !== "deny") return `BROKEN:output is not a deny verdict: ${run.stdout.slice(0, 80)}`;
  if (!out.permissionDecisionReason) return "BROKEN:deny with no reason - the message IS the remedy";
  return DENY;
}

const CASES = [
  ["a path nothing gates is none of this guard's business", { tool_name: "Write", tool_input: { file_path: "src/index.ts" } }, ALLOW],
  ["a shell command that moves nothing is none of its business", { tool_name: "Bash", tool_input: { command: "ls" } }, ALLOW],
  ["personas with no transcript fails closed", { tool_name: "Write", tool_input: { file_path: "docs/personas.md" } }, DENY],
  ["personas after its own question is allowed", { tool_name: "Write", tool_input: { file_path: "docs/personas.md" }, transcript_path: withAsked("personas", ["adopt.personas"]) }, ALLOW],
  ["personas after somebody else's question is still refused", { tool_name: "Write", tool_input: { file_path: "docs/personas.md" }, transcript_path: withAsked("other", ["adopt.guards"]) }, DENY],
  ["a decision record matches through the ** glob", { tool_name: "Write", tool_input: { file_path: "docs/decision-records/ADR-001-thing.md" } }, DENY],
  ["a spec matches through a ** in the middle", { tool_name: "Write", tool_input: { file_path: "specs/billing/spec.md" } }, DENY],
  ["a run record matches a * that must not span a slash", { tool_name: "Write", tool_input: { file_path: "docs/validation/human-prompting/runs/a.json" } }, DENY],
  ["a path that merely resembles a gated one is left alone", { tool_name: "Write", tool_input: { file_path: "docs/personas.md.bak" } }, ALLOW],
  ["a nested path a single * must not reach is left alone", { tool_name: "Write", tool_input: { file_path: "docs/validation/human-prompting/runs/old/a.json" } }, ALLOW],
  ["an absolute path still matches", { tool_name: "Write", tool_input: { file_path: "/home/x/repo/backlog.md" } }, DENY],
  ["Edit is gated exactly as Write is", { tool_name: "Edit", tool_input: { file_path: "PRODUCT.md" } }, DENY],

  // Renames, which reach the agent as shell commands rather than writes. The pair that
  // carries the rule is tracked-versus-untracked: reshaping what a repository already has
  // is legitimate and needs asking, moving a file this run created two steps ago is not
  // anybody else's business and must not be refused, or the guard becomes an obstacle to
  // ordinary work and gets removed.
  ["moving a path the repository already tracks is refused", { tool_name: "Bash", tool_input: { command: "git mv VERSION VERSION.old" } }, DENY],
  ["moving a file git never tracked is the run's own business", { tool_name: "Bash", tool_input: { command: "mv scratch-of-this-run.md elsewhere.md" } }, ALLOW],
  ["a rename after [adopt.layout] was asked is allowed", { tool_name: "Bash", tool_input: { command: "git mv VERSION VERSION.old" }, transcript_path: withAsked("layout", ["adopt.layout"]) }, ALLOW],
  ["a rename chained behind a harmless command is still seen", { tool_name: "Bash", tool_input: { command: "ls docs && git -C . mv VERSION VERSION.old" } }, DENY],
  ["a command that merely mentions mv is not a rename", { tool_name: "Bash", tool_input: { command: "grep -rn 'git mv' docs" } }, ALLOW],
  ["the destination-first form of mv is read the same way", { tool_name: "Bash", tool_input: { command: "mv -t docs/archive VERSION" } }, DENY],
  ["a flag between the command and its source does not hide it", { tool_name: "Bash", tool_input: { command: "git mv -k VERSION VERSION.old" } }, DENY],

  // The stub escape, both ways. Without the refusals below it is a bypass with a comment
  // on it: anything that lets a write through has to be shown refusing something too.
  ["a declared stub passes, because it claims nothing about a human", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "---\nelicitation:\n  adopt.personas: absent\n---\n" } }, ALLOW],
  // Deliberately a path whose only gate allows a stub, so an ALLOW here can only mean the
  // JSON spelling was read. Asserted against a path that would deny either way, this case
  // would pass while parsing nothing.
  ["the JSON spelling of the same declaration is read the same way", { tool_name: "Write", tool_input: { file_path: "backlog.md", content: '{"elicitation": {"adopt.backlog": "absent"}}' } }, ALLOW],
  ["stubbing two of three gating points still leaves the third refusing", { tool_name: "Write", tool_input: { file_path: "docs/discovery/x/dossier.md", content: "elicitation:\n  adopt.existing-material: absent\n  discover.materials: absent\n" } }, DENY],
  ["a stub for a point that has no stub form is still refused", { tool_name: "Write", tool_input: { file_path: "docs/adoption-intake.md", content: "elicitation:\n  adopt.intent: absent\n" } }, DENY],
  ["a stub declared for some other point does not cover this one", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "elicitation:\n  adopt.backlog: absent\n" } }, DENY],
  ["prose merely mentioning the word does not count as a declaration", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "The owner was absent, so adopt.personas was hard to pin down.\n" } }, DENY],
];

// The ledger path needs its own working tree: the guard reads docs/adoption-provenance.md
// relative to where it runs. Asserted from this repo it would read the shipped template,
// where every row is `pending`, and prove nothing either way.
function inRepoWithLedger(ledgerBody, call) {
  const dir = mkdtempSync(join(tmpdir(), "elicit-repo-"));
  mkdirSync(join(dir, ".claude/elicitation"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  copyFileSync(resolve("standard/.claude/elicitation/points.json"), join(dir, ".claude/elicitation/points.json"));
  writeFileSync(join(dir, "docs/adoption-provenance.md"), ledgerBody);
  const run = spawnSync("node", [resolve(GUARD)], { input: JSON.stringify(call), encoding: "utf8", cwd: dir });
  rmSync(dir, { recursive: true, force: true });
  if (run.status !== 0 || run.stderr.trim()) return `BROKEN:exit ${run.status} ${run.stderr.trim().slice(0, 60)}`;
  if (!run.stdout.trim()) return ALLOW;
  try { return JSON.parse(run.stdout).hookSpecificOutput?.permissionDecision === "deny" ? DENY : "BROKEN:not a deny verdict"; }
  catch { return "BROKEN:stdout is not JSON"; }
}

const LEDGER_CASES = [
  ["a ledger row recording the stub is read as one", "| `adopt.personas` | absent | - | - | - | - |\n", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "# Personas\n" } }, ALLOW],
  ["a pending ledger row is not a stub, and does not let the write through", "| `adopt.personas` | pending | - | - | - | - |\n", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "# Personas\n" } }, DENY],
  ["a ledger claiming a person answered still needs the transcript to say so", "| `adopt.personas` | human | owner | 2026-08-19 | docs/personas.md | - |\n", { tool_name: "Write", tool_input: { file_path: "docs/personas.md", content: "# Personas\n" } }, DENY],
];

let bad = 0;
for (const [name, call, expected] of CASES) {
  const got = score(call);
  const ok = got === expected;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : ` (got ${got}, expected ${expected})`}`);
}

for (const [name, ledgerBody, call, expected] of LEDGER_CASES) {
  const got = inRepoWithLedger(ledgerBody, call);
  const ok = got === expected;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : ` (got ${got}, expected ${expected})`}`);
}

const total = CASES.length + LEDGER_CASES.length;
console.log(bad ? `\nelicitation-guard-test: FAIL - ${bad}/${total}` : `\nelicitation-guard-test: OK - ${total} cases, refusals and pass-throughs both`);
process.exit(bad ? 1 : 0);
