#!/usr/bin/env node
// adoption-fixture-test - run the shipped payload inside repositories that are not this one.
//
// Everything else here checks the standard against itself: the tree verifies its own skeleton,
// the guards are scored on command strings, the elicitation guard is replayed against recorded
// transcripts. All of it can be green while the thing an adopter gets is broken, and twice now
// it was: a point that gated a path only this repository has, so no adoption ever reached the
// question; and guards that an adopter had to probe by hand to find four holes in. Both were
// found by a person doing an adoption, not by this suite - and the repository they did it in was
// a scratch clone that no longer exists.
//
// So the fixtures under tools/fixtures/repos/ are kept, and this drives the payload into a real
// git repository built from each of them. What it asserts is what must hold in any adopted repo:
//
//   1. the shipped guard suite passes there, from the adopter's own checkout;
//   2. the elicitation guard refuses an intake nobody was asked about, still refuses it when
//      only one of its two questions was asked, and allows it once both were;
//   3. self-verify reports the drift that is really there rather than a green tick on a tree
//      whose authored files nobody has written yet.
//
// Usage:
//   node tools/adoption-fixture-test.mjs                  # exit 1 on any failure
//   node tools/adoption-fixture-test.mjs --materialise DIR # leave the repos for a field run
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const TREE = join(ROOT, "standard");
const FIXTURES = join(ROOT, "tools/fixtures/repos");
const NAMES = ["brownfield-node", "brownfield-python"];

let failures = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };

const git = (dir, ...args) =>
  spawnSync("git", ["-C", dir, "-c", "user.name=fixture", "-c", "user.email=fixture@example.com",
    "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" });

// The repository as it is before anyone adopts anything: its own layout, its own history, and
// one commit to have a HEAD - the guard asks git what is tracked, and an empty repo answers
// "nothing", which is the answer that waves every check through.
function materialise(name, into) {
  const dir = join(into, name);
  mkdirSync(dir, { recursive: true });
  cpSync(join(FIXTURES, name), dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "--no-verify", "-m", "the repository as it stands before adoption");
  return dir;
}

// What an adoption lands without anyone authoring it: the copy class verbatim, and the merge
// class where the repository has nothing of that name - merging into nothing is the file itself.
// `fill-from-repo` entries are left absent on purpose; that absence is the drift assertion below.
//
// The merge half is not a detail. `.claude/settings.json` is a merge entry, and it is what wires
// the hooks up at all: copying only the copy class leaves the guards on disk and nothing calling
// them, which is a real adoption halfway through rather than a broken one.
function copyPayload(repo) {
  const manifest = JSON.parse(readFileSync(join(TREE, "standard.manifest.json"), "utf8"));
  let copied = 0;
  for (const entry of manifest.files) {
    if (entry.adapt !== "copy" && entry.adapt !== "merge") continue;
    const from = join(TREE, entry.path);
    if (!existsSync(from)) continue;
    const to = join(repo, entry.path);
    if (entry.adapt === "merge" && existsSync(to)) continue;
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    copied++;
  }
  writeFileSync(join(repo, ".standards-version"), `${readFileSync(join(ROOT, "VERSION"), "utf8").trim()}\n`);
  return copied;
}

// One AskUserQuestion turn per point, in the shape the guard reads structurally: the call
// names the point in metadata.source. Nothing here says what was answered, because the guard
// checks that the question was put, not what came back.
const transcript = (dir, name, ids) => {
  const path = join(dir, `${name}.jsonl`);
  writeFileSync(path, `${JSON.stringify({
    message: {
      role: "assistant",
      content: ids.map((id) => ({
        type: "tool_use",
        name: "AskUserQuestion",
        input: { metadata: { source: id }, questions: [{ header: "asked", question: "?" }] },
      })),
    },
  })}\n`);
  return path;
};

// Scored the way every other guard in this repository is scored: a refusal is well-formed deny
// JSON on stdout with exit 0, empty stdout is an allow, and a crash is neither.
function score(repo, call) {
  const run = spawnSync("node", [join(repo, ".claude/hooks/elicitation-guard.mjs")], {
    input: JSON.stringify(call), encoding: "utf8", cwd: repo,
  });
  if (run.status !== 0) return `BROKEN:exit ${run.status}`;
  if (run.stderr.trim()) return `BROKEN:stderr ${run.stderr.trim().split("\n")[0]}`;
  if (!run.stdout.trim()) return "allow";
  let parsed;
  try { parsed = JSON.parse(run.stdout); } catch { return "BROKEN:stdout is not JSON"; }
  return parsed?.hookSpecificOutput?.permissionDecision === "deny" ? "DENY" : "BROKEN:not a deny verdict";
}

