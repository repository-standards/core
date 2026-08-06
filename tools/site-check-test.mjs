#!/usr/bin/env node
// site-check-test - drive the landing gate over fixture sites.
//
// The case this file exists for is the one the gate used to pass: a landing that states
// the current version somewhere AND the previous one somewhere else. "v0.8.13 appears"
// was true while four other places on the same page still read v0.8.12, so the check
// agreed the page was shippable and a reader got both numbers. A gate that only looks
// for the right answer cannot see a wrong one sitting next to it.
//
// The other half is the false positive that makes the strict version of that check
// unusable if it is not handled: SVG path data is a stream of coordinates, and the
// GitHub mark in the landing's own header reads as a dozen version numbers to any
// regex. The fixtures below carry both, so neither half can regress alone.
//
// Usage: node tools/site-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHECK = join(process.cwd(), "tools/site-check.mjs");

// The released version of the fixture site. Deliberately not this repo's own, so a test
// that reads the wrong VERSION file cannot accidentally agree with itself.
const VERSION = "2.4.0";

// Path data holding three version-shaped triples, two of which the failing cases below
// use as their stale version. The same string must be a defect in prose and a coordinate
// list inside <svg>, which is the whole of the exemption the gate makes.
const MARK = '<svg viewBox="0 0 24 24"><path d="M1.9.9 4.5.6 2.3.9"/></svg>';

const landing = ({ pill = VERSION, prose = VERSION, footer = VERSION, script = VERSION, deco = false }) => `<meta charset="utf-8">
<title>fixture landing</title>
<meta property="og:title" content="fixture">
<meta property="og:description" content="a fixture landing">
<meta property="og:url" content="https://example.test/">
<meta property="og:image" content="https://example.test/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>:root{--bg:#08080b}</style>
<header>
  ${pill ? `<span class="tag mono">v${pill}</span>` : "<span class=\"tag mono\">the standard</span>"}
  <a class="gh" href="https://github.com/repository-standards/core">${MARK}GitHub</a>
</header>
<main>
  <p>Open source, MIT, no build step.${prose ? ` Version ${prose}, the first stable line.` : ""}</p>
  <a href="/docs/index.html">Docs</a>
</main>
<footer>${deco ? '<svg class="deco" width="8" height="8"/>' : ""}<span>fixture${footer ? ` &middot; v${footer}` : ""} &middot; MIT</span>${deco ? MARK : ""}</footer>
<script>
  var SCRIPT = [
    {h:'Reading the standard&hellip; <span class="cv">fixture${script ? `@${script}` : ""}</span>', d:640}
  ];
</script>
`;

const docsPage = `<meta charset="utf-8">
<title>fixture docs</title>
<meta property="og:title" content="fixture docs">
<meta property="og:description" content="a fixture docs page">
<meta property="og:url" content="https://example.test/docs/index.html">
<meta property="og:image" content="https://example.test/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>:root{--bg:#08080b}</style>
<div class="prose"><h1>Fixture</h1><p>A generated page.</p></div>
`;

const BASE = {
  VERSION: `${VERSION}\n`,
  "site/site.config.json": JSON.stringify(
    {
      site_url: "https://example.test",
      brand: "fixture",
      repo_url: "https://github.com/repository-standards/core",
      pages: [{ src: "docs/x.md", out: "index.html", nav: "Home", group: null }],
    },
    null,
    2,
  ),
  "site/og.png": "not really a png, and existsSync is all the check asks of it\n",
  "site/index.html": landing({}),
  "site/docs/index.html": docsPage,
};

const run = (dir) => {
  try {
    return { code: 0, out: execFileSync("node", [CHECK], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

const CASES = [
  {
    name: "a landing stating one version, the released one, passes - path data and all",
    fails: false,
    says: `all 4 version string(s) on the page state ${VERSION}`,
  },
  {
    // DOC-12, reproduced: the header pill is right, the footer is a release behind, and
    // the old check called that shippable because the right answer was present.
    name: "a stale version beside the right one fails",
    fails: true,
    says: ["states 2.3.9", `VERSION says ${VERSION}`, "site-check: FAIL - 1 problem(s)"],
    files: { "site/index.html": landing({ footer: "2.3.9" }) },
  },
  {
    // Two of the four stale occurrences were inside the hero's <script>. Tag balance
    // skips script bodies, so a check reading markup only would have missed them.
    name: "a stale version inside the hero script fails too",
    fails: true,
    says: "states 1.9.9",
    files: { "site/index.html": landing({ script: "1.9.9" }) },
  },
  {
    // Equality, not recency: a page that ran ahead of the release is as wrong as one
    // that lagged behind it, and only one of the two looks like a mistake.
    name: "a version the release has not reached yet fails as well",
    fails: true,
    says: "states 2.4.1",
    files: { "site/index.html": landing({ prose: "2.4.1" }) },
  },
  {
    // The mask must not be an opening a stale version can hide behind. This fixture puts
    // a self-closing <svg/> before the stale footer and a real mark after it: a mask that
    // paired the self-closing tag with the NEXT </svg> blanks out everything in between,
    // the version included, and reports the page clean. Verified load-bearing - swap the
    // opener back to a plain <svg and this case is the one that goes red.
    name: "a self-closing mark does not open a hiding place for a stale version",
    fails: true,
    says: ["states 2.3.9", "site-check: FAIL - 1 problem(s)"],
    files: { "site/index.html": landing({ deco: true, footer: "2.3.9" }) },
  },
  {
    // The criterion the strict check must not replace: every version agreeing is not the
    // same as the page carrying one at all.
    name: "a landing naming no version at all still fails",
    fails: true,
    says: `does not advertise v${VERSION}`,
    files: { "site/index.html": landing({ pill: "", prose: "", footer: "", script: "" }) },
  },
];

let failures = 0;
for (const c of CASES) {
  const dir = mkdtempSync(join(tmpdir(), "site-check-test-"));
  for (const [rel, body] of Object.entries({ ...BASE, ...(c.files ?? {}) })) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }

  const { code, out } = run(dir);
  const want = c.fails ? 1 : 0;
  const missing = [].concat(c.says).filter((s) => !out.includes(s));
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (missing.length) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says ${missing.map((s) => `"${s}"`).join(", ")}\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  rmSync(dir, { recursive: true, force: true });
}

if (failures) {
  console.log(`\nsite-check-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nsite-check-test: OK - ${CASES.length} cases, a landing carrying a second version cannot pass`);
