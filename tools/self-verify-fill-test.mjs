#!/usr/bin/env node
// self-verify-fill-test - the placeholder warning must be clearable.
//
// Found by building a real adopting repo and filling it in properly: the warning would not
// go away. The pattern matched generic notation - `specs/<capability>`,
// `docs/discovery/<topic>/`, `blocked:<id>` - which a *correctly filled* repo keeps, and
// which the shipped AGENTS.md carries in its own altitude ladder. So the one file the check
// exists for could never clear it, and a warning nobody can clear is one everybody learns
// to skip.
//
// The fix strips code spans and fenced blocks first, on the convention that angle brackets
// in prose mean "replace me" and angle brackets in code are notation. Both halves are
// asserted here: notation must not warn, and a real prose placeholder must still warn -
// a fix that silenced the check entirely would pass the first assertion alone.
//
// Usage: node tools/self-verify-fill-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

console.log();
if (failures) {
  console.error(`self-verify-fill-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log("self-verify-fill-test: OK - the fill warning is clearable, still fires, and reads any script");
