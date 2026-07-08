---
audience: both
type: added
headline: Drop into an old repo and get a grounded plan to bring it current - decisions first, refactor last
---
- `modernize` skill (+ ADR-007, + a Modernize phase in `docs/adoption.md`) - new: the "recommendation / future" step. After a repo is understood (personas, specs, foundational ADRs from the adoption checkmap), `modernize` audits the stack, derives target versions and migration paths **grounded in the recorded specs and decisions**, records each non-trivial move as an ADR/BDR **before any code changes**, emits a sequenced + counted migration backlog ("N steps to current"), and states a maintenance rhythm so the repo stays current. Hard rule: understand -> record decisions -> then refactor - never bump-then-pray. Distinct from `update-to-version` (which bumps the *standard's* version; this bumps the *repo's own* tech).
