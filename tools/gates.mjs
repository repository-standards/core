#!/usr/bin/env node
// Runs this repo's whole gate set locally, before a push.
//
// Usage:
//   node tools/gates.mjs                     # run every gate, stop-free, report at the end
//   node tools/gates.mjs --base <branch>     # the branch a PR would target (default: main)
//   node tools/gates.mjs --list              # print the commands without running them
//   node tools/gates.mjs --workflow <path>   # read a different workflow (its test uses this)
//
// The list is NOT written here. It is read out of .github/workflows/checks.yml and each
// step's script is handed to bash exactly as CI hands it - because the only failure this
// tool exists to prevent is a local run that is a subset of the remote one. A hand-kept
// copy of the list would drift the day a gate is added, and it would drift silently, in
// the direction of passing.
//
// `${{ github.base_ref }}` is the one workflow expression these steps use; it is
// substituted with --base so the PR-only branches execute here too. It holds a bare branch
// name on GitHub, not a ref - the steps build `origin/<it>` themselves - so --base takes
// the same. Any other expression is refused rather than guessed at.
//
// Run this AFTER committing. Two of the gates diff against the base branch, and a diff
// reads commits, not the working tree - run with the change still uncommitted and those
// two compare the base against itself and pass on an empty diff. Everything else here
// reads files and does not care.
//
// Zone 1 tooling - never shipped. Dependency-free (Node built-ins only).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const baseIdx = args.indexOf("--base");
const base = baseIdx === -1 ? "main" : args[baseIdx + 1];
const workflowIdx = args.indexOf("--workflow");
const WORKFLOW = workflowIdx === -1 ? ".github/workflows/checks.yml" : args[workflowIdx + 1];

if (baseIdx !== -1 && (!base || base.startsWith("--"))) {
  console.error("gates: --base needs a branch name");
  process.exit(2);
}
if (workflowIdx !== -1 && (!WORKFLOW || WORKFLOW.startsWith("--"))) {
  console.error("gates: --workflow needs a path");
  process.exit(2);
}

// The workflow is plain enough to read line by line, and a dependency for this would be a
// dependency in the one tool whose job is to need nothing. What is parsed is narrow: the
// steps of a job, each step's `name:` and its `run:`, inline or as a block scalar. Anything
// the parser does not recognise raises rather than gets skipped - a silently dropped step
// is exactly the subset this tool exists to stop.
function steps(yaml) {
  const lines = yaml.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length && !/^ {4}steps:\s*$/.test(lines[i])) i++;
  if (i === lines.length) throw new Error(`no "steps:" block found in ${WORKFLOW}`);
  i++;

  let current = null;
  const flush = () => {
    if (current && current.run !== null) out.push(current);
    current = null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    // A line indented less than the step list ends the job's steps.
    if (!/^ {6}/.test(line)) break;

    const item = line.match(/^ {6}- (.*)$/);
    if (item) {
      flush();
      current = { name: null, run: null };
      const inline = item[1];
      if (inline.startsWith("uses:")) continue; // setup actions, nothing to run locally
      const named = inline.match(/^name:\s*(.*)$/);
      if (named) current.name = named[1].trim();
      continue;
    }
    if (current === null) continue;

    const named = line.match(/^ {8}name:\s*(.*)$/);
    if (named) {
      current.name = named[1].trim();
      continue;
    }
    // A step-level `if:` decides whether CI runs the step at all, and this runner has no
    // event to evaluate it against. Running it anyway, or skipping it, both make the local
    // set differ from the remote one silently - so it stops instead.
    if (/^ {8}if:/.test(line)) {
      throw new Error(`step "${current.name ?? "(unnamed step)"}" is conditional (\`if:\`), which this runner cannot evaluate`);
    }
    const run = line.match(/^ {8}run:\s*(.*)$/);
    if (run) {
      if (run[1].trim() === "|") {
        const body = [];
        while (i + 1 < lines.length && (/^ {10}/.test(lines[i + 1]) || lines[i + 1].trim() === "")) {
          body.push(lines[++i].replace(/^ {10}/, ""));
        }
        current.run = body.join("\n").trim();
      } else {
        current.run = run[1].trim();
      }
    }
  }
  flush();

  if (out.length === 0) throw new Error(`parsed no runnable steps out of ${WORKFLOW}`);
  return out;
}

function resolveExpressions(script, stepName) {
  const unknown = [...script.matchAll(/\$\{\{\s*([^}]+?)\s*\}\}/g)]
    .map((m) => m[1])
    .filter((expr) => expr !== "github.base_ref");
  if (unknown.length) {
    throw new Error(
      `step "${stepName}" uses workflow expressions this runner cannot supply: ${[...new Set(unknown)].join(", ")}`,
    );
  }
  return script.replaceAll(/\$\{\{\s*github\.base_ref\s*\}\}/g, base);
}

// A parse failure exits non-zero rather than running what it did manage to read. Running a
// partial list is the one outcome worse than not running at all: it reports OK.
let parsed;
try {
  parsed = steps(readFileSync(resolve(ROOT, WORKFLOW), "utf8")).map((s) => ({
    name: s.name ?? "(unnamed step)",
    script: resolveExpressions(s.run, s.name ?? "(unnamed step)"),
  }));
} catch (err) {
  console.error(`gates: ${err.message}`);
  process.exit(2);
}

if (listOnly) {
  for (const { name, script } of parsed) {
    console.log(`# ${name}`);
    console.log(script);
    console.log("");
  }
  console.log(`gates --list: ${parsed.length} step(s) read from ${WORKFLOW}`);
  process.exit(0);
}

console.log(`gates: ${parsed.length} step(s) from ${WORKFLOW}, diff-gated guards against origin/${base}\n`);

const failed = [];
for (const { name, script } of parsed) {
  try {
    execFileSync("bash", ["-e", "-c", script], { cwd: ROOT, stdio: "pipe" });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed.push({ name, output: `${err.stdout ?? ""}${err.stderr ?? ""}`.trimEnd() });
    console.log(`  FAIL  ${name}`);
  }
}

if (failed.length === 0) {
  console.log(`\ngates: OK - ${parsed.length} step(s), the same set CI runs`);
  process.exit(0);
}

for (const { name, output } of failed) {
  console.log(`\n--- ${name}`);
  console.log(
    output
      .split("\n")
      .slice(-25)
      .map((l) => `    ${l}`)
      .join("\n"),
  );
}
console.log(`\ngates: FAIL - ${failed.length} of ${parsed.length} step(s)`);
process.exit(1);
