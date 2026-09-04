# Personas - who we build for

> Fill this in for your product. Personas are not a UX nicety here - they are a
> **validation gate**: every idea, spec, backlog item, and business rule is checked
> against a named persona. "For whom?" must have an answer before "what?" and "how?".
> (See the standard's ADR-006 - personas are a validation gate.)

> **Build it from the distrust, not the name.** Start each persona from what they fear,
> distrust, compare against, or need to see before they act - not from who they are.
> Identity is background you add last, not the opening move; a persona that leads with a
> name, age, and stock photo tends to describe a person without ever pinning down a
> decision.
> (Source: psychographic segmentation, Anthony Dutcher / VIX Media, via
> [Dribbble Stories](https://dribbble.com/stories/2026/08/31/cl-anthony-dutcher-vix-media-web-design-agency-research),
> Aug 2026 - adapted here from buyer psychology to product/engineering personas.)

<!-- Roster reconstructed from the code by an adoption run under `suggest`, not confirmed
     by a person yet? Open here, right after this intro - above `## The roster` so the
     marker line is never read as a persona row - with the one marker (standard ADR-057/058):
       > [NEEDS REVIEW] drafted by the adoption run on <date> from the route table and
       > `roles.js`. Backlog: <ID>.
     A roster a person wrote themselves carries no marker. -->

## Why personas gate everything

A capability that serves no one is waste; a rule that helps persona A while breaking
persona B is a silent regression. So personas sit **above** specs and the backlog in the
altitude: a spec names the persona(s) it serves and states how it serves them; a backlog
item names the persona whose problem it moves; an idea that cannot name a persona is
parked, not built. When two personas conflict, the resolution is a recorded decision
(BDR), not a coin flip.

This is the product-side mirror of buildable specs: specs make behavior verifiable against
the **code**; personas make behavior verifiable against a **user**.

## The roster

List the real customer/user types for this product. Keep it small - typically 3-6, but that
is a ceiling and not a quota: one persona you actually know beats three invented to fill the
table, and invented ones produce specs that serve nobody. Mark the **primary** persona - the
one who wins ties unless a decision says otherwise.

| Persona | Primary? | One-line |
|---|---|---|
| `{{PERSONA_NAME_AND_ROLE}}` | yes | (fill at adoption - the roster below is what the R10 gate checks specs against) |

<!-- The worked example further down carries a filled roster from a rental-property product.
     It stays there deliberately: `scripts/spec-structure.mjs` reads THIS table as the live
     roster, so example names left here would let a spec claim to serve a persona from someone
     else's domain and still pass the gate. -->


## Persona template

Copy this block per persona.

### `{{PERSONA_NAME_AND_ROLE}}` <!-- e.g. "Owner-operator Olga" -->

- **Distrust & friction (before they trust it).** What they fear, distrust, compare against,
  or need to see before they act - the friction that currently blocks the job, and what
  they must not lose. Ground it in real signals (support threads, search queries,
  competitor comparisons), not invention. This is the section a decision should actually
  hinge on - if changing it would not change a spec, a rule, or a design, keep digging.
- **Jobs to be done.** The progress they are trying to make ("when \_\_\_, I want to \_\_\_,
  so I can \_\_\_"). This is the durable part - features change, jobs don't.
- **Goals.** What success looks like for them, in their words.
- **Decisions they influence.** Which product/technical decisions this persona pulls on
  (links to ADR/BDR).
- **Success signals.** How we will know the product serves them (a metric, a behavior, an
  outcome - not "they are happy").
- **Anti-goals.** What this persona explicitly does not need - so we do not gold-plate for
  them.
- **Who / context.** One line, added last: role, environment, tech comfort. Background for
  the fear above, not the starting point.

## Worked example (delete after filling your roster)

A filled roster, from a rental-property product - this is what the table above should look
like once it is yours:

| Persona | Primary? | One-line |
|---|---|---|
| `Owner-operator Olga` | yes | runs a small property herself, no ops team |
| `Agency admin Adam` | no | manages many properties for clients |
| `Guest Gabor` | no | books and stays; never logs into the back office |

### `Owner-operator Olga` (primary)

- **Distrust & friction.** Losing a booking because a confirmation was slow, and looking
  unresponsive to a guest because of it. Doesn't trust a dashboard she has to interpret -
  wants a plain yes/no. A multi-step flow or a piece of jargon reads as "not built for
  someone like me" and she disengages rather than push through it.
- **Jobs to be done.** "When a guest asks to change dates, I want to see if it is possible
  and confirm it in under a minute, so I can get back to my day." "When money lands, I want
  to trust it reconciled itself, so I never chase a payment."
- **Goals.** Zero double-bookings; never manually reconcile a payment; understand her month
  at a glance.
- **Decisions she influences.** Mobile-first UI (ADR-0xx); payment auto-reconciliation
  (BDR-0xx); no required onboarding call.
- **Success signals.** >90% of date-change requests resolved in one session; 0 manual
  reconciliations per month; median back-office task < 60s.
- **Anti-goals.** Bulk operations, role management, API access - that is `Agency admin Adam`,
  not her.
- **Who / context.** Runs 1-3 rental units herself alongside a day job. Comfortable with a
  phone and a spreadsheet, not with dashboards. Touches the product in short bursts, often
  on mobile, often out of hours.

## Keeping them honest

- **Reviewed at the PO stage** of every capability (see the standard's
  [ways of working](https://github.com/repository-standards/core/blob/main/docs/method/ways-of-working.md),
  adopted by reference from the living standard - always latest) - the spec
  states the persona and how it serves them.
- **Referenced in the backlog** - an item names the persona whose job it advances.
- **Revisited when the market moves** - personas are living; a wrong persona misleads every
  downstream artifact, so correct it deliberately (and note what changed).
