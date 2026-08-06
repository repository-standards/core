#!/usr/bin/env node
// self-verify-drift-test - prove the drift number reacts to what it claims to measure.
//
// Every case here is a run that reported `drift 0 - 100% adopted, compliant with the
// standard` on a tree that was not the standard: 19 of 20 skills present, the previous
// version's SPEC.md, a merge-class file with its whole policy block deleted, a bumped pin
// with no files changed, and - the widest one - 13 `kind: "file"` exceptions taking a tree
// with no AGENTS.md, no personas, no capability map and every guard script deleted to
// "100% adopted (32/32)", the percentage RISING as the standard was discarded.
//
// The assertions are deltas against a baseline run of the same fixture, not absolute
// numbers, so adding a manifest entry does not rewrite this file.
//
// Usage: node tools/self-verify-drift-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TREE = join(process.cwd(), "standard");
const VERSION = readFileSync(join(process.cwd(), "VERSION"), "utf8").trim();

// An adopted repo: the shipped tree plus the record an adopter writes at align time. The
// manifest that travels with it is the one the hashes were generated into, which is the
// whole mechanism - the adopter compares against the version they aligned to.
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), "drift-check-"));
  cpSync(TREE, dir, { recursive: true });
  writeFileSync(join(dir, ".standards-version"), `${VERSION}\n`);
  return dir;
};

const run = (dir, args = []) => {
  const r = spawnSync("node", [join(dir, "scripts/self-verify.mjs"), ...args], { cwd: dir, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const m = out.match(/self-verify: (?:OK - )?drift (\d+) - (\d+)% adopted \((\d+)\/(\d+)\), (\d+) excepted/);
  if (!m) throw new Error(`self-verify printed no readable verdict:\n${out}`);
  return { out, exit: r.status, drift: +m[1], pct: +m[2], adopted: +m[3], applicable: +m[4], excepted: +m[5] };
};

const patchManifest = (dir, edit) => {
  const p = join(dir, "standard.manifest.json");
  const m = JSON.parse(readFileSync(p, "utf8"));
  edit(m);
  writeFileSync(p, `${JSON.stringify(m, null, 2)}\n`);
};

const base = (() => {
  const dir = fixture();
  const r = run(dir);
  rmSync(dir, { recursive: true, force: true });
  return r;
})();

let failures = 0;
let cases = 0; // counted, not written down - the verdict said 20 while 23 ran
const check = (name, mutate, assert, args = []) => {
  cases++;
  const dir = fixture();
  let r;
  try {
    mutate(dir);
    r = run(dir, args);
  } finally {
    // Keep the tree on failure so the run can be reproduced by hand.
    if (r) rmSync(dir, { recursive: true, force: true });
  }
  const problems = [];
  assert(r, (ok, why) => { if (!ok) problems.push(why); });
  if (problems.length) {
    failures++;
    console.error(`  FAIL ${name}`);
    for (const p of problems) console.error(`       ${p}`);
    console.error(`       verdict: drift ${r.drift}, ${r.pct}% adopted (${r.adopted}/${r.applicable}), ${r.excepted} excepted`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const says = (r, text) => r.out.includes(text);

// --- 1. a copy-class file that was modified is drift -----------------------------------

check(
  "a modified copy-class file is drift, and the message says it is a content difference",
  (dir) => writeFileSync(join(dir, ".nvmrc"), "22.0.0\n"),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, ".nvmrc differs from the standard's copy"), "no content FAIL naming .nvmrc");
    expect(says(r, "the file is present but its content is not the standard's"), "the message does not distinguish content from absence");
    expect(r.exit === 1, `expected exit 1, got ${r.exit}`);
  },
);

check(
  "a copy-class directory missing one member is drift (19 of 20 skills)",
  (dir) => rmSync(join(dir, ".claude/skills/spec-plan"), { recursive: true, force: true }),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "1 missing (spec-plan/SKILL.md)"), "the FAIL does not name the missing skill");
  },
);

