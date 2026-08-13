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

const write = (dir, files) => {
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
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
