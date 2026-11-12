# ADR-064: Roles, modes and job stories replace personas - the gate stays

| | |
| --- | --- |
| **Status** | Accepted (2026-11-12) - supersedes ADR-006 |
| **Date** | 2026-11-12 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, product, specs, roles, job-stories, journeys |

## Context

ADR-006 made "for whom?" a gate: every spec, backlog row and idea names who it serves, and
`spec-structure.mjs` checks the `**Serves:**` field against a roster (R10). The gate held. The
thing it checked against did not age as well.

The roster was a list of classic personas - a name, a role, a biography line, goals, pains -
and the distrust-first pass (CHANGELOG 1.0.x, "build it from the distrust, not the name")
already had to argue against the format's own opening move. Three problems kept showing:

- **The biography changes no decision.** A name and a stock-photo life story are the part of a
  persona that is easiest to write and that no spec ever cites. What specs cite is the job and
  the fear, and those belong to a situation, not to an imagined person.
- **One person behaves several ways.** The same guest of a booking product books a spontaneous
  weekend, a planned family stay, or a gift for somebody else, and the product has to behave
  differently in each. A persona flattens that into one average; a second persona for the same
  role duplicates the permissions to carry a different situation.
- **The spec carried no testable statement of the need.** `Serves` named the persona and then
  the spec went straight to contracts. The job the capability exists for lived in
  `docs/personas.md`, one hop away, and nothing tied it to the acceptance criteria that prove
  the capability does it.

Research done for this decision (2025-2026 sources) found that practice has not dropped the
"for whom" question; it has moved its starting point from the person to the situation and the
problem:

- **Spec-driven development** (GitHub Spec Kit, 2025) starts a specification from user journeys
  and prioritised user stories that are each independently testable, written as
  Given/When/Then scenarios an agent can build and verify against. This is the format that
  fits when AI agents are the main consumer of a spec.
- **Jobs to be done / job stories** (Bob Moesta's switch interviews; Intercom's job story
  format: "When [situation], I want [motivation], so I can [outcome]") anchor the need in the
  situation that triggers it rather than in a demographic, which is what makes a job story
  durable when features change.
- **NN/g on personas vs archetypes (2022)**: well-made personas and archetypes are
  functionally the same - the same research, presented differently. The persona's advantage is
  a human face that builds empathy and is remembered; the archetype's is that it carries no
  invented detail to mistake for research. Neither is ranked above the other, which is why the
  roster below gates on the archetype-shaped part and keeps a portrait as an optional layer on
  top of it. **NN/g on synthetic AI users (2024)**: AI-generated users are useful for
  forming hypotheses and nothing more; they are the weakest evidence a roster can rest on.
- **Opportunity solution trees** (Teresa Torres): outcomes break into opportunities, which are
  needs observed in real situations; solutions hang off opportunities. The job story is the
  unit that sits on that tree.

No source was found that proposes dropping the "who is this for" question outright. The change
is in what the answer is made of.

**How strong this evidence is.** None of these sources measures roles, modes and job stories
against personas. They are a tool's convention (Spec Kit), practitioner accounts (Intercom,
Moesta, Torres) and one empirical comparison that concerns AI-generated users, not personas
(NN/g, 2024). NN/g also defends well-maintained personas as living documents (2023). The
decision rests on fit for this standard's purpose - a roster a guard can check, permissions a
spec's trust boundaries can be read against, a need stated where an agent builds and a test
proves it - not on a measured advantage. What would show it working or failing is listed under
Revisit when.

## Options considered

- **A - Keep personas, tighten them (status quo after the distrust-first pass).** Cheapest, and
  the distrust content is good. But the format still invites the biography, still flattens
  modes into one average, and still leaves the spec with no testable job. Rejected.
- **B - Drop the roster, let each spec describe its user inline.** Removes a file. Also removes
  the only thing the gate can check membership against, so a spec "serving" an invented user
  passes. This is the failure ADR-006 rejected as Option A. Rejected.
- **C - Roles + optional modes + job stories in every spec + journeys for key flows (chosen).**
  The roster becomes a list of actors with their permissions, no biography; behavioural modes
  are added under a role only when they change how the product behaves; every capability spec
  carries 1-3 job stories with Given/When/Then scenarios linked to its acceptance criteria; one
  journey per key end-to-end flow, pinned to a role. The gate, the roster heading and the
  `Serves` field keep their mechanics.
- **D - Full discovery apparatus (opportunity solution trees, interview repositories, journey
  maps for everything).** ADR-006 rejected the same weight as its Option C and the reason
  stands: most repos will not sustain it. The tree informs the method docs; it is not shipped
  as an artifact.

## Decision

Adopt **Option C**.

