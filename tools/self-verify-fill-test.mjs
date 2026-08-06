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
// ever written. All three directions are asserted: the unfilled row warns, a filled record
// does not, and the template it was copied from is still allowed to carry placeholders (a
// warning on the template is one nobody can clear, so it is one everybody learns to skip).
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

const checkDrift = (name, { editAgents, failsAbout }) => {
  const dir = fixtureTree();
  if (editAgents) {
    const p = join(dir, "AGENTS.md");
    writeFileSync(p, editAgents(readFileSync(p, "utf8")));
  }
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs"), "--skeleton"], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });

  const failLines = out.split("\n").filter((l) => l.trim().startsWith("FAIL"));
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

console.log();
if (failures) {
  console.error(`self-verify-fill-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(
  "self-verify-fill-test: OK - the fill warning is clearable, still fires, reads any script, catches an ellipsis row and an unfilled record author, leaves the templates alone, a removed required AGENTS.md section is reported as drift, and the decision catalog is surfaced without asserting a count",
);
