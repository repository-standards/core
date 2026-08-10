#!/usr/bin/env node
// Adoption-gate artifact guard (R27).
//
// The checkmap calls the gate order and "every gate produces its artifact" rigid and
// framework-enforced. Two of those artifacts had a defined shape and nothing that read it:
//
//   Gate 2 - the assessment health report: maturity per pass (absent / partial / solid),
//            top risks, findings grouped by the owner role that must act.
//   Gate 5 - the counted backlog: a scope block whose categories sum to a stated total,
//            every item naming its owner role. That total is the human's go/no-go.
//
// Gate 0's artifact became a manifest entry in 0.9.0 (R26, ADR-042) and is, measurably, the
// only one of the three that adoption runs reliably produce. That is the whole argument for
// this guard: presence in the manifest is what makes a gate happen, and presence alone is not
// enough for these two, because a file can exist and still not carry the number.
//
// What this checks is shape, never judgment. It cannot tell a considered `partial` from a
// guessed one. It can tell that eight passes were rated, that the arithmetic in the scope
// block is real, and that somebody was named for every item - the three ways these artifacts
// fail silently.
//
// Deliberately NOT checked: whether the maturity is accurate, whether the risks are the real
// ones, or whether the owner named is the right person's role. Those need a reader.
//
// Usage:
//   node scripts/adoption-gates.mjs [--assessment <path>] [--backlog <path>]
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/adoption-gates.mjs.

import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const block = args.includes("--block");
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const ASSESSMENT = argValue("--assessment", "docs/adoption-assessment.md");
const BACKLOG_CANDIDATES = args.includes("--backlog")
  ? [argValue("--backlog", "backlog.md")]
  : ["backlog.md", "docs/backlog.md"];

const MATURITIES = new Set(["absent", "partial", "solid"]);
const ROLES = new Set(["product", "architect", "dev", "agent"]);
const EXPECTED_PASSES = 8;

// self-verify already reports a missing required entry as drift. Failing here too would count
// the same gap twice and, worse, would make a repo mid-adoption look like it had two problems.
if (!existsSync(ASSESSMENT)) {
  console.log(
    `adoption-gates: no ${ASSESSMENT} - skipping (self-verify reports the missing required entry; this guard reads its shape, not its presence)`,
  );
  process.exit(0);
}

const problems = [];
const cells = (line) =>
  line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
