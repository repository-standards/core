---
name: adr-write
description: Use when a technical choice gets made that someone will argue about again - "we went with Postgres over Mongo", "we're dropping the queue", "let's use Fastify", "why did we do it this way?". Drafts the decision record from what you say plus what the code and discovery notes already show, then asks only what neither can answer.
---

# adr-write

A technical decision was made. This writes the record **with** the user rather than handing
them a template - they say what they remember, the agent drafts, they correct.

## Is it an ADR at all?

Two questions, in this order:

1. **Would someone reasonably have chosen otherwise?** If not, it is a convention, and it
   belongs in `AGENTS.md` where the next person will look. One obviously-right answer does
   not need a record; it needs a line in the rules.
2. **Who would overrule it - an architect or a product owner?** An architect means ADR. A
   product owner means **BDR** and `bdr-write` is the skill (`docs/decision-records/README.md`
   has the test). If both would, write the BDR and let the ADR reference it.

Say which way you routed and why, in one line. A user who disagrees will say so, and that is
cheaper than discovering it in review.

## Draft first, ask second

**Read before asking.** The code already shows what was chosen - the dependency, the
migration, the config. `docs/discovery/` may hold the meeting where it was argued. An
existing spec may state the consequence. Draft from those, then ask only what they cannot
answer, and say where each drafted part came from so the user can correct a wrong inference
instead of re-typing a right one.

## What an ADR wants, and what to ask for each

- **Context - the forces.** Not "we needed a database". What made this contestable: the
  constraint, the deadline, the thing that broke, the disagreement. Ask: *what made this a
  decision rather than an obvious step?*
- **Options considered - at most three, with why the losers lost.** This is the part people
  skip and the part that pays. A record listing one option is a note. Ask: *what else was on
  the table, and what killed it?* If genuinely nothing else was considered, write that -
  "no alternative was evaluated" is a fact a future reader needs.
- **Decision.** One paragraph, in the present tense, as a rule the repo now follows.
- **Consequences.** What this makes easy, what it makes hard, and what someone now has to
  live with. Push for the second and third: a consequences section with only upsides is
  advertising.
- **Confirmation - how compliance is verified.** A guard, a test, a review step, or honestly
  "review only". This is what stops the record being decoration.
- **Revisit when.** The concrete signal that reopens it - a scale threshold, a version, a
  cost. Not "if it becomes a problem". Ask: *what would have to be true for us to change our
  minds?*

## Then

Number it `ADR-NNN` - gapless, never reused, next free number **as of `main`** (two branches
minting the same number is a real collision this project has hit). Copy
`docs/decision-records/adr/_template.md`, add the row to `adr/README.md`, set
`Status: Accepted` when the user confirms.

**Never edit an accepted record into a different decision.** If this supersedes one, the old
record keeps its text, flips to `Superseded`, and names this one in its `Superseded by` row.

## Not this

- **Do not write a record for a decision nobody made.** If the user is thinking out loud, it
  is an idea (`docs/ideas/`) until they approve it - `Proposed` is for a decision awaiting
  ratification, not for a maybe.
- **Do not invent the options.** Reconstructing what was on the table is the user's memory or
  the discovery dossier's, and an invented rejected option is worse than none: it will be
  cited later as if it were considered.
- **Do not bury the decision in the context.** If a reader cannot answer "what did we decide"
  from the Decision section alone, it is not written yet.
