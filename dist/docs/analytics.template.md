# Analytics tracking plan - the event taxonomy (template)

<!-- PDLC-3. Fill for your product. The most code-adjacent drift there is: events named
     ad-hoc in code make every dashboard a lie. This file is the single source for
     event names; the same-PR rule below is what keeps it true. -->

## The rules

1. **Every product event the code emits is listed here first.** An event not in this
   plan is a bug, not telemetry.
2. **Same-PR coupling:** a change that adds, renames, or removes an event updates this
   file in the same PR (guardable exactly like spec<->code coupling - grep the event
   registry against this table in CI).
3. **Naming:** `domain.object_action` (e.g. `booking.payment_captured`), snake_case,
   past tense for facts. Rename = migration note in the row, never a silent swap.
4. **Every event serves a KPI.** An event no KPI reads gets removed - collection is
   not free (privacy, noise, cost).

## The plan

| Event | Trigger (when exactly) | Properties (name: type) | KPI it feeds (from PRODUCT's KPI tree) | Owner |
|---|---|---|---|---|
| `<domain.object_action>` | `<the precise moment>` | `<prop: type, ...>` | `<KPI>` | `<team/person>` |

## Retired events

| Event | Retired | Replaced by | Note |
|---|---|---|---|
| - | - | - | - |
