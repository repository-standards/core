#!/usr/bin/env node
// skill-map - render docs/skill-map.md from the skills themselves.
//
// Twenty procedures ship, and their names are terse on purpose: `spec-reconcile`,
// `discovery-digest`, `bdr-write`. A reader who has not used them cannot tell from a
// directory listing which one to reach for, and the folder page explains what the folder is
// FOR without ever saying what is in it.
//
// The obvious fix - write a catalogue by hand - is the one this repo has already watched
// fail twice. `tools/README.md`'s table listed four tools while seven existed, then ten
// while eighteen existed. A hand-written list of twenty things is a second source of truth
// with nothing holding it to the first.
//
// So the page is generated, the way `docs/file-map.md` is generated from the manifest. Each
// skill already declares, in its own frontmatter, the moment it fires - written in the words
// somebody actually says ("btw the export is broken", "when does billing ship?"). That IS
// the catalogue; this only groups it and renders it.
//
// The one thing not derivable from a skill is which group it belongs to, so GROUPS below
// declares it. A skill in no group is a hard failure rather than a quiet omission - which is
// the whole point, since the failure being prevented is exactly "somebody added one and the
// list did not notice".
//
// Usage:
//   node tools/skill-map.mjs           # write docs/skill-map.md
//   node tools/skill-map.mjs --check   # exit 1 if the page is stale or a skill is ungrouped
//
// Zone 1 tooling - never shipped. Dependency-free (Node built-ins only).

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const SHIPPED = "standard/.claude/skills";
const OWN = "skills";
const OUT = "docs/skill-map.md";
const check = process.argv.includes("--check");

// Grouped by the moment the skill fires, not by what it writes. A reader arrives with a
// situation ("we changed our mind", "when does this land?"), never with an artifact name.
const GROUPS = [
  {
    title: "Deciding what to build",
    lead:
      "Before anything is specified. These turn scattered material - a meeting, a hunch, an argument about who the product serves - into something the rest of the loop can read.",
    skills: ["product-write", "personas-write", "idea-write", "discovery-digest", "adr-write", "bdr-write"],
  },
  {
    title: "Specifying a capability",
    lead:
      "Turning a decision into a spec that can be built from, and keeping that spec true as the world moves. `spec-update` is the one to reach for when the work has already started - going back to a spec mid-flight is normal, not a failure.",
    skills: ["spec-specify", "spec-clarify", "spec-impact", "spec-update"],
  },
  {
    title: "Planning and doing the work",
    lead:
      "The scaffolding between a settled spec and merged code. Everything these produce is deliberately temporary and removed when the work closes.",
    skills: ["spec-plan", "spec-tasks", "spec-implement"],
  },
  {
    title: "Closing the work",
    lead:
      "The step most loops skip. What was learned goes back into the documents before it is lost, rather than into a summary nobody reads again.",
    skills: ["spec-reconcile", "pre-pr-review", "add-to-backlog", "record-run"],
  },
  {
    title: "Running the cadence",
    lead:
      "For a team that commits to work in periods and has to answer when things will land. Optional - a solo repo can run the whole loop above without ever opening a sprint.",
    skills: ["sprint-open", "sprint-close", "timeline-update"],
  },
  {
    title: "Seeing where things stand",
    lead:
      "Reading the state the repository already records, rather than summarising it again by hand. Nothing here writes anything.",
    skills: ["show-backlog"],
  },
  {
    title: "Staying on the standard",
    lead: "The standard is living, so a repo that adopted it once has to be able to move with it.",
    skills: ["update-to-version"],
  },
];