check(
  "a changed member of a copy-class directory is drift, however many others match",
  (dir) => writeFileSync(join(dir, ".claude/skills/adr-write/SKILL.md"), "# not the standard's adr-write\n"),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "1 changed (adr-write/SKILL.md)"), "the FAIL does not name the changed skill");
  },
);

check(
  "the sham update - bump the record and the manifest, change no files - is drift",
  (dir) => {
    // The manifest of a LATER version describes later content. Simulated by moving the
    // recorded version and one recorded hash forward while the files stay where they were.
    writeFileSync(join(dir, ".standards-version"), "9.9.9\n");
    patchManifest(dir, (m) => {
      m.version = "9.9.9";
      const spec = m.files.find((f) => f.path === "SPEC.md");
      spec.sha256 = "0".repeat(64);
    });
  },
  (r, expect) => {
    expect(r.drift > base.drift, `expected drift above the baseline ${base.drift}, got ${r.drift}`);
    expect(says(r, "SPEC.md differs from the standard's copy"), "a version bump with no file changes still reported the shipped content as current");
  },
);

check(
  "an alternate path satisfied by an unrelated directory is not a port",
  (dir) => {
    // The real shape this was found in: a monorepo whose `.claude/skills` pointed at its
    // own unrelated skill system, satisfying the manifest's altPath by coincidence.
    rmSync(join(dir, ".claude/skills"), { recursive: true, force: true });
    cpSync(join(dir, "docs"), join(dir, ".agents/skills"), { recursive: true });
  },
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "stands in for .claude/skills"), "the altPath was accepted on existence alone");
    expect(says(r, "a partial port is drift"), "the message does not name R22's rule");
  },
);

// The same hole one entry-shape over. A directory at an alternate path may be a genuine
// port - a different format, checked by name above - but a FILE cannot: an altPath says the
// standard's file lives elsewhere here, not that something else lives there instead. The
// entry resolved, nothing was compared, and the run reported it in a dim note.
const altPathFixture = (dir, body) => {
  patchManifest(dir, (m) => {
    m.files.find((f) => f.path === "SPEC.md").altPaths = ["docs/SPEC.md"];
  });
  unlinkSync(join(dir, "SPEC.md"));
  writeFileSync(join(dir, "docs/SPEC.md"), body);
};

check(
  "a single-file copy entry resolved through an alternate path is compared, not waved through",
  (dir) => altPathFixture(dir, "# not the standard's SPEC at all\n"),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "docs/SPEC.md stands in for SPEC.md"), "the alternate path was accepted on existence alone");
    expect(says(r, "not permission for a different file"), "the message does not say what an altPath means for a file");
  },
);

check(
  "the same entry, carrying the standard's content at the alternate path, passes",
  (dir) => altPathFixture(dir, readFileSync(join(TREE, "SPEC.md"), "utf8")),
  (r, expect) => {
    expect(r.drift === base.drift, `a faithful copy at the alternate path is not drift: expected ${base.drift}, got ${r.drift}`);
    expect(says(r, "docs/SPEC.md stands in for SPEC.md and carries the standard's copy"), "a satisfied alternate path is not reported as satisfied");
  },
);

check(
  "a repo that deliberately rewrote the file at its alternate path records it and stops drifting",
  (dir) => {
    altPathFixture(dir, "# this repo's own normative core\n");
    patchManifest(dir, (m) => {
      m.exceptions = [...(m.exceptions || []), { kind: "content", match: "SPEC.md", reason: "this repo carries its own normative core and tracks the standard's rules by reference" }];
    });
  },
  (r, expect) => {
    expect(r.drift === base.drift, `a recorded deviation is not drift: expected ${base.drift}, got ${r.drift}`);
    expect(r.excepted === 1, `expected the deviation to be counted as excepted, got ${r.excepted}`);
  },
);

// --- 2. merge-class entries assert what matters ----------------------------------------

