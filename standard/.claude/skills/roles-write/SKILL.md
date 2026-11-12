---
name: roles-write
description: Use when the repo needs to name who it is for - "we don't have a roster", specs written against "the user", an old personas file to migrate, a roster that no longer matches who uses the product, or an argument about what a feature should do that keeps stalling on who it serves. Interviews for the real actors, or reconstructs candidates from the code when nobody remembers, and adds behavioural modes only where they change what the product does.
---

# roles-write

Specs in this standard are written against named roles, so a repo with no roster writes specs
against "the user" - and "the user" wants everything, which is why those specs never settle
anything.

A role is an **actor with permissions**, not a character: who uses the product and what they
are allowed to do. No name, age, photo or life story - biography changes no decision. What
changes decisions is the situation someone is in and what they fear before they act, and those
are what this skill asks for.

## Where the roles come from

Ask which of these the repo actually has, because the work differs completely.

- **Real users the team knows.** Interview - below. Best case.
- **Nobody remembers / nobody asked.** Reconstruct **candidates** from evidence: roles in the
  auth model, permission tiers, distinct entry points, admin surfaces, differently-shaped API
  consumers, support tickets if present. The auth model is usually the roster's first draft -
  it names the actors and their permissions outright. Present them as candidates to confirm or
  reject, never as findings: the code shows who the system was built for, which is a good
  hypothesis and not the same thing as who uses it.
- **Only a founder's intuition, or an AI-generated draft.** Write it, mark it
  `[NEEDS REVIEW]`, and say plainly that it is untested. AI-synthesised users are good for
  deciding what to ask real people and nothing more; they are the weakest evidence a roster
  can rest on.
- **An old `docs/personas.md`.** Migrate it - see the last section.

**A repo may legitimately have one role.** Do not manufacture a roster for symmetry - three
thin roles are worse than one real one, and they will produce three thin specs.

## What to ask for, field by field

`docs/roles.md` fixes the fields; this skill decides how to ask for them. Do not invent a field
the template does not have, and do not skip one because the user did not volunteer it - a role
missing its anti-goals is the one that gets gold-plated for.

- **Permissions** - what this role can see and do, and what it cannot. Ask for the second half
  explicitly; it is what a spec's trust boundaries are checked against.
- **Distrust & friction** - what they fear, distrust, compare against, or must see before they
  act, and **what they must not lose**. Ask it as "what would make them stop and leave?", not
  "what are their pain points?". It is the field a decision hinges on; if changing it would
  not change a spec, keep digging.
- **Jobs** - *when \_\_\_, I want \_\_\_, so I can \_\_\_*, in their words. If the user answers
  with a feature, ask what it would let the person accomplish, and write that instead. These
  become job stories in the specs that serve the role.
- **Success signals** - a metric, a behaviour, an outcome. "They are happy" is not one.
- **Anti-goals** - what they explicitly do not need. Ask directly: *what would we be wasting
  our time building for them?*

## Modes - only when the product behaves differently

A mode is a behavioural archetype of one role: the same permissions, a different situation. A
guest of a booking product books a **spontaneous weekend**, a **planned family stay** or a
**gift**, and the product has to filter, warn and price differently in each.

- **Ask for modes last**, after the role's jobs are written, and only as: *does this role come
  to the product in situations where the product must behave differently?*
- **Test each one out loud:** would any spec, rule or design come out differently if this mode
  did not exist? If not, it is not a mode - drop it and say so.
- **At most three per role.** A fourth usually means two of them are the same situation, or
  one of them is really a separate role with different permissions.
- A mode never gets a roster row. A spec that serves one names it after the role:
  ``**Serves:** `Guest` (spontaneous weekend)``.

## Where each part goes

Two places, and mixing them up defeats the gate:

- **The roster table** under `## The roster` - one row per role, name in backticks, primary
  marked, permissions in their own column. **`scripts/spec-structure.mjs` reads this table and
  only this table**, so a role described in detail but missing from it does not exist as far as
  R10 is concerned. The heading is syntax and stays in English.
- **A detail block** per role, copied from `## Role template` as ``### `Role` ``, with its
  modes inside it.

Then **delete the worked example** section. It ships filled, from a generic booking product,
and it stays in the template on purpose - but left in a real repo it lets a spec claim to serve
a role from someone else's domain and pass the gate.

## Draft, then check it earns its place

For each drafted role ask: **would any spec come out differently if this one did not exist?**
If not, it is a duplicate of another role under a different title - merge them and say so.

Then check the reverse against `docs/PRODUCT.md`: does the product frame promise something to
an actor with no role here? That gap is either a missing role or scope the product should drop,
and either way the user should see it now.

Then name the **key end-to-end flows** - the few the product exists for - and offer a journey
for each in `docs/journeys/` (from `_template.md`), one per flow, pinned to one role.

## Migrating an old `docs/personas.md`

1. `git mv docs/personas.md docs/roles.md`. Keep `## The roster`.
2. Rewrite each roster row as an actor: the role name in backticks (drop the personal name),
   a `Permissions` column, the one-line kept. Two personas with the same permissions and
   different situations become **one role with two modes**.
3. Keep each persona's distrust & friction content - it moves to the role, or to the mode
   whose situation it describes. Drop the biography line ("Who / context") unless it states a
   permission or a constraint a spec depends on.
4. Rename the name in every spec's `**Serves:**` field, backlog row and journey to the new
   role name. A change that only renames the role in `**Serves:**` is not held to job
   stories; add them to each spec the next time a change touches what it says.
5. Run `node scripts/spec-structure.mjs` - the legacy-roster notice disappears once the file
   is `docs/roles.md`.

## Then

- Mark unverified assumptions `[NEEDS INPUT: ...]` rather than smoothing them over. Report how
  many are left.
- Run `node scripts/spec-structure.mjs` and show the result. A roster that does not satisfy
  the gate is not finished, and finding that out now costs a minute.
- Offer, in this order: `product-write` if the frame is missing or now contradicted;
  `spec-specify` for a capability whose role just became clear.

## Not this

- **Do not write a biography.** Name, age, family, hobbies and a stock photo describe a person
  without pinning down a decision.
- **Do not write roles for internal job titles.** "The developer who maintains this" is not a
  role unless the product is built for them.
- **Do not let a role become a feature list.** What they need, not what we plan to give them -
  the second belongs in specs and dates within a month.
- **Do not silently upgrade a guess to a finding.** A reconstructed candidate stays labelled
  as reconstructed until a human confirms it.
