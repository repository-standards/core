# Roles, modes and job stories - why not personas

Every spec, backlog row and idea in this standard has to say who it serves. That question is
the gate: a capability that serves nobody is waste, and a rule that helps one actor while
breaking another is a regression nobody notices. The gate has not changed. What a repository
writes to answer it has, and this page explains what it writes now and why.

The short version: **say who acts and what they may do (a role), say the situation that changes
what they need (a mode, only when it matters), and say the need in a form a test can hold (a job
story).** Then draw the few flows the product exists for (a journey).

## What a classic persona got wrong

A classic persona is a fictional person: a name, an age, a photo, a short life story, goals and
pain points. It was a good tool for making a team remember that users exist. As the thing a spec
is checked against, it fails in three ways.

- **The biography changes no decision.** "Olga, 42, runs two flats alongside a day job" is the
  easiest part to write and the part no spec ever cites. What a spec actually depends on is what
  the person may do in the product, what situation they are in, and what they fear before they
  act. Those three things are not a person's life story.
- **One person behaves several ways.** The same guest of a booking product books a spontaneous
  weekend on a phone, a family stay weeks ahead, and a gift for somebody else. The product has to
  filter, warn and price differently in each. A persona averages the three into one character
  who behaves like none of them; a second persona for the same guest copies the permissions just
  to carry a different situation.
- **The need lived one hop away from the proof.** The spec named the persona and then went to
  its contracts. What the persona needed from the capability was in another file, and nothing
  tied it to the acceptance criteria that prove the capability delivers it.

