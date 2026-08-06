#!/usr/bin/env node
// spec-guard-test - drive the shipped coupling guard through real diffs in a
// throwaway git repo.
//
// The guard can be wrong in two directions and only one of them is loud. A false
// positive is visible: it fires, someone argues with it. A false negative is
// silent - a `couples: "shape"` entry that stops noticing a schema change looks
// exactly like a green run, and the capability quietly loses its gate. So every
// case asserts an exit code, and most of them assert the guard still fires.
//
// Usage: node tools/spec-guard-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/spec-guard.mjs");
const repo = mkdtempSync(join(tmpdir(), "spec-guard-test-"));
const IDENT = ["-c", "user.name=spec-guard-test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"];

const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const write = (rel, body) => {
  mkdirSync(dirname(join(repo, rel)), { recursive: true });
  writeFileSync(join(repo, rel), body);
};
const json = (o) => `${JSON.stringify(o, null, 2)}\n`;
const rules = (o = {}) => json({ version: 1, rules: [{ id: "a", on: true }], ...o });
// `payments` carries the two glob shapes from the shipped example - a capability whose
// code sits at the top level, and a file directly inside `shared/`. Both were dead:
// `**` was translated without consuming the slash beside it, so they only ever matched
// a path with an extra directory in the middle, and the money path went unguarded.
const MAP = {
  widgets: ["src/**", { glob: "data/*.json", couples: "shape" }],
  payments: ["**/payment/**", "shared/**/payment*"],
};
// Two capabilities inside one domain folder - the sibling that grew out of the first. The
// exclusion is what lets `payment/refunds.ts` belong to `refunds` alone while everything
// else under `payment/` stays with `payments`.
const SPLIT_MAP = {
  ...MAP,
  payments: ["**/payment/**", "!**/payment/refunds*", "shared/**/payment*"],
  refunds: ["**/payment/refunds*"],
};

write("specs/capability-map.json", json(MAP));
write("specs/widgets/spec.md", "# Widgets\n");
write("specs/payments/spec.md", "# Payments\n");
write("src/index.js", "export const widget = 1;\n");
write("data/rules.json", rules());
write("payment/index.ts", "export const capture = 1;\n");
write("payment/gateway/capture.ts", "export const gateway = 1;\n");
write("payment/refunds.ts", "export const refund = 1;\n");
write("shared/payment.ts", "export const money = 1;\n");
write("shared/paymob.ts", "export const unrelated = 1;\n");
// Tracked and claimed by nobody - what the unclaimed-code check is for.
write("tooling/build.mjs", "export const build = 1;\n");
git("init", "-q", "-b", "main");
git("add", "-A");
git(...IDENT, "commit", "-qm", "seed");

