# Open questions - decided, provisionally

Every entry here is a call the owner made **on judgment, at the simplicity-vs-
universality boundary** - good enough to ship, honestly held, and **actively open to a
better answer**. This is not indecision: each has a decision in force (linked). It is
an invitation: if you can argue a better option, open an issue or PR referencing the
entry. A winning challenge lands as a superseding record or rule change, and the entry
flips to *resolved*.

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

**`dist/` as the name of the shipped skeleton. [RESOLVED 2026-07-22 - keep `dist/`]**
*Resolution (owner):* this structure IS the repo's output and `reflect` literally
builds it; `dist/` universally reads "generated - do not edit by hand", which is the
behavior we want. `skeleton/`/`template/` rejected - they invite hand-editing.

**Zone-2 regroup under one directory. [RESOLVED 2026-07-22 - executed as `standard/`]**
*Resolution (owner directive):* the regroup shipped in the same PR as everything else;
`standard/` won over `src/` (self-describing beats generic; inside repository-standards
it reads as "the standard itself lives here", which is exactly true).

**The project name itself (NAME-1). [RESOLVED 2026-07-22 - `repository-standards` stays]**
*Resolution (owner):* the clear category name wins; both matching domains already
owned; no rename churn anywhere. Deploy/npm/listings unblocked.

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
for a one-person tool the ceremony may still exceed the value. *Better:* a solo case
study showing the one-persona gate caught (or never caught) a real mistake.

**The docs funnel: one source, two surfaces (DISCO-4).**
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
*Better:* the STARTER-1 boot-verified starter either confirms it or replaces it -
evidence over consensus.

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