There is a fourth problem that has grown recently: personas are cheap to generate with AI and
look exactly like researched ones. Nielsen Norman Group tested AI-generated users against
studies with real participants and concluded they are good for forming hypotheses, not for
replacing the people you would ask
([Rosala and Moran, 2024](https://www.nngroup.com/articles/synthetic-users/)). A roster that
rests on them is the weakest evidence a gate can check against.

## What replaces it, and what each part solves

| Part | What it is | What it solves | Where it lives |
|---|---|---|---|
| **Role** | An actor who uses the product, with what they may and may not do. No name, no biography. | Specs have a stable name to serve, and trust boundaries have permissions to be checked against. | `docs/roles.md`, the `## The roster` table |
| **Mode** | A behavioural situation of one role that changes how the product must behave. At most 3 per role, optional. | The same actor in different situations is served correctly without inventing a second actor. | Under its role in `docs/roles.md` |
| **Job story** | `When <situation>, I want <motivation>, so I can <outcome>`, with a GIVEN/WHEN/THEN scenario naming the acceptance criterion that proves it. 1-3 per spec. | The need is stated where it is built, in a form an agent can build and a test can check. | `## Job stories` in every capability spec |
| **Journey** | One key end-to-end flow for one role, stage by stage, each stage naming the specs that serve it. | The few flows the product exists for are visible as a whole, and gaps between specs show up as stages nobody serves. | `docs/journeys/` |

**What survives from the persona.** The distrust-first content - what someone fears, what they
distrust, what they compare against, what they must see before they act - is the part of a
persona decisions actually hinge on. It stays, as a required field of each role, and of each
mode where the fear differs.

## When a mode is justified

Add a mode only if **some spec, rule or design would come out differently without it**. Run the
test out loud for each candidate:

- A guest booking a **spontaneous weekend** needs only places available now and a one-flow
  booking on a phone. A guest booking a **planned family stay** needs filters for beds and rooms
  and the cancellation window shown up front. A **gift** booking needs the payer and the guest to
  be different people. Each one changes what the product does: three modes.
- A guest who "likes clean design" or "travels for work" changes nothing the product does
  differently: not a mode.
- Two "modes" with different permissions are not modes of one role. They are two roles.

More than three modes under one role usually means two of them are the same situation, or one
of them is really another role.

## How it fits together, on one example

The roster of a generic booking product says `Guest` may search, book, pay for and cancel their
own bookings, and nothing in the back office. `Guest` has three modes. The booking capability
spec says ``**Serves:** `Guest` (spontaneous weekend)`` and carries:

```markdown
## Job stories

- **JS-1.** When I find a place for tonight, I want to book it in one flow on my phone,
  so I can stop searching before it is gone.
  - GIVEN a place available tonight WHEN the guest books it from a phone THEN the booking
    is confirmed without leaving the flow. (AC: One-flow booking)
```

`One-flow booking` is a bold criterion name under the spec's `## Acceptance criteria`, so the
structure guard can check the link, and the test that proves the criterion proves the job. The
journey "book a stay" for `Guest` names the booking spec at its "core use" stage.

## Why this shape, and where it comes from

Current practice has not dropped the "who is this for" question. It has moved where the answer
starts: from the person to the situation and the problem.

- **Spec-driven development.** GitHub's Spec Kit starts a specification from user journeys and
  prioritised user stories, each independently testable, with Given/When/Then acceptance
  scenarios; every feature traces back to a story with clear acceptance criteria
  ([Specification-Driven Development](https://github.com/github/spec-kit/blob/main/spec-driven.md),
  [spec template](https://github.com/github/spec-kit/blob/main/templates/spec-template.md)).
  When agents read the spec, a testable story is the form they can build against.
- **Jobs to be done.** Bob Moesta's switch interviews look for the situation and the forces that
  make someone change what they use, not for who they are
  ([Understanding Your Customer Jobs-to-be-Done, 2023](https://businessofsoftware.org/talks/understanding-your-customer-jtbd/)).
  Intercom turned that into the job story, written when the team wanted something better than
  personas ([Paul Adams, How we accidentally invented Job Stories, 2016](https://www.intercom.com/blog/accidentally-invented-job-stories/);
  [Alan Klement, Designing features using Job Stories, 2013](https://www.intercom.com/blog/using-job-stories-design-features-ui-ux/)).
- **Archetypes over biographies.** Nielsen Norman Group shows that a well-made persona and an
  archetype carry the same research, and the archetype drops the invented human details
  ([Page Laubheimer, Personas vs. Archetypes, 2022](https://www.nngroup.com/articles/personas-archetypes/)).
  A mode is an archetype of one role.
- **Synthetic users are hypotheses.** AI-generated users help decide what to ask real people and
  nothing more ([Maria Rosala and Kate Moran, Synthetic Users, 2024](https://www.nngroup.com/articles/synthetic-users/)).
  A role or mode drafted that way stays marked `[NEEDS REVIEW]` until a person confirms it.
- **Opportunities hang off outcomes.** Teresa Torres's opportunity solution tree breaks an outcome
  into opportunities - needs seen in real situations - and hangs solutions off those
  ([Opportunity Solution Trees](https://www.producttalk.org/opportunity-solution-trees/)). A job
  story is that opportunity, written down next to the capability that answers it.
- **Problems first, people second.** The same move is argued from the go-to-market side: start
  from the problems and jobs, and use personas, if at all, to sharpen what you say afterwards
  ([Jana Frejova, Personas are dead, long live their problems, 2022](https://saassygtm.substack.com/p/the-saassy-guide-to-personas-are)).

The decision and the options it rejected are recorded in
[ADR-064](../decision-records/ADR-064-roles-modes-and-job-stories-replace-personas.md).

## Terms

- **Role** - an actor who uses the product, defined by what they may do. Named in backticks in
  the roster; the name a spec's `**Serves:**` field uses.
- **Primary role** - the role that wins a tie between roles unless a BDR says otherwise.
- **Mode** - a behavioural situation of one role that changes what the product must do. Shares
  the role's permissions, has no roster row, at most three per role.
- **Job story** - `When <situation>, I want <motivation>, so I can <outcome>`, labelled
  `**JS-n.**`, with at least one GIVEN/WHEN/THEN scenario ending `(AC: <criterion name>)`.
- **Journey** - one key end-to-end flow for one role, in stages, each naming the specs serving it.
- **The roster** - the table under `## The roster` in `docs/roles.md`; the only list the
  structure guard checks `**Serves:**` against.

## What the guard checks

`scripts/spec-structure.mjs` fails a capability spec whose `**Serves:**` names no role on the
roster, and a spec whose `## Job stories` section is malformed: no `**JS-n.**` story, more than
three, a story with no scenario, or a scenario naming no criterion or one that does not exist.
A spec a change touches must carry the section; a spec nobody has touched since the rule
arrived is reported as a warning in a full-tree run, so adopting the rule never fails a repo for
history, and a change that only renames the role in `**Serves:**` is not held to it either.
A named sub-spec extends its capability's `spec.md` and is checked once it has the section. A repo still on `docs/personas.md` keeps working, and the guard says how to move it -
the `roles-write` skill carries the procedure.