check(
  "a merge-class JSON file missing a declared key is drift",
  (dir) => {
    const p = join(dir, ".claude/settings.json");
    const s = JSON.parse(readFileSync(p, "utf8"));
    delete s.hooks;
    writeFileSync(p, `${JSON.stringify(s, null, 2)}\n`);
  },
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, `is missing the "hooks.PreToolUse" key`), "no key FAIL naming hooks.PreToolUse");
  },
);

check(
  "a merge-class YAML file missing a declared key is drift",
  (dir) => {
    const p = join(dir, ".github/workflows/standards-update-watch.yml");
    // The watch, merged into a repo's CI with its schedule dropped: the file is there and
    // the notification never arrives.
    writeFileSync(p, readFileSync(p, "utf8").replace(/^on:\n(?:.*\n)*?\npermissions:/m, "on:\n  workflow_dispatch:\n\npermissions:"));
  },
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, `is missing the "on.schedule" key`), "no key FAIL naming on.schedule");
  },
);

check(
  "the compliance workflow with its push trigger merged away is drift",
  (dir) => {
    const p = join(dir, ".github/workflows/spec-guard.yml");
    // The shape a merge leaves behind: the workflow arrives, the repo keeps its own
    // pull_request-only trigger, and every direct push to main - starting with the first
    // one, before any pull request exists - goes unchecked while the file is present.
    writeFileSync(p, readFileSync(p, "utf8").replace(/^on:\n(?:.*\n)*?\nconcurrency:/m, "on:\n  pull_request:\n\nconcurrency:"));
  },
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, `is missing the "on.push" key`), "no key FAIL naming on.push");
  },
);

check(
  "a stack manifest's declared keys run through the same code path (Layer 2's supply chain)",
  (dir) => {
    // pnpm's policy block is the case the stack layer needs: the file exists, is valid
    // YAML, and has had the three keys that make it a supply-chain policy removed.
    writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\n");
    writeFileSync(
      join(dir, "stack.manifest.json"),
      `${JSON.stringify(
        {
          standard: "repository-standards-node",
          technology: "node",
          layer: 2,
          files: [
            {
              path: "pnpm-workspace.yaml",
              purpose: "the workspace and its supply-chain policy",
              adapt: "merge",
              required: true,
              profile: "core",
              rule: "R21",
              requiredKeys: ["minimumReleaseAge", "saveExact", "enablePrePostScripts"],
            },
          ],
        },
        null,
        2,
      )}\n`,
    );
  },
  (r, expect) => {
    expect(r.drift === base.drift + 3, `expected drift ${base.drift + 3} (three missing keys), got ${r.drift}`);
    for (const k of ["minimumReleaseAge", "saveExact", "enablePrePostScripts"]) {
      expect(says(r, `is missing the "${k}" key`), `no key FAIL naming ${k}`);
    }
  },
);