- **Roles, not personas.** `docs/roles.md` replaces `docs/personas.md`. Its `## The roster`
  table lists one row per actor - who uses the product and with what permissions - with the
  role name in backticks and one marked primary. No name, age, photo or life story. The
  distrust-first content survives as a required field of each role (and, where it differs, of
  each mode): what they fear, what they distrust, what they must see before they act.
- **Modes are optional and capped.** A role MAY carry 2-3 behavioural modes. A mode is added
  only when it changes how the product behaves - if no spec, rule or design would differ, it is
  not a mode. Modes never get their own roster row: they share the role's permissions.
- **`Serves` names a role.** Optionally qualified by a mode, e.g. ``**Serves:** `Guest`
  (spontaneous weekend)``. R10 and the structure guard are unchanged in kind: the roster is the
  constraint, a name it has never heard of fails.
- **Job stories in every capability spec.** A `## Job stories` section holds 1-3 job stories in
  the form `When [situation], I want [motivation], so I can [outcome]`, each followed by at
  least one GIVEN/WHEN/THEN scenario that names the acceptance criterion it is proven by. The
  structure guard checks the shape on every spec a change touches, and warns on untouched
  specs that predate the section, so adopting the rule never fails a repo for history it did
  not write in this pull request. A change that only renames the role in `**Serves:**` - the
  migration itself - is not held to it, and a named sub-spec is held to it only once it has
  the section of its own.
- **Portraits are optional and never the gate.** A mode MAY carry a short persona-style
  portrait - a name, a line of context, a quote from research - where a team needs the empathy
  and memorability a human face gives. It is grounded in research (an AI-drafted one is marked
  `[NEEDS REVIEW]` as a hypothesis), it belongs to one mode so it never averages several
  situations into one character, and it is never what a spec serves: the guard reads only the
  roster of roles.
- **Journeys for key flows.** One journey per key end-to-end flow (`docs/journeys/`), pinned to
  one role and optionally a mode; each stage names the capability specs serving it.
- **The gate stays.** An idea, backlog row or spec that cannot name the role it serves is parked
  or incomplete, exactly as under ADR-006. A conflict between roles or modes is resolved by a
  BDR. The primary role wins ties unless a BDR says otherwise.
- **Migration is mechanical where it can be.** The guard still reads a legacy
  `docs/personas.md` and says how to move; the manifest lists `docs/personas.md` and the
  renamed `personas-write` skill in `removedPaths`, so `update-to-latest` performs the move
  and `self-verify` reports a repo that has not made it. The adoption question that gates the
  roster keeps its id, `adopt.personas`, and gates both paths: answers already recorded under
  that id stay valid through the move.

## Consequences

- Positive: the roster states permissions, which a spec's trust boundaries can be checked
  against; modes carry the situation that changes behaviour without duplicating a role; every
  spec now holds a testable statement of the need, tied to the criteria that prove it, which
  is the form an agent can build against.
- Negative / cost we accept: every adopting repo renames one file, rewrites its roster rows and
  adds job stories to each spec as it next touches it. Job stories in a spec and journeys in
  `docs/journeys/` can drift from each other; the journey names specs, not the reverse, so a
  drifted journey is found by reading it, not by a guard.
- Risk: a mode list grows into personas by another name. Mitigation: the "would any spec come
  out differently" test in `roles-write`, and the cap of three.

## Confirmation

`scripts/spec-structure.mjs` enforces the role gate (R10) against `docs/roles.md` (or a legacy
`docs/personas.md`, with a migration notice) and the job-story shape on every changed capability
spec; `tools/clarify-gate-test.mjs` covers both. `self-verify.mjs` reports a repo still carrying
a path the manifest lists in `removedPaths`. Mode count and the "no biography" rule are review
only.

## Revisit when

- Measured in adopting repos: job stories that changed an acceptance criterion when they were
  written, versus ones that only restated it; specs sent back from review with "who is this
  for" or "what do they need" after the change, versus before.

- Adopting repos routinely write job stories that restate the acceptance criteria word for word
  - the section has become ceremony and should merge into the criteria instead.
- Most repos end up with more modes than roles, or modes that differ only in name - the cap or
  the test for a mode is not holding.
- Spec Kit or its successors settle on a different shape for testable stories that agents
  consume better than this one.

## Related

Supersedes [ADR-006](ADR-006-personas-are-a-validation-gate.md) - the validation gate it
introduced is kept; the artifact it gated against changes. Builds on
[ADR-003](ADR-003-specs-buildable-not-descriptive.md) (buildable specs - job stories feed the
acceptance criteria), [ADR-057](ADR-057-a-drafted-artifact-says-so-at-the-top.md) and
[ADR-058](ADR-058-one-marker-says-a-human-has-not-looked-yet.md) (a roster reconstructed from the
code carries the review marker), [ADR-052](ADR-052-alignment-tracks-a-provenance-commit-not-a-version-string.md)
(`removedPaths` carries the migration).
