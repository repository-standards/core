#!/usr/bin/env node
// elicitation-points-check - every declared elicitation point has a real call site.
//
// Layer A of the test pyramid: fully deterministic, runs on every PR. It cannot tell whether
// a question is good, only whether one exists at all - which is the failure we actually had.
// standard/elicitation/points.json declared the rule; onboard.md already stated the same rule
// in prose and a full adoption ignored it. Prose is not a call site.
//
// A point is satisfied when its owning skill both invokes AskUserQuestion and carries the
// point's id in a question header as [id]. The id is what lets the replay layer assert which
// points were reached rather than counting questions, and count is the metric that hid this
// defect for months.
//
// Usage: node tools/elicitation-points-check.mjs [--json]
// Exit: 0 all points wired | 1 any point declared with no call site
// Zone 1 tooling - never shipped.

import { readFileSync, existsSync, readdirSync } from "node:fs";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

// Both overridable so the test can point the checker at fixtures. A checker with no way to
// be run against a known-bad tree is one that can only be trusted to say yes.
const POINTS = arg("--points", "standard/.claude/elicitation/points.json");
// Skills live in two roots and the difference is not cosmetic: the shipped ones under
// standard/ are copied into every adopting repository, while the adoption router itself stays
// here. Resolving only one root made twelve points report "no such skill" when the real answer
// was "found it, nothing in it asks" - a check failing for the wrong reason, which is the exact
// class of defect this tool exists to find.
const SKILL_ROOTS = process.argv.includes("--skills") ? [arg("--skills")] : ["standard/.claude/skills", "skills"];
const AS_JSON = process.argv.includes("--json");

const declared = JSON.parse(readFileSync(POINTS, "utf8"));

// A point names its skill - or skills - and optionally the file, or files, within them that ask
// it. With no file named, any file in the skill directory may carry the call site. More than one
// is normal, and it is where drift lives: the same question reaches a greenfield repo and a
// brownfield one down different paths, and one spec question is asked by the skill that writes
// Requirements as well as by the one that clarifies them. Every declared site must ask, and every
// one of them must lead with the same answer - a point wired in one skill and forgotten in the
// other is the shape of the defect the field run found.
function callSites(point) {
  const skills = Array.isArray(point.skill) ? point.skill : [point.skill];
  return skills.map((skill) => {
    const dir = SKILL_ROOTS.map((r) => `${r}/${skill}`).find((d) => existsSync(d));
    if (!dir) return { skill, dir: null, files: [], exact: false };
    if (point.file) {
      const named = (Array.isArray(point.file) ? point.file : [point.file]).map((f) => `${dir}/${f}`);
      // A named file that is not there is a broken declaration, not a call site to skip. It used
      // to be filtered out silently, which let a point pass on the strength of the sibling file
      // it also names.
      return { skill, dir, files: named, exact: true };
    }
    return {
      skill,
      dir,
      files: readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => `${dir}/${e.name}`),
      exact: false,
    };
  });
}