check(
  "a stack manifest's own exceptions are honoured, not only the primary manifest's",
  (dir) => {
    // The Layer 2 manifest is the one an adopter of the stack is told to record a
    // deviation in - files/sections/guards from it were already folded into the check;
    // exceptions were not, so a repo doing exactly what ADAPTING.md instructs got the
    // miss counted anyway.
    writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\nminimumReleaseAge: 10080\nsaveExact: true\n");
    writeFileSync(
      join(dir, "stack.manifest.json"),
      `${JSON.stringify(
        {
          standard: "repository-standards-node",
          technology: "node",
          layer: 2,
          files: [
            {
              path: "pnpm-workspace.yaml",
              purpose: "the workspace and its supply-chain policy",
              adapt: "merge",
              required: true,
              profile: "core",
              rule: "R21",
              requiredKeys: ["minimumReleaseAge", "saveExact", "enablePrePostScripts"],
            },
          ],
          exceptions: [
            {
              kind: "key",
              match: "pnpm-workspace.yaml#enablePrePostScripts",
              reason: "this repo does not run pre/post install scripts by any means the key would gate",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );
  },
  (r, expect) => {
    expect(r.drift === base.drift, `a stack-declared exception must clear its drift: expected ${base.drift}, got ${r.drift}`);
    expect(r.excepted === 1, `expected 1 excepted from the stack manifest, got ${r.excepted}`);
  },
);

check(
  "a merge-class file that carries its declared keys among the repo's own content passes",
  (dir) => {
    writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\nminimumReleaseAge: 10080\nsaveExact: true\nenablePrePostScripts: false\n");
    writeFileSync(
      join(dir, "stack.manifest.json"),
      `${JSON.stringify(
        {
          technology: "node",
          layer: 2,
          files: [
            {
              path: "pnpm-workspace.yaml",
              purpose: "the workspace and its supply-chain policy",
              adapt: "merge",
              required: true,
              rule: "R21",
              requiredKeys: ["minimumReleaseAge", "saveExact", "enablePrePostScripts"],
            },
          ],
        },
        null,
        2,
      )}\n`,
    );
  },
  (r, expect) => {
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(r.applicable === base.applicable + 4, `expected 4 more checks (one file, three keys), got ${r.applicable - base.applicable}`);
  },
);

// Two Layer-2 stacks that coexist permanently - a framework beside a native engine - had no
// way to register: the engine read one filename, so the second manifest was invisible, its
// entries unchecked and its absence unreported. The last two cases here are the bound: a
// file that only looks like a stack manifest is not one, and a stack manifest that cannot be
// parsed is loud rather than skipped.
const stackManifest = (technology, files) => `${JSON.stringify({ standard: `repository-standards/env-${technology}`, technology, version: "0.1.0", layer: 2, files }, null, 2)}\n`;
const NEEDS = (path, purpose) => [{ path, purpose, adapt: "fill-from-repo", required: true, rule: "R20" }];

check(
  "a repo running two stacks at once registers both, and both count in the one drift number",
  (dir) => {
    writeFileSync(join(dir, "stack.manifest.json"), stackManifest("dart-flutter", NEEDS("pubspec.yaml", "the dart package manifest")));
    writeFileSync(join(dir, "stack.native-engine.manifest.json"), stackManifest("native-engine", NEEDS("CMakeLists.txt", "the engine build")));
  },
  (r, expect) => {
    expect(r.drift === base.drift + 2, `expected both stacks' unmet entries: drift ${base.drift + 2}, got ${r.drift}`);
    expect(says(r, "pubspec.yaml missing"), "the first stack's entry was not checked");
    expect(says(r, "CMakeLists.txt missing"), "the second stack's entry was not checked - it used to be invisible");
    expect(says(r, "stack.native-engine.manifest.json: native-engine"), "the second stack manifest is not named in the report");
  },
);

check(
  "two stacks claiming one path are checked once each, and the doubling is stated rather than collapsed",
  (dir) => {
    // `.nvmrc` is in the tree, so the collision costs no drift and the case is only about
    // what the run says: neither stack is this repo's to edit, and silently picking a
    // winner would hide that they disagree about who owns the file.
    writeFileSync(join(dir, "stack.manifest.json"), stackManifest("dart-flutter", NEEDS(".nvmrc", "the node version the tooling runs on")));
    writeFileSync(join(dir, "stack.native-engine.manifest.json"), stackManifest("native-engine", NEEDS(".nvmrc", "the node version the build scripts run on")));
  },
  (r, expect) => {
    expect(r.drift === base.drift, `a satisfied path is not drift however many stacks declare it: expected ${base.drift}, got ${r.drift}`);
    expect(says(r, "is declared by both stack.manifest.json and stack.native-engine.manifest.json"), "the collision is not reported");
    expect(r.applicable === base.applicable + 2, `expected the path to be checked once per declaration, got ${r.applicable - base.applicable} more checks`);
  },
);

check(
  "a file that only looks like a stack manifest is not read as one",
  (dir) => {
    writeFileSync(join(dir, "mystack.manifest.json"), stackManifest("invented", NEEDS("nothing-here.txt", "an entry no stack registered")));
  },
  (r, expect) => {
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(!says(r, "nothing-here.txt"), "a file whose name merely contains `manifest.json` was merged as a stack");
  },
);

check(
  "a second stack manifest that cannot be parsed is drift, not a silent skip",
  (dir) => {
    writeFileSync(join(dir, "stack.manifest.json"), stackManifest("dart-flutter", NEEDS("pubspec.yaml", "the dart package manifest")));
    writeFileSync(join(dir, "stack.native-engine.manifest.json"), "{ not json");
  },
  (r, expect) => {
    expect(r.drift === base.drift + 2, `expected the unparseable manifest to count: drift ${base.drift + 2}, got ${r.drift}`);
    expect(says(r, "stack.native-engine.manifest.json is present but unparseable"), "the broken manifest was skipped without saying so");
  },
);

// --- 3. the exception hatch is bounded and visible --------------------------------------

check(
  "a guard's own script cannot be excepted",
  (dir) => {
    unlinkSync(join(dir, "scripts/spec-structure.mjs"));
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "file", match: "scripts/spec-structure.mjs", reason: "we do not want this check" }];
    });
  },
  (r, expect) => {
    expect(says(r, "excepts a guard's own script"), "the illegal exception was accepted");
    expect(r.drift >= base.drift + 1, `expected the deleted guard to still count, got drift ${r.drift} against baseline ${base.drift}`);
    expect(r.excepted === 0, `expected the exception to be refused, but ${r.excepted} was counted as excepted`);
    expect(r.exit === 1, `expected exit 1, got ${r.exit}`);
  },
);

