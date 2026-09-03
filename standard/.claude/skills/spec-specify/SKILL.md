---
name: spec-specify
description: Use when someone describes a feature, a behaviour, or something the product should do - "we need refunds", "users should be able to reset their password", "add a way to export bookings". Turns it into that capability's living spec and goes straight into the clarify questions. Reach for this before writing the code, not after it.
---

<!-- Vendored from github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE). PATCHED(repository-standards) hunks are marked inline. -->
<!-- PATCHED(repository-standards): em and en dashes normalised to ASCII hyphens throughout.
     standard/docs/conventions.md forbids them, and this file ships into every adopting repo,
     so the vendored punctuation would have carried a rule break into each one. Prose only -
     no instruction, path or example changed. Enforced by tools/prose-check.mjs. -->
<!-- PATCHED(repository-standards): ADR-010 - clarify chains automatically after specify -->
**Clarify chains automatically after specify.** When this command completes, immediately continue into the clarify loop (`/spec-clarify`) in the same session - do not stop and wait to be asked. The loop is AI-led: propose answers, ask the user only what genuinely needs their call, and record every deferral ("leaving this to the technical side") in the spec's `## Clarifications` section instead of dropping it. Plan and tasks are gated: they refuse a spec that has no `## Clarifications` section or still contains open markers of the `[NEEDS ...` family (that gate is what earns `Status: ready-to-develop`).

<!-- PATCHED(repository-standards): ADR-033 - a record that already governs the request is
     read before the request is drafted, not discovered afterwards -->
**Decision intake (before drafting, and before the dossier).** Read `docs/decision-records/`'s index - the README table, not every record - and open in full only the records whose subject overlaps this request. Cheap by construction: one table, then the two or three rows that match. The index is only safe to read *instead of* the directory because `decision-records-check` fails a record that exists on disk and is missing from the table; if that guard is not running here, list the directory too - a record the index forgot is exactly the one nobody remembers.

- **An Accepted record in scope is not a question and not a suggestion - it is already the answer.** What it settles goes into the draft as settled content citing the record, never as a `[NEEDS DECISION]` marker and never as something to ask about.
- **If the request contradicts an Accepted record, stop before drafting** and say which record. The two legitimate routes are: change the request to fit, or supersede the record (`/adr-write`, `/bdr-write`) - a spec written around a record is the thing R6 exists to stop, and nothing downstream detects it.
- **If a record retired the capability this request would extend, do not draft into it** - step 2 below owns what to do instead, and is where the protocol is written; it is not repeated here.
- A record that is `Proposed`, `Rejected` or `Superseded` binds nothing: follow the supersession link and use the record that is current.

<!-- PATCHED(repository-standards): ADR-024 - discovery dossiers feed specify -->
**Discovery intake (before drafting).** Check `docs/discovery/` for a dossier related to this feature's topic. If one plausibly matches but you are not sure, ask the user which (never guess between dossiers). If a dossier exists:

- Read only what the stamp allows: entries **newer** than the dossier README's `Last reconciled:` stamp, plus any entry still marked `new`/`open`. Entries marked `folded-into-spec` or `superseded-by:` are history - never re-ask about them.
- **A dossier is never normative.** Where an entry differs from an existing spec or an accepted record, the spec/record has already won - do not surface it as a conflict; only genuinely new material enters the draft.
- What the dossier settles goes straight into the spec's sections. What it leaves open becomes a **typed open marker** naming what is missing and who brings it: `NEEDS CLARIFICATION` (a question), `NEEDS DECISION` (a missing ADR/BDR + topic + owner), `NEEDS INPUT` (e.g. a UX design + owner), `NEEDS ASSET` (e.g. credentials + owner). The clarify-marker limit below applies to CLARIFICATION questions only - DECISION/INPUT/ASSET markers are the honest gap list and are not capped.
- After writing the spec, close the loop in the dossier: mark the consumed entries `folded-into-spec`, and update the README stamp to `Last reconciled: <today> (specs/<capability> @ <commit>)`.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/spec-specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

<!-- PATCHED(repository-standards): ADR-033 - the eye goes to the numbered list, and the two
     intakes above it read as preamble. They are not: either can end the run before step 1. -->
