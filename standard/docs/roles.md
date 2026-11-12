# Roles - who uses the product, and with what permissions

> Fill this in for your product. The roster is a **validation gate**: every idea, spec,
> backlog item and business rule names the role it serves. "For whom?" must have an answer
> before "what?" and "how?". (See standard ADR-064 - roles, modes and job stories
> replace personas; the gate itself is standard ADR-006's.)

> **A role is an actor, not a character.** It says who uses the product and what they are
> allowed to do - no name, age, photo or life story. Biography changes no decision; what
> does is the situation someone is in, what they fear and distrust, and what they must see
> before they act. Write those, and stop. Why this shape, what each part solves and when a
> mode is justified, with sources:
> [roles, not personas](https://github.com/repository-standards/core/blob/main/docs/method/roles-not-personas.md)
> (adopted by reference from the living standard - always latest).

<!-- Roster reconstructed from the code by an adoption run under `suggest`, not confirmed
     by a person yet? Open here, right after this intro - above `## The roster` so the
     marker line is never read as a role row - with the one marker (standard ADR-057/058):
       > [NEEDS REVIEW] drafted by the adoption run on <date> from the route table and
       > `roles.js`. Backlog: <ID>.
     A roster a person wrote themselves carries no marker. -->

## How the roster gates everything

A capability that serves no one is waste; a rule that helps one role while breaking another
is a silent regression. So roles sit **above** specs and the backlog: a spec's `**Serves:**`
field names the role (and, where it matters, the mode) it serves; a backlog item names the
role whose problem it moves; an idea that cannot name a role is parked, not built. When two
roles or two modes conflict, the resolution is a recorded decision (BDR), not a coin flip.

What the role needs is written where it is tested: each capability spec carries 1-3 **job
stories** with Given/When/Then scenarios linked to its acceptance criteria, and each key
end-to-end flow has a **journey** in `docs/journeys/` pinned to one role.

## The roster

One row per actor who uses the product - customers, staff, administrators, integrating
systems. Keep it to the actors whose permissions or needs actually differ: one role you know
beats three invented to fill the table. Mark the **primary** role - the one who wins ties
unless a decision says otherwise.

| Role | Primary? | Permissions | One-line |
|---|---|---|---|
| `{{ROLE_NAME}}` | yes | `{{WHAT_THIS_ROLE_CAN_DO}}` | (fill at adoption - this table is what the R10 gate checks specs against) |

<!-- The worked example further down carries a filled roster from a generic booking product.
     It stays there deliberately: `scripts/spec-structure.mjs` reads THIS table as the live
     roster, so example names left here would let a spec claim to serve a role from someone
     else's domain and still pass the gate. The heading `## The roster` is syntax: keep it in
     English even when the roster itself is written in another language. -->

## Role template

Copy this block per role.

### `{{ROLE_NAME}}`

- **Permissions.** What this role can see and do, and what it cannot. The line a spec's trust
  boundaries are checked against.
- **Distrust & friction (before they act).** What they fear, distrust, compare against, or
  must see before they act - the friction that blocks the job today, and what they must not
  lose. Ground it in real signals (support threads, search queries, competitor comparisons,
  interviews), not invention. If changing this would not change a spec, a rule or a design,
  keep digging.
- **Jobs.** The situations this role comes to the product in ("when \_\_\_, I want \_\_\_, so I
  can \_\_\_"). The durable part - features change, jobs don't. Each capability spec that
  serves this role turns the relevant ones into job stories with scenarios.
- **Success signals.** How we will know the product serves them (a metric, a behaviour, an
  outcome - not "they are happy").
- **Anti-goals.** What this role explicitly does not need - so we do not gold-plate for it.
- **Modes** (optional, at most 3). Add a mode only when it changes how the product behaves for
  this role. A mode shares the role's permissions and never gets its own roster row. Per mode:
  - **`{{MODE_NAME}}`** - the situation that defines it; what the product must do differently;
    any distrust that differs from the role's.
    - *Portrait* (optional) - a name, one line of context and a quote from research, for the
      empathy a human face gives. Grounded in real signals; mark an AI-drafted one
      `[NEEDS REVIEW]`. Never on the roster and never in a spec's `**Serves:**` - the guard
      reads roles only.

## Worked example (delete after filling your roster)

A filled roster, from a generic booking product - this is what the table above should look
like once it is yours:

| Role | Primary? | Permissions | One-line |
|---|---|---|---|
| `Guest` | yes | searches, books, pays and cancels own bookings; no back office | books a stay and wants certainty before paying |
| `Host` | no | manages own listings, calendar, prices and bookings on them | runs the place and answers for every booking |
| `Support agent` | no | reads any booking, issues refunds up to a limit, cannot edit listings | resolves what went wrong without owning it |

### `Guest` (primary)

- **Permissions.** Search and view public listings; create, pay for and cancel own bookings;
  message the host of a booking they hold. No access to other guests' data or any back office.
- **Distrust & friction.** Fears paying for a place that does not match the photos, and
  hidden fees appearing at the last step. Distrusts a total price that changes between search
  and checkout. Must see the full price, the cancellation terms and the exact dates before
  entering a card.
- **Jobs.** "When I find a place that fits, I want to see the final price and the
  cancellation terms at once, so I can decide without opening five tabs." "When my plans
  change, I want to cancel and know what I get back, so I am not left arguing for a refund."
- **Success signals.** Checkout abandonment after the price step under 10%; no support
  contact asking "what does this cost in total".
- **Anti-goals.** Loyalty tiers, social features, host-side analytics.
- **Modes.**
  - **`spontaneous weekend`** - booking for tonight or this weekend, usually on a phone.
    The product must show only places available now and let them book in one flow; the
    fear is that the place is gone by the time they finish.
  - **`planned family stay`** - weeks ahead, several guests, children. The product must
    filter by beds and rooms and show the cancellation window prominently; the fear is
    being locked into a non-refundable booking when plans move.
    - *Portrait:* Marta, booking for five including two small children - "I need to know I
      can cancel if one of them gets sick." (from support threads about refunds)
  - **`gift`** - booking for someone else. The product must let the payer and the guest be
    different people and keep the price off what the guest receives.

## Keeping it honest

- **Reviewed at the PO stage** of every capability (see the standard's
  [ways of working](https://github.com/repository-standards/core/blob/main/docs/method/ways-of-working.md),
  adopted by reference from the living standard - always latest) - the spec names the role,
  and its job stories say what that role needs from it.
- **Referenced in the backlog** - an item names the role whose job it advances.
- **AI-generated roles or modes are hypotheses**, not findings: useful to decide what to ask
  real users, never a substitute for asking them. Mark them `[NEEDS REVIEW]` until a person
  confirms them.
- **Revisited when the market moves** - a wrong role misleads every downstream artifact, so
  correct it deliberately (and note what changed).
