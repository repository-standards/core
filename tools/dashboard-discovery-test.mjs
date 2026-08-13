#!/usr/bin/env node
// dashboard-discovery-test - drive the shipped dashboard generator over fixture repos and read
// the data it embedded, which is the only thing the page can possibly render.
//
// The invariant under test: a discovery entry written the way the standard says to write it -
// copy `standard/docs/discovery/_entry-template.md`, fill the header in - is summarised by what
// it says, not by the template's instructions to whoever fills it. The entry summary was the
// file's first 220 characters verbatim, which since ADR-049 gave entries an instruction comment
// and a typed header table means every entry on the page opened with "Copy to
// docs/discovery/<topic>/...". The fixture takes the template from the tree rather than
// restating it, so a future template that reintroduces the problem fails here.
//
// The other half asserts what must NOT move: the entry table is read by column name, so the six
// columns ADR-049 added leave date and state where the generator finds them, and a dossier is
// live on material newer than its stamp and settled once folded in.
//
// Usage: node tools/dashboard-discovery-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GEN = join(process.cwd(), "standard/scripts/generate-dashboard/index.mjs");
const ENTRY_TEMPLATE = join(process.cwd(), "standard/docs/discovery/_entry-template.md");

// A pool is what makes the generated page a page at all; discovery is what this suite reads.
const POOL = `# Backlog

## Epic: everything

| id | title | type | why | status |
|---|---|---|---|---|
| PAY-1 | Take a payment | task | revenue | todo |
`;

// The dossier README in the shape `standard/docs/discovery/_template.md` ships since ADR-049:
// six columns, the entry row mirroring the entry's own header.
const dossier = (stamp, rows) =>
  `# Booking changes - discovery dossier

**Summary.** What guests may change about a booking after they have paid.

**Last reconciled:** \`${stamp}\`

## Entries

| Date | Kind | Source | Touches | State | Outcome |
|---|---|---|---|---|---|
${rows.map((r) => `| \`${r.date}\` | \`${r.kind}\` | \`${r.source}\` - ${r.what} | \`${r.touches}\` | \`${r.state}\` | \`${r.outcome}\` |`).join("\n")}

## Contradictions to resolve

| What disagrees | Source A | Source B |
|---|---|---|
`;

// The entry exactly as the standard says to produce one: the shipped template, filled in. Read
// from the tree so this asserts the real artifact and not a copy of it that can drift.
const entryFromTemplate = (said) =>
  readFileSync(ENTRY_TEMPLATE, "utf8")
    .replace("# <what it was> - <topic>", "# Kickoff meeting - booking changes")
    .replace("| **Date** | `<YYYY-MM-DD>` |", "| **Date** | `2026-07-30` |")
    .replace("| **Touches** | `<topic>`, `<other-topic>` |", "| **Touches** | `pricing`, `refunds` |")
    .replace(
      /## What was said\n[\s\S]*?(?=\n## Explained here)/,
      `## What was said\n\n- **the owner:** ${said}\n`,
    );

const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "dashboard-discovery-"));
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

let failed = 0;
const check = (name, ok, detail) => {
  if (ok) return;
  failed++;
  console.error(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`);
};

const dirs = [];
const run = (name, files, assert) => {
  const dir = fixture({ "backlog.md": POOL, ...files });
  dirs.push(dir);
  assert(name, build(dir));
};

const SAID = "guests change dates up to 24h before check-in, and we eat the difference";

run(
  "an entry written from the shipped template",
  {
    "docs/discovery/booking-changes/README.md": dossier("never", [
      { date: "2026-07-30", kind: "meeting", source: "2026-07-30-kickoff-meeting.md", what: "the kickoff", touches: "pricing", state: "new", outcome: "none yet" },
    ]),
    "docs/discovery/booking-changes/2026-07-30-kickoff-meeting.md": entryFromTemplate(SAID),
  },
  (name, D) => {
    const file = D.discovery[0]?.files?.[0];
    check(`${name}: reaches the page`, !!file, `discovery: ${JSON.stringify(D.discovery)}`);
    if (!file) return;
    check(`${name}: keeps its own title`, file.title === "Kickoff meeting - booking changes", file.title);
    check(
      `${name}: is not summarised by the template's instructions`,
      !/Copy to docs\/discovery|<!--/.test(file.summary),
      file.summary,
    );
    check(`${name}: is summarised by what it says`, file.summary.includes(SAID), file.summary);
    check(
      `${name}: the header table is not read as prose`,
      !/\*\*Kind\*\*|\| ---/.test(file.summary),
      file.summary,
    );
  },
);

run(
  "the six-column entry table",
  {
    "docs/discovery/booking-changes/README.md": dossier("2026-08-01 (specs/booking @ abc1234)", [
      { date: "2026-07-30", kind: "meeting", source: "2026-07-30-kickoff-meeting.md", what: "the kickoff", touches: "pricing", state: "folded-into-spec", outcome: "specs/booking" },
      { date: "2026-08-09", kind: "mail", source: "2026-08-09-mail-from-provider.md", what: "settlement timing", touches: "payments", state: "new", outcome: "none yet" },
    ]),
    "docs/discovery/booking-changes/2026-07-30-kickoff-meeting.md": entryFromTemplate(SAID),
    "docs/discovery/booking-changes/2026-08-09-mail-from-provider.md": entryFromTemplate("settlement lands T+3"),
  },
  (name, D) => {
    const topic = D.discovery[0];
    check(`${name}: both entries are read`, topic?.entries?.length === 2, JSON.stringify(topic?.entries));
    check(
      `${name}: state is still read by name, not by position`,
      topic?.entries?.[0]?.state === "folded-into-spec",
      JSON.stringify(topic?.entries?.[0]),
    );
    check(
      `${name}: material newer than the stamp counts as live, the folded-in entry does not`,
      topic?.live === 1,
      String(topic?.live),
    );
    check(`${name}: the dossier counts as live work`, D.counts.discoveryLive === 1, String(D.counts?.discoveryLive));
  },
);

for (const dir of dirs) rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error(`\ndashboard-discovery-test: ${failed} failure(s)`);
  process.exit(1);
}
console.log("dashboard-discovery-test: all checks passed");
