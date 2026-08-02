---
name: spec-specify
description: Use when someone describes a feature, a behaviour, or something the product should do - "we need refunds", "users should be able to reset their password", "add a way to export bookings". Turns it into that capability's living spec and goes straight into the clarify questions. Reach for this before writing the code, not after it.
---

<!-- Vendored from github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE). PATCHED(repository-standards) hunks are marked inline. -->
<!-- PATCHED(repository-standards): ADR-010 - clarify chains automatically after specify -->
**Clarify chains automatically after specify.** When this command completes, immediately continue into the clarify loop (`/spec-clarify`) in the same session - do not stop and wait to be asked. The loop is AI-led: propose answers, ask the user only what genuinely needs their call, and record every deferral ("leaving this to the technical side") in the spec's `## Clarifications` section instead of dropping it. Plan and tasks are gated: they refuse a spec that has no `## Clarifications` section or still contains open markers of the `[NEEDS ...` family (that gate is what earns `Status: ready-to-develop`).

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

2. **Create the spec feature directory**:

   Specs live under the default `specs/` directory unless the user explicitly provides `SPECIFY_FEATURE_DIRECTORY`.

   **Resolution order for `SPECIFY_FEATURE_DIRECTORY`**:
   1. If the user explicitly provided `SPECIFY_FEATURE_DIRECTORY` (e.g., via environment variable, argument, or configuration), use it as-is
   2. Otherwise, auto-generate it under `specs/`:
      <!-- PATCHED(repository-standards): ADR-002 capability paths - the directory is
           specs/<slug>/ named after the capability/domain, with NO numeric or timestamp
           prefix. Never create NNN-slug or YYYYMMDD-HHMMSS-slug directories. -->
      - The directory name is the short name alone: `<short-name>` (e.g., `user-auth`) - it names a capability/domain, so it must be stable and prefix-free
      - Do NOT add a numeric prefix (`003-user-auth`) or timestamp prefix (`20260319-143022-user-auth`)
      - If `specs/<short-name>/` already exists, this is the same capability: update the existing spec in place instead of minting a new sibling directory
      - Set `SPECIFY_FEATURE_DIRECTORY` to `specs/<short-name>`

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

   **IMPORTANT**:
   - You must only create one feature per `/spec-specify` invocation
   - The spec directory name and the git branch name are independent — they may be the same but that is the user's choice

3. Load `specs/capability-spec.template.md` to understand required sections. <!-- PATCHED(repository-standards): the standard's template is the single source of the spec shape -->

4. **IF EXISTS**: Load `specs/constitution.md` for project principles and governance constraints.

5. Follow this execution flow:
    1. Parse user description from arguments
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
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
    4. Fill Purpose, Scope and Out of scope
       If the boundary cannot be determined: ERROR "Cannot determine the capability's boundary"
    5. Fill Core concepts, then the contracts the declared tier requires
       buildable (the default, R9): Data contracts and Interface contracts quoted VERBATIM -
         real table and field names, real enums, real endpoints and methods, and the
         exhaustive error table. A paraphrased contract is not a contract
       behavioral (the escape hatch): contracts may stay descriptive, and the spec MUST
         state why the buildable tier was not met
    6. Generate Requirements, each testable; add Invariants, and Algorithms & rules
       wherever the logic is non-trivial (numbered implementable steps, not prose)
       Reasonable defaults for unspecified details are fine - record each one under
       Open questions rather than letting it pass silently
    7. Write Acceptance criteria as Given/When/Then covering the happy path, every error
       path, every edge case and every state transition. Every Invariant must be covered
       by at least one of them
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
           default and specs/README.md requires contracts quoted verbatim - real field
           names, enums, endpoints. The checklist now gates on the tier the spec declares. -->
      ## Content Quality

      - [ ] Spec tier is declared, and the spec meets it: buildable means an agent could
            rebuild and verify this capability from the spec alone; behavioral says why not
      - [ ] Contracts quote real identifiers verbatim, never paraphrase (buildable tier)
      - [ ] Serves names a persona from `docs/personas.md`
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

## Completion Report

Report completion to the user with:
- `SPECIFY_FEATURE_DIRECTORY` — the feature directory path
- `SPEC_FILE` — the spec file path
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

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: record each reasonable default under `## Open questions` - the
   template has no Assumptions section, and an undocumented default is the drift that a
   later reader mistakes for a decision <!-- PATCHED(repository-standards) -->
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
<!-- PATCHED(repository-standards): the authentication method was on this list upstream. It is
     one of the eight foundation forks that must be consciously decided and recorded (R7), and
     the decision checklist's reason for it is "retro-fitting authz is a security minefield".
     A default nobody chose, recorded nowhere, is the exact failure the standard exists to
     stop - and it is the one item here with security consequences. It is now a question. -->
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
