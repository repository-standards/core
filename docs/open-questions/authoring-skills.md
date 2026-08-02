# How many skills co-author a document, and whether they are worth the ceiling

**Decided (2026-08-02):** **one skill per document type** - `adr-write`, `bdr-write`,
`product-write`, `personas-write`. Four descriptions, each naming one situation, taking the
shipped family from 15 to 19. All four shipped the same day; the measured context cost came in
at 1,580 tokens for nineteen, against a prediction of about 1,490.

**How the answer changed.** This entry first recommended two routing skills, and the reason
was the ceiling: [`shipped-skills`](shipped-skills.md) put it at eight to ten, so two cost
less than four. That entry has since been revised, and the reasoning it rested on did not
survive: the ceiling had no source, the parenthetical offered to support it named a
collection shipping seventeen, and the context cost it feared measures at roughly 1,190
tokens for all fifteen - 0.6% of the window.

The constraint that actually bites is **discriminability**, and it inverts this decision.
`spec-specify` failed to fire on "we need refunds" at twelve skills and fires now at fifteen,
because its description changed and nothing else did. On that axis four sharp descriptions
beat two that each cover two situations - a routing `record-decision` must match both "we
picked Postgres over Mongo yesterday" and "we decided to charge per seat", and a description
covering both is by construction vaguer than either alone.

The ceiling was pushing toward the design that fires less reliably.

**The doubt that remains:** four sibling files can drift apart. This repo proved that four
times in one day with four copies of a command list - though those restated a single fact, so
divergence was a defect by definition, while four question sets restate nothing and can
differ legitimately. Weaker, not absent.

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
  text a request is matched against. Cost: 19 shipped skills - about 300 tokens more context,
  measured, not feared - and four files that can drift apart. **Chosen**, once the ceiling
  stopped being the deciding constraint.
- **B - Two skills, routing inside** (was recommended, now rejected). `record-decision` asks the
  who-would-overrule question first and then runs the right elicitation; `author-product`
  treats the product frame and the roster as the single conversation they are - greenfield
  already runs them together, and splitting them asks the same person the same thing twice.
  Cost: two descriptions have to cover two situations each without becoming vague, which is
  exactly the failure the description rewrite just fixed elsewhere. That cost was accepted
  while the ceiling looked binding; once it did not, this option was buying a worse trigger
  surface to save 300 tokens.
- **C - No new skills; put the elicitation in the templates.** Zero ceiling cost, and it is
  where the guidance lives today. Rejected on evidence: the templates already carry good
  prompts and the audit still found the flow asking cold, because a template is read by
  whoever already opened it - it cannot ask a question, and it cannot notice the user is
  agreeing with the worked example instead of describing their own product.
- **D - One `author` skill for everything**, routing by artifact. One description, minimal
  ceiling cost, and a description so broad it matches everything and therefore nothing
  usefully. The same failure as `spec-specify` reading "create or update a capability spec".

## What settled it

The question was whether a routing description could fire reliably on both *"we picked
Postgres over Mongo yesterday"* and *"we decided to charge per seat, not per user"*. It was
never answered directly, because the constraint that made routing attractive turned out not
to hold: the ceiling had no source, and the context cost it feared measured at 0.6% of the
window. With that gone, the argument for A was the argument that had already been settled
elsewhere - a description that names one situation fires, a description that names two is
vaguer than either.

**What would reopen it:** a real user's sentence matching the wrong one of the four, with the
descriptions that did it. That is a better test than the hypothetical, and it needs a repo
using them.

## Related

- [`shipped-skills`](shipped-skills.md) - revised: the constraint is discriminability, not count.
- `AUTHOR-1..4` in [`backlog.md`](../../backlog.md) - the work this decision gates.
