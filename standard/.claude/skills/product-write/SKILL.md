---
name: product-write
description: Use when the repo needs to state what it is building and for whom - starting a product, "we never wrote down what this app actually does", a PRODUCT.md that is stale or empty, or an argument about scope that keeps recurring because nothing settles it. Interviews for the frame, drafts it, and marks what is still unknown rather than inventing it.
---

# product-write

`PRODUCT.md` is the top of the altitude ladder - the thing specs, decisions and backlog items
get judged against. This writes it by interview, not by template-filling.

## First: is it empty, stale, or contested?

Three different jobs, and doing the wrong one wastes the session.

- **Empty** - a full interview, below.
- **Stale** - the product moved and the file did not. Do not rewrite from scratch: read it,
  read the specs and the accepted BDRs that came after it, and show the user the specific
  contradictions. Ask about those. A frame that survived contact deserves editing, not
  replacement.
- **Contested** - the file is fine but people disagree with it. That is not a writing task;
  it is a decision, and `bdr-write` is the skill. Say so.

## The interview

Ask few questions, in this order, and **stop after each** - the answers change what is worth
asking next. Draft as you go and play it back in the user's own words.

1. **What is it, in one sentence a stranger would understand?** If the answer needs a second
   sentence, the product is not one product yet - and that is worth naming now rather than
   discovering it three capabilities in.
2. **Who is it for?** Names, roles, or segments. If `docs/personas.md` exists, read it first
   and ask whether it is still right; if it does not, this is where it starts, and
   `personas-write` takes over once names appear.
3. **What do they do today instead?** The status quo, including "nothing" and "a
   spreadsheet". A product with no alternative being displaced usually means the problem has
   not been found yet.
4. **What has to be true for this to be worth building?** The bet underneath. Ask plainly:
   *what would make us stop?*
5. **What is explicitly out of scope?** Push here. Non-goals are the highest-value section in
   the file and the one users skip - they are what makes the frame able to settle an argument
   later. Ask for three, accept fewer, but ask.
6. **How will we know it worked?** Observable, ideally countable. "Users are happy" becomes
   "the second visit happens without support contact".

The answers map onto the template's sections - `What it is`, `What people do today instead`,
`Vision` (which is where the bet goes), `Users / personas`, `Non-goals`, `Success metrics`.
Ask in the order above, which is the order that makes sense to a person; write in the
template's order, which is the order that makes sense to a reader.

`Current state` and `Key capabilities` are not interview questions - fill them from what the
repo actually contains, and mark what you could not determine.

## Unknowns get marked, not filled

Anything the user does not know becomes `[NEEDS INPUT: what is unknown]` - the same marker the
rest of the standard uses, so the gate counts it and it cannot quietly become a fact. **A
guessed success metric is worse than a marked one**: it will be measured against.

Say at the end how many markers are left and that the file is usable with them in place.

## Then

- Write `docs/PRODUCT.md` (`docs/product/` in a repo that has one).
- If the interview produced named users, offer `personas-write` next - the two files reference
  each other and a persona invented later rarely matches the frame.
- If it produced decisions already made ("we're not doing self-hosting"), offer `bdr-write`
  for each. Decisions embedded in a product frame are invisible; as records they are citable.
- If it produced distinct areas of behaviour, name them as candidate capabilities and offer
  `spec-specify`. Do not write the specs here.

## Not this

- **Do not write a product frame for a repo that is a library or a tool with no users beyond
  its callers.** `README.md` is the right file. Ask if unsure.
- **Do not turn it into a roadmap.** What is being built and why, not when and in what order -
  that is the backlog and the cycles, which change weekly while this should not.
- **Do not invent the metric.** See above; this is the single most common way this file
  becomes a thing nobody trusts.
