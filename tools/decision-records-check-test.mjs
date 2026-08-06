#!/usr/bin/env node
// decision-records-check-test - drive the shipped decision-record index guard over real
// fixtures.
//
// The guard exists because two real defects both passed self-verify at drift 0: a second
// BDR-004 minted by following bdr-write's numbering step literally (duplicate id), and an
// Accepted BDR-004 that never made it into bdr/README.md (on disk, missing from the index).
// The cases below reproduce both directly, plus the mirror case (indexed, missing from
// disk), and check the guard is layout-agnostic: the shipped `adr/` + `bdr/` split and this
// repo's own flat `docs/decision-records/` must both be understood, and a number reused
// across the two streams (ADR-004 and BDR-004 coexisting) must not be flagged - only a
// number reused *within* one stream is a collision.
//
// Usage: node tools/decision-records-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/decision-records-check.mjs");

const run = (dir, { block = true, root } = {}) => {
  const rootArgs = root ? ["--root", root] : [];
  const r = spawnSync("node", [GUARD, ...rootArgs, ...(block ? ["--block"] : [])], { cwd: dir, encoding: "utf8" });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

// files: { "docs/decision-records/adr/README.md": "...", ... }
const fixture = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "decision-records-check-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return dir;
};

let failures = 0;
const check = (name, { files, block = true, root, code, expect }) => {
  const dir = fixture(files);
  const { code: got, out } = run(dir, { block, root });
  rmSync(dir, { recursive: true, force: true });
  const wrong = got !== code || (expect && !expect.every((s) => out.includes(s)));
  if (wrong) {
    failures++;
    console.error(`  FAIL ${name}\n       expected exit ${code}${expect ? ` containing ${expect.join(" + ")}` : ""}, got ${got}\n       ${out.trim().split("\n").join("\n       ")}`);
  } else {
    console.log(`  ok    ${name}`);
  }
};

const adrReadme = (...rows) => `# ADR index\n\n| # | Title | Status |\n|---|---|---|\n${rows.join("\n")}\n`;
const bdrReadme = (...rows) => `# BDR index\n\n| # | Title | Status |\n|---|---|---|\n${rows.join("\n")}\n`;
const row = (n, file, status = "Accepted") => `| [${n}](${file}) | something | ${status} |`;

check("no docs/decision-records/ at all is nothing to check", {
  files: { "README.md": "# empty repo\n" },
  code: 0,
  expect: ["skipping"],
});

check("the shipped empty adr/ + bdr/ skeleton is clean", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme("| - | (none yet) | - |"),
    "docs/decision-records/bdr/README.md": bdrReadme("| - | (none yet) | - |"),
  },
  code: 0,
  expect: ["OK"],
});

check("a flat directory (this repo's own layout) with matching files and index is clean", {
  files: {
    "docs/decision-records/README.md": adrReadme(row("001", "ADR-001-first.md")),
    "docs/decision-records/ADR-001-first.md": "# ADR-001\n",
  },
  code: 0,
  expect: ["OK", "1 record"],
});

check("ADR-004 and BDR-004 coexisting in one flat directory is not a collision", {
  files: {
    "docs/decision-records/README.md": adrReadme(row("004", "ADR-004-x.md")) + bdrReadme(row("004", "BDR-004-y.md")),
    "docs/decision-records/ADR-004-x.md": "# ADR-004\n",
    "docs/decision-records/BDR-004-y.md": "# BDR-004\n",
  },
  code: 0,
  expect: ["OK", "2 record"],
});

check("two files claiming the same number is a duplicate id (the reproduced bug)", {
  files: {
    "docs/decision-records/bdr/README.md": bdrReadme(row("004", "BDR-004-pricing-model.md")),
    "docs/decision-records/bdr/BDR-004-pricing-model.md": "# BDR-004: pricing\n",
    "docs/decision-records/bdr/BDR-004-seat-based.md": "# BDR-004: seats (the duplicate)\n",
  },
  code: 1,
  expect: ["duplicate id", "BDR-4", "BDR-004-pricing-model.md", "BDR-004-seat-based.md"],
});

check("an Accepted record on disk missing from the index (the other reproduced bug)", {
  files: {
    "docs/decision-records/bdr/README.md": bdrReadme(row("003", "BDR-003-earlier.md")),
    "docs/decision-records/bdr/BDR-003-earlier.md": "# BDR-003\n",
    "docs/decision-records/bdr/BDR-004-pricing-model.md": "# BDR-004: pricing, never indexed\n",
  },
  code: 1,
  expect: ["missing from the index", "BDR-004-pricing-model.md"],
});

check("an index row citing a file that is not there", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme(row("001", "ADR-001-first.md"), row("002", "ADR-002-removed.md", "Superseded")),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 1,
  expect: ["missing from disk", "ADR-002-removed.md"],
});

