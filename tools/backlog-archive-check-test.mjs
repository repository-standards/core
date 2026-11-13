#!/usr/bin/env node
// backlog-archive-check-test - drive the shipped guard over fixture repositories.
//
// The guard is the whole of ADR-051's enforcement, and a guard that stops firing is silent
// about it: it prints only when it refuses. So each of its four refusals gets a fixture that
// must fail, and - the half that is easy to lose - each of its exemptions gets one that must
// pass. A guard nobody can close a row past is as broken as one that never fires; the removal
// check runs on every pull request in a repository where rows legitimately move.
//
// The diff case needs real history, so those fixtures are real git repositories: the base
// commit holds the pool, HEAD holds whatever the change did to it.
//
// Usage: node tools/backlog-archive-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/backlog-archive-check.mjs");

const pool = (rows) =>
  `# Backlog\n\n## Epic: everything\n\n| id | title | type | why | status |\n|---|---|---|---|---|\n${rows
    .map((r) => `| ${r.id} | ${r.title ?? "Do the thing"} | ${r.type ?? "task"} | ${r.why ?? "it matters"} | ${r.status ?? "todo"} |`)
    .join("\n")}\n`;

const archive = (rows) =>
  `# Backlog archive\n\n## 0.9.0 - 2026-08-10\n\n| id | title | status | where |\n|---|---|---|---|\n${rows
    .map((r) => `| ${r.id} | ${r.title ?? "Do the thing"} | done | ${r.where ?? ""} |`)
    .join("\n")}\n`;

// A `null` body deletes the file, so a change can remove what the base commit had.
const write = (dir, files) => {
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    if (body === null) {
      rmSync(abs, { force: true });
      continue;
    }
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
};

const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "backlog-archive-"));
  write(dir, files);
  return dir;
};

const git = (dir, ...argv) => {
  const r = spawnSync("git", argv, { cwd: dir, encoding: "utf8" });
  if ((r.status ?? 1) !== 0) throw new Error(`git ${argv.join(" ")} failed: ${r.stderr}`);
};

// A change is two states of one repository, which is what the guard reads: the pool as the base
// commit has it, and the tree as this change leaves it.
const history = (baseFiles, headFiles) => {
  const dir = fixture(baseFiles);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "seed");
  git(dir, "add", "-A");
  git(dir, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "base");
  git(dir, "branch", "-f", "base-ref");
  write(dir, headFiles);
  git(dir, "add", "-A");
  git(dir, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "change");
  return dir;
};

