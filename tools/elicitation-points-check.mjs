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

const POINTS = "standard/.claude/elicitation/points.json";
// Skills live in two roots and the difference is not cosmetic: the shipped ones under
// standard/ are copied into every adopting repository, while the adoption router itself stays
// here. Resolving only one root made twelve points report "no such skill" when the real answer
// was "found it, nothing in it asks" - a check failing for the wrong reason, which is the exact
// class of defect this tool exists to find.
const SKILL_ROOTS = ["standard/.claude/skills", "skills"];
const AS_JSON = process.argv.includes("--json");

const declared = JSON.parse(readFileSync(POINTS, "utf8"));

// A point names its skill, and optionally one file within it. With no file named, any file in
// the skill directory may carry the call site.
function skillFiles(point) {
  const dir = SKILL_ROOTS.map((r) => `${r}/${point.skill}`).find((d) => existsSync(d));
  if (!dir) return [];
  if (point.file) {
    const named = `${dir}/${point.file}`;
    return existsSync(named) ? [named] : [];
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => `${dir}/${e.name}`);
}

const results = declared.points.map((point) => {
  const files = skillFiles(point);
  if (!files.length) {
    return { id: point.id, ok: false, why: `no file for skill "${point.skill}"${point.file ? `/${point.file}` : ""}` };
  }
  const bodies = files.map((f) => readFileSync(f, "utf8"));
  // Both in one file, not both somewhere in the directory. Six points name no file, so a
  // skill whose SKILL.md mentions the id in prose while some other page asks about something
  // else entirely would otherwise read as wired - which is the shape of the original defect.
  const wired = bodies.some((b) => b.includes("AskUserQuestion") && b.includes(`[${point.id}]`));
  if (wired) return { id: point.id, ok: true };
  const invokes = bodies.some((b) => b.includes("AskUserQuestion"));
  const tagged = bodies.some((b) => b.includes(`[${point.id}]`));
  if (!invokes && !tagged) return { id: point.id, ok: false, why: "no AskUserQuestion and no point id anywhere in the skill" };
  if (!invokes) return { id: point.id, ok: false, why: "point id present but nothing calls AskUserQuestion" };
  return { id: point.id, ok: false, why: `AskUserQuestion is called, but no single file pairs it with a [${point.id}] header` };
});

const missing = results.filter((r) => !r.ok);
const required = new Set(declared.points.filter((p) => p.required).map((p) => p.id));
const missingRequired = missing.filter((m) => required.has(m.id));

// The baseline is what makes this a gate today rather than an aspiration. Wiring 18 points is
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
