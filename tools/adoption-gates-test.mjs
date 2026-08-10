#!/usr/bin/env node
// adoption-gates-test - drive the shipped adoption-gate artifact guard over real fixtures.
//
// The guard exists because a real adoption run reached self-verify drift 0 having produced
// neither of the two artifacts a human reads to decide go or no-go: the Gate 2 health report
// and the Gate 5 count. Prose was delivered instead, after the fact, and nothing noticed -
// because nothing read either artifact's shape. The cases below fix each way that happens:
// a report that rates fewer than eight passes, a maturity word the scale does not contain, a
// count whose categories do not add up to the total it claims, and an item nobody owns.
//
// The arithmetic case is the one worth keeping honest. A scope block is hand-maintained, so
// its total drifts from its parts the first time an item is added - and a total that no
// longer describes its own breakdown is exactly as useless as no total, while looking
// authoritative.
//
// Usage: node tools/adoption-gates-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/adoption-gates.mjs");

const run = (dir, { block = true } = {}) => {
  const r = spawnSync("node", [GUARD, ...(block ? ["--block"] : [])], { cwd: dir, encoding: "utf8" });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "adoption-gates-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return dir;
};

let failures = 0;
let cases = 0;
const check = (name, { files, block = true, code, expect }) => {
  cases++;
  const dir = fixture(files);
  const { code: got, out } = run(dir, { block });
  rmSync(dir, { recursive: true, force: true });
  const wrong = got !== code || (expect && !expect.every((s) => out.includes(s)));
  if (wrong) {
    failures++;
    console.error(
      `  FAIL ${name}\n       expected exit ${code}${expect ? ` containing ${expect.join(" + ")}` : ""}, got ${got}\n       ${out.trim().split("\n").join("\n       ")}`,
    );
  } else {
    console.log(`  ok    ${name}`);
  }
};

// ------------------------------------------------------------------------------- fixtures

const PASSES = [
  "Skeleton & docs",
  "Decisions in code",
  "Capabilities & specs",
  "Quality gates",
  "CI/CD",
  "Security & supply chain",
  "Dependencies & stack",
  "Drift & health",
];

const assessment = ({ rows = 8, maturities = [], risks = true, owners = true } = {}) => {
  const body = PASSES.slice(0, rows)
    .map((p, i) => `| ${i + 1} | ${p} | **${maturities[i] ?? "solid"}** | evidence |`)
    .join("\n");
  return [
    "# Adoption assessment - demo",
    "",
    "## Maturity per pass",
    "",
    "| # | Pass | Maturity | What that rests on |",
    "| --- | --- | --- | --- |",
    body,
    "",
    ...(risks ? ["## Top risks", "", "1. The guards were failing open.", ""] : []),
    ...(owners ? ["## Findings by owner role", "", "### dev", "", "| Finding | Where |", "| --- | --- |", "| a thing | item 1 |", ""] : []),
  ].join("\n");
};

const backlog = ({
  parts = [5, 2, 4, 3],
  total = 14,
  block = true,
  ownerless = false,
  title = "Alignment scope for demo -> standard@0.9.0",
  totalLine = null,
} = {}) => {
  const scope = [
    "```",
    title,
    `  specs to write / raise to buildable ....  ${parts[0]}`,
    `  decisions to record (ADR/BDR) .........   ${parts[1]}`,
    `  drift to reconcile ....................   ${parts[2]}`,
    `  guards / structure to install .........   ${parts[3]}`,
    "  ---------------------------------------------",
    totalLine ?? `  ${total} tasks to full alignment`,
    "```",
  ].join("\n");
  return [
    "# Backlog",
    "",
    "## Standards alignment",
    "",
    ...(block ? [scope, ""] : []),
    "| # | Item | Owner | Notes |",
    "| --- | --- | --- | --- |",
    `| 1 | write the specs | ${ownerless ? "" : "dev"} | some note |`,
    "| 2 | confirm personas | product | some note |",
    "",
  ].join("\n");
};

const good = { "docs/adoption-assessment.md": assessment(), "backlog.md": backlog() };

// ---------------------------------------------------------------------------------- cases

check("a repo with no assessment is self-verify's problem, not this guard's", {
  files: { "backlog.md": "# Backlog\n" },
  code: 0,
  expect: ["skipping"],
});

check("a complete report and a count that adds up passes", { files: good, code: 0, expect: ["OK"] });

