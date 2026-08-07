#!/usr/bin/env node
// self-verify-fill-test - manifest-driven checks that must be enforceable, not just present.
//
// Two regressions, both found by the same failure mode: a check that reports green no
// matter what actually happened to the tree.
//
// 1. The placeholder warning must be clearable. Found by building a real adopting repo and
//    filling it in properly: the warning would not go away. The pattern matched generic
//    notation - `specs/<capability>`, `docs/discovery/<topic>/`, `blocked:<id>` - which a
//    *correctly filled* repo keeps, and which the shipped AGENTS.md carries in its own
//    altitude ladder. So the one file the check exists for could never clear it, and a
//    warning nobody can clear is one everybody learns to skip. The fix strips code spans
//    and fenced blocks first, on the convention that angle brackets in prose mean "replace
//    me" and angle brackets in code are notation. Both halves are asserted: notation must
//    not warn, and a real prose placeholder must still warn - a fix that silenced the check
//    entirely would pass the first assertion alone.
//
// 2. The AGENTS.md section that makes the loop self-trigger had no `sections` entry at all,
//    so deleting it changed nothing self-verify reported. (The sibling regression - a
//    required lifecycle skill removed from `.claude/skills` - turned out to need no new
//    mechanism: that directory is already a copy-class entry with one recorded hash per
//    skill, so a missing member is a named content FAIL. See
//    tools/self-verify-drift-test.mjs.) Two new `sections` entries close the AGENTS.md gap,
//    asserted here the same way: delete the heading, expect a FAIL naming it; leave the
//    shipped tree alone, expect none.
//
// Usage: node tools/self-verify-fill-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TREE = join(process.cwd(), "standard");

// A repo the check can run against: the shipped tree, plus the pin an adopter writes at
// align time. Files under test are overwritten per case.
const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "fill-check-"));
  cpSync(TREE, dir, { recursive: true });
  writeFileSync(join(dir, ".standards-version"), "0.7.2\n");
  for (const [rel, body] of Object.entries(files)) writeFileSync(join(dir, rel), body);
  return dir;
};

let failures = 0;
const check = (name, { files, warnsAbout }) => {
  const dir = fixture(files);
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs")], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });

  const warned = out.split("\n").filter((l) => l.includes("still carries template placeholders"));
  const named = (f) => warned.some((l) => l.includes(f));
  const wrong = warnsAbout.some(([file, expected]) => named(file) !== expected);

  if (wrong) {
    failures++;
    const got = warned.map((l) => l.trim()).join("\n       ") || "(no fill warnings)";
    console.error(`  FAIL ${name}\n       expected ${JSON.stringify(warnsAbout)}\n       ${got}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const FILLED_HEAD = "# Acme Scheduling\n\nA real, filled README for a real repo.\n\n";

check("generic notation inside code spans does not warn", {
  files: {
    "README.md":
      `${FILLED_HEAD}Specs live at \`specs/<capability>/spec.md\` and discovery at ` +
      "`docs/discovery/<topic>/`. A blocked row is written `blocked:<id>`.\n",
  },
  warnsAbout: [["README.md", false]],
});

check("a fenced block full of notation does not warn", {
  files: {
    "README.md": `${FILLED_HEAD}\`\`\`\nPRINCIPLES -> ADR -> specs/<capability> -> code\n\`\`\`\n`,
  },
  warnsAbout: [["README.md", false]],
});

check("an angle-bracket placeholder in prose still warns", {
  files: { "README.md": `# <repo>\n\nSomething about <the product>.\n` },
  warnsAbout: [["README.md", true]],
});

check("a mustache placeholder in prose still warns", {
  files: { "README.md": `${FILLED_HEAD}Contact {{SECURITY_CONTACT}} about anything.\n` },
  warnsAbout: [["README.md", true]],
});

check("notation and a real placeholder together still warn", {
  files: {
    "README.md": `${FILLED_HEAD}Specs live at \`specs/<capability>/\`, owned by <team name>.\n`,
  },
  warnsAbout: [["README.md", true]],
});

// A table row of ellipsis cells is the other shape a template leaves behind, and the one a
// showcase repo shipped in its own entry file while self-verify said nothing.
check("a table row of ellipsis cells is an unfilled shell", {
  files: {
    "README.md": `${FILLED_HEAD}| Capability | Owner |\n|---|---|\n| ... | ... |\n`,
  },
  warnsAbout: [["README.md", true]],
});