// The recommended answer is declared, not left to the agent. It has to be, because an agent
// choosing for itself chooses the cautious option: on stayget four of five recommendations
// pointed at the least convergent answer, and "keep yours and map" was recommended for the
// repository layout - an adoption that recommends not adopting.
//
// What can be checked here is the skill's own option order against the declaration. What
// cannot is the question as it reaches the user: it is asked in whatever language the user
// writes in, and no string held here would match it. Better a check that covers the text we
// author than one that quietly passes because it never matched anything.
function recommendationDrift(point, bodies) {
  if (!("recommended" in point)) {
    return "no `recommended` key - every point states which answer leads, or states null for a question with no such axis (consent)";
  }
  if (point.recommended === null) return null;
  // Scoped to the point's own section, never the file's first list: nine points share
  // intake.md, so a file-wide search reads every one of them against the topmost question.
  // The anchor is the heading that opens the block, not the first mention of the id anywhere -
  // prose cites these ids legitimately ("see `[adopt.language]`, below"), and anchoring on a
  // citation slices from the wrong place and reports a disagreement that is not there.
  const tag = `[${point.id}]`;
  const heading = (body) => body.split("\n").findIndex((l) => l.startsWith("#") && l.includes(tag));
  const mentions = bodies.filter((b) => b.includes(tag));
  // A file that opens a block for this point is the call site; a file that merely names it is
  // not, and must not contribute an option list. Only when no file has the heading at all does
  // the slice fall back to the mention, which is the older skill layout.
  const withHeading = mentions.filter((b) => heading(b) !== -1);
  // Every call site, not the first one found. A point asked on two paths - greenfield and
  // brownfield - is two option lists, and the one nobody checked is the one that drifts: the
  // first field run recommended "your conventions win" on a path whose question no file
  // declared, while the declared greenfield copy led with the standard's defaults.
  const blocks = withHeading.map((b) => {
    const lines = b.split("\n");
    const start = heading(b);
    const depth = lines[start].match(/^#+/)[0].length;
    let end = start + 1;
    while (end < lines.length && !(lines[end].startsWith("#") && lines[end].match(/^#+/)[0].length <= depth)) end++;
    return lines.slice(start, end);
  });
  const scoped = blocks.length ? blocks : [mentions.flatMap((b) => b.slice(b.indexOf(tag)).split("\n"))];
  const lines = scoped.map((b) => b.find((l) => l.includes("Options, in order:"))).filter(Boolean);
  if (!lines.length) return `declares recommended "${point.recommended}" but the skill lists no "Options, in order:" line to lead with it`;
  for (const line of lines) {
    const first = line.split("Options, in order:")[1].split(" / ")[0];
    if (!first.includes(point.recommended)) {
      return `declares recommended "${point.recommended}", but the skill offers "${first.trim()}" first${lines.length > 1 ? ` at one of its ${lines.length} call sites` : ""} - the recommendation is whichever one is spoken first, so these cannot disagree`;
    }
  }
  return null;
}

// One file has to carry both the call and the id. Points that name no file would otherwise read
// as wired when a skill's SKILL.md mentions the id in prose while some other page asks about
// something else entirely - which is the shape of the original defect.
const asks = (body, id) => body.includes("AskUserQuestion") && body.includes(`[${id}]`);

const results = declared.points.map((point) => {
  const sites = callSites(point);
  const bodies = [];
  for (const site of sites) {
    if (!site.dir) return { id: point.id, ok: false, why: `no skill directory "${site.skill}"` };
    const present = site.files.filter((f) => existsSync(f));
    if (site.exact) {
      const gone = site.files.filter((f) => !existsSync(f));
      if (gone.length) return { id: point.id, ok: false, why: `declares ${gone.join(", ")}, which does not exist` };
    }
    if (!present.length) return { id: point.id, ok: false, why: `no file for skill "${site.skill}"` };
    const read = present.map((f) => [f, readFileSync(f, "utf8")]);
    bodies.push(...read.map(([, b]) => b));
    // Named files are each a call site in their own right; an unnamed directory needs one file
    // in it that asks. What the diagnosis reads is what actually failed, not the whole site -
    // a site where one named file asks and the other does not should not be reported as a
    // skill that never calls the tool.
    const failing = site.exact
      ? read.filter(([, b]) => !asks(b, point.id))
      : read.some(([, b]) => asks(b, point.id)) ? [] : read;
    if (failing.length) {
      const where = site.exact ? failing.map(([f]) => f).join(", ") : site.dir;
      const anyCall = failing.some(([, b]) => b.includes("AskUserQuestion"));
      const anyTag = failing.some(([, b]) => b.includes(`[${point.id}]`));
      if (!anyCall && !anyTag) return { id: point.id, ok: false, why: `no AskUserQuestion and no point id in ${where}` };
      if (!anyCall) return { id: point.id, ok: false, why: `point id present but nothing calls AskUserQuestion in ${where}` };
      return { id: point.id, ok: false, why: `AskUserQuestion is called, but nothing pairs it with a [${point.id}] header in ${where}` };
    }
  }
  const bad = recommendationDrift(point, bodies);
  return bad ? { id: point.id, ok: false, why: bad } : { id: point.id, ok: true };
});

const missing = results.filter((r) => !r.ok);
const required = new Set(declared.points.filter((p) => p.required).map((p) => p.id));
const missingRequired = missing.filter((m) => required.has(m.id));

// The baseline is what makes this a gate today rather than an aspiration. Wiring every point is
// weeks of work; waiting for zero before switching the check on would leave exactly the gap
// that produced this situation - a rule everybody agreed with and nothing enforced.
const BASELINE = "tools/elicitation-baseline.json";
const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const drift = missing.length - baseline.unwired;

if (AS_JSON) {
  console.log(JSON.stringify({ total: results.length, unwired: missing.length, baseline: baseline.unwired, missing }, null, 2));
} else {
  for (const m of missing) console.log(`  FAIL  ${m.id}: ${m.why}`);
  console.log("");
  if (drift > 0) {
    console.log(`elicitation-points-check: FAIL - ${missing.length}/${results.length} point(s) have no call site, baseline is ${baseline.unwired}`);
    console.log(`  ${drift} point(s) lost their call site. Wire them back, or say in the pull request why the point should not exist.`);
  } else if (drift < 0) {
    console.log(`elicitation-points-check: FAIL - ${missing.length} unwired, but the baseline still says ${baseline.unwired}`);
    console.log(`  Good news, stale record. Set "unwired" to ${missing.length} in ${BASELINE} in this commit.`);
  } else if (missing.length) {
    console.log(`elicitation-points-check: OK at baseline - ${missing.length}/${results.length} still unwired (${missingRequired.length} required), target 0`);
  } else {
    console.log(`elicitation-points-check: OK - all ${results.length} point(s) wired to a question`);
  }
}
process.exit(drift === 0 ? 0 : 1);