**Decision intake and discovery intake, above, run before step 1** - they are steps, not preamble, and the first of them can stop the run before a name is ever generated.

1. **Generate a concise short name** (2-4 words) for the feature:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

<!-- PATCHED(repository-standards): ADR-002 - collision detection was exact-string on the
     generated slug, in the one skill barred from asking the user. A request whose slug did
     not string-match an existing capability it functionally overlapped therefore minted a
     sibling in silence: `manager-shift-reassignment` beside an existing `shift-swap-request`
     that already described the same behaviour - the split-by-wording failure standard ADR-002 exists
     to prevent, arriving through the step that is supposed to prevent it. -->
1b. **Before minting anything, look for a capability collision - by behaviour, not by name.**
    List the directories under `specs/` and the capability keys in `specs/capability-map.json`,
    and read the `## Purpose`, `## Scope` and `## Out of scope` of every one whose subject is
    near this request. The name is the one thing that will not match: the same behaviour
    arrives worded as the actor ("a manager reassigns a shift"), as the surface ("the shift
    screen"), or as the ticket that asked for it, and a generated slug matches none of those.

    - **An existing capability already owns this behaviour** -> update that spec in place.
      Name it and say why in the Completion Report; do not mint a sibling.
    - **The request spans two capabilities** (one sentence, two boundaries) -> write the
      spec for the one it is primarily about, and record the other in `## Out of scope` as
      `[NEEDS DECISION: <the boundary question>; owner: <who>]`, naming the capability it may
      belong to. Never absorb the second silently, and never mint both in one invocation.
    - **You cannot tell whether it is one capability or two** -> that is the same marker, not
      a guess. Splitting a capability the wrong way produces two valid specs no guard can
      compare, and nothing downstream will ever notice.

    This is how the step surfaces a boundary call without breaking the rule that specify does
    not ask: the marker blocks the clarify gate, and `/spec-clarify` - which owns the question
    protocol - settles it before plan. Report every near-miss you considered, including the
    ones you ruled out and why.

2. **Create the spec feature directory**:

   Specs live under the default `specs/` directory unless the user explicitly provides `SPECIFY_FEATURE_DIRECTORY`.

   **Resolution order for `SPECIFY_FEATURE_DIRECTORY`**:
   1. If the user explicitly provided `SPECIFY_FEATURE_DIRECTORY` (e.g., via environment variable, argument, or configuration), use it as-is
   2. Otherwise, auto-generate it under `specs/`:
      <!-- PATCHED(repository-standards): ADR-002 capability paths - the directory is
           specs/<slug>/ named after the capability/domain, with NO numeric or timestamp
           prefix. Never create NNN-slug or YYYYMMDD-HHMMSS-slug directories. -->
      - The directory name **for a genuinely new capability** is the short name alone: `<short-name>` (e.g., `user-auth`) - it names a capability/domain, so it must be stable and prefix-free
      - Do NOT add a numeric prefix (`003-user-auth`) or timestamp prefix (`20260319-143022-user-auth`)
      <!-- PATCHED(repository-standards): ADR-033 - this check ran on the slug alone and read
           no status, so a near-miss name minted a rival spec for a subject the repo already
           had, and "update in place" applied to a retired capability as readily as a live one.
           The subject search itself is step 1b; what happens here is what the match is used for. -->
      - **Take the capability step 1b matched, not the slug.** The short name step 1 generated is yours, not the repo's: `shift-reminders` and `shift-notifications` are the same capability under two names, and `specs/shift-reminders/` not existing proves nothing. A name match catches only the easy half; step 1b's search on subject is what decides whether this request already has a home
      - **Read the matched spec's `Status` before editing it.** `retired` means stop and do not draft: the capability was ended by a decision record, and the file stays as the record of what was built, not as somewhere to add to. Name that record, say what it decided, and let the user choose - a genuinely new capability specced fresh may well be right, and the record often says so, but that is the user's call to make with the record in front of them. What you must not do is proceed on your own, under either the old slug or a new one
      - Otherwise, if a directory matched, this is the same capability: update the existing spec in place instead of minting a new sibling directory
      <!-- PATCHED(repository-standards): ADR-002/R8 - an approved idea's slug is the common
           case of a name that will never match: it names the idea, never the capability. -->
      - **A matched capability is `/spec-update`'s target, not a directory to mint** - say which capability you matched and why. Where step 1b left the call open, `/spec-impact` answers it. Mint only when no existing capability owns the behaviour, and name the directory after the capability, never after the request or the idea it came from
      - Set `SPECIFY_FEATURE_DIRECTORY` to the matched capability's directory, or to `specs/<short-name>` when nothing matched. The generated short name only names the directory when the capability is genuinely new - adopting it over a matched capability's existing name is how the rival spec gets minted anyway, one bullet after the check that caught it

   **Create the directory and spec file**:
   - `mkdir -p SPECIFY_FEATURE_DIRECTORY`
   <!-- PATCHED(repository-standards): the spec shape is owned by the standard, not the
        engine - instantiate specs from specs/capability-spec.template.md (Spec tier /
        Serves / Status / Success metric / clarify-gate expectations), never from a
        vendored spec-template.md (which is intentionally not shipped). -->
   - Copy `specs/capability-spec.template.md` (the standard's capability spec template) to `SPECIFY_FEATURE_DIRECTORY/spec.md` as the starting point
   - Set `SPEC_FILE` to `SPECIFY_FEATURE_DIRECTORY/spec.md`
   - Persist the resolved path to `specs/feature.json`:
     ```json
     {
       "feature_directory": "<resolved feature dir>"
     }
     ```
     Write the actual resolved directory path value (for example, `specs/user-auth`), not the literal string `SPECIFY_FEATURE_DIRECTORY`. <!-- PATCHED(repository-standards): ADR-002 - slug-only example -->
     This allows downstream commands (`/spec-plan`, `/spec-tasks`, etc.) to locate the feature directory without relying on git branch name conventions.

   **Register the capability in `specs/capability-map.json`** when the directory is new
   <!-- PATCHED(repository-standards): R11 - a spec with no map entry has no coupling -->
   - Add a key for the capability with the globs its code will occupy, e.g.
     `"payments": ["packages/payments/**", "apps/*/src/**/payment/**"]`. Propose them from
     the repo's actual layout (read `specs/capability-map.example.json` for the shape) and
     say what you added, so the user can correct a wrong guess now rather than after the
     guard fires.
   - This is the step that owns it: minting the directory is the moment the map goes stale,
     and `spec-guard --audit` fails a capability spec with no entry (R11) - which lands as a
     failed pull request on whoever opens one next. Where the code has no home yet, add the
     key with the globs it is going to have; a glob matching nothing is reported by the
     audit, which is the correct, visible state for a capability nobody has built yet.
   - `/spec-reconcile` reconciles the map against the code that actually landed before the
     pull request. Both writers exist on purpose: this one keeps a new capability from being
     unmapped by construction, that one catches a refactor moving code out from under a glob.

   **IMPORTANT**:
   - You must only create one feature per `/spec-specify` invocation - a request that spans two capabilities is handled by step 1b (write one, mark the boundary), never by folding the second one in unnamed
   - The spec directory name and the git branch name are independent - they may be the same but that is the user's choice

3. Load `specs/capability-spec.template.md` to understand required sections. <!-- PATCHED(repository-standards): the standard's template is the single source of the spec shape -->

4. **IF EXISTS**: Load `specs/constitution.md` for project principles and governance constraints.

5. Follow this execution flow:
    1. Parse user description from arguments
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - **Ask before guessing** <!-- PATCHED(repository-standards) -->: put what the description
         leaves undetermined to the user as `[spec.unknowns]`. The guess below is for what they
         hand back, not a way around asking
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    <!-- PATCHED(repository-standards): the sections are the standard's template, not the
         engine's. Upstream fills User Scenarios / Functional Requirements / Success
         Criteria / Key Entities; none of those exist in capability-spec.template.md, and
         a spec written to them cannot be reconciled against the shape the guards check. -->
    4. Ask `[spec.scope]`, then fill Purpose, Scope and Out of scope from the answer - the
       boundary is asked, never derived. Undeterminable with nobody to ask: ERROR "Cannot
       determine the capability's boundary"
    5. Fill Core concepts, then the contracts the declared tier requires
       buildable (the default, R9): Data contracts and Interface contracts quoted VERBATIM -
         real table and field names, real enums, real endpoints and methods, and the
         exhaustive error table. A paraphrased contract is not a contract
       behavioral (the escape hatch): contracts may stay descriptive, and the spec MUST
         state why the buildable tier was not met
    6. Generate Requirements, each testable; add Invariants, and Algorithms & rules
       wherever the logic is non-trivial (numbered implementable steps, not prose)
       Reasonable defaults for unspecified details are fine - record each one under
       `## Clarifications` as the assumed answer it is, rather than letting it pass
       silently. It does not belong under Open questions: a default you took is a
       decision, not an outstanding question, and that section says whether anything
       is still outstanding
    7. Ask `[spec.acceptance]`, then write Acceptance criteria as Given/When/Then covering
       the happy path, every error path, every edge case and every state transition. Every
       Invariant must be covered by at least one of them
    8. Set the front-matter fields the template declares: Spec tier, Serves (a persona
       from `docs/personas.md` - a spec that serves nobody fails the structure guard),
       Status, Success metric
    9. Return: SUCCESS (spec ready for the clarify loop)

6. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

7. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md` using the checklist template structure with these validation items:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]

      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]

      <!-- PATCHED(repository-standards): upstream gates on "no implementation details",
           which is the opposite of what a buildable spec is. R9 makes buildable the
           default and the standard requires contracts quoted verbatim - real field
           names, enums, endpoints. The checklist now gates on the tier the spec declares. -->
      ## Content Quality

      - [ ] Spec tier is declared, and the spec meets it: buildable means an agent could
            rebuild and verify this capability from the spec alone; behavioral says why not
      - [ ] Contracts quote real identifiers verbatim, never paraphrase (buildable tier)
      - [ ] Serves names a persona from `docs/personas.md`
      - [ ] Nothing here contradicts an Accepted decision record, and what a record
            settles is written as settled, citing it
      - [ ] Success metric names the KPI this capability moves, or says why "n/a"
      - [ ] All applicable template sections completed, section order preserved

      ## Requirement Completeness

      - [ ] No `[NEEDS ...]` markers of any type remain unrecorded - a deferral is an
            answer written down, never a dropped question
      - [ ] Requirements are testable and unambiguous
      - [ ] Every Invariant is covered by at least one acceptance criterion
      - [ ] Acceptance criteria cover the happy path, every error path, every edge case
            and every state transition
      - [ ] Edge cases are identified
      - [ ] Scope and Out of scope are bounded, and Out of scope names the owning capability
      - [ ] Open questions records what is genuinely unresolved, or says "None known."

      ## Feature Readiness

      - [ ] Every requirement traces to an acceptance criterion
      - [ ] Cross-capability interactions name and link the other spec
      - [ ] Trust boundaries filled where the capability touches money, auth or personal data

      ## Notes

      - Items marked incomplete require spec updates before `/spec-clarify` or `/spec-plan`
      ```

   b. **Run Validation Check**: Review the spec against each checklist item:
      - For each item, determine if it passes or fails
      - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:

      - **If all items pass**: Mark checklist complete and proceed to the Completion Report

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List the failing items and specific issues
        2. Update the spec to address each issue
        3. Re-run validation until all items pass (max 3 iterations)
        4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

      <!-- PATCHED(repository-standards): specify does not ask - it hands off. Upstream asks
           up to three questions presented together; clarify asks up to five, one at a time,
           each with a recommended answer. Running both meant the same gaps were raised twice
           under two protocols, and answers given here landed outside the `## Clarifications`
           section the gate actually reads. -->
      - **If `[NEEDS ...]` markers remain**: leave them exactly where they are and finish.
        Clarify runs next in the same session and owns the question protocol end to end -
        it is what writes answers into `## Clarifications`, and that section plus zero open
        markers is what earns `Status: ready-to-develop`. Do not ask the user here.

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

## Questions this skill must ask

Three real `AskUserQuestion` calls - the boundary, what done means, and whatever the description
leaves undetermined. [`questions.md`](questions.md) says where each fires and what it offers; read
it at steps 5.3, 5.4 and 5.7, not afterwards. The guard refuses the write until they have fired.

## Completion Report

Report completion to the user with:
- `SPECIFY_FEATURE_DIRECTORY` - the feature directory path
- `SPEC_FILE` - the spec file path
- The capability collisions considered (step 1b): which existing capabilities were read, which was ruled the same or a neighbour, and any boundary left as a `NEEDS DECISION` marker <!-- PATCHED(repository-standards) -->
- Checklist results summary
- Readiness for the next phase (`/spec-clarify` or `/spec-plan`)

**NOTE:** Spec directory and file creation are always handled by this core command.

## Quick Guidelines

<!-- PATCHED(repository-standards): upstream's "avoid HOW, write for business stakeholders"
     describes the behavioral tier, which here is the escape hatch and not the default. -->
- A capability spec is the current truth of one **capability**, never of a ticket, a page
  or a release. If it surfaces on three screens it is still one spec.
- **Buildable is the default** (R9): an agent could rebuild and verify the capability from
  this spec alone. Contracts name real fields, real enums, real endpoints, real error codes.
- The **behavioral** tier is the escape hatch - a PO writing intent starts here, a developer
  raises it to buildable. Declaring it obliges the spec to say why.
- Avoid naming the *implementation* - which framework, which library, which file - but never
  avoid the *contract*. The contract is the point.
- DO NOT create any checklists that are embedded in the spec.
- Mandatory sections are completed for every capability; optional ones only where they apply,
  and a section that does not apply is removed rather than left as "N/A".

### For AI Generation

When creating this spec from a user prompt:

1. **Ask first, then guess** <!-- PATCHED(repository-standards) -->: `[spec.unknowns]` is what
   you do with a gap; context, industry standards and common patterns are what you do with the
   ones handed back to you
2. **Document assumptions**: record each reasonable default under `## Clarifications`, as
   `- Q: <what was unspecified> -> A: <the default taken> (assumed)` - an undocumented default
   is the drift a later reader mistakes for a decision. Never under `## Open questions`: the
   clarify gate reads that section and passes only on "None known.", because it answers one
   question - is anything still outstanding. A default worth confirming is a
   `[NEEDS CLARIFICATION: ...]` marker instead <!-- PATCHED(repository-standards) -->
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
<!-- PATCHED(repository-standards): the marker cap and priority order stood here word for word
     from step 5.3, and the areas worth a marker restated its tests. One copy, in the flow. -->

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
<!-- PATCHED(repository-standards): the authentication method was on this list upstream. It is
     a foundation fork that must be decided and recorded (R7) - "retro-fitting authz is a
     security minefield" - so a default nobody chose is exactly the failure this stops. Now a
     question. -->
- Integration patterns: Use project-appropriate patterns (REST/GraphQL for web services, function calls for libraries, CLI args for tools, etc.)

### Success metric, and where measurable targets go

<!-- PATCHED(repository-standards): the template has no "Success Criteria" section. It has a
     `Success metric` front-matter field (the product KPI) and an Acceptance criteria section
     (Given/When/Then). Upstream's rule that a measurable target is "too technical" would
     strip exactly the numbers a buildable spec exists to carry. -->

**`Success metric`** is a front-matter field, not a section: the one KPI from the product's
KPI tree this capability moves. A capability that moves none needs a stated why, not an
invented metric.

**Measurable targets belong in Requirements** and are verified in **Acceptance criteria**.
They are allowed - required, where the number is load-bearing - to be technical:

- "The endpoint responds within 200 ms at p95" is a requirement, and an acceptance criterion
  can assert it. It is not "too technical"; it is the kind of thing a spec is for.
- "Users see results instantly" is not a requirement. Nothing can pass or fail it.

What to keep out is the *implementation*: which cache, which framework, which library. The
threshold stays, the vendor goes. "Cache hit rate above 80%" names a design choice, so it
belongs in the plan or an ADR; "a repeated lookup within the same request MUST NOT re-query"
is the invariant that survives whichever cache is chosen.

## Done When

- [ ] Specification written to `SPEC_FILE` and validated against quality checklist
- [ ] Completion reported to user with feature directory, spec file path, and checklist results
