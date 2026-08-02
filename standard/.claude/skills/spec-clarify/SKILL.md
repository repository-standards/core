---
name: spec-clarify
description: Use right after a spec is drafted, or whenever one still has open questions in it. Asks one question at a time, each leading with a recommended answer you can accept by saying yes, and writes every answer into the spec - including a deliberate "decide that later", which is an answer and gets recorded as one. Planning and building refuse to start until this reaches zero open questions.
---

<!-- Vendored from github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE). PATCHED(repository-standards) hunks are marked inline; CHERRY-PICKED hunks name the upstream commit they came from. -->
<!-- PATCHED(repository-standards): ADR-024 - the dossier answers before the user does -->
**Discovery first, the user second.** Before asking the user anything, check `docs/discovery/` for the topic's dossier. Answers may already be there: use entries **newer** than the dossier README's `Last reconciled:` stamp (plus entries still `new`/`open`) as an answer source, and record their provenance in `## Clarifications` ("per discovery/<topic>/<entry>"). Never re-ask what an entry marked `folded-into-spec` or `superseded-by:` already settled, and never treat a dossier-vs-spec difference as a question - a dossier is not normative; the spec has already won. The marker family is wider than questions: `NEEDS DECISION` / `NEEDS INPUT` / `NEEDS ASSET` markers are not clarify questions - report them as the outstanding gap list (what is missing, who brings it) and leave them open until the decision/input/asset lands. When this loop folds dossier material into the spec, mark those entries and update the stamp.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

<!-- PATCHED(repository-standards): upstream lets the user wave the gate off for a spike. R12
     makes passing it a MUST and the entry file says never take a spec past it, so the escape
     hatch contradicted both - and the gate is enforced by script, so waving it off here only
     produced a later, more confusing refusal. -->
Note: this workflow runs and completes BEFORE `/spec-plan`. There is no skip: the gate is
what earns `Status: ready-to-develop`, and `/spec-plan` and `/spec-tasks` refuse a spec that
has not passed it. If the user asks to skip ahead, show what is still open instead - an
exploratory spike is a legitimate reason to *defer* an answer, and a recorded deferral is an
answer. It is not a reason to leave the question unwritten.

Execution steps:

1. Run `scripts/spec/check-prerequisites.sh --json --paths-only` from repo root **once** (combined `--json --paths-only` mode / `-Json -PathsOnly`). Parse minimal JSON payload fields:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Optionally capture `IMPL_PLAN`, `TASKS` for future chained flows.)
   - If JSON parsing fails, abort and instruct user to re-run `/spec-specify` or verify feature branch environment.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **IF EXISTS**: Load `specs/constitution.md` for project principles and governance constraints.

3. Load the current spec file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing. Produce an internal coverage map used for prioritization (do not output raw map unless no questions will be asked).

   Functional Scope & Behavior:
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   Domain & Data Model:
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   Interaction & UX Flow:
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility or localization notes

   Non-Functional Quality Attributes:
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   Integration & External Dependencies:
   - External services/APIs and failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   Edge Cases & Failure Handling:
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   Constraints & Tradeoffs:
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs or rejected alternatives

   Terminology & Consistency:
   - Canonical glossary terms
   - Avoided synonyms / deprecated terms

   Completion Signals:
   - Acceptance criteria testability
   - Measurable Definition of Done style indicators

   Misc / Placeholders:
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

   For each category with Partial or Missing status, add a candidate question opportunity unless:
   - Clarification would not materially change implementation or validation strategy
   - Information is better deferred to planning phase (note internally)

<!-- PATCHED(repository-standards): upstream caps the session at five questions and reports
     whatever is left over as "Deferred" in the completion message. That is wrong here for two
     reasons. Our default tier is BUILDABLE (R9) - verbatim data contracts, interface contracts,
     invariants, algorithms, acceptance criteria - and a real capability has far more than five
     things that decide whether it can be built from the spec alone. Worse, the leftovers went
     into a chat report rather than into the spec. Gaps that /spec-specify marked are safe - they
     are in the file and the gate counts them - but the ambiguities THIS skill discovers in its
     own scan are not markers, so anything past the fifth was reported once and then gone: not in
     the spec, not blocking the gate, not recoverable. The skill's most valuable output was the
     part the cap discarded. Coverage replaces the count, and anything unsettled is written into
     the spec as a marker. -->
4. Build a prioritized queue. **There is no question limit** - the loop is bounded by *coverage*,
   not by a count.
    - **What must be asked:** anything whose absence means the capability cannot be built or
      verified from the spec alone. At the `buildable` tier that means every field name, type,
      enum value, endpoint, error code, ordering rule, boundary and invariant the spec asserts
      but does not pin down. Paraphrase is not a contract.
    - **What must not be asked:** anything that changes no contract and no test - stylistic
      preference, plan-level execution detail, or something a sensible default already covers.
      A question the user cannot tell the point of costs more than it buys.
    - Rank by (Impact x Uncertainty). Prefer the question whose answer unblocks a whole section
      over three that each polish one line.
    - Exclude anything already answered in the spec, in `## Clarifications`, or in the discovery
      dossier.