check("a filled table row does not warn, and neither does an empty one", {
  files: {
    // Empty cells are deliberately not a placeholder: a table with nothing in it yet is a
    // legitimate state, and a warning it cannot clear is one everybody learns to skip.
    "README.md": `${FILLED_HEAD}| Capability | Owner |\n|---|---|\n| booking | platform |\n\n| Team | Cycle |\n|---|---|\n| | |\n`,
  },
  warnsAbout: [["README.md", false]],
});

// The regression in its original form: the shipped entry file carries `specs/<capability>`
// in its altitude ladder, so before the fix AGENTS.md warned no matter how completely an
// adopter filled it. Only the genuine markers should keep it warning now.
check("the shipped AGENTS.md warns for its real markers, not its notation", {
  files: {},
  warnsAbout: [["AGENTS.md", true]],
});

// Too loose in one direction: ordinary README markup has the same shape as `<repo>`, and
// the warning fired on it in four foreign repos - files the standard never wrote and an
// adopter cannot "fill".
check("HTML markup in a filled README does not warn", {
  files: {
    "README.md":
      `${FILLED_HEAD}<picture><source media="(prefers-color-scheme: dark)" srcset="logo-dark.png"><img src="logo.png" alt="Acme"></picture>\n\n` +
      "<details>\n<summary>More</summary>\n\nRun it with <code>pnpm dev</code>, then press <kbd>r</kbd>.<br>\n</details>\n",
  },
  warnsAbout: [["README.md", false]],
});

// Too tight in the other: the pattern was ASCII-only, so a translated shell nobody filled
// reached drift 0 looking complete.
check("a placeholder in a non-Latin script warns", {
  files: { "README.md": "# 项目名称\n\n这个仓库属于 <角色名>。\n" },
  warnsAbout: [["README.md", true]],
});

check("a multi-word placeholder in Cyrillic warns", {
  files: { "README.md": "# Проект\n\nВладелец: <нужно заполнить>.\n" },
  warnsAbout: [["README.md", true]],
});

check("an autolink is not a placeholder", {
  files: { "README.md": `${FILLED_HEAD}Report issues at <https://example.com/issues>.\n` },
  warnsAbout: [["README.md", false]],
});

// The decision records were outside the scanned set entirely, so the one placeholder the
// record templates ship - `| **Author** | {{AUTHOR}} |` - reached drift 0 on every record
// ever written. Four directions are asserted: the unfilled row warns, a filled record does
// not, the template it was copied from is still allowed to carry placeholders (a warning on
// the template is one nobody can clear, so it is one everybody learns to skip), and prose
// angle notation inside a record does not warn - records are the repo's own writing, and the
// last case is a real one, taken from this project's own log.
const RECORD = (author) =>
  "# ADR-001: use Postgres\n\n| | |\n| --- | --- |\n| **Status** | Accepted |\n" +
  `| **Date** | 2026-08-06 |\n| **Author** | ${author} |\n| **Tags** | datastore |\n\n` +
  "## Context\n\nThe scheduling data outgrew the file store.\n\n## Decision\n\nWe will use Postgres.\n";

check("an unfilled record author warns", {
  files: { "docs/decision-records/adr/ADR-001-use-postgres.md": RECORD("{{AUTHOR}}") },
  warnsAbout: [["ADR-001-use-postgres.md", true]],
});

check("a filled record does not warn", {
  files: { "docs/decision-records/adr/ADR-001-use-postgres.md": RECORD("adrienne") },
  warnsAbout: [["ADR-001-use-postgres.md", false]],
});

check("the record template itself is not a shell to fill", {
  files: {},
  warnsAbout: [["decision-records/adr/_template.md", false], ["decision-records/bdr/_template.md", false]],
});

// A record can sit directly under docs/decision-records/ rather than in an adr/ or bdr/
// subfolder - decision-records-check.mjs detects both layouts, and so must this: the scan
// keys on the record filename, not on a fixed directory.
check("a record directly under docs/decision-records/ is scanned as well", {
  files: { "docs/decision-records/BDR-004-target-personas.md": RECORD("{{AUTHOR}}") },
  warnsAbout: [["BDR-004-target-personas.md", true]],
});

