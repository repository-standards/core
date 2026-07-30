# ADR-004: The standard's decisions reach client repos by reference, not by copy

| | |
| --- | --- |
| **Status** | Accepted; mechanism extended to method docs by ADR-023 |
| **Date** | 2026-07-07 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, distribution, decision-records |

## Context

The standard makes methodology decisions (ADR-001, ADR-002, ADR-003, ...). A client
that adopts the standard follows the **rules** those decisions produce (`specs/README`,
conventions). Open question: do the standard's ADRs themselves get **copied** into
each client repo, or **referenced**?

## Decision drivers

- Deviating from a standard prescription is **rare**; re-aligning to a new standard
  version is **frequent**.
- A client **adopts** the standard's decisions - it does not **own** them.
- A deviation should be a visible, governed record, not a silent edit.
- A client's decision log should be about the client's product, not cluttered with
  the standard's meta-decisions.

## Options considered

- **Copy** - the standard's ADRs are copied into the client repo; the client edits
  them to deviate. Easy to deviate (edit in place), but **every standard revision
  conflicts** with the client's edited copy (forked-config drift); clutters the
  client's log; blurs ownership.
- **Reference (link)** - the standard's ADRs stay in the standard (public rationale);
  the client gets the **rules** (`specs/README`) with a link; to deviate, the client
  writes its **own** ADR that supersedes the standard's default. Trivial to update
  (nothing copied); deviation is a first-class client-owned record; zero noise.
- **Overlay layer** over copied ADRs - rejected: noise, and it does not fix the
  update conflict.

## Decision

The standard's methodology ADRs live in the standard and are **referenced, not
copied**. Clients receive the **rules** (methodology docs, which ship to `dist/`) and
link to the standard's ADR for the rationale. To deviate, a client writes its **own
ADR** that supersedes the standard's default. No copies, no overlay.

### Consequences

- Positive: standard updates stay trivial (no forked copies to reconcile); deviations
  are explicit, client-owned records; the standard's public ADRs double as adoption /
  marketing rationale; client logs stay about the client's product.
- Cost accepted: deviating takes a small ceremony (a superseding client ADR) rather
  than an in-place edit - fine, because deviation is rare and the ceremony **is** the
  correct, visible way to record it.

## Confirmation

- `dist/` ships the **rules** (`specs/README`, conventions) + the ADR template - not
  the standard's own filled ADRs.
- The standard's ADRs (`ADR-001..N`) exist **source-only** in the standard's
  `decision-records/`.
- Client deviations are recorded as client ADRs that reference the standard's default.

## Revisit when

A reflection engine (manifest + versioned migrations, Copier-style 3-way merge) makes
updateable copies cheap enough to reconsider - though a client's edits would still
conflict on update.

## Related

- Builds on ADR-001 (decision-record policy). Governs how ADR-002 / ADR-003 and future
  methodology ADRs reach clients.
