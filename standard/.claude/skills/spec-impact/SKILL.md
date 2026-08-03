---
name: spec-impact
description: Use before changing how something already works - "what breaks if we change X?", "can we make bookings cancellable?". Finds everything the change ripples to across other capability specs, decision records and code, so the change does not land having updated only the obvious file.
---

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

2. **Read** the primary spec and the code it maps to (`specs/capability-map.json`).

3. **Find the ripple:**
   - **Other capability specs** whose behavior this touches (cross-domain). A
     payments change may touch `bookings`, `refunds`, `notifications`.
   - **ADRs** - does the change need a new/superseding decision, or contradict an
     Accepted ADR? If it contradicts one, stop: an ADR comes first.
   - **Code / files** - which areas change (from the capability map + reading code):
     domain services, APIs, schemas, migrations, events, integrations, tests, UI,
     feature flags. Direct and indirect behavioral impact.

## Output

- Primary capability.
- Affected capabilities, with their spec paths.
- ADR impact: none / new / supersede (link).
- Code areas to change.

This drives `spec-update` (which specs to edit) and the technical plan.