// Both angle tokens below are lifted verbatim from this project's own records, where they are
// notation inside a quoted utterance. Scanning records with the full pattern warned on 2 of
// this repo's 33 records for exactly this, so records get the two forms that are never
// anything else - and this case is what stops the angle form being added back.
check("prose angle notation in a record does not warn", {
  files: {
    "docs/decision-records/adr/ADR-002-transition-skills.md":
      "# ADR-002: transition skills run from the standard\n\n| | |\n| --- | --- |\n" +
      "| **Status** | Accepted |\n| **Date** | 2026-08-06 |\n| **Author** | adrienne |\n\n" +
      "## Context\n\nThe agent says \"I'll align you to <standard>@<version>\", and the intake\n" +
      "asks: your stack is <technology> - shall I offer the <technology> best practices?\n",
  },
  warnsAbout: [["ADR-002-transition-skills.md", false]],
});

// Stripping code spans is right for the angle form and was wrong for everything else: the
// shipped SECURITY.md writes `{{SECURITY_CONTACT}}` inside backticks and personas.md wrote
// its roster marker the same way, so both passed silently - a fake security contact and an
// empty persona roster at drift 0. PRINCIPLES.md had no marker of either form at all.
check("a mustache placeholder inside a code span still warns", {
  files: { "README.md": `${FILLED_HEAD}Email \`{{SECURITY_CONTACT}}\` about anything.\n` },
  warnsAbout: [["README.md", true]],
});

check("a mustache placeholder inside a fenced block still warns", {
  files: { "README.md": `${FILLED_HEAD}\`\`\`\ncontact: {{SECURITY_CONTACT}}\n\`\`\`\n` },
  warnsAbout: [["README.md", true]],
});

// The other direction, and the reason the raw form is restricted to UPPER_SNAKE: a filled
// repo's README quotes CI expressions, and a warning it cannot clear is one nobody reads.
check("a CI expression in a filled README does not warn", {
  files: {
    "README.md":
      `${FILLED_HEAD}Release runs on \`\${{ github.ref }}\` with \`\${{ secrets.NPM_TOKEN }}\`.\n\n` +
      "```yaml\nenv:\n  TOKEN: ${{ secrets.NPM_TOKEN }}\n  REF: ${{ github.event.pull_request.head.sha }}\n```\n",
  },
  warnsAbout: [["README.md", false]],
});

// The two code forms an old document uses and the check used to miss. Both were found on
// third-party repositories during the 2026-08-07 adoption round, in files the standard
// never wrote and an adopter cannot "fill": git/git's README.md and vim/vim's AGENTS.md.
check("a code span wrapped across a line break is not a placeholder", {
  files: {
    // git/git README.md:26-27, verbatim shape.
    "README.md":
      `${FILLED_HEAD}documentation of each command with \`man git-<commandname>\` or \`git help\n<commandname>\`.\n`,
  },
  warnsAbout: [["README.md", false]],
});

check("a real placeholder after a wrapped code span still warns", {
  files: {
    "README.md": `${FILLED_HEAD}Run \`git help\n<commandname>\` for details. Owned by <team name>.\n`,
  },
  warnsAbout: [["README.md", true]],
});

check("notation in an indented code block is not a placeholder", {
  files: {
    // vim/vim AGENTS.md:84-92, verbatim shape: a commit-message example indented four
    // spaces rather than fenced.
    "README.md":
      `${FILLED_HEAD}Vim uses a strict commit message format:\n\n` +
      "    patch 9.2.NNNN: short description of the problem\n\n" +
      "    Signed-off-by: Author Name <email>\n\nThat is the whole convention.\n",
  },
  warnsAbout: [["README.md", false]],
});

check("a placeholder in an indented list continuation still warns", {
  files: {
    // Four spaces under a bullet is a continuation paragraph, not code - so the strip must
    // not reach it, or a nested unfilled marker would go silent.
    "README.md": `${FILLED_HEAD}- The owner is:\n\n    <team name>\n`,
  },
  warnsAbout: [["README.md", true]],
});

// The subtle half of letting a span cross a line break: `` `x` `` - the way markdown shows
// a backtick - is a two-backtick delimiter. Paired one backtick at a time it leaves an odd
// one behind, and every span after it shifts by one, which exposed the notation on the
// FOLLOWING lines. vim/vim's AGENTS.md:257-262 is exactly this list.
check("notation after a double-backtick span is still notation", {
  files: {
    "README.md":
      `${FILLED_HEAD}Cross-references:\n\n` +
      "- `` `:cmd` `` is an Ex command.\n- `'option'` is an option name.\n- `<Key>` or `CTRL-X` are special keys.\n",
  },
  warnsAbout: [["README.md", false]],
});

