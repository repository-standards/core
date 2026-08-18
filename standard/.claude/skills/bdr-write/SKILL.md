---
name: bdr-write
description: Use when a product or business call gets made - "we're charging per seat, not per user", "we're not supporting self-hosting", "this launches to the agency segment first", "we decided to drop the free tier". Drafts the record from what you say plus the product frame and discovery notes, then asks what neither can answer.
---

# bdr-write

A business or product decision was made. This writes the record **with** the user - they say
what was decided and roughly why, the agent drafts, they correct.

## Is it a BDR?

First: is it expensive to reverse? A pricing or process tweak - which segment gets a
discount code, what a launch email says - is a one-line revert even when contestable; it
belongs in `CONTRIBUTING.md` or a product doc, not a BDR. Reserve the record for calls
costly enough that reconstructing *why* matters later - the pricing model, the market,
what the product will not do.

Then ask who would overrule it. **A product owner means BDR; an architect means ADR** and
`adr-write` is the skill. If both would, the BDR is the parent and the ADR references it -
"we charge per seat" is the decision, "we model seats in the licences table" is its
technical consequence, and conflating them is how a pricing change later reads as a schema
change.

Say which way you routed, in one line.

## What a BDR wants - and why the questions differ from an ADR's

An ADR asks about forces and options. A business decision has those too, but the parts that
decide whether it was a good one are different, and asking an ADR's questions produces a BDR
that reads like an ADR with the wrong nouns.

- **Who it serves - by name from `docs/personas.md`.** Which persona is better off, and which
  one is not. A decision that serves everyone equally is usually one nobody made. Ask: *who
  is this for, and who loses?*
- **What changes for them.** Concretely, in their words: what they can now do, what it costs
  them, what they will notice. Not "improved flexibility".
- **What it costs us.** Money, scope, a door closed, a segment given up. Ask directly: *what
  are we giving up by doing this?* A BDR with no cost is a wish.
- **What we are deliberately not doing.** The non-goals that come with it. This is the
  section that stops the decision quietly expanding for a year.
- **How we would know we were wrong.** The observable signal - a churn number, a support
  pattern, a segment that never converts. Ask: *what would we see in three months if this was
  the wrong call?* Push for something checkable; "if it doesn't work out" is not one.
- **How compliance is confirmed.** Not the same question, and this is the one that gets
  dropped: the signal above says how you would learn the decision was a *mistake*, this says
  how you would learn it is *not being kept*. Ask: *what would catch us breaking this?* A
  guard, a test, a CI check, a review step, a config value, or the spec that now carries it.
  Name the enforcement point - naming it is not designing it, and a business decision with a
  technical consequence and no named check is the one that quietly stops being followed. On
  privacy, money and safety decisions this is the whole risk, and "nothing yet" is a real
  answer that has to be written down as one.
- **Revisit when.** Usually the same signal, with a date or a threshold attached.
  **Required**, and `scripts/decision-records-check.mjs` fails the build without it -
  `discovery-digest` greps these across the log to catch a decision sitting past its own
  trigger, so a record with no signal is silently untrippable. A business decision more
  often has a real threshold than a technical one; where it genuinely has none, say so in
  the section rather than inventing a number that would fire on nothing anyone meant.
  Superseded and rejected records are exempt.
- **Decided by - what made it binding.** "The author" is a real answer where the author could
  make the call. Where a body did - a steering group, a board, a client sign-off - name it
  the way that body defines a decision (name, date, tally, quorum met). A business decision
  is contested more often than a technical one, and the row is what a challenge lands on.

These are the template's own sections - `Who it serves`, `What this rules out` and `How we
would know we were wrong` exist in the BDR template and not in the ADR one, which is the
whole reason the two records are not the same form with different nouns. `Confirmation` is
the one section both forms share, for the same reason in both: it is what stops the record
being decoration.

## Draft first, ask second

Read `docs/PRODUCT.md` for the frame this sits in, `docs/personas.md` for who is affected,
and `docs/discovery/` for the conversation where it was argued. Most BDRs are the written
form of something already half-recorded. Draft from that and say where each part came from.

If the decision contradicts `PRODUCT.md`'s stated goals or non-goals, **say so before
writing** - either the product frame moved and should be updated in the same change, or this
decision is not yet made.

## Then

Number `BDR-NNN` - gapless, never reused. Find the next free number by **reading the
directory** (`ls docs/decision-records/bdr/`), never the README table's row count and never a
remembered count - the two can disagree, and `scripts/decision-records-check.mjs` exists
because a stale or missing index row let them (it minted a second `BDR-004` once). Do this as
of the latest `main`, right before writing: `git fetch` and re-check the number is still free
immediately before committing - two branches minting the same number from an older `main` is
a real collision this project has hit. Copy `docs/decision-records/bdr/_template.md`, add the
row to `bdr/README.md`, `Status: Accepted` on confirmation. An accepted record is superseded,
never edited into a different decision.

**Fill the `Author` row with a person**, not a role and not a persona - whoever is
accountable for this decision and can be asked about it later. The template ships it as
`{{AUTHOR}}`; left unsubstituted it is an unfilled shell, and the shipped `self-verify`
warns about it the same way it warns about any other placeholder that survived. A business
record is the likeliest place to write a persona name here, and a persona is nobody.

## Not this

- **Do not design the technical consequence here.** Which table, which service, which library
  is an ADR. If the record starts specifying files, it has drifted. Naming *where* compliance
  is checked is not that, and it is required: `Confirmation` says "the retention job's test
  asserts it" or "nothing yet", and the ADR it links says how the job works.
- **Do not soften the cost.** The section exists so a future reader can tell whether the
  trade was worth it, and a BDR whose costs are all upside teaches them the records lie.
- **Do not record a decision the user is still thinking about.** That is an idea until
  approved, and **`idea-write`** is the skill that catches it - named here because it, not
  the `docs/ideas/` folder, carries the template, the persona check and the graduation
  contract. Writing the file by hand skips all three.
