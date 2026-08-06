---
name: spec-impact
description: Use before changing how something already works - "what breaks if we change the refund window?", "who else depends on this before I touch it?". Finds everything the change ripples to across other capability specs, decision records and code, so the change does not land having updated only the obvious file.
---

<!-- PATCHED(repository-standards): this skill is NOT vendored from github/spec-kit - ADR-015
     extracted only five prompts (specify, clarify, plan, tasks, implement); spec-impact has
     no upstream equivalent. -->
# spec-impact

Run when you are about to change how a capability works. Start from the **spec**,
then find the ripple. This is analysis - do not edit code yet.

## Steps

1. **Primary capability.** Which `specs/<capability>/` does this change belong to?
   If it is a genuinely new domain (rare), flag it - do not create a new capability
   spec just because a request or ticket exists. Search existing capabilities first.
   **Check the primary spec's `Status` first.** A `retired` capability stays in the
   repo as a record, not as something to extend - if the change targets one, stop
   and say so, and point at the BDR/ADR that retired it. A genuinely new need in
   that area is a new capability, specced fresh, not a reopening.

   **Check `Status` on every capability this reaches, not only the primary** - the
   ripple below finds retired specs too, and skipping them is how a retired spec
   ends up stating something a later change made false. A retired **ripple** target
   is not a stop: report it as a correction target (ADR-036), so the change fixes
   what it falsified rather than leaving it.

2. **Read** the primary spec and the code it maps to (`specs/capability-map.json`).
   Read the topic's dossier too, if it has one (`docs/discovery/<topic>/`, ADR-024):
   entries **newer** than its `Last reconciled:` stamp, plus anything still `new`/`open`,
   are the material that has not reached this spec yet - and new material is the usual
   reason a change to a shipped capability starts at all. Name those entries in the
   output so `spec-update` knows which ones it is folding in; entries marked
   `folded-into-spec` or `superseded-by:` are history and are never re-raised.

3. **Find the ripple:**
   - **Other capability specs** whose behavior this touches (cross-domain). A
     payments change may touch `bookings`, `refunds`, `notifications`.
   - **Decision records, BDRs as well as ADRs** - does the change need a new or
     superseding record, or contradict an Accepted one? Read **both streams**:
     what a change is *forbidden* to do is usually a business constraint - a
     licence boundary, a vendor or customer contract, a regulatory limit, a
     persona call - and it is written in a BDR's `What this rules out`, the only
     section that states a capability's non-goals. Reading the ADRs alone answers
     a different question, and answers it "none". If the change contradicts an
     Accepted record, stop: the record comes first, and it is superseded by a new
     record, never edited (R6).
   - **Code / files** - which areas change (from the capability map + reading code):
     domain services, APIs, schemas, migrations, events, integrations, tests, UI,
     feature flags. Direct and indirect behavioral impact.
   - **The other artifacts the repo keeps** - a change that contradicts a runbook is
     wrong at 3 a.m. whatever the spec says, and a specs-records-code sweep never looks
     there. Take each of these that exists and say which sentence this change falsifies,
     or that it is untouched: `docs/runbooks/` (a procedure that walks an operator
     through the behaviour being changed), `docs/personas.md` (a persona whose stated
     job, or whose "must never lose", this removes), `docs/PRODUCT.md` (a scope or KPI
     claim it contradicts), `docs/analytics.md` (an event it renames, drops or re-times)
     and the backlog (a row whose definition of done this change now meets, or makes
     impossible to meet). Grep the capability's own terms across `docs/` rather than
     re-reading everything: a sentence that contradicts this change is a sentence that
     names the thing being changed.

4. **File what this change will not address now.** A ripple found above - an
   affected capability, a needed ADR/BDR, a code area - that this change deliberately
   will not touch is real work, not scope creep to absorb: file it via
   `add-to-backlog` (source = this analysis) rather than letting it evaporate once the
   output below has been read and acted on only in part. A named backlog feeder
   (`docs/backlog.md`'s own "What feeds this backlog"), not a step this skill can skip
   just because nobody asked for it explicitly.

## Output

- Primary capability.
- Affected capabilities, with their spec paths.
- Decision-record impact, ADR **and** BDR: none / new / supersede / contradicts (link).
- Code areas to change.
- Other artifacts contradicted (runbooks, personas, PRODUCT, analytics, backlog rows) -
  each one named with the line, or "none".
- Unreconciled discovery entries for the topic (newer than the stamp, or still `new`/`open`), or "none".
- Anything filed to the backlog because this change will not address it now.

This drives `spec-update` (which specs to edit) and the technical plan.