check(
  "there is no guard kind, and claiming one is drift rather than a silent no-op",
  (dir) =>
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "guard", match: "spec-structure", reason: "our specs are shaped differently" }];
    }),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "is not a valid kind"), "an unknown exception kind was ignored instead of reported");
  },
);

check(
  "an exception with no reason is not a recorded deviation",
  (dir) => {
    unlinkSync(join(dir, "docs/personas.md"));
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "file", match: "docs/personas.md" }];
    });
  },
  (r, expect) => {
    expect(says(r, "carries no reason"), "an unexplained exception was honoured");
    expect(r.drift >= base.drift + 1, "the underlying miss stopped counting");
  },
);

check(
  "an excepted entry clears its drift and costs coverage instead of buying it",
  (dir) => {
    unlinkSync(join(dir, ".github/workflows/spec-guard.yml"));
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "file", match: ".github/workflows/spec-guard.yml", reason: "this repo gates on GitLab CI; the same two guards run in .gitlab-ci.yml" }];
    });
  },
  (r, expect) => {
    expect(r.drift === base.drift, `an excepted entry must not be drift: expected ${base.drift}, got ${r.drift}`);
    expect(r.excepted === 1, `expected 1 excepted, got ${r.excepted}`);
    expect(r.pct <= base.pct, `excepting raised the percentage from ${base.pct}% to ${r.pct}%`);
    expect(says(r, "1 excepted"), "the summary does not state the exception count");
  },
);

