#!/usr/bin/env node
// clarify-gate-test - drive the shipped clarify gate over real spec files.
//
// The gate decides whether a spec may reach plan, tasks and the tracker, which makes it
// the one guard whose false PASS costs the most: everything downstream believes the spec
// is settled. It had no test at all, and it has failed open three times - open items
// recorded as a numbered list instead of brackets, markers translated with the rest of a
// spec written in another language, and the template's own `## Open questions` section
// carrying live content the gate never read.
//
// So the cases here are mostly the fail-open direction: a spec that is not ready must not
// pass. The other half matters too and is cheaper to forget - ordinary markdown (links,
// checkboxes, footnotes) must not be mistaken for an open marker, or the gate becomes the
// thing people route around.
//
// Usage: node tools/clarify-gate-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GATE = join(process.cwd(), "standard/scripts/spec/check-spec-clarified.sh");
const TEMPLATE = join(process.cwd(), "standard/specs/capability-spec.template.md");
const SPEC_ENGINE_DIR = join(process.cwd(), "standard/scripts/spec");

// The shipped template's own `## Open questions` section, read rather than restated - a
// copy here would pass while the template it stands for had drifted.
const templateOpenQuestions = () => {
  const body = readFileSync(TEMPLATE, "utf8");
  const at = body.indexOf("## Open questions");
  if (at < 0) throw new Error(`${TEMPLATE} has no '## Open questions' section to test against`);
  return body.slice(at);
};

const CLARIFIED = `## Clarifications

### Session 2026-08-04

- Q: which currency does a refund settle in? -> A: the currency of the capture.
`;

// The shape a spec has when the gate should pass it: the clarify record, and an open
// questions section that says there are none.
const clean = (body = "") => `# Payments

${CLARIFIED}
## Requirements

- The system MUST capture within 7 days.
${body}
## Open questions

None known.
`;