const run = (dir, ...argv) => {
  const r = spawnSync("node", [GUARD, "--block", ...argv], { cwd: dir, encoding: "utf8" });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

let failed = 0;
const dirs = [];
const expect = (name, { code, out }, wantCode, wantText) => {
  const ok = code === wantCode && (!wantText || out.includes(wantText));
  if (ok) return;
  failed++;
  console.error(`FAIL  ${name}\n      exit ${code}, wanted ${wantCode}${wantText ? ` and text "${wantText}"` : ""}\n      ${out.trim()}`);
};

/* ---------- 1: a row leaves the pool without reaching the archive ---------- */

{
  const dir = history(
    { "backlog.md": pool([{ id: "PAY-1" }, { id: "INV-3", status: "done" }]) },
    { "backlog.md": pool([{ id: "PAY-1" }]) },
  );
  dirs.push(dir);
  // No archive in this fixture, deliberately: the first closure is the one this guard exists
  // for, and a removal check that stood down until an archive existed would never see it.
  expect("a deleted row fails where no archive exists yet", run(dir, "--base", "base-ref"), 1, "is not in docs/backlog-archive.md");
}

{
  const dir = history(
    { "backlog.md": pool([{ id: "PAY-1" }, { id: "INV-3", status: "done" }]) },
    {
      "backlog.md": pool([{ id: "PAY-1" }]),
      "docs/backlog-archive.md": archive([{ id: "INV-3", where: "`ADR-012`" }]),
    },
  );
  dirs.push(dir);
  expect("a relocated row passes", run(dir, "--base", "base-ref"), 0, "OK");
}

{
  const dir = history(
    { "backlog.md": pool([{ id: "PAY-1" }, { id: "INV-3" }]) },
    {
      "backlog.md": pool([{ id: "PAY-1" }]),
      "docs/sprints/2026-08-sprint.md": `# Sprint\n\n## Intents\n\n| id | title | status |\n|---|---|---|\n| INV-3 | Do the thing | doing |\n`,
    },
  );
  dirs.push(dir);
  expect("a row that moved into a sprint passes", run(dir, "--base", "base-ref"), 0, "OK");
}

{
  const dir = history(
    { "backlog.md": pool([{ id: "PAY-1", status: "split:PAY-8" }]) },
    { "backlog.md": pool([{ id: "PAY-8" }]) },
  );
  dirs.push(dir);
  expect("a split whose remainder is live passes", run(dir, "--base", "base-ref"), 0, "OK");
}

{
  // The example rows every shipped template carries. Read as data, a commented row is a row
  // this change "deleted" the moment anybody edits the file around it.
  const dir = history(
    {
      "backlog.md": `${pool([{ id: "PAY-1" }])}\n<!--\n| EXAMPLE-1 | shown, not tracked | task | - | todo |\n-->\n\n\`\`\`\n| FENCED-1 | also an example | task | - | todo |\n\`\`\`\n`,
    },
    { "backlog.md": pool([{ id: "PAY-1" }]) },
  );
  dirs.push(dir);
  expect("an example row is not a deleted row", run(dir, "--base", "base-ref"), 0, "OK");
}

/* ---------- 2, 3, 4: the archive's own shape ---------- */

{
  const dir = fixture({
    "backlog.md": pool([{ id: "PAY-1" }]),
    "docs/backlog-archive.md": archive([{ id: "INV-3", where: "" }]),
  });
  dirs.push(dir);
  expect("an empty where fails", run(dir), 1, "empty `where`");
}

{
  const dir = fixture({
    "backlog.md": pool([{ id: "PAY-1" }]),
    "docs/backlog-archive.md": archive([{ id: "INV-3", where: "`docs/decision-records/ADR-999-gone.md`" }]),
  });
  dirs.push(dir);
  expect("a where that resolves to nothing fails", run(dir), 1, "not in this repository");
}

{
  const dir = fixture({
    "backlog.md": pool([{ id: "PAY-1" }]),
    "docs/decision-records/ADR-012-real.md": "# ADR-012\n",
    "docs/backlog-archive.md": archive([{ id: "INV-3", where: "`docs/decision-records/ADR-012-real.md`" }]),
  });
  dirs.push(dir);
  expect("a where that resolves passes", run(dir), 0, "OK");
}

{
  const dir = fixture({
    "backlog.md": pool([{ id: "PAY-1" }]),
    "docs/backlog-archive.md": archive([{ id: "INV-3", where: "https://github.com/acme/repo/pull/12" }]),
  });
  dirs.push(dir);
  expect("a where naming a URL is not resolved as a path", run(dir), 0, "OK");
}

{
  const dir = fixture({
    "backlog.md": pool([{ id: "PAY-1" }, { id: "INV-3", status: "done" }]),
    "docs/backlog-archive.md": archive([{ id: "INV-3", where: "`CHANGELOG.md`" }]),
    "CHANGELOG.md": "# Changelog\n",
  });
  dirs.push(dir);
  expect("a row in both files fails", run(dir), 1, "is in both");
}

/* ---------- 3: what a `where` cell points at ---------- */

// The archive lives at docs/backlog-archive.md, so a markdown link in it resolves from docs/ -
// the way the rendered link does. Every pointer below was a failure when the cell was read
// from the repository root and tokenized as if every slash were a path.
const pointerRepo = (where, extra = {}) =>
  fixture({
    "backlog.md": pool([{ id: "PAY-1" }]),
    "specs/cms/spec.md": "# CMS\n",
    "docs/dashboard.md": "# Dashboard\n",
    "docs/facts.json": "{}\n",
    "docs/decision-records/adr/ADR-022-real.md": "# ADR-022\n",
    "apps/console/tests/e2e/auth.setup.ts": "\n",
    ".claude/skills/spec-plan/SKILL.md": "# plan\n",
    "docs/backlog-archive.md": archive([{ id: "INV-3", where }]),
    ...extra,
  });

for (const [name, where] of [
  ["a link relative to the archive's directory resolves", "[`specs/cms/spec.md`](../specs/cms/spec.md) - the bucket"],
  ["a link to a sibling of the archive resolves", "[`docs/dashboard.md`](dashboard.md) and the [`facts.json`](facts.json) fact"],
  ["a link into a folder beside the archive resolves", "[ADR-022](decision-records/adr/ADR-022-real.md) - the scope"],
  ["a link target's anchor is not part of its path", "[open questions](../specs/cms/spec.md#open-questions)"],
  ["a module specifier is not a path", "moved the `<img>` tags to `next/image` and ran `pnpm --filter @my-brand/db reconcile`"],
  ["a pair of ids is not a path", "the decision and what it overrides in ADR-008/ADR-016, and/or later"],
  ["a glob resolves when something matches it", "`.claude/skills/spec-*` for the engine"],
  ["a bare file name in a code span names a file somewhere in the repository", "`auth.setup.ts` signs in"],
  ["a bare file name in prose is a word, not a pointer", "the Next.js optimizer, wired in next.config.ts"],
]) {
  const dir = pointerRepo(where);
  dirs.push(dir);
  expect(name, run(dir), 0, "OK");
}

for (const [name, where, text] of [
  ["a link to a file that is not there still fails", "[gone](../specs/gone/spec.md)", "at ../specs/gone/spec.md"],
  ["a path that resolves from neither the archive nor the root fails", "`tools/blog.ts` beside the server", "at tools/blog.ts"],
  ["a glob nothing matches fails", "`.claude/skills/nothing-*`", "at .claude/skills/nothing-*"],
  ["a bare file name no file in the repository carries fails", "`session.test.ts` pins it", "names session.test.ts"],
]) {
  const dir = pointerRepo(where);
  dirs.push(dir);
  expect(name, run(dir), 1, text);
}

// Rows archived before the guard existed are read like any other row, in `--base` mode too: a
// change that renames a file an old row points at is the change that rots the archive.
{
  const dir = history(
    {
      "backlog.md": pool([{ id: "PAY-1" }]),
      "specs/cms/spec.md": "# CMS\n",
      "docs/backlog-archive.md": archive([{ id: "INV-3", where: "[spec](../specs/cms/spec.md)" }]),
    },
    { "specs/cms/spec.md": null },
  );
  dirs.push(dir);
  expect("a change that removes an old row's target fails under --base", run(dir, "--base", "base-ref"), 1, "at ../specs/cms/spec.md");
}

/* ---------- what must not fire ---------- */

{
  const dir = fixture({ "backlog.md": pool([{ id: "PAY-1" }]) });
  dirs.push(dir);
  expect("no archive and no diff is not a failure", run(dir), 0, "skipping");
}

{
  const dir = fixture({ "docs/backlog-archive.md": archive([{ id: "INV-3", where: "" }]) });
  dirs.push(dir);
  expect("no pool at all skips", run(dir), 0, "skipping");
}

for (const dir of dirs) rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error(`\nbacklog-archive-check-test: ${failed} failure(s)`);
  process.exit(1);
}
console.log("backlog-archive-check-test: all checks passed");
