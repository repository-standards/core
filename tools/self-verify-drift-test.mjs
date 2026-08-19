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

// Gate 2's artifact as an adopter leaves it, not as it ships. The shipped file is a template
// of `{{...}}` cells, and `adoption-gates` blocks on those by design (R27) - a placeholder
// where a maturity word belongs is a pass nobody ran. Every case here measures something
// else, so the fixture writes the filled shape once rather than each case carrying the
// failure. The unfilled state has its own case, in the guard's own suite.
const FILLED_ASSESSMENT = `# Adoption assessment - fixture

## Maturity per pass

| # | Pass | Maturity | What that rests on |
| --- | --- | --- | --- |
| 1 | Skeleton & docs | solid | the tree is the standard's own |
| 2 | Decisions in code | solid | recorded |
| 3 | Capabilities & specs | partial | no capability map yet |
| 4 | Quality gates | solid | the suite runs |
| 5 | CI/CD | solid | the workflow fires |
| 6 | Security & supply chain | partial | scanning only |
| 7 | Dependencies & stack | solid | pinned |
| 8 | Drift & health | solid | drift is measured |

## Top risks

1. nothing is specified yet, so the coupling guard binds nothing

## Findings by owner role

### dev

| Finding | Where it goes |
| --- | --- |
| write a capability map | item 1 |
`;

// An adopted repo: the shipped tree plus the record an adopter writes at align time. The
// manifest that travels with it is the one the hashes were generated into, which is the
// whole mechanism - the adopter compares against the version they aligned to.
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), "drift-check-"));
  cpSync(TREE, dir, { recursive: true });
  writeFileSync(join(dir, ".standards-version"), `${VERSION}\n`);
  writeFileSync(join(dir, "docs/adoption-assessment.md"), FILLED_ASSESSMENT);
  answeredProvenance(dir);
  return dir;
};

// An adopted repo that went through its questions. Without this the ledger ships all
// `pending`, and any case writing an artifact one of those points gates - `stack.manifest.json`
// is the one that bites here - adds a drift this suite is not measuring. The elicitation
// ledger has its own suite; these cases are about self-verify's arithmetic.
//
// It carries the harvest heading for the same reason: a ledger missing it is a finding over
// there, and every case here would then be measuring that finding rather than its own.
function answeredProvenance(dir) {
  const points = JSON.parse(readFileSync(join(dir, ".claude/elicitation/points.json"), "utf8")).points || [];
  const rows = points.map((p) => `| \`${p.id}\` | human | fixture | 2026-08-19 | docs/x.md | - |`).join("\n");
  writeFileSync(
    join(dir, "docs/adoption-provenance.md"),
    `# Adoption provenance\n\n| Point | State | Answered by | When | Landed in | Backlog row |\n|---|---|---|---|---|---|\n${rows}\n\n## Questions this run asked that no point declares\n`,
  );
}

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

// The capability map is authored at adoption, so the shipped tree carries none and the plain
// fixture sits one point above zero. Cases that assert something about the DRIFT-0 verdict
// line have to write it, or they assert nothing: an assertion about that line is vacuously
// true while the run is taking the drift-above-zero branch.
const emptyCapabilityMap = (dir) =>
  writeFileSync(join(dir, "specs/capability-map.json"), `${JSON.stringify({ $about: ["capability -> the code globs that must move with its spec (R11)."] }, null, 2)}\n`);

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

// The stack's own version was carried and never printed, so a repo several stack releases
// behind read exactly like one on the newest. Naming it is not staleness detection - nothing
// local knows what the stack repo ships (ADR-022) - but an unspoken number cannot be compared
// by hand either.
const stackManifest = (extra = {}) =>
  `${JSON.stringify({ standard: "repository-standards-node", technology: "node", layer: 2, files: [], ...extra }, null, 2)}\n`;

