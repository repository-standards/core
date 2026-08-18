#!/usr/bin/env node
// dashboard-ideas-test - drive the shipped dashboard generator over real fixture repos and
// read the data it embedded, which is the only thing the page can possibly render.
//
// The invariant under test is one merge, in both directions: an idea reaches the Backlog tab
// whether the repo writes it as a file under `docs/ideas/` (R14) or as a `type: idea` row in
// `backlog.md` (ADR-046), and a repo that does both gets it once per tab rather than twice.
// The merge ran file -> Documents only, so a repo following the standard's own documented
// convention saw an Ideas chip that filtered to nothing.
//
// Half the cases here assert what must NOT move: the todo/doing/blocked/done tiles count
// task and bug rows alone, and a wider pool that quietly folded idea vocabulary into them
// would be a worse defect than the invisible ideas this fixes.
//
// Usage: node tools/dashboard-ideas-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GEN = join(process.cwd(), "standard/scripts/generate-dashboard/index.mjs");

// An idea file, in the shape `standard/docs/ideas/_template.md` ships: an h1, a meta table,
// and the itch. `status: null` writes no Status row at all, which is how a hand-written file
// that never filled the template in reads.
const ideaDoc = (title, status, itch = "Because it itches.") =>
  `# ${title}\n\n| | |\n| --- | --- |\n${status === null ? "" : `| **Status** | ${status} |\n`}| **Date** | 2026-08-11 |\n\n## The itch\n\n${itch}\n`;

// The pool. Columns are read by name, so a fixture that ships no `type` column is an adopter
// whose every row is a task - the pre-ADR-046 shape, and still the common one.
const pool = (rows, cols = ["id", "title", "type", "why", "status"]) =>
  `# Backlog\n\n## Epic: everything\n\n| ${cols.join(" | ")} |\n|${cols.map(() => "---").join("|")}|\n${rows
    .map((r) => `| ${cols.map((c) => r[c] ?? "").join(" | ")} |`)
    .join("\n")}\n`;

const TASK = { id: "PAY-1", title: "Take a payment", type: "task", why: "revenue", status: "todo" };

const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "dashboard-ideas-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return dir;
};

// The page is one static file with its data inline, so the data is read back out of the built
// page rather than out of the generator: what this asserts is what a reader would be shown.
const build = (dir) => {
  const out = join(dir, "out/index.html");
  const r = spawnSync("node", [GEN, dir, "--out", out], { encoding: "utf8" });
  if ((r.status ?? 1) !== 0) throw new Error(`generator exited ${r.status}: ${r.stderr ?? ""}`);
  const html = readFileSync(out, "utf8");
  const raw = html.match(/<script type="application\/json" id="work-data">([\s\S]*?)<\/script>/);
  if (!raw) throw new Error("built page carries no work-data payload");
  return JSON.parse(raw[1].replace(/\\u003c/g, "<"));
};

