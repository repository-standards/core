# Open questions - decided, provisionally

Every entry here is a call the owner made **on judgment, at the simplicity-vs-
universality boundary** - good enough to ship, honestly held, and **actively open to a
better answer**. This is not indecision: each has a decision in force (linked). It is
an invitation: if you can argue a better option, open an issue or PR referencing the
entry. A winning challenge lands as a superseding record or rule change, and a
resolved entry is deleted - the resolution lives in the record that settled it.

How this differs from the neighbors: an **ADR** records a fork taken; an **idea** is a
feature that may never ship; an open question is a **standing "I chose X, convince me
of Y"**. Records stay authoritative until superseded - this file just marks where the
owner himself is still looking.

## Structure & naming

**Folder self-description = `README.md` per folder.**
*Decided:* the three-section README convention ([taxonomy](../standard/docs/taxonomy.md)); `catalog.md`
rejected as the describer name. *Why:* GitHub renders README.md right where the reader
lands - zero clicks; and the description lives inside what it describes, so same-PR
coupling keeps it honest. *Doubt (owner's words: chosen for lack of better):* READMEs
may bloat; the what/why/how mix in one file may serve neither humans nor agents
perfectly. *A better answer would:* keep zero-click rendering and colocation while
separating audience concerns - without introducing a second file that can drift.

**`checklist.md` for the decisions-to-make list.**
*Decided:* `decision-records/checklist.md` (was `catalog.md` - the library sense of
"catalog" belongs to the record indexes). *Doubt:* "checklist" undersells that each row
carries a paved-road default; `forks.md`, `decide.md` were alternatives. *Better:* a
name that says "choices you must consciously make, defaults included" in one word.

**One tree at real-repo paths (ADR-014).**
*Decided:* a single authored `standard/` tree, shipped as-is at the paths a real repo
uses - no source/dist split, no build step. *Doubt:* template shells and hand-authored
docs now mix in one tree, distinguished only by the manifest's `adapt` field; a reader
browsing the tree cannot tell "fill this in" from "read this as-is" without it.
*Better:* evidence from the first real adoption that the mix confuses nobody.

**Twenty rules (R1-R20).**
*Decided:* the whole normative core is one page - twenty numbered MUST/SHOULD rules in
[`SPEC.md`](../standard/SPEC.md); the manifest cites them. *Why:* every standard that
won stays this small - semver has 11 rules, Conventional Commits 16. *Doubt:* twenty
sits at the top of that range, several rules bundle more than one MUST, and the
judgment-tier rules cannot be script-checked. *Better:* the first adoptions showing
which rules never bite - those are candidates to merge, or to demote to guidance.

## The engine and the skills

**Upstream improvements are cherry-picked by hand (ADR-015).**
*Decided:* the five engine prompts are extracted as the standard's own skills; there is
no byte-diffability with github/spec-kit, and sync means reading upstream's prompt
changes at release time. *Why:* the vendored area cost a third of the repo's markdown
for a surface the loop half-used. *Doubt:* upstream ships roughly ten releases in eight
days; without a mechanical diff, the five prompts could quietly fall behind the state
of the art. *Better:* a few release cycles proving the cherry-pick check stays cheap -
or evidence that it does not, which reopens vendoring with better tooling.

**Eleven lifecycle skills ship into every adopted repo.**
*Decided:* one family - the five engine steps plus impact/update/reconcile, backlog
capture, pre-pr-review and update-to-version; each skill's name and description ride in
the agent's context every turn. *Doubt:* respected skill collections treat eight to ten
committed skills as the ceiling, and the five engine steps might collapse into fewer
without losing the loop. *Better:* field evidence on trigger reliability and context
cost from real adopted repos - or a merge that keeps every verb reachable with fewer
slots.

**The repo specs its own tooling (four capability specs).**
*Decided:* `specs/` carries tree-guard, verify-engine, web-surface and spec-engine -
the buildable method dogfooded on the repo's own scripts. *Doubt:* specs for scripts of
a few hundred readable lines risk becoming documentation theatre. *Better:* the first
tooling change that lands spec-first and catches a real contradiction - or proves the
specs dead weight, which retires them as an honest negative result in the case studies.

## Lifecycle & tracking

**Work history lives in the tracker + git, not in repo files.**
*Decided:* ADR-010 - repo holds intents and living truth; tracker holds execution
state and history; plan/tasks are deleted at close. *Why:* dead scaffolding is noise
agents keep reading; git already is a ledger. *Doubt (the owner went back and forth):*
this kills "who did what when" visibility inside the repo; regulated shops may need
in-repo history. *Better:* a cheap archive overlay that preserves auditability without
teaching agents to read debris - if it can stay optional and out of context windows.

**GitHub Issues as the default tracker.**
*Decided:* ADR-010 - free and unlimited wins for the default; Jira/Linear as adapters.
*Doubt:* GH Issues is the weakest PO experience of the three; Linear's free cap (250
active issues) may bite mid-project; the bridge convention is field-proven against
Jira only. *Better:* evidence from a second bridge implementation, or a default that
serves POs better at zero cost.

