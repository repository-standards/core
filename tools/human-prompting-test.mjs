#!/usr/bin/env node
// human-prompting-test - drive the human-prompting check through cases that must fail.
//
// The check writes nothing when it is happy, so a broken one is silent: it stops refusing and
// the suite carries on looking green. Every case below is a defect that actually reached a
// branch in this repository, not an invented one:
//
//   - a duplicate prompt id, three times in one week, across three branches
//   - a hole in a series, which is what a half-finished renumbering leaves
//   - an observation citing a row that was renumbered out from under it
//   - a run whose own prose states a fraction its turns do not support
//
// The last case is the control and it matters as much as the rest: the real corpus must pass
// untouched. A check that fails on everything is as useless as one that fails on nothing.
//
// Fixtures are built in a temp directory, never against the real tree.
//
// Usage: node tools/human-prompting-test.mjs
// Zone 1 tooling - never shipped. Dependency-free (Node built-ins only).

import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = "tools/human-prompting.mjs";
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
};

// Run the tool inside a fixture root. Returns { code, out }.
const run = (root, args = []) => {
  try {
    const out = execFileSync(process.execPath, [join(process.cwd(), TOOL), ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

const PROMPTS = `# corpus

| id | prompt | source | what it tests |
|---|---|---|---|
| A1 | \`one\` | assistant | the entry line |
| A2 | \`two\` | assistant | a paraphrase |
| A3 | \`three\` | assistant | a constraint |

## Part 3 - volunteered

| id | the sentence | the situation | what happens without it |
|---|---|---|---|
| V1 | "this is out of scope" | a second problem mentioned in passing | the scope is absorbed |
`;

const RUN = {
  $about: "a fixture, not a real run",
  $headline: "asked 1 of 2. checked 2 of 2. suggested 1 of 2.",
  observations: [
    {
      prompt: "A1",
      target: "repo:fixture/one",
      mode: "stop-and-ask",
      verdict: "pass",
      evidence: "asked two questions before writing anything",
      turns: [
        { who: "user", said: "one" },
        { who: "agent", said: "asked, read the tree, named a next step", asked: true, checked: true, suggested: true },
      ],
    },
    {
      prompt: "A2",
      target: "repo:fixture/two",
      mode: "stop-and-ask",
      verdict: "partial",
      evidence: "inferred the undetermined part and acted on it",
      turns: [
        { who: "user", said: "two" },
        { who: "agent", said: "wrote first", asked: false, checked: true, suggested: false },
      ],
    },
  ],
};

// Build a fresh fixture root; `mutate` receives the paths and may break one thing.
const fixture = (mutate) => {
  const root = mkdtempSync(join(tmpdir(), "hp-test-"));
  const dir = join(root, "docs/validation/human-prompting");
  mkdirSync(join(dir, "runs"), { recursive: true });
  const state = { prompts: PROMPTS, run: structuredClone(RUN) };
  if (mutate) mutate(state);
  writeFileSync(join(dir, "prompts.md"), state.prompts);
  writeFileSync(join(dir, "runs/2026-01-01-a-fixture.json"), JSON.stringify(state.run, null, 2));
  return root;
};

const CASES = [
  {
    name: "a clean corpus passes, and the page it writes satisfies its own --check",
    mutate: null,
    expect: 0,
    then: (root) => {
      const second = run(root, ["--check"]);
      if (second.code !== 0) fail(`a freshly written page does not satisfy --check:\n${second.out}`);
    },
  },
  {
    name: "a duplicate prompt id is refused",
    mutate: (s) => {
      s.prompts = s.prompts.replace("| A3 | `three`", "| A2 | `three`");
    },
    expect: 1,
    match: /prompt id A2 is used by 2 rows/,
  },
  {
    name: "a hole in a series is refused",
    mutate: (s) => {
      s.prompts = s.prompts.replace("| A2 | `two` | assistant | a paraphrase |\n", "");
      s.run.observations[1].prompt = "A3";
    },
    expect: 1,
    match: /A series has no row for A2/,
  },
  {
    name: "an observation citing a row that does not exist is refused",
    mutate: (s) => {
      s.run.observations[0].prompt = "A9";
    },
    expect: 1,
    match: /cites A9, which is not a row/,
  },
  {
    name: "a stated fraction the rows do not support is refused",
    mutate: (s) => {
      s.run.$headline = "asked 2 of 2. checked 2 of 2. suggested 1 of 2.";
    },
    expect: 1,
    match: /states asked 2\/2, which is neither unit/,
  },
  {
    name: "an unknown verdict is refused",
    mutate: (s) => {
      s.run.observations[0].verdict = "mostly-fine";
    },
    expect: 1,
    match: /verdict "mostly-fine"/,
  },
  {
    name: "an observation with no evidence is refused",
    mutate: (s) => {
      delete s.run.observations[0].evidence;
    },
    expect: 1,
    match: /has no evidence/,
  },
  {
    name: "a run with no $about is refused",
    mutate: (s) => {
      delete s.run.$about;
    },
    expect: 1,
    match: /has no \$about/,
  },
  {
    name: "a turn with an unknown speaker is refused",
    mutate: (s) => {
      s.run.observations[0].turns[1].who = "system";
    },
    expect: 1,
    match: /turn 2 has who: "system"/,
  },
];

for (const c of CASES) {
  const root = fixture(c.mutate);
  try {
    const { code, out } = run(root);
    if (code !== c.expect) {
      fail(`${c.name}: expected exit ${c.expect}, got ${code}\n${out}`);
    } else if (c.match && !c.match.test(out)) {
      fail(`${c.name}: refused, but not for the stated reason - output was:\n${out}`);
    } else {
      console.log(`  ok    ${c.name}`);
      if (c.then) c.then(root);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// The real corpus is the last case, and the only one that is not a fixture: a check tuned until
// the fixtures pass but the actual tree fails would be worse than no check.
{
  const root = mkdtempSync(join(tmpdir(), "hp-real-"));
  try {
    cpSync("docs/validation/human-prompting", join(root, "docs/validation/human-prompting"), { recursive: true });
    const { code, out } = run(root, ["--check"]);
    if (code !== 0) fail(`the repository's own corpus does not pass:\n${out}`);
    else console.log("  ok    the repository's own corpus passes untouched");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

if (failures) {
  console.error(`\nhuman-prompting-test: ${failures} case(s) did not behave as required`);
  process.exit(1);
}
console.log(`human-prompting-test: OK - ${CASES.length + 1} cases`);