check(
  "the stack layer's own version is printed, not only its technology",
  (dir) => writeFileSync(join(dir, "stack.manifest.json"), stackManifest({ version: "0.1.0" })),
  (r, expect) => {
    // The note is prefixed by the manifest's filename rather than a fixed phrase, because a
    // repo whose stacks coexist carries more than one and the line has to say which.
    expect(says(r, "stack.manifest.json: node @ 0.1.0"), "the stack's version was carried but never said out loud");
    expect(r.drift === base.drift, `naming the stack version must not move drift: expected ${base.drift}, got ${r.drift}`);
  },
);

check(
  "a stack manifest with no version at all says so",
  (dir) => writeFileSync(join(dir, "stack.manifest.json"), stackManifest()),
  (r, expect) => {
    expect(says(r, "declares no version"), "a stack manifest carrying no version was accepted in silence");
    expect(r.drift === base.drift, `expected drift ${base.drift}, got ${r.drift}`);
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
const namedStackManifest = (technology, files) => `${JSON.stringify({ standard: `repository-standards/env-${technology}`, technology, version: "0.1.0", layer: 2, files }, null, 2)}\n`;
const NEEDS = (path, purpose) => [{ path, purpose, adapt: "fill-from-repo", required: true, rule: "R20" }];

check(
  "a repo running two stacks at once registers both, and both count in the one drift number",
  (dir) => {
    writeFileSync(join(dir, "stack.manifest.json"), namedStackManifest("dart-flutter", NEEDS("pubspec.yaml", "the dart package manifest")));
    writeFileSync(join(dir, "stack.native-engine.manifest.json"), namedStackManifest("native-engine", NEEDS("CMakeLists.txt", "the engine build")));
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
    writeFileSync(join(dir, "stack.manifest.json"), namedStackManifest("dart-flutter", NEEDS(".nvmrc", "the node version the tooling runs on")));
    writeFileSync(join(dir, "stack.native-engine.manifest.json"), namedStackManifest("native-engine", NEEDS(".nvmrc", "the node version the build scripts run on")));
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
    writeFileSync(join(dir, "mystack.manifest.json"), namedStackManifest("invented", NEEDS("nothing-here.txt", "an entry no stack registered")));
  },
  (r, expect) => {
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(!says(r, "nothing-here.txt"), "a file whose name merely contains `manifest.json` was merged as a stack");
  },
);

check(
  "a second stack manifest that cannot be parsed is drift, not a silent skip",
  (dir) => {
    writeFileSync(join(dir, "stack.manifest.json"), namedStackManifest("dart-flutter", NEEDS("pubspec.yaml", "the dart package manifest")));
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
    const guards = ["spec-structure", "facts-check", "schema-pair", "spec-guard", "sprint-guard"];
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
  "a shipped skill the repo deliberately does not carry is named, reasoned and paid for",
  (dir) => {
    // The shape our trial adoption of usebruno/bruno's codebase settled on: drop
    // pre-pr-review, because that project ships a review skill of its own and two skills
    // matching one sentence is a defect this standard names itself - and record why. We
    // wrote that judgment, not the project, but it is the legitimate way a shipped procedure
    // ends up absent, and the reason this hatch cannot be narrowed to "changed members only"
    // without turning a considered decision into drift.
    //
    // What it must never become is the silent version. An item an align run left out of its
    // plan is absent for a reason nobody wrote down; it reaches this state only by someone
    // adding a line to the manifest, under review, at a cost to the percentage. The
    // assertions below are that cost - if a later change makes an excepted absence free or
    // invisible, "consciously skipped" stops needing anyone's approval.
    rmSync(join(dir, ".claude/skills/pre-pr-review"), { recursive: true, force: true });
    patchManifest(dir, (m) => {
      m.exceptions = [{ kind: "content", match: ".claude/skills/pre-pr-review/SKILL.md", reason: "this repo ships its own branch review skill, tuned to its reviewer lenses; two skills matching one sentence is the defect" }];
    });
  },
  (r, expect) => {
    expect(r.drift === base.drift, `a recorded absence must not be drift: expected ${base.drift}, got ${r.drift}`);
    expect(r.excepted === 1, `expected the absence to be counted as excepted, got ${r.excepted}`);
    expect(says(r, ".claude/skills/pre-pr-review/SKILL.md is missing against the standard's copy"), "the excepted line does not name the absent skill");
    expect(says(r, "this repo ships its own branch review skill"), "the excepted line does not carry the recorded reason");
    expect(r.pct < base.pct, `excepting an absence must cost coverage: ${r.pct}% against a baseline of ${base.pct}%`);
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

// --- 3b. a section follows its file to the alternate path the manifest itself declares ---

check(
  "a required section is read at the file entry's declared altPath, not only at its primary name",
  (dir) => {
    // The shape a real adoption produced: the repo keeps its changelog under docs/, which is
    // exactly what the CHANGELOG.md entry's altPaths exist for. Before the fix the file
    // entry passed and the section entry failed with "CHANGELOG.md missing" - about a file
    // that was there, and unclosable without moving it back.
    mkdirSync(join(dir, "docs"), { recursive: true });
    renameSync(join(dir, "CHANGELOG.md"), join(dir, "docs/CHANGELOG.md"));
  },
  (r, expect) => {
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(says(r, 'docs/CHANGELOG.md > "Unreleased"'), "the section PASS does not name the path it actually read");
    expect(!says(r, 'CHANGELOG.md missing, so "Unreleased" cannot be checked'), "a present file is still reported as missing");
  },
);

check(
  "a section still fails when the heading is absent from the altPath copy",
  (dir) => {
    mkdirSync(join(dir, "docs"), { recursive: true });
    unlinkSync(join(dir, "CHANGELOG.md"));
    writeFileSync(join(dir, "docs/CHANGELOG.md"), "# Changelog\n\n## 1.0.0\n\n- released\n");
  },
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, 'docs/CHANGELOG.md is missing the "Unreleased" section'), "the FAIL does not name the file it read");
  },
);

check(
  "a section whose file is absent from every declared path is still missing",
  (dir) => unlinkSync(join(dir, "CHANGELOG.md")),
  (r, expect) => {
    expect(r.drift === base.drift + 2, `expected drift ${base.drift + 2} (the file and its section), got ${r.drift}`);
    expect(says(r, 'CHANGELOG.md missing, so "Unreleased" cannot be checked'), "an absent changelog no longer reports its section as uncheckable");
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

// --- 4b. the two things the run said nothing about at all --------------------------------
// Neither is drift - drift counts unmet manifest entries - but both were invisible, and
// invisible is what let each of them decide something on its own.

// The shipped CI workflow computes `PROFILE=… .profile || 'scale'`, and the manifest it
// reads that from carried no such key, so every repo took the scale-tier gate by default,
// including the solo ones the core profile exists for. The key now ships, and a copy that
// lost it says so instead of defaulting in silence.
check(
  "the shipped manifest declares the profile the CI gate reads",
  () => {},
  (r, expect) => {
    expect(says(r, 'profile "scale" declared in the manifest copy'), "the shipped manifest declares no profile for the workflow to read");
    expect(r.drift === base.drift, `declaring a profile must not move drift: expected ${base.drift}, got ${r.drift}`);
  },
);

check(
  "a manifest copy with no profile says so rather than defaulting quietly",
  (dir) =>
    patchManifest(dir, (m) => {
      delete m.profile;
    }),
  (r, expect) => {
    expect(says(r, "declares no profile - defaulted to scale"), "the fallback to scale happened without a word");
    expect(r.drift === base.drift, `a missing profile is not drift: expected ${base.drift}, got ${r.drift}`);
  },
);

// A dependency tree tracked in git is what a `**/`-prefixed capability glob matches by
// accident: `**/swap/**` compiles to `(?:[^/]+/)*swap/.+` and matches
// `node_modules/pkg/swap/a.js`, so a dependency bump broke the blocking coupling gate for a
// capability nobody touched. spec-guard now ignores those paths (tools/spec-guard-test.mjs);
// this is the repo-side condition, which self-verify reported nowhere.
const gitInit = (dir) => {
  const git = (...a) =>
    spawnSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@e.x", "-c", "commit.gpgsign=false", ...a], { encoding: "utf8" });
  git("init", "-q", "-b", "main");
  // Most developers ignore node_modules globally, and `git add` honours that - which would
  // make this fixture untrackable on their machine and green on CI for the wrong reason.
  // Point the excludes file at an empty file, inside .git so it is not itself tracked.
  writeFileSync(join(dir, ".git/no-excludes"), "");
  git("config", "core.excludesFile", join(dir, ".git/no-excludes"));
  git("add", "-A");
};

check(
  "a tracked dependency tree is named, and so is the missing .gitignore",
  (dir) => {
    mkdirSync(join(dir, "node_modules/some-pkg"), { recursive: true });
    writeFileSync(join(dir, "node_modules/some-pkg/index.js"), "module.exports = 1;\n");
    gitInit(dir);
  },
  (r, expect) => {
    expect(says(r, "under node_modules/ are tracked in git"), "a committed dependency tree was not reported");
    expect(says(r, "no .gitignore at all"), "the missing .gitignore was not named");
    expect(r.drift === base.drift, `this is a warning, not drift: expected ${base.drift}, got ${r.drift}`);
  },
);

check(
  "a workspace's nested dependency tree is caught too, and a lookalike directory is not",
  (dir) => {
    mkdirSync(join(dir, "packages/api/node_modules/dep"), { recursive: true });
    writeFileSync(join(dir, "packages/api/node_modules/dep/index.js"), "module.exports = 1;\n");
    mkdirSync(join(dir, "tools/my_node_modules"), { recursive: true });
    writeFileSync(join(dir, "tools/my_node_modules/keep.js"), "export const keep = 1;\n");
    gitInit(dir);
  },
  (r, expect) => {
    expect(says(r, "1 file(s) under node_modules/ are tracked in git"), "a nested dependency tree was missed, or the lookalike directory was counted");
  },
);

check(
  "a git repo that does not track one says nothing",
  (dir) => gitInit(dir),
  (r, expect) => {
    expect(!says(r, "tracked in git"), "the dependency-tree warning fired on a repo with no dependency tree");
    expect(r.drift === base.drift, `expected drift ${base.drift}, got ${r.drift}`);
  },
);

// --- 5. an update nobody applied ---------------------------------------------------------

// The sham update in full: bump `.standards-version`, copy the target version's manifest,
// apply none of the release's file changes, and run the exact check step 6 of
// `update-to-latest` nominates as proof of completion. The case above builds that shape by
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

// --- 6. a check that could not run, against a check that ran and failed -----------------
//
// Both were `drift 1 - 99% adopted (78/79)`, byte for byte: a machine with no pnpm and a
// repo with three real lint errors produced the same number, so the number said "this
// laptop" in the words of one that says "this repo". Every case below is asserted in both
// directions - the missing prerequisite must stop counting AND the real failure must keep
// counting, because a fix that only did the first would be a fix that deleted the check.
//
// The absent tool is a name nothing could plausibly install rather than `pnpm`: a runner
// that happens to have pnpm would otherwise run the guard for real and the case would
// assert nothing.
const ABSENT_TOOL = "definitely-not-installed-tool-9f3c";
const stackGuard = (dir, guard) =>
  writeFileSync(
    join(dir, "stack.manifest.json"),
    `${JSON.stringify(
      {
        technology: "node",
        layer: 2,
        guards: [{ id: "stack-check-all", kind: "static", blocks: true, purpose: "the stack's own quality gate", profile: "core", ...guard }],
      },
      null,
      2,
    )}\n`,
  );
// A guard that shouts if it executes: whether it ran is then readable in the drift number
// and in the output, with no sentinel file to inspect after the fixture is gone.
const LOUD = `node -e "console.error('THE GUARD EXECUTED'); process.exit(1)"`;

check(
  "a guard whose tool is not on this machine is NOT RUN - not drift, and never silent",
  (dir) => {
    // Taken all the way to drift 0 on purpose: the assertions below are about the drift-0
    // verdict line, and against a fixture sitting at drift 1 they would pass no matter what
    // that line said.
    emptyCapabilityMap(dir);
    stackGuard(dir, { run: `${ABSENT_TOOL} check:all` });
  },
  (r, expect) => {
    expect(r.drift === 0, `a missing prerequisite must not score as drift: expected 0, got ${r.drift}`);
    expect(says(r, "stack-check-all NOT RUN"), "the guard was not reported as unrun");
    expect(says(r, `${ABSENT_TOOL} is not on PATH`), "the message does not name what is missing");
    expect(says(r, "1 CHECK NOT RUN HERE (stack-check-all)"), "the verdict line hides a check that never ran");
    // Not counting it as drift loosened the gate - this used to exit 1 - so the word a reader
    // skims is what has to stop saying the run was complete.
    expect(r.exit === 0, `expected exit 0: a tool this machine lacks is not this repo's failure, got ${r.exit}`);
    expect(!says(r, "self-verify: OK"), "a run with a blocking check that never started still announced itself as OK");
  },
);

// Present on disk is not present in the repository. The fixture is not a git work tree, so
// these four cases make one - which is also what pins the "no git, no change" behaviour.
const git = (dir, ...args) => spawnSync("git", args, { cwd: dir, encoding: "utf8" });
const asRepo = (dir) => {
  git(dir, "init", "-q", ".");
  git(dir, "add", "-A");
};

check(
  "a required file under an ignore rule is drift, not a pass",
  (dir) => {
    // The rule has to exist before anything is staged, or git tracks the file first and the
    // ignore rule never applies to it - which is the second case below, not this one.
    writeFileSync(join(dir, ".gitignore"), "/docs/\n");
    asRepo(dir);
  },
  (r, expect) => {
    expect(r.drift > base.drift, `an ignored required entry did not move the number: drift ${r.drift}, baseline ${base.drift}`);
    expect(says(r, "is git-ignored and untracked"), "the failure did not say why the file does not count");
    expect(says(r, ".gitignore:1:/docs/"), "the failure did not name the rule that excludes it, which is the only actionable part");
    expect(says(r, "a fresh clone does not have it"), "the consequence was not stated");
  },
);

check(
  "a fallback chain needs one of its alternatives, not all of them",
  (dir) =>
    // `a || b` where a resolves: probing b and skipping on it would turn a working guard off.
    // `git` rather than `node` on purpose - node is never probed at all, so it would exercise
    // the "unclassifiable alternative" branch and leave "a resolvable alternative satisfies
    // the group" untested. git is a prerequisite of the standard's own guards anyway.
    stackGuard(dir, { run: `git --version || ${ABSENT_TOOL} check:all` }),
  (r, expect) => {
    expect(says(r, "stack-check-all passed"), "a satisfied fallback chain was treated as a missing prerequisite");
    expect(!says(r, "NOT RUN"), "a guard whose first alternative resolves was skipped on the second");
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
  },
);

check(
  "a guard that ran and failed is still drift, and reads nothing like one that could not run",
  (dir) => stackGuard(dir, { run: `node -e "console.error('checked 214 files: 3 lint errors'); process.exit(1)"` }),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `a real guard failure must still count: expected ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "stack-check-all failed"), "the failing guard was not reported as a failure");
    expect(says(r, "3 lint errors"), "the guard's own output was swallowed");
    expect(!says(r, "NOT RUN"), "a guard that ran was reported as unrun");
    expect(!says(r, "CHECK NOT RUN HERE"), "the verdict claims a check did not run when it did");
    expect(r.exit === 1, `expected exit 1, got ${r.exit}`);
  },
);

check(
  "a declared path prerequisite stops the guard executing at all - the compliance check has no side effects",
  (dir) =>
    stackGuard(dir, {
      run: LOUD,
      requires: [{ kind: "path", match: "node_modules", hint: "the guard runs the installed toolchain" }],
    }),
  (r, expect) => {
    // The shape this exists for: a package manager present and its dependency tree absent,
    // where RUNNING the guard is what pulls the tree off the network as a side effect of
    // asking a question about the repo - recorded once at 376 packages and ~670 MB. The only
    // way not to do that is to look first.
    expect(!says(r, "THE GUARD EXECUTED"), "the guard ran despite a declared prerequisite being absent");
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
    expect(says(r, "node_modules is absent from this repo"), "the message does not name the missing prerequisite");
    expect(says(r, "the guard runs the installed toolchain"), "the entry's hint was not passed through");
  },
);

check(
  "the same guard runs, and fails, once its declared prerequisite is there",
  (dir) => {
    mkdirSync(join(dir, "node_modules"));
    stackGuard(dir, { run: LOUD, requires: [{ kind: "path", match: "node_modules" }] });
  },
  (r, expect) => {
    expect(says(r, "THE GUARD EXECUTED"), "a met prerequisite left the guard unrun - the check would be permanently off");
    expect(r.drift === base.drift + 1, `expected the guard's failure to count: ${base.drift + 1}, got ${r.drift}`);
  },
);

check(
  "the same file, force-added, counts again",
  (dir) => {
    asRepo(dir);
    writeFileSync(join(dir, ".gitignore"), "/docs/\n");
    git(dir, "add", "-f", "docs/personas.md");
  },
  (r, expect) => {
    expect(r.drift === base.drift, `tracking the file did not clear the drift: drift ${r.drift}, baseline ${base.drift}`);
    expect(!says(r, "git-ignored and untracked"), "a tracked file was still reported as ignored - an ignore rule does not un-track what git already follows");
  },
);

check(
  "a requires entry nobody can evaluate is drift, not a guard that quietly stops running",
  (dir) => stackGuard(dir, { run: `node -e "process.exit(0)"`, requires: [{ kind: "toolbox", match: "pnpm" }] }),
  (r, expect) => {
    expect(r.drift === base.drift + 1, `expected drift ${base.drift + 1}, got ${r.drift}`);
    expect(says(r, "carries an unusable requires entry"), "a malformed prerequisite was ignored instead of reported");
  },
);

check(
  "words inside a guard's own error message are not mistaken for missing tools",
  (dir) =>
    stackGuard(dir, {
      // The shape the node stack's guard actually has: a builtin probe, a quoted message
      // naming things that are not commands, then the real command.
      run: `command -v node >/dev/null 2>&1 || { echo "${ABSENT_TOOL} is required; install it"; exit 1; }; node -e "process.exit(0)"`,
    }),
  (r, expect) => {
    expect(says(r, "stack-check-all passed"), "a runnable guard was skipped - inference that errs this way removes checks");
    expect(!says(r, "NOT RUN"), "quoted text or a shell builtin was probed as a command");
    expect(r.drift === base.drift, `expected the baseline drift ${base.drift}, got ${r.drift}`);
  },
);

// --- 7. what drift 0 does not say -------------------------------------------------------
//
// Measured on a raw greenfield tree: `.standards-version`, a `profile` key and an empty
// `specs/capability-map.json` took it from drift 3 to `OK - drift 0 - 100% adopted (69/69) -
// compliant with the standard` with no capability spec written at all. The number was right
// and the sentence was not. Reported rather than scored: the greenfield walk scaffolds in
// step 1 and specifies in step 6, so scoring the gap would put drift 0 out of reach of an
// honest new repo for the length of the interview.

// The greenfield walk in miniature, and the exact tree the case was measured on: the third
// declarative file (`emptyCapabilityMap`, defined with the fixture helpers above) is what
// takes it to drift 0. `.standards-version` the fixture already wrote.
check(
  "a repo that has specified nothing reaches drift 0, and the verdict says that is all it means",
  emptyCapabilityMap,
  (r, expect) => {
    expect(r.drift === 0, `the documented greenfield walk must still reach drift 0: got ${r.drift}`);
    expect(r.exit === 0, `expected exit 0 - the caveat is reported, never scored, got ${r.exit}`);
    expect(says(r, "no capability spec exists here yet"), "an empty repo was reported as compliant with nothing said about it");
    expect(says(r, "AND THAT IS THE WHOLE CLAIM"), "the verdict line still reads as an unqualified compliance claim");
  },
);

check(
  "one real capability spec clears it - the caveat is a state, not a permanent footnote",
  (dir) => {
    emptyCapabilityMap(dir);
    // A spec that satisfies the rest of the gate too, so the run is a real drift 0 and not
    // the caveat trading places with a structure failure: personas.md is fill-from-repo, and
    // R10 holds every capability spec to a persona from its roster.
    const personas = join(dir, "docs/personas.md");
    // Whichever shape the shipped roster's placeholder currently takes: the marker moved from
    // the angle form to the mustache form, and a hard-coded copy of it quietly stopped
    // matching - leaving the roster unfilled and this case failing on the persona gate
    // instead of measuring what it is about.
    writeFileSync(personas, readFileSync(personas, "utf8").replace(/\|\s*`(?:\{\{[^}]*\}\}|<[^>]*>)`\s*\|/, "| `Booker Bea` |"));
    mkdirSync(join(dir, "specs/booking"), { recursive: true });
    writeFileSync(
      join(dir, "specs/booking/spec.md"),
      "# Booking\n\n**Spec tier:** behavioral\n**Serves:** `Booker Bea`\n\n## Purpose\n\nReal specified behaviour.\n",
    );
  },
  (r, expect) => {
    expect(r.drift === 0, `expected drift 0, got ${r.drift}`);
    expect(!says(r, "no capability spec exists here yet"), "a repo with a capability spec was still told it has none");
    expect(!says(r, "AND THAT IS THE WHOLE CLAIM"), "the verdict kept the caveat after it stopped being true");
  },
);

check(
  "untracked but not ignored is left alone",
  (dir) => {
    // The state every adoption passes through: files authored, nothing staged yet. Failing
    // here would fire on every honest run of the procedure that creates them.
    asRepo(dir);
    git(dir, "rm", "-r", "--cached", "-q", ".");
  },
  (r, expect) => {
    expect(r.drift === base.drift, `an unstaged working tree was penalised: drift ${r.drift}, baseline ${base.drift}`);
    expect(!says(r, "git-ignored and untracked"), "files that are merely not staged yet were reported as excluded");
  },
);

check(
  "a template, a README and the engine's own scaffolding are not specified behaviour",
  (dir) => {
    // The shapes that would make the caveat unreachable if they counted: the shipped
    // templates and example under specs/, plus the plan/tasks files the spec engine writes
    // and deletes (ADR-010). A repo whose only "spec" is a plan has specified nothing.
    emptyCapabilityMap(dir);
    mkdirSync(join(dir, "specs/booking"), { recursive: true });
    writeFileSync(join(dir, "specs/booking/plan.md"), "# Plan\n");
    writeFileSync(join(dir, "specs/booking/tasks.md"), "# Tasks\n");
    writeFileSync(join(dir, "specs/booking/README.md"), "# Booking specs\n");
  },
  (r, expect) => {
    expect(says(r, "no capability spec exists here yet"), "ephemeral engine scaffolding counted as a capability spec");
    expect(r.drift === 0, `expected drift 0, got ${r.drift}`);
  },
);

check(
  "a tree that is no git repository is checked exactly as before",
  () => {},
  (r, expect) => {
    expect(r.drift === base.drift, `the baseline fixture is not a git work tree and must be unaffected: drift ${r.drift}, baseline ${base.drift}`);
    expect(!says(r, "git-ignored and untracked"), "a non-repository was told about ignore rules it cannot have");
  },
);

console.log();
if (failures) {
  console.error(`self-verify-drift-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(`self-verify-drift-test: OK - ${cases} cases, the drift number moves when the content does and holds still when the machine changes`);
