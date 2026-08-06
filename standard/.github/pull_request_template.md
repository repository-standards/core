<!-- Keep this short and honest. Delete sections that do not apply. -->

## What

<!-- What does this change do, in one or two sentences? -->

## Why

<!-- Link the ticket / issue. What problem does this solve? -->

## Decision-record impact

<!-- Tick one. Accepted records are binding - do not silently contradict one.
     Read BOTH streams. An ADR says how the thing is built; a BDR says what the
     business has ruled out - a licence boundary, a vendor or customer contract, a
     regulatory limit, a persona call - and that lives in a BDR's `What this rules
     out`, the only section stating a capability's non-goals. Reading the ADRs alone
     answers a different question, and answers it "none". -->

- [ ] None - touches no accepted decision, in either stream
- [ ] Updates a living standard only (no new record)
- [ ] Adds a new record (link it, and say which stream)
- [ ] Supersedes an existing record (link both)
- [ ] Contradicts an accepted record - resolve that first. The record comes first,
      and it is superseded by a new record, never edited (R6)

## Test plan

<!-- How was this verified? Local checks run, manual steps, screenshots. -->

## Checklist

- [ ] Ran the repo's local checks (format / lint / typecheck / tests as applicable)
- [ ] Self-reviewed the diff (see the `pre-pr-review` skill)
- [ ] No secrets in the diff
- [ ] Based on `main` and rebased onto it - no merge commits from `main`, no
      stacking on another PR's branch; every commit stands on its own (R23)