let failures = 0;
const check = (name, files, assert) => {
  const dir = fixture(files);
  let problem = null;
  try {
    problem = assert(build(dir)) || null;
  } catch (e) {
    problem = e.message;
  }
  rmSync(dir, { recursive: true, force: true });
  if (problem) {
    failures++;
    console.error(`  FAIL ${name}\n       ${problem}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const ideas = (D) => D.items.filter((i) => i.type === "idea");
const titles = (list) => list.map((i) => i.title).sort();
const eq = (what, got, want) => (got === want ? null : `${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

// The defect itself. Three files, a backlog with no idea row anywhere, and a Backlog tab that
// showed none of them while the Documents tab showed all three.
check(
  "an idea written only as a file reaches the pool",
  {
    "backlog.md": pool([TASK]),
    "docs/ideas/mentoring.md": ideaDoc("Paid mentoring", "idea"),
    "docs/ideas/portfolio.md": ideaDoc("A portfolio vertical", "exploring"),
    "docs/ideas/landing.md": ideaDoc("A landing page per product", "parked"),
  },
  (D) =>
    eq("ideas in the pool", ideas(D).length, 3) ||
    eq("ideas on Documents", D.ideas.length, 3) ||
    eq("pool titles", titles(ideas(D)).join(" | "), "A landing page per product | A portfolio vertical | Paid mentoring"),
);

// The chip is only rendered for a type the pool actually carries, so an empty pool is an
// absent chip rather than a chip that filters to nothing - either way the ideas were gone.
check(
  "a repo with no ideas anywhere still has an idea-free pool",
  { "backlog.md": pool([TASK]) },
  (D) => eq("ideas in the pool", ideas(D).length, 0) || eq("ideas on Documents", D.ideas.length, 0),
);

// The status vocabulary is the idea's own (ADR-046). Defaulting it to `todo` would put a
// parked idea in the same bucket as agreed, unstarted work.
check(
  "a file-based idea carries its own status, and an unstated one is `idea`",
  {
    "backlog.md": pool([TASK]),
    "docs/ideas/parked.md": ideaDoc("Parked one", "parked"),
    "docs/ideas/bare.md": ideaDoc("Unstated one", null),
    "docs/ideas/bold.md": ideaDoc("Bold one", "**exploring**"),
  },
  // Sorted, because the pool's order is the directory's and this case is about the values.
  (D) => eq("statuses", ideas(D).map((i) => `${i.title}=${i.status}`).sort().join(" "), "Bold one=exploring Parked one=parked Unstated one=idea"),
);

// `graduated` and `dropped` close an idea the way `done` closes a task (page.js's CLOSED set),
// so an idea that carries its status also leaves the default list - and one that lost its
// status to `todo` would sit in the pool forever.
check(
  "a graduated idea is closed, so it does not sit in the open pool",
  {
    "backlog.md": pool([TASK]),
    "docs/ideas/shipped.md": ideaDoc("Shipped one", "graduated"),
    "docs/ideas/live.md": ideaDoc("Live one", "exploring"),
  },
  (D) => {
    const CLOSED = new Set(["done", "split", "graduated", "dropped"]);
    return eq("open items", D.items.filter((i) => !CLOSED.has(i.status)).length, 2);
  },
);

// The tiles. An idea's vocabulary must reach neither the four counts nor the Now tab's
// in-flight and blocked lists, which read the pool directly when no sprint is open.
check(
  "the todo/doing/blocked/done counts see task and bug rows only",
  {
    "backlog.md": pool([
      TASK,
      { id: "BUG-1", title: "Fix the export", type: "bug", status: "doing" },
      { id: "OQ-1", title: "Is R21 too strict", type: "open-question", status: "open" },
    ]),
    "docs/ideas/a.md": ideaDoc("An idea", "idea"),
    "docs/ideas/b.md": ideaDoc("Another idea", "exploring"),
  },
  (D) =>
    eq("todo", D.counts.todo, 1) ||
    eq("doing", D.counts.doing, 1) ||
    eq("blocked", D.counts.blocked, 0) ||
    eq("done", D.counts.done, 0) ||
    eq("items reading as in flight", D.items.filter((i) => i.status === "doing").length, 1) ||
    eq("items reading as blocked", D.items.filter((i) => i.status === "blocked").length, 0),
);

// Both directions of the merge at once, which is the shape this repo itself has: the file
// carries the whole idea and the row carries the id, so each tab takes the richer source and
// neither renders it twice.
check(
  "an idea that is both a file and a backlog row renders once per tab",
  {
    "backlog.md": pool([TASK, { id: "IDEA-1", title: "Capability stacks", type: "idea", why: "crosses stacks", status: "idea" }]),
    "docs/ideas/stacks.md": ideaDoc("Capability stacks", "idea", "The long version."),
  },
  (D) =>
    eq("ideas in the pool", ideas(D).length, 1) ||
    eq("the pool keeps the row, which has the id", ideas(D)[0].id, "IDEA-1") ||
    eq("ideas on Documents", D.ideas.length, 1) ||
    eq("Documents keeps the file, which has the itch", D.ideas[0].itch, "The long version."),
);

// The title is the dedup key and it is compared case-insensitively, the same rule the merge
// already used in the other direction.
check(
  "the dedup ignores case, as the other direction always did",
  {
    "backlog.md": pool([TASK, { id: "IDEA-1", title: "capability STACKS", type: "idea", status: "idea" }]),
    "docs/ideas/stacks.md": ideaDoc("Capability Stacks", "idea"),
  },
  (D) => eq("ideas in the pool", ideas(D).length, 1) || eq("ideas on Documents", D.ideas.length, 1),
);

// A row is free to phrase its title differently from the heading of the file it points at, and
// one in this repo did - which rendered the same idea twice, the second copy reading as a
// promise to weigh the first. So the link a row cites outranks the title: whatever the row
// calls itself, it is the file's row. The link is read off the raw cell, because the shaping
// that builds an item renders a markdown link down to its label and throws the path away.
check(
  "a row that links to an idea file is that file's row, however it titles itself",
  {
    "backlog.md": pool([
      TASK,
      {
        id: "IDEA-1",
        title: "Two patterns worth adopting from another agent's real source",
        type: "idea",
        why: "filed as an idea to weigh, see [`stacks`](docs/ideas/stacks.md)",
        status: "idea",
      },
    ]),
    "docs/ideas/stacks.md": ideaDoc("Capability stacks", "idea", "The long version."),
  },
  (D) =>
    eq("ideas in the pool", ideas(D).length, 1) ||
    eq("the pool keeps the row, which has the id", ideas(D)[0].id, "IDEA-1") ||
    eq("ideas on Documents", D.ideas.length, 1) ||
    eq("Documents keeps the file", D.ideas[0].title, "Capability stacks"),
);

// The link only claims a file that exists. A row citing a path nobody has written yet is still
// its own idea, or a dangling reference would silently delete a row from both tabs.
check(
  "a row linking to an idea file that does not exist keeps its own row",
  {
    "backlog.md": pool([
      TASK,
      { id: "IDEA-3", title: "Not written up yet", type: "idea", why: "see [notes](docs/ideas/missing.md)", status: "idea" },
    ]),
    "docs/ideas/stacks.md": ideaDoc("Capability stacks", "idea"),
  },
  (D) => eq("ideas in the pool", ideas(D).length, 2) || eq("ideas on Documents", D.ideas.length, 2),
);

// The pre-existing direction, pinned so this change cannot quietly reverse it: a row with no
// file yet is still a document on the Documents tab.
check(
  "a backlog-only idea still reaches Documents",
  { "backlog.md": pool([TASK, { id: "IDEA-2", title: "No file yet", type: "idea", why: "an itch", status: "exploring" }]) },
  (D) =>
    eq("ideas on Documents", D.ideas.length, 1) ||
    eq("its title", D.ideas[0].title, "No file yet") ||
    eq("ideas in the pool", ideas(D).length, 1),
);

// Titles are shaped once. Running the inline renderer over an already-rendered title escapes
// the markup the first pass produced, so a title with code in it would read as literal tags.
check(
  "a title carrying markup is rendered once, not escaped twice",
  {
    "backlog.md": pool([TASK]),
    "docs/ideas/code.md": ideaDoc("Retire `backlog.md`", "idea"),
  },
  (D) =>
    eq("pool title", ideas(D)[0].title, "Retire <code>backlog.md</code>") ||
    eq("Documents title", D.ideas[0].title, "Retire <code>backlog.md</code>"),
);

// The id is the file's own name rather than a number this generator made up: the page is a
// projection of the repo, so every identifier on it has to exist in the repo.
check(
  "a file-based idea is identified by its file, not by an invented id",
  { "backlog.md": pool([TASK]), "docs/ideas/paid-mentoring.md": ideaDoc("Paid mentoring", "idea") },
  (D) => eq("id", ideas(D)[0].id, "paid-mentoring"),
);

// The template ships with the folder and is not an idea; nor is the folder's own README.
check(
  "the shipped template and the folder README are not ideas",
  {
    "backlog.md": pool([TASK]),
    "docs/ideas/README.md": "# Ideas\n\nWhat this folder is for.\n",
    "docs/ideas/_template.md": readFileSync(join(process.cwd(), "standard/docs/ideas/_template.md"), "utf8"),
    "docs/ideas/real.md": ideaDoc("A real one", "idea"),
  },
  (D) => eq("ideas in the pool", ideas(D).length, 1) || eq("its title", ideas(D)[0].id, "real"),
);

console.log();
if (failures) {
  console.error(`dashboard-ideas-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(
  "dashboard-ideas-test: OK - an idea reaches the Backlog tab whether the repo writes it as a file or as a row, a repo that writes both gets it once per tab, its own status survives, and the work counts still see task and bug rows alone",
);