check("a report that rates seven passes is a pass nobody ran", {
  files: { ...good, "docs/adoption-assessment.md": assessment({ rows: 7 }) },
  code: 1,
  expect: ["rates 7 pass(es), expected 8"],
});

check("a maturity word outside absent / partial / solid is rejected", {
  files: {
    ...good,
    "docs/adoption-assessment.md": assessment({ maturities: ["solid", "good enough"] }),
  },
  code: 1,
  expect: ['maturity is "good enough"'],
});

check("every pass rated absent is a legitimate report, not a broken one", {
  files: {
    ...good,
    "docs/adoption-assessment.md": assessment({ maturities: Array(8).fill("absent") }),
  },
  code: 0,
  expect: ["OK"],
});

check("a report with no top risks says what is, never what is worst", {
  files: { ...good, "docs/adoption-assessment.md": assessment({ risks: false }) },
  code: 1,
  expect: ["Top risks"],
});

check("a report that attributes nothing leaves every finding unowned", {
  files: { ...good, "docs/adoption-assessment.md": assessment({ owners: false }) },
  code: 1,
  expect: ["owner role"],
});

check("a backlog with no scope block has no go/no-go number", {
  files: { ...good, "backlog.md": backlog({ block: false }) },
  code: 1,
  expect: ["no alignment scope block"],
});

check("a total that does not match its own breakdown is caught", {
  files: { ...good, "backlog.md": backlog({ parts: [5, 2, 4, 3], total: 12 }) },
  code: 1,
  expect: ["categories sum to 14", "claims 12"],
});

check("an alignment item with no owner role is caught", {
  files: { ...good, "backlog.md": backlog({ ownerless: true }) },
  code: 1,
  expect: ["name no owner role"],
});

check("the backlog is also read at docs/backlog.md", {
  files: { "docs/adoption-assessment.md": assessment(), "docs/backlog.md": backlog() },
  code: 0,
  expect: ["OK"],
});

// Bound to the shipped file, not a copy of it: a repo that scaffolded the template and never
// wrote the assessment is the exact failure ADR-048 exists for, and the case has to keep
// failing if the template's placeholder syntax is ever changed.
// The block's own title names the standard's version, so a title-reading parser adds that
// version's last number to the sum. It passed only because the fixture's version ended in 0.
check("the block's title is a title, not a category whose number joins the sum", {
  files: { ...good, "backlog.md": backlog({ title: "Alignment scope for demo -> standard@1.2" }) },
  code: 0,
  expect: ["OK"],
});

// The fix for the case above is easy to write as "skip the first line", which silently drops
// a real category from any block that carries no title - a wrong sum reported as the repo's.
check("a block with no title line at all still sums its own categories", {
  files: {
    ...good,
    // Five categories, no title: a guard that skipped line one would see 9 against a stated 14.
    "backlog.md": backlog({ title: "  specs to write .....................    5", parts: [2, 4, 3, 0], total: 14 }),
  },
  code: 0,
  expect: ["OK"],
});

check("a bolded total is still a total", {
  files: { ...good, "backlog.md": backlog({ totalLine: "  **14** tasks to full alignment" }) },
  code: 0,
  expect: ["OK"],
});

check("a scope block that says tasks but names no number is caught as that, not as bad arithmetic", {
  files: { ...good, "backlog.md": backlog({ totalLine: "  N tasks to full alignment" }) },
  code: 1,
  expect: ["names no number"],
});

check("a column headed 'Maturity today' is still the maturity column", {
  files: {
    ...good,
    "docs/adoption-assessment.md": assessment().replace("| Maturity |", "| Maturity today |"),
  },
  code: 0,
  expect: ["OK"],
});

check("the shipped template, scaffolded and never filled, does not pass for an assessment", {
  files: {
    ...good,
    "docs/adoption-assessment.md": readFileSync(join(process.cwd(), "standard/docs/adoption-assessment.md"), "utf8"),
  },
  code: 1,
  expect: ["expected one of absent / partial / solid"],
});

check("without --block a violation warns and does not fail the build", {
  files: { ...good, "backlog.md": backlog({ total: 12 }) },
  block: false,
  code: 0,
  expect: ["does not add up"],
});

console.log();
if (failures) {
  console.error(`adoption-gates-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log(`adoption-gates-test: OK - ${cases} cases, both gate artifacts are read for shape and arithmetic`);
