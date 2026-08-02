# How many lifecycle skills ship into every adopted repo

**Decided (revised 2026-08-02):** the count is not the constraint. **Discriminability is.**
A skill earns its place when its description names a situation no other skill's description
names; it costs something only when it overlaps one. Ten skills with blurred descriptions
are worse than twenty with sharp ones, and the number on its own predicts nothing.

Currently 19 ship into every adopted repo. That is a report, not a budget.

## Why the previous answer was wrong

This entry used to put the ceiling at eight to ten and note that the family had passed it
twice without anyone deciding to. Three things were wrong with it.

**It had no source.** "Respected skill collections treat eight to ten as the ceiling" was
written without a citation - and the parenthetical offered in support said Anthropic's
flagship collection ships **17**. The evidence produced to defend the number contradicted it.

**The cost it implied is not measurable.** Every skill's name and description ride in the
agent's context each turn, which was the fear. Measured on 2026-08-02: the 15 then shipping
came to **4,772 characters, roughly 1,190 tokens** - about 0.6% of a 200k window. The four
authoring skills added the same day took it to **6,319 characters, roughly 1,580 tokens**,
about 0.8%. The prediction that four more would cost around 300 tokens was made before they
were written and held. Whatever the constraint is, it is not size.

**The real failure was observed, and it was not about count.** `spec-specify` - the entry to
the whole loop - did not fire on "we need refunds", because its description read *"Create or
update a capability spec from a natural-language description"*: a definition of the artifact,
matching nothing a user would say. Rewriting the description fixed it **with the count
unchanged**. That is the experiment, run by accident: what breaks is a description that names
no situation, and it breaks at fifteen skills exactly as it would at five.

## What replaces it

Two questions before any skill ships, neither of them arithmetic:

1. **Does its description name a situation, in words a user would type?** Not the artifact it
   produces - the moment someone reaches for it.
2. **Is that situation already named by another skill?** If two descriptions could both
   plausibly match one sentence, one of them loses that sentence at random. Merge them, or
   sharpen both until the boundary is obvious to a reader.

A family that passes both can grow. One that fails either is already too big, whatever the
number says.

## What this changed downstream

[`authoring-skills`](authoring-skills.md) was blocked on this entry and recommended two
routing skills specifically to respect the ceiling. With the ceiling reframed the
recommendation inverts: **one skill per document type**, because four descriptions each
naming one situation discriminate better than two descriptions each covering two. The
constraint had been pushing toward the vaguer design.

## The doubt that survives

Not context, not count - **four sibling files drifting apart**, which this repo demonstrated
four times in one day with four copies of one command list.

Worth separating, though: those four copies restated a single fact, so any divergence was a
defect by definition. Four skills carry four different question sets and restate nothing, so
they can differ without either being wrong. A weaker risk, but not zero, and the mitigation
is that they share one structure and get read together whenever one changes.

**A better answer would** bring field evidence from a real adopted repo: a case where a real
user's sentence matched the wrong skill, or matched none, with the descriptions that did it.
That is the only thing that should move this again - and unlike the old ceiling, it names an
observation rather than a number.