check(
  "the recorded attack - except the standard away - cannot reach 100% adopted",
  (dir) => {
    // What was actually done to a real tree: 13 `kind: "file"` exceptions took it to
    // "OK - drift 0 - 100% adopted (32/32), compliant with the standard" with no AGENTS.md,
    // no personas, no capability map and every guard script deleted, the percentage rising
    // because each exception left the denominator.
    const gone = ["AGENTS.md", "docs/personas.md", "docs/PRINCIPLES.md"];
    for (const p of gone) unlinkSync(join(dir, p));
    const guards = ["spec-structure", "facts-check", "schema-pair", "spec-guard", "cycle-guard"];
    for (const g of guards) unlinkSync(join(dir, `scripts/${g}.mjs`));
    patchManifest(dir, (m) => {
      m.exceptions = [
        ...[...gone, "specs/capability-map.json"].map((match) => ({ kind: "file", match, reason: "not how this repo works" })),
        { kind: "section", match: "AGENTS.md#Altitude", reason: "no AGENTS.md to carry it" },
        ...guards.map((g) => ({ kind: "file", match: `scripts/${g}.mjs`, reason: "we do not run this check" })),
      ];
    });
  },
  (r, expect) => {
    expect(r.pct < base.pct, `the percentage did not fall: ${r.pct}% against a baseline of ${base.pct}%`);
    expect(r.pct < 100, "a tree with the standard excepted away still reads as 100% adopted");
    expect((r.out.match(/excepts a guard's own script/g) || []).length === 5, "the five guard-script exceptions were not all refused");
    expect(r.drift >= 5, `expected the refusals to count as drift, got ${r.drift}`);
    expect(r.exit === 1, `expected exit 1, got ${r.exit}`);
  },
);

check(
  "the summary states the exception count even when it is zero",
  () => {},
  (r, expect) => {
    expect(/0 excepted/.test(r.out), "the summary line hides an exception count of zero");
  },
);

check(
  "a copy-class file the repo deliberately changed stops counting once excepted",
  (dir) => {
    writeFileSync(join(dir, ".nvmrc"), "22.0.0\n");
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "content", match: ".nvmrc", reason: "this repo runs Node 22; the guards are dependency-free and pass on it" }];
    });
  },
  (r, expect) => {
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(r.excepted === 1, `expected 1 excepted, got ${r.excepted}`);
    expect(says(r, "excepted (recorded manifest deviation, R17): this repo runs Node 22"), "the excepted line does not carry the recorded reason");
    expect(r.pct < 100, "a repo that excepts a file still reads as 100% adopted");
  },
);

// --- 4. the yardstick, and the filesystem's opinion about case ---------------------------

check(
  "a run with no manifest says so in the verdict, not only in a dim note",
  (dir) => unlinkSync(join(dir, "standard.manifest.json")),
  (r, expect) => {
    // Three real unaligned repos reported drift 4-5 from this fallback while the shipped
    // manifest gave 13-15 for the same trees, in the same output format.
    expect(says(r, "no standard.manifest.json in this repo"), "the fallback did not warn");
    expect(/BUILT-IN \d+-CHECK SKELETON/.test(r.out), "the verdict line does not name the yardstick it used");
    expect(says(r, "the real distance from the standard is larger"), "the verdict lets a skeleton number read as a manifest number");
  },
);

check(
  "a file whose name differs only in case is missing, whatever the filesystem thinks",
  (dir) => renameSync(join(dir, "AGENTS.md"), join(dir, "Agents.md")),
  (r, expect) => {
    // existsSync is case-insensitive on macOS and Windows: this repo state passed on a
    // contributor's Mac and failed on Linux CI, from one commit.
    expect(r.drift >= base.drift + 1, `expected the wrong-case file to count as missing, got drift ${r.drift} against baseline ${base.drift}`);
    expect(says(r, "AGENTS.md missing"), "a wrong-case AGENTS.md was accepted");
  },
);

check(
  "a content exception may scope a subtree, and a file exception may not",
  (dir) => {
    writeFileSync(join(dir, ".claude/skills/adr-write/SKILL.md"), "# ours\n");
    writeFileSync(join(dir, ".claude/skills/bdr-write/SKILL.md"), "# ours too\n");
    unlinkSync(join(dir, "scripts/spec-structure.mjs"));
    patchManifest(dir, (m) => {
      m.exceptions = [
        { kind: "content", match: ".claude/skills/**", reason: "this repo ported the procedures to its own house style" },
        { kind: "file", match: "scripts/**", reason: "and we would like the guards gone too" },
      ];
    });
  },
  (r, expect) => {
    expect(says(r, ".claude/skills/adr-write/SKILL.md is changed"), "the subtree waiver did not cover a member");
    expect(r.excepted === 2, `expected both changed members counted as excepted, got ${r.excepted}`);
    expect(says(r, "scripts/spec-structure.mjs missing"), "a file exception reached into a subtree and waived a guard's script");
  },
);