const plain = (cell) => cell.replace(/[*`]/g, "").trim().toLowerCase();

// ---------------------------------------------------------------- Gate 2: the health report

const assessment = readFileSync(ASSESSMENT, "utf8");
const lines = assessment.split("\n");

// The maturity table is found by its header, not by position: a heading above it can be
// reworded without breaking this, which is the kind of edit a real repo makes.
const headerIdx = lines.findIndex(
  (l) => l.startsWith("|") && plain(l).includes("pass") && plain(l).includes("maturity"),
);

if (headerIdx === -1) {
  problems.push(
    `${ASSESSMENT}: no maturity table - expected a table whose header names a "Pass" column and a "Maturity" column, one row per assessment pass`,
  );
} else {
  const header = cells(lines[headerIdx]).map(plain);
  // The header is matched loosely above, so the column has to be found the same way: a repo
  // that writes "Maturity today" must not have every one of its rows reported as empty.
  const maturityCol = header.findIndex((c) => c.includes("maturity"));
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) break;
    if (/^\|[\s|:-]+\|$/.test(line)) continue; // the --- separator row
    rows.push({ line, n: i + 1 });
  }

  if (rows.length !== EXPECTED_PASSES) {
    problems.push(
      `${ASSESSMENT}: the maturity table rates ${rows.length} pass(es), expected ${EXPECTED_PASSES} - the repo-assessment defines eight, and a table missing one is a pass nobody ran`,
    );
  }

  for (const { line, n } of rows) {
    const value = plain(cells(line)[maturityCol] ?? "");
    if (!MATURITIES.has(value)) {
      problems.push(
        `${ASSESSMENT}:${n}: maturity is "${value || "(empty)"}" - expected one of absent / partial / solid`,
      );
    }
  }
}

const hasHeading = (re) => lines.some((l) => /^#{2,3}\s/.test(l) && re.test(plain(l)));

if (!hasHeading(/top risks/)) {
  problems.push(`${ASSESSMENT}: no "Top risks" heading - the report has to say what is worst, not only what is`);
}

if (!hasHeading(/findings by owner|by owner role/)) {
  problems.push(
    `${ASSESSMENT}: no "Findings by owner role" heading - a finding with no role attached is a finding nobody has to act on`,
  );
}

const rolesNamed = lines
  .filter((l) => /^#{3,4}\s/.test(l))
  .map((l) => plain(l).replace(/^#+\s*/, "").split(/[\s/(]/)[0])
  .filter((r) => ROLES.has(r));

if (!rolesNamed.length) {
  problems.push(
    `${ASSESSMENT}: no owner-role grouping found - expected sub-headings naming at least one of: ${[...ROLES].join(", ")}`,
  );
}

// ------------------------------------------------------------- Gate 5: the counted backlog

const backlogPath = BACKLOG_CANDIDATES.find((p) => existsSync(p));

if (!backlogPath) {
  problems.push(`no backlog found at ${BACKLOG_CANDIDATES.join(" or ")} - Gate 5 has nowhere to put the count`);
} else {
  const backlog = readFileSync(backlogPath, "utf8");
  const blocks = [...backlog.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const scope = blocks.find((b) => /tasks? to full alignment/i.test(b));

  if (!scope) {
    problems.push(
      `${backlogPath}: no alignment scope block - expected a fenced block ending in "N tasks to full alignment", which is the number the human says go or no-go on`,
    );
  } else {
    // Emphasis around the total is a real thing people write, and a total that reads as
    // absent because it was bolded would fail as arithmetic rather than as formatting.
    const scopeText = scope.replace(/[*`]/g, "");
    const total = Number(scopeText.match(/(\d+)\s+tasks? to full alignment/i)?.[1]);
    // A category line is "label ....  12": dot leaders are conventional, so anything ending in
    // a number that is not the total counts, and a repo may name its own categories. The
    // number must stand apart from its label, which is what separates a count from the version
    // in the block's title - `standard@1.2` ends in a digit too, and reading it as a category
    // fails a block whose arithmetic is correct. Position is deliberately not used: dropping
    // "the first line" would eat a real category in a block that carries no title.
    const parts = scopeText
      .split("\n")
      .filter((l) => !/tasks? to full alignment/i.test(l))
      .map((l) => l.match(/^\s*\S.*?\s(\d+)\s*$/))
      .filter(Boolean)
      .map((m) => Number(m[1]));

    const sum = parts.reduce((a, b) => a + b, 0);
    if (Number.isNaN(total)) {
      problems.push(
        `${backlogPath}: the scope block names no number - "tasks to full alignment" with nothing in front of it is the sentence the count was supposed to replace`,
      );
    } else if (!parts.length) {
      problems.push(`${backlogPath}: the scope block states a total but breaks it into nothing - no category lines found`);
    } else if (sum !== total) {
      problems.push(
        `${backlogPath}: the scope block does not add up - categories sum to ${sum}, the block claims ${total} tasks to full alignment`,
      );
    }

    // Owner roles are checked only on the table that follows the count, so this never reaches
    // into a repo's product backlog and demands roles the standard never asked it to carry.
    const after = backlog.slice(backlog.indexOf(scope) + scope.length);
    const section = after.split(/\n## /)[0];
    const tableRows = section
      .split("\n")
      .filter((l) => l.startsWith("|") && /^\|\s*\d+\s*\|/.test(l));

    const ownerless = tableRows.filter((l) => !cells(l).some((c) => ROLES.has(plain(c))));
    if (tableRows.length && ownerless.length) {
      problems.push(
        `${backlogPath}: ${ownerless.length} of ${tableRows.length} alignment item(s) name no owner role - every item says whose work it is (${[...ROLES].join(" / ")}), or the count says how much work but not whose`,
      );
    }
  }
}

// --------------------------------------------------------------------------------- verdict

if (!problems.length) {
  console.log("adoption-gates: OK (Gate 2 report rated and attributed, Gate 5 count adds up and every item is owned)");
  process.exit(0);
}

console.error("adoption-gates: the gate artifacts exist but do not carry what the gate is for:\n");
for (const p of problems) console.error(`  - ${p}`);
console.error(
  `\nadoption-gates: ${problems.length} problem(s). These are the artifacts a human reads to say go or no-go; a run that reaches drift 0 without them has measured the repo and skipped the person.`,
);
process.exit(block ? 1 : 0);