5. Ask, in rounds, and **stop on coverage rather than on a number**:
    - **Batch by contract, not one question per message forever.** Questions that belong to the
      same contract are one conversation - a field's name, type and nullability get asked
      together, in one message, numbered. Unrelated questions stay separate. Asking six things
      about one table across six messages is not thoroughness, it is a worse interface.
    - Keep a round to roughly **five messages**, then **check in**: say how many open items
      remain and what they block, and offer three ways forward - keep going, park the rest as
      markers, or park a named subset. Parking is safe *because* it writes markers, and the gate
      then refuses to plan. Say that when offering it.
    - **Stop when** every section the declared tier requires either carries a real contract or
      carries a typed marker; or the user says stop. Never stop merely because a number was hit.
    <!-- CHERRY-PICKED(github/spec-kit 39f2ac3, after v0.13.2): ask a real question, not a label -->
    - Lead each with `**Question:** <full interrogative>?` - answerable as written. NEVER use a
      topic label, a section heading or a requirement id as the question itself: "Retention
      policy" and "FR-023" are subjects, not questions. An id may trail it:
      `**Question:** How long are booking records kept after cancellation? (FR-023)`.
    - Under it, one plain-language sentence on why it matters - what changes depending on the
      answer. Everyday wording; introduce a term only if the same sentence defines it.
    - For multiple-choice questions:
       - **Analyze the options** and pick the most suitable, on best practice for this project
         type, common patterns, risk (security, performance, maintainability), and the spec's own
         stated goals and constraints.
       - Present the recommendation first: `**Recommended:** Option [X] - <1-2 sentence reason>`.
       - Then the options as a table:

       | Option | Description |
       |--------|-------------|
       | A | <Option A description> |
       | B | <Option B description> |
       | C | <Option C description> (add D/E as needed, up to 5) |
       | Short | Provide a different short answer (Include only if a free-form alternative fits) |

       - After the table: `Reply with the option letter (e.g. "A"), accept the recommendation with
         "yes", or give your own answer.`
    - For short-answer questions:
       - Give your **suggested answer** first: `**Suggested:** <proposal> - <brief reason>`, then
         `Accept with "yes", or give your own.`
       - **Do not impose a word limit on a contract.** Upstream constrains every short answer to
         five words; that is fine for "which auth model?" and useless for "what does the payload
         look like?". Ask for exactly the shape the spec section needs - a field list, an enum, a
         rule - and say so.
    - After each answer:
       - "yes" / "recommended" / "suggested" accepts what you proposed.
       - **A deferral is an answer.** "Decide later", "ask the architect", "the designer owes us
         that" - record it, and write the matching typed marker so the gate holds it.
       - If the answer is ambiguous, ask once for disambiguation - it is the same question, not a
         new one.
       - Record it, then integrate it (step 6) before moving on.
    - Never reveal queued questions in advance.
    - If nothing is unclear at the start, say so plainly and stop.

<!-- PATCHED(repository-standards): the hole the cap opened, closed. -->
5b. **Everything unresolved becomes a marker in the spec, before this skill returns.** Not a
    bullet in a completion report - a `[NEEDS CLARIFICATION: ...]`, `[NEEDS DECISION: ...]`,
    `[NEEDS INPUT: ...]` or `[NEEDS ASSET: ...]` written into the section it belongs to, naming
    what is missing and who brings it. This is what makes stopping early safe: the gate counts
    those markers, so a spec that was only half settled cannot reach plan or tasks. A question
    that was never asked and never marked is indistinguishable from a question that was answered,
    and that is the failure this step exists to prevent.

6. Integration after EACH accepted answer (incremental update approach):
    - Maintain in-memory representation of the spec (loaded once at start) plus the raw file contents.
    - For the first integrated answer in this session:
       - Ensure a `## Clarifications` section exists (create it just after the highest-level contextual/overview section per the spec template if missing).
       - Under it, create (if not present) a `### Session YYYY-MM-DD` subheading for today.
    - Append a bullet line immediately after acceptance: `- Q: <question> → A: <final answer>`.
    - Then immediately apply the clarification to the most appropriate section(s):
       <!-- PATCHED(repository-standards): routed to the sections capability-spec.template.md
            actually has. Upstream targets Functional Requirements / User Stories / Data Model /
            Success Criteria > Measurable Outcomes - none of which exist here, so answers landed
            in sections the agent had to invent. -->
       - Functional ambiguity → update or add a bullet under `## Requirements` in the right `### <Area>`.
       - Who may do this / actor distinction → `## Trust boundaries` (who can call it, with what proof); if it changes who the capability is for, correct the `Serves` field instead of adding a roster.
       - Data shape, fields, enums, constraints → `## Data contracts`, quoting real identifiers; add the matching row to `## Interface contracts` where it crosses the boundary.
       - Non-functional constraint → a testable bullet under `## Requirements`, plus the acceptance criterion that verifies it. Convert the vague adjective into a number.
       - Edge case / negative flow → `## Edge cases`, and the error row in the `## Interface contracts` table if it surfaces to a caller.
       - Rule, ordering, rounding, concurrency → `## Algorithms & rules` as numbered steps.
       - Something that must always hold → `## Invariants`, with an acceptance criterion covering it.
       - Terminology conflict → normalize the term across the spec and record it in `## Core concepts`; retain the original only if necessary by adding `(formerly referred to as "X")` once.
    - If the clarification invalidates an earlier ambiguous statement, replace that statement instead of duplicating; leave no obsolete contradictory text.
    - Save the spec file AFTER each integration to minimize risk of context loss (atomic overwrite).
    - Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
    - Keep each inserted clarification minimal and testable (avoid narrative drift).

7. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Every open item is either answered in `## Clarifications` or present as a typed marker - nothing unresolved exists only in the conversation.
   - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
   - No contradictory earlier statement remains (scan for now-invalid alternative choices removed).
   - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Terminology consistency: same canonical term used across all updated sections.

8. Write the updated spec back to `FEATURE_SPEC`.

9. **Re-validate Spec Quality Checklist** (if it exists):
   - Check if `FEATURE_DIR/checklists/requirements.md` exists.
   - If it does NOT exist, skip this step silently.
   - If it exists:
     1. Read the checklist file.
     2. Identify all GitHub task-list checkbox lines — lines matching `- [ ]`, `- [x]`, or `- [X]` (case-insensitive, tolerant of leading whitespace for nested items) outside of code fences. Ignore all other content (headings, notes, non-checkbox bullets, metadata).
     3. For each checkbox line, record its current marker state (checked or unchecked) and item text into a before-snapshot list.
     4. Re-evaluate each checkbox item against the **updated** spec (the version just saved in step 7).
     5. For each checkbox item, update only if the checked/unchecked state actually changes:
        - If the item now passes and was unchecked: change `[ ]` to `[x]`.
        - If the item now fails and was checked: change `[x]`/`[X]` to `[ ]`.
        - If the state is unchanged: leave the marker as-is (preserve existing case to avoid cosmetic diffs).
     6. Save the updated checklist file. **Only toggle the `[ ]`/`[x]` marker portion of checkbox lines whose state changed.** All other file content — headings, metadata, notes, line ordering, whitespace — must remain unchanged to avoid noisy diffs.
     7. Compare the before-snapshot with the current state to compute three lists for the Completion Report:
        - **Newly passing**: items that changed from unchecked to checked.
        - **Regressions**: items that changed from checked to unchecked.
        - **Still unchecked**: items that remain unchecked.
     8. Record the before/after pass counts as checked/total checkbox items (e.g., "12/16 → 15/16 items passing").

Behavior rules:

- If no meaningful ambiguities found (or all potential questions would be low-impact), respond: "No critical ambiguities detected worth formal clarification." and suggest proceeding.
- If spec file missing, instruct user to run `/spec-specify` first (do not create a new spec here).
- There is no cap on questions. There is a cap on *unrecorded* ones: zero.
- Avoid speculative tech stack questions unless the absence blocks functional clarity.
- Respect user early termination signals ("stop", "done", "proceed").
- If no questions asked due to full coverage, output a compact coverage summary (all categories Clear) then suggest advancing.
- If the user stops the loop early, write the remaining items as typed markers, say how many were written, and say plainly that plan and tasks will refuse the spec until they are resolved.

Context for prioritization: $ARGUMENTS

## Completion Report

Report completion (after questioning loop ends or early termination):
- Number of questions asked and answered, and the number of markers written for what was not.
- Path to updated spec.
- Sections touched (list names).
- Spec quality checklist status (if `FEATURE_DIR/checklists/requirements.md` was re-validated): show before/after pass counts (e.g., "Spec Quality Checklist: 12/16 → 15/16 items passing") and list any items that changed state — both newly checked (unchecked → checked) and any regressions (checked → unchecked). If any items remain unchecked, list them as areas needing attention.
- Coverage summary table listing each taxonomy category with Status: Resolved (was Partial/Missing and addressed), Marked (unresolved and now carrying a typed marker - with the marker's type and owner), Clear (already sufficient).
- If any Outstanding or Deferred remain, recommend whether to proceed to `/spec-plan` or run `/spec-clarify` again later post-plan.
- Suggested next command.

## Done When

- [ ] Spec ambiguities identified and clarifications integrated into spec file
- [ ] Spec quality checklist re-validated against updated spec (if `FEATURE_DIR/checklists/requirements.md` exists)
- [ ] Completion reported to user with questions answered, sections touched, checklist status, and coverage summary