check("two index rows claiming the same file/number is a duplicate id from the index side", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme(row("001", "ADR-001-first.md"), row("001", "ADR-001-first.md")),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 1,
  expect: ["duplicate id", "README row claims"],
});

check("advisory without --block: reports and exits 0", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme(row("001", "ADR-001-first.md"), row("002", "ADR-002-gone.md")),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  block: false,
  code: 0,
  expect: ["missing from disk"],
});

// The row form nobody documents: an author who has just written ADR-001-title.md writes
// `[ADR-001](ADR-001-title.md)` in the index, because at the time the shipped README template
// carried only the `| - | (none yet) | - |` placeholder and no worked row. Before the fix that row was
// invisible to the guard, which then reported the record as "missing from the index" - about a
// record whose row was on screen. Found on a real repository (caddyserver/caddy).
check("a link label carrying the stream prefix is still an index row", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme("| [ADR-001](ADR-001-first.md) | something | Accepted |"),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 0,
});

// The other direction: accepting the prefixed label must not make a genuinely missing row pass.
check("a prefixed label for one record does not cover a second, unindexed one", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme("| [ADR-001](ADR-001-first.md) | something | Accepted |"),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
    "docs/decision-records/adr/ADR-002-second.md": "# ADR-002\n",
  },
  code: 1,
  expect: ["missing from the index", "ADR-002-second.md"],
});

// A bare row may carry the prefix too, and in a flat layout the prefix is the only thing that
// distinguishes BDR-004's row from ADR-004's - so it is read, not discarded.
check("a bare prefixed row indexes its own stream, not the other one", {
  files: {
    "docs/decision-records/README.md": adrReadme("| ADR-004 | something | Accepted |", "| BDR-004 | something | Accepted |"),
    "docs/decision-records/ADR-004-tech.md": "# ADR-004\n",
    "docs/decision-records/BDR-004-business.md": "# BDR-004\n",
  },
  code: 0,
});

// An example row inside an HTML comment is what every other shipped template uses to show
// its own format, and this guard read it as a real index entry - so the index README was the
// one file that could not document itself. Both directions: a commented example is ignored,
// and an uncommented row for a file that is not there still fails.
check("an example row inside an HTML comment is not an index entry", {
  files: {
    "docs/decision-records/adr/README.md":
      `${adrReadme(row("001", "ADR-001-first.md"))}\n<!-- Filled, a row reads like this:\n\n| [002](ADR-002-example.md) | an example | Accepted |\n-->\n`,
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 0,
});

check("a fenced example row is not an index entry either", {
  files: {
    "docs/decision-records/adr/README.md":
      `${adrReadme(row("001", "ADR-001-first.md"))}\n\`\`\`\n| [002](ADR-002-example.md) | an example | Accepted |\n\`\`\`\n`,
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 0,
});

check("an uncommented row for a missing file still fails after comment stripping", {
  files: {
    "docs/decision-records/adr/README.md": adrReadme(row("001", "ADR-001-first.md"), row("002", "ADR-002-example.md")),
    "docs/decision-records/adr/ADR-001-first.md": "# ADR-001\n",
  },
  code: 1,
  expect: ["missing from disk", "ADR-002-example.md"],
});

// The shipped skeleton itself, verbatim - a fresh degit must not trip its own guard.
{
  const dir = fixture({});
  mkdirSync(join(dir, "docs/decision-records"), { recursive: true });
  const { code, out } = run(dir, { block: true, root: join(process.cwd(), "standard/docs/decision-records") });
  rmSync(dir, { recursive: true, force: true });
  if (code !== 0) {
    failures++;
    console.error(`  FAIL the shipped adr/bdr skeleton does not trip the guard\n       exit ${code}: ${out.trim()}`);
  } else {
    console.log("  ok    the shipped adr/bdr skeleton does not trip the guard");
  }
}

// This repo's own real, flat docs/decision-records/ - the guard must agree with itself.
{
  const dir = fixture({});
  const { code, out } = run(dir, { block: true, root: join(process.cwd(), "docs/decision-records") });
  rmSync(dir, { recursive: true, force: true });
  if (code !== 0) {
    failures++;
    console.error(`  FAIL this repo's own docs/decision-records/ does not trip the guard\n       exit ${code}: ${out.trim()}`);
  } else {
    console.log("  ok    this repo's own docs/decision-records/ does not trip the guard");
  }
}

console.log();
if (failures) {
  console.error(`decision-records-check-test: ${failures} case(s) failed`);
  process.exit(1);
}
console.log("decision-records-check-test: OK - 17 cases, the index and the directory are cross-checked both ways");