const run = (...args) => {
  try {
    return { code: 0, out: execFileSync("node", [GUARD, ...args], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

// The sibling capability's own spec directory, minted and removed by the --audit cases that
// need it: leaving it in the seed would make every --audit case above report an orphan spec,
// and creating it in a diff-mode case would read as that capability's spec being touched.
const withRefundsSpec = {
  act: () => write("specs/refunds/spec.md", "# Refunds\n"),
  undo: () => {
    git("reset", "-q");
    rmSync(join(repo, "specs/refunds"), { recursive: true, force: true });
  },
};

// fires = the guard must block (exit 1 under --block); passes = it must not.
const CASES = [
  { name: "a data addition does not couple", fires: false, says: "changed as data", act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true }, { id: "b", on: false }] })) },
  { name: "a value edit does not couple", fires: false, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: false }] })) },
  { name: "a new key inside an entry couples", fires: true, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true, mode: "x" }] })) },
  { name: "a dropped key couples", fires: true, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a" }] })) },
  { name: "a new top-level key couples", fires: true, act: () => write("data/rules.json", rules({ mode: "x" })) },
  { name: "a file with no earlier version couples", fires: true, act: () => write("data/extra.json", rules()), undo: () => rmSync(join(repo, "data/extra.json")) },
  { name: "unparseable json couples", fires: true, act: () => write("data/rules.json", "{") },
  { name: "code without its spec fires", fires: true, act: () => write("src/index.js", "export const widget = 2;\n") },
  { name: "code with its spec passes", fires: false, act: () => { write("src/index.js", "export const widget = 3;\n"); write("specs/widgets/spec.md", "# Widgets\n\nA widget is 3.\n"); } },
  { name: "a staged data addition does not couple", fires: false, args: ["--staged"], says: "changed as data", act: () => { write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true }, { id: "c", on: true }] })); git("add", "-A"); }, undo: () => git("reset", "-q") },
  { name: "an unusable map entry stops the guard", fires: true, says: "unusable entry", act: () => write("specs/capability-map.json", json({ widgets: [{ couples: "shape" }] })) },

  // The glob shapes the shipped example leads with. Before the shared translator each
  // of these passed: `spec-guard: OK` on a change to a money path with no spec edit.
  { name: "a capability directory at the top level matches `**/payment/**`", fires: true, act: () => write("payment/index.ts", "export const capture = 2;\n") },
  { name: "a file nested deeper under the same glob matches", fires: true, act: () => write("payment/gateway/capture.ts", "export const gateway = 2;\n") },
  { name: "`shared/**/payment*` matches a file directly inside shared", fires: true, act: () => write("shared/payment.ts", "export const money = 2;\n") },
  { name: "a neighbour that only starts like the glob does not match", fires: false, act: () => write("shared/paymob.ts", "export const unrelated = 2;\n") },

  // --audit: the map is what makes the guard mean anything, and it can rot in four ways.
  {
    name: "--audit reports a glob that matches no file",
    fires: true,
    args: ["--audit"],
    says: "watching nothing",
    act: () => write("specs/capability-map.json", json({ ...MAP, widgets: ["src/**", "moved-away/**"] })),
  },
  {
    name: "--audit reports a map entry whose capability has no spec",
    fires: true,
    args: ["--audit"],
    says: "no spec",
    act: () => write("specs/capability-map.json", json({ ...MAP, checkout: ["src/**"] })),
  },
  {
    name: "--audit says so when the unclaimed-code check is off",
    fires: false,
    args: ["--audit"],
    says: "unclaimed-code check is OFF",
    act: () => {},
  },
  {
    name: "--audit reports code that belongs to no capability once $unclaimed is declared",
    fires: true,
    args: ["--audit"],
    says: "tooling/build.mjs",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimed: [] })),
  },
  {
    name: "--audit passes when that code is declared unclaimed",
    fires: false,
    args: ["--audit"],
    says: "each claimed by a capability or declared unclaimed",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] })),
  },
  {
    name: "$unclaimed is metadata, not a capability whose spec can never be touched",
    fires: false,
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      write("tooling/build.mjs", "export const build = 2;\n");
    },
  },
  {
    name: "an unknown $ key is refused instead of silently exempting nothing",
    fires: true,
    says: "unknown metadata key",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimd: ["tooling/**"] })),
  },
  {
    // The spec template tells a retiring capability to keep its map entry: the code is
    // gone, the spec stays as the record, and dropping the entry would make the spec
    // read as an orphan instead. Its globs match nothing by design.
    name: "--audit leaves a retired capability's now-empty globs alone",
    fires: false,
    args: ["--audit"],
    says: "1 retired",
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, legacy: ["legacy/**"] }));
      write("specs/legacy/spec.md", "# Legacy\n\n**Status:** retired\n");
      git("add", "-A");
    },
    undo: () => {
      git("reset", "-q");
      rmSync(join(repo, "specs/legacy"), { recursive: true, force: true });
    },
  },

  // Exclusions: two capabilities in one domain folder. Without them the map could only say
  // "the whole folder" - every edit demanding both specs - or hand-enumerate the files that
  // are left, which goes stale in silence the moment one is added.
  {
    name: "an exclusion hands one file inside a claimed folder to its sibling",
    fires: true,
    says: "- refunds ",
    never: "- payments ",
    act: () => {
      write("specs/capability-map.json", json(SPLIT_MAP));
      write("payment/refunds.ts", "export const refund = 2;\n");
    },
  },
  {
    name: "the excluded file's neighbours still couple to the folder's capability",
    fires: true,
    says: "- payments ",
    never: "- refunds ",
    act: () => {
      write("specs/capability-map.json", json(SPLIT_MAP));
      write("payment/index.ts", "export const capture = 2;\n");
    },
  },
  {
    name: "editing the excluded file with its own spec passes",
    fires: false,
    act: () => {
      withRefundsSpec.act();
      write("specs/capability-map.json", json(SPLIT_MAP));
      write("payment/refunds.ts", "export const refund = 3;\n");
      write("specs/refunds/spec.md", "# Refunds\n\nA refund returns a capture.\n");
      git("add", "-A");
    },
    undo: withRefundsSpec.undo,
  },
  {
    name: "--audit accepts the split - every file still claimed by exactly one capability",
    fires: false,
    args: ["--audit"],
    says: "each claimed by a capability or declared unclaimed",
    act: () => {
      withRefundsSpec.act();
      write("specs/capability-map.json", json({ ...SPLIT_MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      git("add", "-A");
    },
    undo: withRefundsSpec.undo,
  },
  {
    // The silent way an exclusion rots: the sibling's file is renamed, the exclusion stops
    // matching, and the folder's capability quietly claims it back.
    name: "--audit reports an exclusion that holds nothing back",
    fires: true,
    args: ["--audit"],
    says: "the exclusion holds nothing back",
    act: () => {
      withRefundsSpec.act();
      write("specs/capability-map.json", json({ ...SPLIT_MAP, payments: ["**/payment/**", "!**/payment/rebates*", "shared/**/payment*"] }));
      git("add", "-A");
    },
    undo: withRefundsSpec.undo,
  },
  {
    // An exclusion may hand a file over; it may not make one disappear.
    name: "--audit reports a file an exclusion handed to nobody",
    fires: true,
    args: ["--audit"],
    says: "payment/refunds.ts",
    act: () =>
      write(
        "specs/capability-map.json",
        json({ ...MAP, payments: ["**/payment/**", "!**/payment/refunds*", "shared/**/payment*"], $unclaimed: ["tooling/**", "shared/paymob.ts"] }),
      ),
  },
  {
    name: "a capability of nothing but exclusions is refused",
    fires: true,
    says: "only exclusions",
    act: () => write("specs/capability-map.json", json({ ...MAP, widgets: ["!src/**"] })),
  },
  {
    name: "an exclusion written as an object is refused, not silently given a coupling mode",
    fires: true,
    says: "exclusion written as an object",
    act: () => write("specs/capability-map.json", json({ ...MAP, widgets: ["src/**", { glob: "!src/vendor/**", couples: "shape" }] })),
  },
  {
    name: "a bare `!` is refused",
    fires: true,
    says: "empty exclusion",
    act: () => write("specs/capability-map.json", json({ ...MAP, widgets: ["src/**", "!"] })),
  },

  // Code the map does not describe at all. The per-capability loop can only fire on a file
  // some glob matches, so a capability built where its globs do not look changed with
  // `spec-guard: OK` - and the diff run is the only spec-guard the manifest ships as a gate.
  {
    name: "a capability implemented where its globs do not look is reported instead of passing",
    fires: true,
    says: "belong to no capability",
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, widgets: ["src/widgets/**"], $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      write("services/widget-sync.js", "export const sync = 1;\n");
    },
    undo: () => rmSync(join(repo, "services"), { recursive: true, force: true }),
  },
  {
    name: "the same file couples to its capability once the map binds where the code is",
    fires: true,
    says: "- widgets ",
    never: "belong to no capability",
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, widgets: ["src/**", "services/widget-*.js"], $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      write("services/widget-sync.js", "export const sync = 1;\n");
    },
    undo: () => rmSync(join(repo, "services"), { recursive: true, force: true }),
  },
  {
    // Without `$unclaimed` the map never claimed to cover everything, so the guard has no
    // basis to call anything unclaimed - the same rule --audit already applies.
    name: "the unclaimed-code check stays off in a map that declares no $unclaimed",
    fires: false,
    act: () => write("services/widget-sync.js", "export const sync = 1;\n"),
    undo: () => rmSync(join(repo, "services"), { recursive: true, force: true }),
  },
];

let failures = 0;
for (const c of CASES) {
  c.act();
  const { code, out } = run(...(c.args ?? []), "--block");
  const want = c.fires ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (c.says && !out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"`);
  } else if (c.never && out.includes(c.never)) {
    // Firing is not enough when the point of the case is WHICH capability fired: an
    // exclusion that changed nothing still exits 1, on the sibling it was meant to release.
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output also says "${c.never}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  c.undo?.();
  git("checkout", "--", ".");
}

rmSync(repo, { recursive: true, force: true });

if (failures) {
  console.log(`\nspec-guard-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nspec-guard-test: OK - ${CASES.length} cases, the guard fires where it must`);