const materialiseFlag = process.argv.indexOf("--materialise");
if (materialiseFlag !== -1) {
  const into = process.argv[materialiseFlag + 1];
  if (!into) { console.error("--materialise needs a directory"); process.exit(2); }
  mkdirSync(into, { recursive: true });
  for (const name of NAMES) console.log(materialise(name, into));
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), "adoption-fixture-"));
for (const name of NAMES) {
  console.log(`== ${name}`);
  const repo = materialise(name, work);
  const copied = copyPayload(repo);
  copied > 0
    ? ok(`${copied} entries land in the repository without anyone authoring them`)
    : fail("nothing was copied");

  const guards = spawnSync("bash", [join(repo, "scripts/verifyAgentGuards.sh")], { encoding: "utf8", cwd: repo });
  guards.status === 0
    ? ok("the shipped guard suite passes from the adopting repository")
    : fail(`the shipped guard suite fails in an adopting repository: ${(guards.stdout || "").split("\n").filter((l) => l.includes("FAIL")).join(" | ") || guards.stderr}`);

  const intake = { tool_name: "Write", tool_input: { file_path: "docs/adoption-intake.md" } };
  const cases = [
    ["an intake nobody was asked about is refused", {}, "DENY"],
    ["one of the two questions is not both of them", { transcript_path: transcript(work, `${name}-one`, ["adopt.intent"]) }, "DENY"],
    ["asked what it is for and whether the run may be kept, the intake is allowed",
      { transcript_path: transcript(work, `${name}-both`, ["adopt.intent", "adopt.evidence"]) }, "allow"],
  ];
  for (const [label, extra, expect] of cases) {
    const got = score(repo, { ...intake, ...extra });
    got === expect ? ok(label) : fail(`${label}: expected ${expect}, got ${got}`);
  }

  const verify = spawnSync("node", [join(repo, "scripts/self-verify.mjs")], { encoding: "utf8", cwd: repo });
  const said = `${verify.stdout}${verify.stderr}`;
  const drift = said.match(/drift (\d+)/);
  if (!drift) fail(`self-verify said nothing a reader could act on: ${said.trim().split("\n")[0] || "(no output)"}`);
  else if (drift[1] === "0") fail("self-verify reports drift 0 on a repository whose authored files do not exist yet");
  else ok(`self-verify reports the ${drift[1]} entries still to author, rather than a clean bill of health`);

  // The state neither fixture reaches on its own: the repository after its adoption, with a
  // committed ledger answering every repository-scoped point. The guard suite's elicitation
  // cases used to expect refusals that only hold before anything was answered, so in an adopted
  // repository they scored the guard rightly allowing as a failure - found by the first adopted
  // repository to re-run the suite, not by these fixtures, which only exercised the state above.
  const points = JSON.parse(readFileSync(join(repo, ".claude/elicitation/points.json"), "utf8"));
  const rows = points.points
    .filter((p) => p.scope === "repository")
    .map((p) => `| \`${p.id}\` | human | fixture | 2026-08-19 | \`docs/adoption-intake.md\` | - |`);
  mkdirSync(join(repo, "docs"), { recursive: true });
  writeFileSync(join(repo, "docs/adoption-provenance.md"), [
    "# Adoption provenance", "",
    "| Point | State | Answered by | When | Landed in | Backlog row |",
    "|---|---|---|---|---|---|",
    ...rows, "",
  ].join("\n"));
  git(repo, "add", "docs/adoption-provenance.md");
  git(repo, "commit", "-q", "--no-verify", "-m", "the adoption answered its repository-scoped points");
  const adopted = spawnSync("bash", [join(repo, "scripts/verifyAgentGuards.sh")], { encoding: "utf8", cwd: repo });
  adopted.status === 0
    ? ok("the shipped guard suite still passes once the adoption has answered its points")
    : fail(`the shipped guard suite fails in an adopted repository: ${(adopted.stdout || "").split("\n").filter((l) => l.includes("FAIL")).join(" | ") || adopted.stderr}`);
}

rmSync(work, { recursive: true, force: true });
console.log(failures === 0
  ? "adoption-fixture-test: OK - the payload behaves the same in a repository that is not this one"
  : `adoption-fixture-test: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
