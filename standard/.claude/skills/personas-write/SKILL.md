---
name: personas-write
description: Use when the repo needs to name who it is for - "we don't have personas", specs written against "the user", an existing roster that no longer matches reality, or an argument about what a feature should do that keeps stalling on who it serves. Interviews for real users, or reconstructs candidates from the code when nobody remembers.
---

# personas-write

Specs in this standard are written against named personas, so a repo with no roster writes
specs against "the user" - and "the user" wants everything, which is why those specs never
settle anything.

## Where the names come from

Ask which of these the repo actually has, because the work differs completely.

- **Real users the team knows.** Interview - below. Best case.
- **Nobody remembers / nobody asked.** Reconstruct **candidates** from evidence: roles in the
  auth model, permission tiers, distinct entry points, admin surfaces, differently-shaped API
  consumers, support tickets if present. Present them as candidates to confirm or reject,
  never as findings. The code shows who the system was built for, which is a good hypothesis
  and not the same thing as who uses it.
- **Only a founder's intuition.** Write it, mark it, and say plainly that it is untested. An
  honest guess labelled as one is usable; a guess dressed as research is not.

**A repo may legitimately have one persona.** Do not manufacture a roster for symmetry -
three thin personas are worse than one real one, and they will produce three thin specs.

## What to ask for, field by field

`docs/personas.md` fixes the fields; this skill decides how to ask for them. Do not invent a
field the template does not have, and do not skip one because the user did not volunteer it -
a persona missing its anti-goals is the one that gets gold-plated for.

- **Who / context** - role, environment, tech comfort, constraints. Ask what their day looks
  like around this task, not who they are as a person: demographics and biography change no
  decision.
- **Jobs to be done** - *when \_\_\_, I want to \_\_\_, so I can \_\_\_*, in their words. The
  durable part, and the part a spec cites. If the user answers with a feature, ask what it
  would let the person accomplish, and write that instead.
- **Goals** - what success looks like from inside their head.
- **Pains / frictions** - what blocks the job today, and **what they must not lose**. Ask the
  second half explicitly; it is the constraint a spec is checked against, and users almost
  never offer it unprompted.
- **Decisions they influence** - which ADRs/BDRs this persona pulls on. Often empty at first
  and filled later; leave it empty rather than guessing.
- **Success signals** - a metric, a behaviour, an outcome. "They are happy" is not one, and
  the template says so.
- **Anti-goals** - what they explicitly do not need. Ask directly: *what would we be wasting
  our time building for them?*

## Where each part goes

Two places, and mixing them up defeats the gate:

- **The roster table** under `## The roster` - one row per persona, name in backticks, primary
  marked. **`scripts/spec-structure.mjs` reads this table and only this table**, so a persona
  described in detail but missing from it does not exist as far as R10 is concerned.
- **A detail block** per persona, copied from `## Persona template` as ``### `Name` ``.

Then **delete the worked example** section. It ships filled, from a rental-property product,
and it stays in the template on purpose - but left in a real repo it lets a spec claim to
serve a persona from someone else's domain and pass the gate.

## Draft, then check it earns its place

For each drafted persona ask: **would any spec come out differently if this one did not
exist?** If not, it is a duplicate of another persona wearing a different job title - merge
them and say so. This is the test that keeps a roster from inflating, and it is worth running
out loud so the user can overrule it.

Then check the reverse against `docs/PRODUCT.md`: does the product frame promise something to
someone with no persona here? That gap is either a missing persona or scope the product should
drop, and either way the user should see it now.

## Then

- Mark unverified assumptions `[NEEDS INPUT: ...]` rather than smoothing them over. Report how
  many are left.
- Run `node scripts/spec-structure.mjs` and show the result. A roster that does not satisfy
  the gate is not finished, and finding that out now costs a minute.
- Offer, in this order: `product-write` if the frame is missing or now contradicted;
  `spec-specify` for a capability whose persona just became clear.

## Not this

- **Do not write personas for internal roles that are really job titles.** "The developer who
  maintains this" is not a persona unless the product is built for them.
- **Do not let a persona become a feature list.** What they need, not what we plan to give
  them - the second belongs in specs and dates within a month.
- **Do not silently upgrade a guess to a finding.** A reconstructed candidate stays labelled
  as reconstructed until a human confirms it.
