#!/usr/bin/env node
// facts-check-test - drive the derived-facts check over fixtures.
//
// The failure that matters here is not a wrong number, it is a claim that stops
// matching: a surface gets reworded, the pattern finds nothing, and a check that
// treated that as "nothing to disagree with" would go quiet exactly when the
// sentence it guards became unguarded. That case is the reason this file exists.
//
// Usage: node tools/facts-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHECK = join(process.cwd(), "standard/scripts/facts-check.mjs");

const FACTS = [
  {
    id: "skills",
    what: "how many skills ship",
    home: { count: "tree/skills/*/SKILL.md" },
    claims: [{ file: "README.md", pattern: "the (\\d+) shipped skills" }],
  },
  {
    // A glob whose wildcard is its FIRST path segment, which is how a monorepo counts a file
    // that exists once per top-level package. The walk started at the fixed part of the glob,
    // that part was the empty string, and the count came back 0. Zero is the dangerous answer
    // because it is a number: the run did not error, it reported `the source says "0"` and
    // blamed the prose. A repository with thirteen component changelogs was told it had none.
    id: "top-level-changelogs",
    what: "how many component changelogs this monorepo carries",
    home: { count: "*/CHANGELOG.md" },
    claims: [{ file: "README.md", pattern: "(\\d+) component changelogs" }],
  },
  {
    id: "slug",
    what: "where the tree is degit'd from",
    home: { match: { file: "README.md", pattern: "npx degit (\\S+)" } },
    claims: [{ file: "docs/adopt.md", pattern: "npx degit (\\S+)" }],
  },
  {
    // A count of what one file declares. The rule count is the case that needed it: the
    // spec said "R1-R24" while defining R25, and neither of the other home forms can
    // express "how many of these does this file declare".
    id: "rules",
    what: "how many numbered rules the spec declares",
    home: { countMatches: { file: "SPEC.md", pattern: "^- \\*\\*R\\d+\\.\\*\\*" } },
    claims: [{ file: "README.md", pattern: "rules are numbered R1-R(\\d+)" }],
  },
];

const BASE = {
  "tree/skills/one/SKILL.md": "# one\n",
  "tree/skills/two/SKILL.md": "# two\n",
  "README.md": "the 2 shipped skills\n\nnpx degit owner/repo\n\nrules are numbered R1-R2\n\n3 component changelogs\n",
  "actionpack/CHANGELOG.md": "# actionpack\n",
  "activerecord/CHANGELOG.md": "# activerecord\n",
  "railties/CHANGELOG.md": "# railties\n",
  "docs/adopt.md": "run npx degit owner/repo to start\n",
  "SPEC.md": "# Spec\n\n- **R1.** a rule\n- **R2.** another rule\n",
};

// A repo whose canonical fact lives in a binary artifact - a font's version inside its
// TTF name table. The two encodings matter: the check used to answer differently
// depending on which one the artifact happened to use, matching the ASCII record and
// reporting a green tick, and reporting "matches nothing" for the UTF-16 one as though
// the pattern were at fault. Both are the same unsupported home.
const nameTable = (bytes) =>
  Buffer.concat([Buffer.from([0x00, 0x01, 0x00, 0x00]), Buffer.from("name"), Buffer.from([0x00, 0x00]), bytes]);
const BINARY = {
  "font-ascii.ttf": nameTable(Buffer.from("Version 2.103", "ascii")),
  "font-utf16.ttf": nameTable(Buffer.from("Version 2.103".split("").flatMap((c) => [0, c.charCodeAt(0)]))),
};
const BINARY_FACT = (file) => [
  {
    id: "font-version",
    what: "the font's version, which lives in the binary name table",
    home: { match: { file, pattern: "Version (\\d+\\.\\d+)" } },
    claims: [{ file: "README.md", pattern: "at version (\\d+\\.\\d+)" }],
  },
];

