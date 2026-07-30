# Personas - who we build for

> Fill this in for your product. Personas are not a UX nicety here - they are a
> **validation gate**: every idea, spec, backlog item, and business rule is checked
> against a named persona. "For whom?" must have an answer before "what?" and "how?".
> (See the standard's ADR-006 - personas are a validation gate.)

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

List the real customer/user types for this product. Keep it small (3-6). Mark the
**primary** persona - the one who wins ties unless a decision says otherwise.

| Persona | Primary? | One-line |
|---|---|---|
| `Owner-operator Olga` | yes | runs a small property herself, no ops team |
| `Agency admin Adam` | no | manages many properties for clients |
| `Guest Gabor` | no | books and stays; never logs into the back office |

## Persona template

Copy this block per persona.

### `<Name + role>` <!-- e.g. "Owner-operator Olga" -->

- **Who / context.** One paragraph: their role, environment, tech comfort, constraints.
- **Jobs to be done.** The progress they are trying to make ("when \_\_\_, I want to \_\_\_,
  so I can \_\_\_"). This is the durable part - features change, jobs don't.
- **Goals.** What success looks like for them, in their words.
- **Pains / frictions.** What currently blocks the job; what they must not lose.
- **Decisions they influence.** Which product/technical decisions this persona pulls on
  (links to ADR/BDR).
- **Success signals.** How we will know the product serves them (a metric, a behavior, an
  outcome - not "they are happy").
- **Anti-goals.** What this persona explicitly does not need - so we do not gold-plate for
  them.

## Worked example (delete after filling your roster)

### `Owner-operator Olga` (primary)

- **Who / context.** Runs 1-3 rental units herself alongside a day job. Comfortable with a
  phone and a spreadsheet, not with dashboards. Time-poor; touches the product in short
  bursts, often on mobile, often out of hours.
- **Jobs to be done.** "When a guest asks to change dates, I want to see if it is possible
  and confirm it in under a minute, so I can get back to my day." "When money lands, I want
  to trust it reconciled itself, so I never chase a payment."
- **Goals.** Zero double-bookings; never manually reconcile a payment; understand her month
  at a glance.
- **Pains / frictions.** Multi-step flows; jargon; anything that assumes an ops team or a
  desktop. Losing a booking to a slow confirmation.
- **Decisions she influences.** Mobile-first UI (ADR-0xx); payment auto-reconciliation
  (BDR-0xx); no required onboarding call.
- **Success signals.** >90% of date-change requests resolved in one session; 0 manual
  reconciliations per month; median back-office task < 60s.
- **Anti-goals.** Bulk operations, role management, API access - that is `Agency admin Adam`,
  not her.

## Keeping them honest

- **Reviewed at the PO stage** of every capability (see the standard's
  [ways of working](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/ways-of-working.md),
  adopted by reference at your pinned version) - the spec
  states the persona and how it serves them.
- **Referenced in the backlog** - an item names the persona whose job it advances.
- **Revisited when the market moves** - personas are living; a wrong persona misleads every
  downstream artifact, so correct it deliberately (and note what changed).