// PRINCIPLES.md's own banner says shipping it unread adopts commitments nobody agreed to,
// and nothing checked whether it was still there. Deleting the note, as it instructs, is
// what clears this - so both directions are asserted.
check("a shipped template banner is an unfilled shell", {
  files: {
    "README.md": `# Acme Scheduling\n\n> **Template - rewrite every line, then delete this note.**\n\nA real, filled README.\n`,
  },
  warnsAbout: [["README.md", true]],
});

check("a real placeholder after a double-backtick span still warns", {
  files: {
    "README.md": `${FILLED_HEAD}Use \`\` \`:cmd\` \`\` for commands. Maintained by <team name>.\n`,
  },
  warnsAbout: [["README.md", true]],
});

check("a README with the banner deleted does not warn", {
  files: { "README.md": `${FILLED_HEAD}Principles we actually agreed on, written by us.\n` },
  warnsAbout: [["README.md", false]],
});

// The shipped tree itself, unfilled: these are the three files the check listed and never
// fired on. Read against the tree rather than a hand-written copy of it, so a template that
// drops its marker fails here instead of passing quietly.
check("the shipped SECURITY.md, personas.md and PRINCIPLES.md warn while unfilled", {
  files: {},
  warnsAbout: [
    ["SECURITY.md", true],
    ["docs/personas.md", true],
    ["docs/PRINCIPLES.md", true],
  ],
});

check("filled versions of all three clear the warning", {
  files: {
    "SECURITY.md": "# Security\n\nEmail `security@acme.example` - do not open a public issue. We reply within 3 business days.\n",
    "docs/personas.md":
      "# Personas\n\n## The roster\n\n| Persona | Primary? | One-line |\n|---|---|---|\n" +
      "| `Owner-operator Olga` | yes | runs four rentals herself |\n",
    "docs/PRINCIPLES.md": "# Engineering principles\n\n- **Boring, proven tech.** Prefer the dull option.\n",
  },
  warnsAbout: [
    ["SECURITY.md", false],
    ["docs/personas.md", false],
    ["docs/PRINCIPLES.md", false],
  ],
});

check("an unmatched backtick cannot swallow a later placeholder", {
  files: {
    "README.md": `${FILLED_HEAD}A stray \` backtick here.\n\nThe owner is <team name>.\n`,
  },
  warnsAbout: [["README.md", true]],
});

// Regression 2: a required sections[] entry must turn "removed" into a reported FAIL, not
// stay silently green because the file the heading lived in is still there. (The sibling
// regression - a required lifecycle skill deleted from .claude/skills - turned out to be the
// same gap self-verify's copy-class content check already closes: each shipped skill is a
// member of that directory entry's sha256 map, so a missing one is a named content FAIL;
// see tools/self-verify-drift-test.mjs for that coverage.)
const fixtureTree = () => {
  const dir = mkdtempSync(join(tmpdir(), "drift-check-"));
  cpSync(TREE, dir, { recursive: true });
  return dir;
};

