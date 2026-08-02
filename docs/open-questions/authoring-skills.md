# How many skills co-author a document, and whether they are worth the ceiling

**Decided, provisionally:** two skills - `record-decision`, routing ADR vs BDR by the
who-would-overrule test and then running the elicitation that record deserves, and
`author-product`, covering `PRODUCT.md` and `docs/personas.md` as one conversation. Two
skills, four elicitation shapes, taking the shipped family from 12 to 14.

**The doubt:** [`shipped-skills`](shipped-skills.md) puts the ceiling at eight to ten and
records that this family already passed it "one useful skill at a time, which is exactly
how a ceiling gets passed without anyone deciding to pass it". This entry proposes doing
that again, deliberately, and it should be argued rather than waved through.

## Why anything is needed here at all

The spec loop has six skills to produce one artifact. Decisions, the product frame and the
persona roster have templates and nothing that writes them *with* anyone. So the flow asks
a product person to fill an ADR the way a developer would, and the result is what always
happens when a form replaces a conversation: the sections get filled and the thinking does
not.

The elicitations are genuinely different, which is the whole argument:

- **An ADR** wants the forces that made this contestable, the options actually weighed and
  why the losers lost, the consequences someone will live with, how compliance is confirmed,
  and what would reopen it.
- **A BDR** wants who it serves, what changes for them, what it costs, what we are
  deliberately not doing, and how we would know we were wrong.
- **A product frame** wants the one sentence, the problem, the observable three-month
  outcome, and the non-goals - the last being the question nobody answers unprompted.
- **A persona roster** wants jobs to be done, pains, anti-goals, and which one wins ties.

Hand all four the same eight prompts and you get a BDR that reads like an ADR with the
wrong nouns.

## Options weighed

- **A - One skill per document type** (`adr-write`, `bdr-write`, `product-write`,
  `personas-write`). Cleanest triggering: each description names one situation, so the model
  matches it precisely - which matters more than it looks, since a description is the only
  text a request is matched against. Cost: 16 shipped skills, every name and description in
  the agent's context every turn, and four files that will drift apart the way four copies
  of the gate list did today. Rejected on the ceiling.
- **B - Two skills, routing inside** (recommended). `record-decision` asks the
  who-would-overrule question first and then runs the right elicitation; `author-product`
  treats the product frame and the roster as the single conversation they are - greenfield
  already runs them together, and splitting them asks the same person the same thing twice.
  Cost: two descriptions have to cover two situations each without becoming vague, which is
  exactly the failure the description rewrite just fixed elsewhere.
- **C - No new skills; put the elicitation in the templates.** Zero ceiling cost, and it is
  where the guidance lives today. Rejected on evidence: the templates already carry good
  prompts and the audit still found the flow asking cold, because a template is read by
  whoever already opened it - it cannot ask a question, and it cannot notice the user is
  agreeing with the worked example instead of describing their own product.
- **D - One `author` skill for everything**, routing by artifact. One description, minimal
  ceiling cost, and a description so broad it matches everything and therefore nothing
  usefully. The same failure as `spec-specify` reading "create or update a capability spec".

## What would settle it

Whether a routing skill can keep a description that fires reliably. If `record-decision`
cannot be described in a way that matches both "we picked Postgres over Mongo yesterday" and
"we decided to charge per seat, not per user", option A's cost buys something real and the
ceiling is the wrong constraint to optimise. That is testable before committing to either:
write the two descriptions, and check whether they match the sentences a user would say.

The ceiling itself also deserves questioning rather than obeying. It was noted from
collections that ship for every domain combined; a per-repo family that ships one workflow
may simply have a different number. But that is an argument for revisiting
[`shipped-skills`](shipped-skills.md), not for quietly exceeding it here.

## Related

- [`shipped-skills`](shipped-skills.md) - the ceiling this entry pushes against.
- `AUTHOR-1..4` in [`backlog.md`](../../backlog.md) - the work this decision gates.