**Spec `Status` lives in front-matter (in-refinement -> ready-to-develop -> ...).**
*Decided:* the clarify gate flips it mechanically; the PO reads the pipeline from
specs. *Doubt:* once a tracker mirrors the work, status exists in two places - the
mirror is one-way by design, but humans will read both and one will lag. *Better:* one
rendered view that makes the lag invisible, or a convention for which surface answers
"what's the status?" per audience.

**Ideas are slugs, not numbers.**
*Decided:* `docs/ideas/<slug>.md` - numbers are for records, and an idea must not look
decided. *Doubt:* referencing ideas in conversation ("the marketplace idea") is
wordier than "IDEA-7", and renames break links. *Better:* stable reference without the
false authority of a record id.

## Product shape

**One repo, two profiles (core / scale) - no light fork.**
*Decided:* ADR-011 - `profile` per manifest entry, views rendered, never a second
repo. *Doubt:* two profiles may be too coarse (a regulated `audit` third looms), and
the discipline "profile column, not parallel chapters" is untested at scale. *Better:*
proof from a real solo adoption that core alone feels light, before 1.0 hard-commits
the split.

**Personas stay a hard gate even solo (one persona minimum).**
*Decided:* in the profiles split, the gate is core, the full roster is scale. *Doubt:*
for a one-person tool the ceremony may still exceed the value - and for repos with no
product surface at all (an internal service, a library) a persona gate may deserve a
separate product profile rather than core. *Better:* a solo case
study showing the one-persona gate caught (or never caught) a real mistake.

**The docs funnel: one source, two surfaces.**
*Decided:* the human docs site renders from the same md agents read; no separately
authored documentation, ever. *Doubt:* folder READMEs written for in-place reading may
not sequence into a nextjs.org/docs-style learning path without glue. *Better:* an IA
that reuses the files verbatim and still teaches in order - or honest evidence that a
thin authored overlay is unavoidable.

**Case-study anonymization at "kind of product" granularity.**
*Decided:* describe the situation, never the company/repo. *Doubt:* the line between
"useful context" and "identifiable" is judgment per case, unwritten. *Better:* a
two-rule test a contributor can apply without asking.

## Stack picks (Layer 2)

**Better Auth as the product-auth default.**
*Decided:* DECISIONS #10 - the 2026 community default (and it now maintains Auth.js);
`openid-client` for enterprise SSO is field-proven, Better Auth here is not yet.
*Better:* the boot-verified starter now runs it - the open question is field evidence
beyond one boot. Evidence over consensus.

**CSS Modules + SCSS over Tailwind.**
*Decided:* DECISIONS #10 - matches the evidence repos; Tailwind is the recorded escape
hatch. *Doubt:* a large slice of the 2026 ecosystem defaults to Tailwind; this pick is
closest to taste of anything in Layer 2. *Better:* a criterion that makes the choice
situational (team, design-system maturity) instead of one paved road.

## Meta

**This file's own shape.**
*Decided:* one flat file, entries grouped by area, name `open-questions.md` (the owner
floated "future of the standards" and "for contributors"; this name won because it
names the content, not the audience). *Doubt:* it may grow unwieldy exactly like the
things it questions. *Better:* if it outgrows one file, the folder-README convention
applies to it too - but that day proves the convention, so it is a good problem.