const checkDrift = (name, { editAgents, editChangelog, renameChangelog, failsAbout }) => {
  const dir = fixtureTree();
  if (renameChangelog) {
    const from = join(dir, "CHANGELOG.md");
    const body = readFileSync(from, "utf8");
    rmSync(from);
    writeFileSync(join(dir, renameChangelog), body);
  }
  if (editAgents) {
    const p = join(dir, "AGENTS.md");
    writeFileSync(p, editAgents(readFileSync(p, "utf8")));
  }
  if (editChangelog) {
    const p = join(dir, "CHANGELOG.md");
    writeFileSync(p, editChangelog(readFileSync(p, "utf8")));
  }
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs"), "--skeleton"], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });

  // WARN counts as a reported line here: the case-twin hazard is a warning by design, because the
  // file genuinely is missing and the drift number should say so - what must not be silent is the
  // fact that creating it destroys something.
  const failLines = out.split("\n").filter((l) => /^\s*(FAIL|WARN)\b/.test(l));
  const named = (needle) => failLines.some((l) => l.includes(needle));
  const wrong = failsAbout.some(([needle, expected]) => named(needle) !== expected);

  if (wrong) {
    failures++;
    const got = failLines.map((l) => l.trim()).join("\n       ") || "(no FAIL lines)";
    console.error(`  FAIL ${name}\n       expected FAIL containing ${JSON.stringify(failsAbout)}\n       ${got}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const dropSection = (heading, nextHeading) => (body) => {
  const start = body.indexOf(`## ${heading}`);
  const end = body.indexOf(`## ${nextHeading}`);
  return body.slice(0, start) + body.slice(end);
};

checkDrift("removing the unprompted-behaviour section is drift", {
  editAgents: dropSection("The loop runs itself (unprompted)", "What you must not do"),
  failsAbout: [
    ['missing the "The loop runs itself (unprompted)" section', true],
    ["missing the \"Volunteer, don't wait to be asked\" section", true],
  ],
});

checkDrift("the shipped tree carries every required section - no false positive", {
  failsAbout: [
    ['missing the "The loop runs itself (unprompted)" section', false],
    ["missing the \"Volunteer, don't wait to be asked\" section", false],
  ],
});

// Markdown has two heading forms and the section check only ever saw one. A repository whose
// changelog underlines its headings - setext, equally valid, and what a changelog older than the
// ATX habit tends to use - was told its `Unreleased` section was missing while the word sat
// there in the file. The only way to satisfy the check was to restyle somebody else's changelog,
// which is the standard rewriting a repository to suit its own regex.
//
// The rewrite has a false-positive edge the fix has to hold: a table row sits directly above a
// `|---|---|` delimiter, which reads exactly like a setext underline if the check is careless.
// The same name in another case, on a filesystem that cannot tell them apart. Reporting the file
// missing is correct; what the adopter does next is not. Writing `CHANGELOG.md` beside an existing
// `ChangeLog.md` on APFS or NTFS lands on the existing file and destroys it - reproduced, a
// repository's whole release history gone by following the procedure exactly. The report has to
// carry the warning, because the report is what sends somebody to create the file.
checkDrift("a required file whose case twin is present warns instead of sending you to overwrite it", {
  renameChangelog: "ChangeLog.md",
  failsAbout: [
    ["DO NOT CREATE CHANGELOG.md", true],
    ["ChangeLog.md is here - the same name in another case", true],
  ],
});

checkDrift("a setext Unreleased heading is a heading", {
  editChangelog: () => "Changelog\n=========\n\nUnreleased\n----------\n\nTBD\n",
  failsAbout: [['CHANGELOG.md is missing the "Unreleased" section', false]],
});

checkDrift("a table row above its delimiter is not a heading", {
  editChangelog: () => "# Changelog\n\n| Unreleased | notes |\n|---|---|\n| a | b |\n",
  failsAbout: [['CHANGELOG.md is missing the "Unreleased" section', true]],
});

checkDrift("an Unreleased section shown inside a code fence is an example, not the section", {
  editChangelog: () => "# Changelog\n\nWrite it like this:\n\n```\nUnreleased\n----------\n```\n",
  failsAbout: [['CHANGELOG.md is missing the "Unreleased" section', true]],
});

// The decision catalog is a menu, and the run must not describe it as a quota. R7 "names no
// subset and asserts no count", while the manifest marked all eight entries required:true and
// the summary printed "8 catalogued decisions to confirm recorded at review" on every run -
// a number in a report whose other numbers are drift and adoption. Both halves are asserted,
// because deleting the line would satisfy the first one alone.
const decisionNote = (edit) => {
  const dir = fixtureTree();
  if (edit) {
    const p = join(dir, "standard.manifest.json");
    const m = JSON.parse(readFileSync(p, "utf8"));
    edit(m);
    writeFileSync(p, `${JSON.stringify(m, null, 2)}\n`);
  }
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs"), "--skeleton"], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });
  return out.split("\n").filter((l) => /^\s*(····|FAIL)\s+decision\b/.test(l));
};

const expect = (name, ok, detail) => {
  if (ok) console.log(`  ok    ${name}`);
  else {
    failures++;
    console.error(`  FAIL ${name}\n       ${detail}`);
  }
};

const shippedNote = decisionNote();
expect(
  "the run still surfaces the decision catalog for review",
  shippedNote.some((l) => l.includes("confirm at review")),
  `no decision note in the run: ${shippedNote.join(" | ") || "(none)"}`,
);
expect(
  "the decision note asserts no count",
  shippedNote.every((l) => !/\d/.test(l.replace(/https?:\/\/\S+/g, "").replace(/\bR\d+\b/g, ""))),
  `a decision line still carries a number: ${shippedNote.join(" | ")}`,
);
expect(
  "the shipped manifest marks no decision area required",
  !decisionNote().some((l) => l.includes("cannot be required by the manifest")),
  "the shipped manifest still declares a required decision area",
);
expect(
  "a manifest that marks a decision area required is drift",
  decisionNote((m) => {
    m.decisions[0].required = true;
  }).some((l) => l.trim().startsWith("FAIL") && l.includes("cannot be required by the manifest")),
  "self-verify accepted a decisions entry claiming required:true",
);

// A stub the adopter wrote themselves carries no template placeholder, so the check above is
// blind to it - and the file list it walked was hardcoded, so `CONTRIBUTING.md` (a
// fill-from-repo entry) was covered by nothing at all. Six such files moved a sparse repo
// from 21% to 37% adopted with its substance unchanged.
//
// What is asserted here is the boundary, in both directions. "Visibly nothing written" must
// warn; terse-but-real must not. A length threshold would fail that second half, which is why
// there is no length threshold.
const checkSubstance = (name, { files, warnsAbout }) => {
  const dir = fixture(files);
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs")], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });

  const warned = out.split("\n").filter((l) => l.includes("presence is not substance"));
  const named = (f) => warned.some((l) => l.includes(` ${f} `));
  const wrong = warnsAbout.some(([file, expected]) => named(file) !== expected);

  if (wrong) {
    failures++;
    const got = warned.map((l) => l.trim()).join("\n       ") || "(no substance warnings)";
    console.error(`  FAIL ${name}\n       expected ${JSON.stringify(warnsAbout)}\n       ${got}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

checkSubstance("a self-written TODO stub warns, on a file the hardcoded list never covered", {
  files: { "CONTRIBUTING.md": "# Contributing\n\nTODO.\n" },
  warnsAbout: [["CONTRIBUTING.md", true]],
});

checkSubstance("a file with nothing but a heading warns", {
  files: { "SECURITY.md": "# Security\n" },
  warnsAbout: [["SECURITY.md", true]],
});

checkSubstance("a marker meaning nobody has written this yet warns, whichever spelling", {
  files: { "docs/PRODUCT.md": "# Product\n\nTBD\n", "SECURITY.md": "# Security\n\nWork in progress\n" },
  warnsAbout: [["docs/PRODUCT.md", true], ["SECURITY.md", true]],
});

checkSubstance("a terse but real file does not warn - substance is not length", {
  files: {
    "SECURITY.md": "# Security\n\nReport vulnerabilities to security@example.com. We acknowledge within five working days.\n",
    "CONTRIBUTING.md": "# Contributing\n\nOpen a pull request against main; the conventions live in AGENTS.md.\n",
  },
  warnsAbout: [["SECURITY.md", false], ["CONTRIBUTING.md", false]],
});

// Found by probing the boundary rather than by a case failing: the placeholder scan strips
// code before matching, and reusing that stripped body for the emptiness test warned on a
// SECURITY.md whose whole content is the command to file an advisory - a finished file. Code
// is content here, even though it is notation there.
checkSubstance("a file whose only content is a fenced command is not empty", {
  files: { "SECURITY.md": "# Security\n\n```\ngh security-advisory create --repo acme/api\n```\n" },
  warnsAbout: [["SECURITY.md", false]],
});

checkSubstance("a support table with no prose is content", {
  files: { "SECURITY.md": "# Security\n\n| Version | Supported |\n|---|---|\n| 2.x | yes |\n" },
  warnsAbout: [["SECURITY.md", false]],
});

checkSubstance("a heading plus a real list is content, not an empty shell", {
  files: { "docs/ARCHITECTURE.md": "# Architecture\n\n## Shape\n\n- A Fastify API behind a Next proxy.\n- Postgres, one schema.\n" },
  warnsAbout: [["docs/ARCHITECTURE.md", false]],
});

console.log();
if (failures) {
  console.error(`self-verify-fill-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(
  "self-verify-fill-test: OK - the fill warning is clearable, still fires, reads any script, catches an ellipsis row and an unfilled record author, leaves the templates alone, a file that says only TODO is flagged as unfilled, a removed required AGENTS.md section is reported as drift, and the decision catalog is surfaced without asserting a count",
);