const frontmatter = (dir, name) => {
  const p = `${dir}/${name}/SKILL.md`;
  if (!existsSync(p)) return null;
  const body = readFileSync(p, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(body);
  if (!m) return null;
  const desc = /^description:\s*(.+)$/m.exec(m[1]);
  return desc ? desc[1].trim() : null;
};

const shipped = existsSync(SHIPPED)
  ? readdirSync(SHIPPED).filter((d) => existsSync(`${SHIPPED}/${d}/SKILL.md`)).sort()
  : [];
const own = existsSync(OWN) ? readdirSync(OWN).filter((d) => existsSync(`${OWN}/${d}/SKILL.md`)).sort() : [];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
};

const grouped = GROUPS.flatMap((g) => g.skills);
for (const s of shipped) {
  if (!grouped.includes(s)) {
    fail(`${s} ships but belongs to no group in tools/skill-map.mjs - add it to the group whose moment it fires in, so the catalogue cannot quietly stop covering the tree`);
  }
}
for (const s of grouped) {
  if (!shipped.includes(s)) fail(`the catalogue groups "${s}", which no longer ships`);
}
const dupes = grouped.filter((s, i) => grouped.indexOf(s) !== i);
if (dupes.length) fail(`grouped more than once: ${[...new Set(dupes)].join(", ")}`);

const row = (dir, name) => {
  const d = frontmatter(dir, name);
  if (!d) {
    fail(`${dir}/${name}/SKILL.md has no description in its frontmatter - the description IS the catalogue entry`);
    return `| \`${name}\` | (no description) |`;
  }
  return `| \`${name}\` | ${d.replace(/\|/g, "\\|")} |`;
};

const sections = GROUPS.map(
  (g) => `## ${g.title}

${g.lead}

| Skill | When to reach for it |
|---|---|
${g.skills.map((s) => row(SHIPPED, s)).join("\n")}`,
).join("\n\n");

const ownSection = own.length
  ? `\n\n## Moving a repo onto the standard

These live in this repository and are **never** copied into an adopted repo - they run *from*
here, against somebody else's tree, and one of them runs before the target repo exists.
Finding one inside an adopted repo is a hand-copy mistake, and \`self-verify\` warns about it.

| Skill | When to reach for it |
|---|---|
${own.map((s) => row(OWN, s)).join("\n")}`
  : "";

const page = `<!-- GENERATED by tools/skill-map.mjs from each skill's own frontmatter. Do not edit by
     hand: a hand-written catalogue of twenty procedures is a second source of truth, and this
     repo has watched that fail twice in tools/README.md alone. Change a skill's description
     and re-run the tool; \`--check\` fails CI on a stale page. -->

# What each skill is for

${shipped.length} procedures ship into an adopted repo, and their names are terse on purpose. This page
says what each one is for, grouped by **the moment it fires** rather than by what it writes -
because a reader arrives with a situation, not with an artifact name.

Every description below is the skill's own, verbatim from its frontmatter, which is what an
agent reads when deciding whether to run it. If a description here does not match what the
skill does, the skill is wrong, not this page.

The folder itself, and the rule that decides whether a new skill earns its place, are in
[\`.claude/skills/\`](tree/claude-skills.md).

${sections}${ownSection}

## If your agent is not Claude Code

The procedures are markdown, not a Claude feature. \`.claude/skills/\` is where Claude Code
looks; another agent reads the same files from wherever it looks. The port is a path, not a
rewrite - see [\`.claude/skills/\`](tree/claude-skills.md).
`;

if (failures) {
  console.error(`\nskill-map: ${failures} problem(s)`);
  process.exit(1);
}

if (check) {
  if (!existsSync(OUT) || readFileSync(OUT, "utf8") !== page) {
    console.error(`skill-map: ${OUT} is stale - run \`node tools/skill-map.mjs\``);
    process.exit(1);
  }
  console.log(`skill-map: OK - ${OUT} matches the skills (${shipped.length} shipped, ${own.length} zone 1)`);
} else {
  writeFileSync(OUT, page);
  console.log(`skill-map: wrote ${OUT} - ${shipped.length} shipped skills in ${GROUPS.length} groups, ${own.length} zone 1`);
}
