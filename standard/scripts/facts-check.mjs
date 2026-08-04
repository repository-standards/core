#!/usr/bin/env node
// facts-check - a fact lives in one place; every other place must agree with it.
//
// The code<->spec coupling map made a declared edge out of "these move together".
// This is the same idea one level down, for facts restated in prose: a count, a
// path, a command. They drift silently because nothing connects the sentence to
// what it describes - the standard shipped "twenty rules" while SPEC.md had 21,
// and "11 lifecycle skills" while the tree held 12.
//
// Two mechanisms, different jobs. tree-check BANS a fact from surfaces where it
// adds nothing (say "the numbered rules"). This one covers facts that legitimately
// appear in several places: state them once at home, declare every restatement,
// and fail when they disagree.
//
// A claim whose pattern matches nothing is a failure too. A surface reworded past
// its own pattern stops being covered, and silence would look identical to
// agreement - which is how a check rots into decoration.
//
// Declare facts in docs/facts.json (R4):
//   [{ "id": "...", "what": "...",
//      "home":   { "count": "<glob>" }                                   how many files match
//              | { "countMatches": { "file": "...", "pattern": "..." } }  how many times one file declares it
//              | { "read": "<file>" }                                     the file's whole content
//              | { "match": { "file": "...", "pattern": "...(capture)..." } },
//      "claims": [{ "file": "...", "pattern": "...(capture)..." }] }]
//
// Usage:
//   node scripts/facts-check.mjs [--facts docs/facts.json]   # exit 1 on any failure
//
// No dependencies (Node built-ins only). Place at scripts/facts-check.mjs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { globToRegExp } from "./lib/glob.mjs";

const args = process.argv.slice(2);
const idx = args.indexOf("--facts");
const CONFIG = idx >= 0 ? args[idx + 1] : "docs/facts.json";

if (!existsSync(CONFIG)) {
  console.log(`facts-check: no ${CONFIG} - skipping (declare the facts this repo restates to enable it)`);
  process.exit(0);
}

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};
const ok = (msg) => console.log(`  ok    ${msg}`);

const walk = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".git") continue;
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};

const homeValue = (fact) => {
  const { home } = fact;
  if (home.count) {
    const base = home.count.split("/").slice(0, -1).join("/").split("*")[0].replace(/\/$/, "");
    const re = globToRegExp(home.count);
    return String(walk(base).filter((f) => re.test(f)).length);
  }
  if (home.read) return readFileSync(home.read, "utf8").trim();
  if (home.match) {
    const m = readFileSync(home.match.file, "utf8").match(new RegExp(home.match.pattern));
    if (!m) throw new Error(`the home pattern matches nothing in ${home.match.file}`);
    return m[1];
  }
  // How many times a file declares the thing - rules in a spec, rows in a table. Neither
  // of the forms above can say it: `count` counts files, and `match` captures one
  // occurrence when the number wanted is how many there are. Without it, a count of
  // something declared inside one file has no home and goes back to being hand-written.
  if (home.countMatches) {
    const hits = [...readFileSync(home.countMatches.file, "utf8").matchAll(new RegExp(home.countMatches.pattern, "gm"))].length;
    if (hits === 0) throw new Error(`the home pattern matches nothing in ${home.countMatches.file}`);
    return String(hits);
  }
  throw new Error("home must be one of: count, countMatches, read, match");
};

const facts = JSON.parse(readFileSync(CONFIG, "utf8"));

for (const fact of facts) {
  let value;
  try {
    value = homeValue(fact);
  } catch (e) {
    fail(`${fact.id}: ${e.message}`);
    continue;
  }

  let checked = 0;
  const before = failures;
  for (const claim of fact.claims) {
    if (!existsSync(claim.file)) {
      fail(`${fact.id}: ${claim.file} does not exist`);
      continue;
    }
    // Multiline: a claim anchored with ^ means the start of its line in a document.
    const matches = [...readFileSync(claim.file, "utf8").matchAll(new RegExp(claim.pattern, "gm"))];
    if (matches.length === 0) {
      fail(`${fact.id}: the claim in ${claim.file} matches nothing - the surface was reworded past its pattern, so nothing was covering it`);
      continue;
    }
    for (const m of matches) {
      checked++;
      if (m[1] !== value) {
        fail(`${fact.id}: ${claim.file} says "${m[1]}", the source says "${value}" (${fact.what})`);
      }
    }
  }

  if (failures === before) ok(`${fact.id} = ${value} - ${checked} restatement(s) agree`);
}

if (failures) {
  console.log(`\nfacts-check: FAIL - ${failures} fact(s) restated wrong or no longer covered`);
  process.exit(1);
}
console.log(`\nfacts-check: OK - ${facts.length} fact(s), every restatement agrees with its source`);
