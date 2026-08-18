# How many lifecycle skills ship into every adopted repo

**Decided (revised 2026-08-02):** the count is not the constraint. **Discriminability is.**
A skill earns its place when its description names a situation no other skill's description
names; it costs something only when it overlaps one. Ten skills with blurred descriptions
are worse than twenty with sharp ones, and the number on its own predicts nothing.

Currently 22 ship into every adopted repo. That is a report, not a budget.

`show-backlog` (2026-08-13) is the most recent addition, and it is the first one this entry
asked for by name: the closing paragraph wanted field evidence of a real user's sentence
matching none of the descriptions, and it arrived. On an adopted repo that had taken the
dashboard entry, "show me the backlog" matched no skill - so the backlog file got read and
summarised into chat instead, while the page that renders it went unmentioned. No description
claimed the situation and no rule named it. `add-to-backlog` is the near neighbour and the
boundary is the direction of travel: it files work, this one only reads. Both descriptions now
say so explicitly.

`record-run` (2026-08-09) was, until then, the most recent addition: the human-prompting corpus's own
README names its worst weakness as every number in it coming from people who wrote the
standard. Nothing closed that loop from inside a real adoption run - the gap was in
reflexivity, not routing, unlike every prior addition here. Its description triggers at the
close of an `align-to-standards` session, a moment no other skill's description claims.

`idea-write` (2026-08-03) was, at the time, the most recent addition: `adr-write` and `bdr-write` both
named `docs/ideas/` as where a not-yet-decided speculation belongs and neither wrote to
it - a real gap in the loop's own routing, found by testing every skill's promised
behavior against a real repo, not a count concern. Its description triggers on
"floating"/"wondering"/"might never ship" language, distinct from `bdr-write`'s "a call
gets made" and `add-to-backlog`'s "work surfaces" - no overlap found on review.

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

Not context, not count. This entry used to close by asking for field evidence - a real user's
sentence matching the wrong skill or none of them, on a repo that did not write the standard -
and that evidence arrived on 2026-08-13, when "show me the backlog" matched nothing on an
adopted repo. It confirmed the reframe rather than moving it: the fix was two sharpened
descriptions and the count did not change. The in-house failure that opened the reframe,
`spec-specify` not firing on "we need refunds", had the same shape.

So the doubt is sharper than the one it replaced: **nothing has yet failed in a way the count
could explain.** Every miss so far was a description that named no situation, and every fix
was rewording one. What would test the rule rather than confirm it is a miss no sharpening
separates - two situations a user genuinely distinguishes, where every wording of one
description keeps taking sentences meant for the other. If that arrives, discriminability is
not sufficient on its own and something has to bound the family after all.

The four authoring skills carry a different risk - four sibling files drifting apart - and it
is stated where those four are decided, in [`authoring-skills`](authoring-skills.md).