check(
  "an exception the repo no longer needs is reported as stale",
  (dir) =>
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "content", match: ".nvmrc", reason: "left over from when this repo ran Node 20" }];
    }),
  (r, expect) => {
    expect(r.drift === base.drift, `a stale exception must not be drift: expected ${base.drift}, got ${r.drift}`);
    expect(says(r, "is excepted but met anyway"), "a deviation the repo no longer has was left unreported");
  },
);

// --- 5. an update nobody applied ---------------------------------------------------------

// The sham update in full: bump `.standards-version`, copy the target version's manifest,
// apply none of the release's file changes, and run the exact check step 6 of
// `update-to-version` nominates as proof of completion. The case above builds that shape by
// hand-writing one hash; here the target manifest is GENERATED from a real newer tree by
// `tools/manifest-hashes.mjs`, so the two halves of the mechanism have to agree - the tool
// that records content and the verifier that reads it. A recorder that hashed bytes where
// the verifier normalizes CRLF would pass every hand-written case and miss every real
// update, and nothing else here would notice.
check(
  "a sham update carrying the target version's generated manifest is drift, under the invocation the skill nominates",
  (dir) => {
    // The target version, in the three shapes a release moves a copy entry in: a procedure
    // added, a procedure rewritten, a shipped document rewritten.
    const next = mkdtempSync(join(tmpdir(), "drift-check-next-"));
    cpSync(TREE, join(next, "standard"), { recursive: true });
    mkdirSync(join(next, "standard/.claude/skills/lock-the-doors"));
    writeFileSync(join(next, "standard/.claude/skills/lock-the-doors/SKILL.md"), "# a procedure the target version ships\n");
    writeFileSync(join(next, "standard/.claude/skills/adr-write/SKILL.md"), "# adr-write, as the target version rewrote it\n");
    writeFileSync(join(next, "standard/SPEC.md"), `${readFileSync(join(TREE, "SPEC.md"), "utf8")}\n- **R99.** a rule the target version added.\n`);
    const gen = spawnSync("node", [join(process.cwd(), "tools/manifest-hashes.mjs")], { cwd: next, encoding: "utf8" });
    if (gen.status !== 0) throw new Error(`manifest-hashes failed on the target tree:\n${gen.stdout ?? ""}${gen.stderr ?? ""}`);
    const target = JSON.parse(readFileSync(join(next, "standard/standard.manifest.json"), "utf8"));
    rmSync(next, { recursive: true, force: true });

    // The sham itself: the pin and the manifest move, not one file of the release.
    target.version = "9.9.9";
    writeFileSync(join(dir, "standard.manifest.json"), `${JSON.stringify(target, null, 2)}\n`);
    writeFileSync(join(dir, ".standards-version"), "9.9.9\n");
  },
  (r, expect) => {
    expect(r.drift === base.drift + 2, `expected the two unapplied copy entries to count: drift ${base.drift + 2}, got ${r.drift}`);
    expect(says(r, "1 missing (lock-the-doors/SKILL.md)"), "a procedure the target version ships was not reported absent");
    expect(says(r, "1 changed (adr-write/SKILL.md)"), "a procedure the target version rewrote read as current");
    expect(says(r, "SPEC.md differs from the standard's copy"), "the previous version's SPEC.md read as the target's");
    expect(!/\.standards-version is /.test(r.out), "the pin check fired - the drift has to come from the files, not from the record the sham did move");
    expect(r.exit === 1, `expected exit 1, so the update cannot be opened as a PR on a green check, got ${r.exit}`);
  },
  ["--version", "9.9.9"],
);

console.log();
if (failures) {
  console.error(`self-verify-drift-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(`self-verify-drift-test: OK - ${cases} cases, the drift number moves when the content does`);