const gate = (file) => {
  const r = spawnSync("bash", [GATE, file], { encoding: "utf8" });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

const run = (body) => {
  const dir = mkdtempSync(join(tmpdir(), "clarify-gate-test-"));
  const file = join(dir, "spec.md");
  writeFileSync(file, body);
  const result = gate(file);
  rmSync(dir, { recursive: true, force: true });
  return result;
};

// fails = the gate must refuse the spec (exit 1). says = a fragment of the reason, so a
// case cannot pass by failing for an unrelated reason.
const CASES = [
  {
    name: "a settled spec passes",
    fails: false,
    says: "PASS",
    body: clean(),
  },
  {
    name: "no Clarifications section fails, and says the heading is not translatable",
    fails: true,
    says: "SYNTAX",
    body: "# Payments\n\n## Requirements\n\n- The system MUST capture.\n\n## Open questions\n\nNone known.\n",
  },
  {
    name: "an open marker of the family fails",
    fails: true,
    says: "open [NEEDS ...] marker",
    body: clean("- [NEEDS DECISION: refund window; owner: business]\n"),
  },
  {
    name: "the family written as a numbered list instead of brackets fails",
    fails: true,
    says: "instead of the required [NEEDS ...] bracket form",
    body: clean("- **CLARIFICATION-1 (owner: business).** Which currency?\n"),
  },

  // The translated-marker false pass: a spec in another language whose author translated
  // the marker family printed PASS with every gap still open.
  {
    name: "a marker translated into Chinese fails instead of passing silently",
    fails: true,
    says: "shaped like an open marker",
    body: clean("- [需要澄清: 退款窗口是几天?]\n"),
  },
  {
    name: "a marker translated into Polish fails",
    fails: true,
    says: "shaped like an open marker",
    body: clean("- [BRAK DECYZJI: model cenowy; wlasciciel: biznes]\n"),
  },
  {
    name: "an invented marker type fails",
    fails: true,
    says: "not one of the four forms",
    body: clean("- [TODO: decide the retry budget]\n"),
  },
  {
    name: "the failure names where the rule is written down",
    fails: true,
    says: "working-language.md",
    body: clean("- [需要决策: 定价; 负责人: 业务]\n"),
  },

  // The other direction: ordinary markdown is not an open marker. A gate that fires on a
  // link is a gate people learn to route around.
  {
    name: "a markdown link is not a marker",
    fails: false,
    says: "PASS",
    body: clean("- See [the pricing ADR](../docs/decision-records/ADR-004-pricing.md).\n"),
  },
  {
    name: "a link whose text is shouty with a colon is not a marker",
    fails: false,
    says: "PASS",
    body: clean("- See [ADR-004: pricing](../docs/decision-records/ADR-004-pricing.md).\n"),
  },
  {
    name: "a link whose text is not ASCII is not a marker",
    fails: false,
    says: "PASS",
    body: clean("- Zobacz [decyzja: cennik](../docs/decision-records/ADR-004-pricing.md).\n"),
  },
  {
    name: "checkboxes, footnotes and reference links are not markers",
    fails: false,
    says: "PASS",
    body: clean("- [ ] not done\n- [x] done\n- a footnote[^1] and a [reference][ref]\n"),
  },
  {
    name: "prose in a language other than English is not a marker",
    fails: false,
    says: "PASS",
    body: clean("- System MUSI przechwycic platnosc w ciagu 7 dni (kwota w groszach).\n"),
  },

  // The template's required `## Open questions` section, which the gate did not read.
  // Every shape below was reproduced passing with the questions still live.
  {
    name: "no Open questions section fails",
    fails: true,
    says: "no '## Open questions' section",
    body: `# Payments\n\n${CLARIFIED}\n## Requirements\n\n- The system MUST capture.\n`,
  },
  {
    name: "a translated Open questions heading fails as a missing one",
    fails: true,
    says: "no '## Open questions' section",
    body: `# Payments\n\n${CLARIFIED}\n## Requirements\n\n- MUSI przechwycic.\n\n## Pytania otwarte\n\nBrak.\n`,
  },
  {
    name: "a question in prose under Open questions fails",
    fails: true,
    says: "live line(s) under '## Open questions'",
    body: clean().replace("None known.", "Do we refund the fee on a partial refund?"),
  },
  {
    name: "a question phrased as a statement fails",
    fails: true,
    says: "live line(s) under '## Open questions'",
    body: clean().replace("None known.", "The refund window is still undecided."),
  },
  {
    name: "a table of open items fails",
    fails: true,
    says: "live line(s) under '## Open questions'",
    body: clean().replace("None known.", "| Gap | Owner |\n|---|---|\n| refund window | business |"),
  },
  {
    name: "an item resolved above but still listed below fails",
    fails: true,
    says: "live line(s) under '## Open questions'",
    body: clean().replace("None known.", "None known.\n\nRefund window: answered in Clarifications, kept here for context."),
  },
  {
    name: "the failure lists the live lines with their line numbers",
    fails: true,
    says: "Do we refund the fee",
    body: clean().replace("None known.", "Do we refund the fee on a partial refund?"),
  },
  {
    name: "'None.' and other plain forms of nothing-open pass",
    fails: false,
    says: "PASS",
    body: clean().replace("None known.", "None."),
  },
  {
    name: "guidance inside an HTML comment is not live content",
    fails: false,
    says: "PASS",
    body: clean().replace("None known.", "<!-- write real gaps here, or leave the line below -->\nNone known."),
  },
  {
    name: "a multi-line HTML comment is not live content",
    fails: false,
    says: "PASS",
    body: clean().replace("None known.", "<!-- an example:\n\n| Gap | Owner |\n|---|---|\n| refund window | business |\n-->\nNone known."),
  },
  {
    // The shipped template's own section, verbatim - the placeholder must not trip the
    // rule the placeholder teaches.
    name: "the shipped template's Open questions section does not trip the rule",
    fails: false,
    says: "PASS",
    body: `# Payments\n\n${CLARIFIED}\n## Requirements\n\n- The system MUST capture.\n\n${templateOpenQuestions()}`,
  },

  // A gate that cannot read its spec must not report on it.
  { name: "a spec file that does not exist fails", fails: true, says: "not found", absent: true },
];

let failures = 0;
for (const c of CASES) {
  const { code, out } = c.absent ? gate(join(tmpdir(), "clarify-gate-test-absent", "spec.md")) : run(c.body);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (c.says && !out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

// --- the status that depends on the gate ---------------------------------------------
// `**Status:** ready-to-develop` is what the rest of the method reads as "settled", and
// nothing read or wrote it - so it sat on specs whose gate fails, with every other guard
// green. spec-structure re-runs the real gate on any spec claiming it, which is the half
// that can be mechanical; these cases assert it in both directions, including the one that
// matters most for adoption - an honest draft must not be a violation.
const STRUCTURE = join(process.cwd(), "standard/scripts/spec-structure.mjs");

const ROSTER = "# Personas\n\n## The roster\n\n| Persona | Cares about |\n|---|---|\n| `Owner-operator Olga` | money arriving |\n";

const structure = (specBody, personas = ROSTER, extraFiles = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "spec-status-test-"));
  mkdirSync(join(dir, "specs", "payments"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  // A roster, so the persona check has something to hold and these cases are only about
  // the status. The spec below names one.
  writeFileSync(join(dir, "docs", "personas.md"), personas);
  writeFileSync(join(dir, "specs", "payments", "spec.md"), specBody);
  for (const [rel, body] of Object.entries(extraFiles)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  const r = spawnSync("node", [STRUCTURE, "--block"], { cwd: dir, encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

const withStatus = (status, body) => `# Payments\n\n**Serves:** \`Owner-operator Olga\`\n**Status:** ${status}\n\n${body}`;

const STATUS_CASES = [
  {
    name: "a spec claiming live while the gate fails is reported",
    fails: true,
    says: "claiming a status the clarify gate does not grant",
    body: withStatus("live", "## Requirements\n\n- The system MUST capture.\n"),
  },
  {
    name: "a spec claiming ready-to-develop with a live open question is reported",
    fails: true,
    says: "says `ready-to-develop`",
    body: withStatus("ready-to-develop", `${CLARIFIED}\n## Open questions\n\nThe refund window is undecided.\n`),
  },
  {
    name: "an honest in-refinement draft with open questions is not a violation",
    fails: false,
    says: "OK",
    body: withStatus("in-refinement", "## Requirements\n\n- [NEEDS DECISION: refund window; owner: business]\n"),
  },
  {
    name: "a spec that earns its status passes",
    fails: false,
    says: "OK",
    body: withStatus("live", `${CLARIFIED}\n## Requirements\n\n- The system MUST capture.\n\n## Open questions\n\nNone known.\n`),
  },
  {
    name: "the template's unfilled list of statuses is not a claim",
    fails: false,
    says: "OK",
    body: withStatus("in-refinement | ready-to-develop | in-development | live | retired", "## Requirements\n\n- The system MUST capture.\n"),
  },
  {
    // The same silent-disable shape, one check over: scoping the roster scan to a heading
    // meant a translated heading fell back to reading the whole file, worked example
    // included, and widened the roster instead of narrowing it.
    name: "a translated roster heading fails instead of widening the roster",
    fails: true,
    says: "no '## The roster' section",
    personas: "# Persony\n\n## Zespol\n\n| Persona | Zalezy jej na |\n|---|---|\n| `Owner-operator Olga` | pieniadze |\n",
    body: withStatus("in-refinement", "## Requirements\n\n- The system MUST capture.\n"),
  },
];

// --- the tier that has to be paid for -------------------------------------------------
// `**Spec tier:** buildable` is the other field the method reads as a promise, and the
// sections that make it true were required by the template alone - so a buildable spec
// shipped with no contracts at all and the sections were retrofitted by hand later.
//
// Most of these cases are the shapes that must KEEP passing, because a guard that fires on
// them is a guard somebody deletes: the behavioral escape hatch (R9), a section that
// honestly says there is nothing to state, a section whose body opens with a sub-heading,
// a heading carrying a parenthetical, and a named sub-spec that extends the capability's
// spec rather than repeating it.
const CONTRACTS = `## Data contracts

\`payments\` owns the \`payment\` table: \`id\` (uuid), \`amount_minor\` (integer, cents).

## Interface contracts

\`POST /payments\` - captures. 201 on success, 409 on a duplicate idempotency key.

## Acceptance criteria

- **capture.** GIVEN an authorized card WHEN capture runs THEN the payment is 201.
`;

const withTier = (tier, body) =>
  `# Payments\n\n${tier === null ? "" : `**Spec tier:** ${tier}\n`}**Serves:** \`Owner-operator Olga\`\n**Status:** in-refinement\n\n${body}`;

const TIER_CASES = [
  {
    name: "a buildable spec with no contracts at all is reported, naming every missing section",
    fails: true,
    says: "missing: ## Data contracts, ## Interface contracts, ## Acceptance criteria",
    body: withTier("buildable", "## Purpose\n\nTake money.\n"),
  },
  {
    name: "the reported spec is told how to declare the behavioral tier instead",
    fails: true,
    says: "declare `**Spec tier:** behavioral` and justify it",
    body: withTier("buildable", "## Purpose\n\nTake money.\n"),
  },
  {
    name: "a buildable spec carrying its contracts passes",
    fails: false,
    says: "OK",
    body: withTier("buildable", CONTRACTS),
  },
  {
    name: "a section that honestly says there is nothing to state passes - the heading stays, the claim is explicit",
    fails: false,
    says: "OK",
    body: withTier("buildable", CONTRACTS.replace(/`payments` owns.*$/m, "None - this capability persists nothing; it forwards to the processor.")),
  },
  {
    name: "a heading with an empty body is not a section",
    fails: true,
    says: "missing: ## Data contracts",
    body: withTier("buildable", CONTRACTS.replace(/`payments` owns.*$/m, "")),
  },
  {
    name: "a section carrying nothing but the template's own comment is not a section",
    fails: true,
    says: "missing: ## Data contracts",
    body: withTier("buildable", CONTRACTS.replace(/`payments` owns.*$/m, "<!-- buildable: REQUIRED. Verbatim. -->")),
  },
  {
    name: "a section whose body opens with a sub-heading is filled",
    fails: false,
    says: "OK",
    body: withTier("buildable", CONTRACTS.replace(/`payments` owns.*$/m, "### Tables\n\n`payment`: `id` (uuid), `amount_minor` (integer).")),
  },
  {
    name: "a heading carrying a parenthetical still satisfies the requirement",
    fails: false,
    says: "OK",
    body: withTier("buildable", CONTRACTS.replace("## Acceptance criteria", "## Acceptance criteria (capture)")),
  },
  {
    name: "the behavioral tier is still an escape hatch, not a violation (R9)",
    fails: false,
    says: "OK",
    body: withTier("behavioral", "## Purpose\n\nTake money. Buildable is not available: the processor owns the contract.\n"),
  },
  {
    name: "a spec that declares no tier is warned about, not failed - a guard that blocks every undeclared spec gets switched off",
    fails: false,
    says: "declare no `**Spec tier:**`",
    body: withTier(null, "## Purpose\n\nTake money.\n"),
  },
  {
    name: "the template's unfilled list of tiers is not a declaration",
    fails: false,
    says: "declare no `**Spec tier:**`",
    body: withTier("buildable | behavioral", "## Purpose\n\nTake money.\n"),
  },
  {
    name: "a named sub-spec is not held to the tier its capability's spec declares",
    fails: false,
    says: "OK",
    body: withTier("buildable", CONTRACTS),
    extraFiles: { "specs/payments/refunds.md": "# Refunds\n\n**Serves:** `Owner-operator Olga`\n\n## Purpose\n\nThe refund path of payments.\n" },
  },
  {
    name: "a sub-spec that claims the buildable tier itself is held to it",
    fails: true,
    says: "specs/payments/refunds.md",
    body: withTier("buildable", CONTRACTS),
    extraFiles: { "specs/payments/refunds.md": "# Refunds\n\n**Spec tier:** buildable\n**Serves:** `Owner-operator Olga`\n\n## Purpose\n\nThe refund path.\n" },
  },
];

for (const c of TIER_CASES) {
  const { code, out } = structure(c.body, ROSTER, c.extraFiles);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

for (const c of STATUS_CASES) {
  const { code, out } = structure(c.body, c.personas);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

// --- the bridge precondition -----------------------------------------------------------
// The gate is only as good as what calls it. It was documented as a "MANDATORY PRECHECK"
// in /spec-plan and /spec-tasks's own prompts, but neither setup-plan.sh nor
// setup-tasks.sh called it - a prose instruction an agent could skip by never invoking it,
// exactly the failure mode this whole gate exists to close one layer up. These cases run
// the real scripts, from a copy of the shipped engine, against a spec that fails the gate
// and one that passes it.
const runScript = (script, specBody, { planExists = false } = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "bridge-precondition-test-"));
  cpSync(SPEC_ENGINE_DIR, join(dir, "scripts/spec"), { recursive: true });
  mkdirSync(join(dir, "specs/payments"), { recursive: true });
  writeFileSync(join(dir, "specs/payments/spec.md"), specBody);
  if (planExists) writeFileSync(join(dir, "specs/payments/plan.md"), "# existing plan\n");
  const env = { ...process.env, SPECIFY_FEATURE_DIRECTORY: "specs/payments" };
  const r = spawnSync("bash", [join(dir, "scripts/spec", script), "--json"], { cwd: dir, env, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  rmSync(dir, { recursive: true, force: true });
  return { code: r.status ?? 1, out };
};

const UNCLARIFIED = "# Payments\n\n## Requirements\n\n- The system MUST capture.\n\n## Open questions\n\nThe refund window is undecided.\n";
const CLARIFIED_SPEC = `# Payments\n\n${CLARIFIED}\n## Requirements\n\n- The system MUST capture within 7 days.\n\n## Open questions\n\nNone known.\n`;

const BRIDGE_CASES = [
  {
    name: "setup-plan.sh refuses an unclarified spec",
    script: "setup-plan.sh",
    body: UNCLARIFIED,
    fails: true,
    says: "no '## Clarifications' section",
  },
  {
    name: "setup-plan.sh proceeds on a clarified spec",
    script: "setup-plan.sh",
    body: CLARIFIED_SPEC,
    fails: false,
    says: "FEATURE_SPEC",
  },
  {
    name: "setup-plan.sh re-checks the gate even when plan.md already exists",
    script: "setup-plan.sh",
    body: UNCLARIFIED,
    fails: true,
    says: "no '## Clarifications' section",
    planExists: true,
  },
  {
    name: "setup-tasks.sh refuses an unclarified spec",
    script: "setup-tasks.sh",
    body: UNCLARIFIED,
    fails: true,
    says: "no '## Clarifications' section",
    planExists: true,
  },
  {
    name: "setup-tasks.sh proceeds on a clarified spec",
    script: "setup-tasks.sh",
    body: CLARIFIED_SPEC,
    fails: false,
    says: "FEATURE_DIR",
    planExists: true,
  },
];

for (const c of BRIDGE_CASES) {
  const { code, out } = runScript(c.script, c.body, { planExists: c.planExists });
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
}

const total = CASES.length + TIER_CASES.length + STATUS_CASES.length + BRIDGE_CASES.length;
if (failures) {
  console.log(`\nclarify-gate-test: FAIL - ${failures} of ${total} cases`);
  process.exit(1);
}
console.log(`\nclarify-gate-test: OK - ${total} cases, a spec that is not settled cannot reach plan or tasks, claim it did, or claim a depth it does not carry`);
