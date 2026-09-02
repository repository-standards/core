#!/usr/bin/env node
// site-check-test - drive the landing gate over fixture sites.
//
// The rule under test is that the landing states NO version. It used to have to advertise
// the current one, and the case this file was built around is what that permitted: a page
// stating v0.8.13 in the header while four other places on it still read v0.8.12, with the
// gate green, because "the right answer appears" is true of a page showing two answers.
// The pill now reads the newest tag at runtime, so there is no copy to keep true - and the
// cases below assert that even the correct version fails, which is the only form of the
// rule that cannot be satisfied by a page carrying two.
//
// The other half is the false positive that makes any version scan unusable if it is not
// handled: SVG path data is a stream of coordinates, and the GitHub mark in the landing's
// own header reads as a dozen version numbers to any regex. The fixtures below carry both,
// so neither half can regress alone.
//
// Usage: node tools/site-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHECK = join(process.cwd(), "tools/site-check.mjs");

// The version the fixture site states in the cases that must fail. Deliberately not this
// repo's own: a test agreeing with the checkout it runs in would prove nothing.
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
    // The mark's path data holds three version-shaped triples, so a page carrying no
    // version of its own still has to survive the scan. The masking is what this proves.
    name: "a landing stating no version passes - path data and all",
    fails: false,
    says: "states no version",
    files: { "site/index.html": landing({ pill: "", prose: "", footer: "", script: "" }) },
  },
  {
    // The rule is none, not "the right one". A version on the page is a second copy of a
    // number that already lives in VERSION and in the newest tag, and the copy is the one
    // that goes stale while looking authoritative.
    name: "even the current version fails - the page must state none",
    fails: true,
    says: [`states version ${VERSION}`, "must state none"],
    files: { "site/index.html": landing({}) },
  },
  {
    // Tag balance skips script bodies, so a check reading markup only would miss this.
    // Two of the four occurrences in DOC-12 were exactly here.
    name: "a version inside the hero script fails too",
    fails: true,
    says: "states version 1.9.9",
    files: { "site/index.html": landing({ pill: "", prose: "", footer: "", script: "1.9.9" }) },
  },
  {
    // The mask must not be an opening a version can hide behind. This fixture puts a
    // self-closing <svg/> before the footer version and a real mark after it: a mask that
    // paired the self-closing tag with the NEXT </svg> blanks out everything in between,
    // the version included, and reports the page clean. Verified load-bearing - swap the
    // opener back to a plain <svg and this case is the one that goes red.
    name: "a self-closing mark does not open a hiding place for a version",
    fails: true,
    says: ["states version 2.3.9", "site-check: FAIL - 1 problem(s)"],
    files: { "site/index.html": landing({ deco: true, pill: "", prose: "", script: "", footer: "2.3.9" }) },
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
console.log(`\nsite-check-test: OK - ${CASES.length} cases, a landing carrying any version cannot pass`);