const run = (dir, args = ["--facts", "facts.json"]) => {
  try {
    return { code: 0, out: execFileSync("node", [CHECK, ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

const CASES = [
  { name: "every restatement agreeing passes", fails: false, says: "every restatement agrees", files: {} },
  { name: "a stale count fails", fails: true, says: 'says "3", the source says "2"', files: { "README.md": "the 3 shipped skills\n\nnpx degit owner/repo\n" } },
  { name: "a new file under the glob moves the source", fails: true, says: 'the source says "3"', files: { "tree/skills/three/SKILL.md": "# three\n" } },
  { name: "a reworded surface fails instead of going quiet", fails: true, says: "matches nothing", files: { "docs/adopt.md": "clone it from GitHub to start\n" } },
  { name: "a claim pointing at a file that is gone fails", fails: true, says: "does not exist", files: {}, drop: ["docs/adopt.md"] },
  { name: "a home pattern that matches nothing fails", fails: true, says: "matches nothing", files: { "README.md": "the 2 shipped skills\n" } },
  {
    name: "a rule added to the file moves the count, and the restatement fails",
    fails: true,
    says: 'says "2", the source says "3"',
    files: { "SPEC.md": "# Spec\n\n- **R1.** a rule\n- **R2.** another rule\n- **R3.** a third rule\n" },
  },
  {
    name: "a counted home whose pattern matches nothing fails rather than counting zero",
    fails: true,
    says: "matches nothing",
    files: { "SPEC.md": "# Spec\n\nno rules here any more\n" },
  },
  {
    name: "a wildcard in the first path segment counts, instead of silently reporting zero",
    fails: false,
    says: "top-level-changelogs = 3",
  },
  {
    name: "and that count still moves when a package is added",
    fails: true,
    says: 'says "3", the source says "4"',
    files: { "actionmailer/CHANGELOG.md": "# actionmailer\n" },
  },

  // A repo that declares no facts is not a repo with drift - the shipped guard runs
  // in every adopting repo and must stay quiet where nothing was declared.
  { name: "a repo with no declared facts passes", fails: false, says: "skipping", files: {}, args: [] },
  {
    name: "a home inside a binary artifact is refused by name, not answered by accident",
    fails: true,
    says: "font-ascii.ttf is not UTF-8 text",
    files: { ...BINARY, "README.md": "this font ships at version 2.103\n" },
    facts: BINARY_FACT("font-ascii.ttf"),
  },
  {
    name: "the same binary home in another encoding gets the same answer, not 'matches nothing'",
    fails: true,
    says: "font-utf16.ttf is not UTF-8 text",
    files: { ...BINARY, "README.md": "this font ships at version 2.103\n" },
    facts: BINARY_FACT("font-utf16.ttf"),
  },
  {
    name: "a claim pointing into a binary artifact is refused the same way",
    fails: true,
    says: "font-ascii.ttf is not UTF-8 text",
    files: { ...BINARY, "README.md": "this font ships at version 2.103\n" },
    facts: [
      {
        id: "font-version",
        what: "a text home restated inside a binary artifact",
        home: { match: { file: "README.md", pattern: "at version (\\d+\\.\\d+)" } },
        claims: [{ file: "font-ascii.ttf", pattern: "Version (\\d+\\.\\d+)" }],
      },
    ],
  },
  // The boundary must not cost the ordinary case: a text home beside binary artifacts
  // in the same repo still resolves and still passes.
  {
    name: "a text home in a repo that also ships binaries still passes",
    fails: false,
    says: "every restatement agrees",
    files: { ...BINARY },
  },
];

let failures = 0;
for (const c of CASES) {
  const dir = mkdtempSync(join(tmpdir(), "facts-check-test-"));
  const files = { ...BASE, ...c.files };
  for (const drop of c.drop ?? []) delete files[drop];
  files["facts.json"] = JSON.stringify(c.facts ?? FACTS, null, 2);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }

  const { code, out } = run(dir, c.args);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  rmSync(dir, { recursive: true, force: true });
}

if (failures) {
  console.log(`\nfacts-check-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nfacts-check-test: OK - ${CASES.length} cases, a fact that drifts or stops being covered fails`);
