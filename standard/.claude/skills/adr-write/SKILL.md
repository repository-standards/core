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
   product owner means **BDR** and `bdr-write` is the skill. The test itself is R5, and the
   standard works it through in [decision records (by reference)](https://github.com/repository-standards/core/blob/main/docs/tree/docs-decision-records.md).
   If both would overrule it, write the BDR and let the ADR reference it.

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

Number it `ADR-NNN` - gapless, never reused. Find the next free number by **reading the
directory** (`ls docs/decision-records/adr/` or wherever this repo's ADRs actually live),
never the README table's row count and never a remembered count - the two can disagree, and
`scripts/decision-records-check.mjs` exists because a stale or missing index row let them.
Do this **as of the latest `main`**, right before you write the file: `git fetch` and
re-check the number is still free immediately before committing, not only when you started -
two branches minting the same number from an older `main` is a real collision this project
has hit, and rebasing late narrows the window but does not close it. Copy
`docs/decision-records/adr/_template.md`, add the row to `adr/README.md`, set
`Status: Accepted` when the user confirms.

**Fill the `Author` row with a person**, not a role and not a persona - whoever is
accountable for this decision and can be asked about it later. The template ships it as
`{{AUTHOR}}`; left unsubstituted it is an unfilled shell, and the shipped `self-verify`
warns about it the same way it warns about any other placeholder that survived.

**Never edit an accepted record into a different decision.** If this supersedes one, the old
record keeps its text, flips to `Superseded`, and names this one in its `Superseded by` row.

## Not this

- **Do not write a record for a decision nobody made.** If the user is thinking out loud, it
  is an idea until they approve it - `Proposed` is for a decision awaiting ratification, not
  for a maybe. Hand it to **`idea-write`**, by name: that skill owns the idea template, the
  "an idea that serves no persona is parked" check and the graduation contract, and writing
  a file into `docs/ideas/` yourself is how all three get skipped.
- **Do not invent the options.** Reconstructing what was on the table is the user's memory or
  the discovery dossier's, and an invented rejected option is worse than none: it will be
  cited later as if it were considered.
- **Do not bury the decision in the context.** If a reader cannot answer "what did we decide"
  from the Decision section alone, it is not written yet.
