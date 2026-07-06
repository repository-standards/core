# Decision records: ADR / BDR / TDR

Every decision that shapes the product or the system gets a record. If a decision
has no record, it does not exist - reviewers and agents treat undocumented
divergence as a red flag.

Three streams, three questions:

| Stream | Question | Folder | Lifecycle |
|---|---|---|---|
| **ADR** - Architecture Decision Record | *why (technical)* | `docs/adr/` | Immutable once Accepted; change = supersede |
| **BDR** - Business Decision Record | *why (business / product)* | `docs/bdr/` | Immutable once Accepted; change = supersede |
| **TDR** - Technical Design Record | *how it works* | `docs/tdr/` | Living - edited in place as the design evolves |

Naming: `ADR-NNN-slug.md` (3-digit, gapless, never reused). Same for BDR / TDR. A
retired record is marked `Superseded` / `Withdrawn`, not deleted - the number stays
a permanent anchor.

## Status lifecycle (ADR / BDR)

`Proposed -> Accepted -> (Superseded by ADR-MMM | Deprecated | Rejected)`.

Never edit an Accepted ADR/BDR to change the decision - write a new one that
supersedes it. TDRs are living: edit in place, keep a short changelog at the top.

## Altitude hierarchy (which wins on conflict)

```
PRINCIPLES.md
  -> ADR / BDR (accepted)
    -> ARCHITECTURE.md / CODING_STANDARDS
      -> .cursor/rules + skills
        -> code
```

Higher wins. If code disagrees with an Accepted ADR, **stop** and propose a
superseding ADR - do not silently diverge.

## Governance

- One decision per record. Consider at most ~3 options - avoid analysis paralysis.
- Every ADR states **Revisit when**: the concrete signal that would reopen it.
- Link each record to the standards/docs it drives and to its issue/ticket key.
- ADR = technical why, BDR = business why, TDR = how. Do not restate an ADR inside
  a TDR - link it.
