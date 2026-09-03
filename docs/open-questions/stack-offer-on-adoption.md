# Who decides Layer 2 during an adoption

**Decided:** the router asks, and never applies a stack on its own. The intake's
question round covers "technology + Layer 2 consent", the technology is looked up in
[`stacks.json`](../../stacks.json) before any offer is made, and the reconciliation
runs later in its own phase - "Consent is gathered here; the actual stack
reconciliation runs later"
([`SKILL.md`](../../skills/align-to-standards/SKILL.md)). R20 makes the two layers
adoptable independently, so declining is a first-class answer rather than a failure
to comply.

**Doubt:** the path has almost never been walked, and where it was, the user was not
the one who answered. Two shapes of run exist in the validation suite and neither
tests the gate:

- **The user names the stack.** The corpus's most-run entry line so far is `A26`
  (`take this repo onto repositorystandards.com with the node stack`), which supplies
  consent in its opening words - detection is never exercised, only obedience. `A2`,
  the shipped stack-named line, has not been run at all.
- **Nobody names it.** `RET1` (the entry line retired on 2026-08-19, ending "interview me
  for what you need") has run twice against
  `hagopj13/node-express-boilerplate` - the only entry line ever run where the repo
  matches the one registered technology and the prompt says nothing about a stack. Both
  times Layer 2 ended up unapplied, and both times something other than the user's
  answer decided it: once the agent judged it itself ("adopting that stack wholesale
  would be a rewrite of the product rather than an alignment of it"), once the owner
  had declared Layer 1 only before the question could arise. The three
  JavaScript/TypeScript adoptions in the AI-prompting suite - `honojs/hono`,
  `drizzle-team/drizzle-orm`, `usebruno/bruno`, all on the registered technology -
  record no observation about a Layer 2 offer at all; their single mention of a stack
  is a Layer 1 deny-list entry being adapted.

So no run has recorded a registered stack being detected, offered cold, accepted and
applied. `STACK-ALIGN-1` says the same from the other side: the Layer 2 path has not
executed against any repo. What the runs do show is the offer being **declined** in
every form - by the agent's judgment, by a declared profile, by a repo whose
technology was never the stack's - which is a decent sign that nothing gets applied
silently, and no evidence at all about the accept path.

**Update, 2026-09-03:** one run has now walked the accept path - the h adoption
([`runs/2026-09-03-h-monorepo-adoption.json`](../validation/human-prompting/runs/2026-09-03-h-monorepo-adoption.json),
transcript alongside). It settles the first half and reopens the second: the gate
fires, and asking at intake, as it is done today, is not the right default. The
section at the end of this file has the evidence.

**A better answer would:** come from an adoption where a registered technology is
detected rather than announced. One run, on a repo the registry matches, driven from
`A1` or `A2` with a user who says yes, recording verbatim what the router said about
the stack, whether it asked before touching anything, and whether
`stack.manifest.json` landed. That is `FIELD-1` territory and would settle both
halves at once: whether the gate fires, and whether asking is the right default when
it does.

## Options in view

Listed rather than weighed - the evidence to weigh them does not exist yet.

1. **Ask at intake** (in force). One question round covers everything, so the user
   answers before any work starts. Costs an answer from someone who may not have one
   yet - the same tension `greenfield.md` already records when it says the process is
   not stack-first.
2. **Auto-apply on an unambiguous match.** Fewer questions, and Layer 2 is where most
   of the mechanical value sits. Against it: a stack rewrites lint, type and test
   tooling, the largest diff any adoption produces, and `hono` refusing the pnpm
   requirement over bun is exactly the case that would have been forced through.
3. **Detect, say nothing, offer at the end.** Layer 1 lands first and the stack is
   proposed against a repo already at drift 0, when the user can see what the machine
   does. Against it: the technology is known at intake, and holding it back to raise
   later is a question asked twice.
4. **Ask at intake, as its own declared question, and say when it lands.** Added after
   the h run. The offer stays where the technology is known, but it stops being one
   line in a card of four with no point id: `adopt.stack` is declared in
   `points.json` on the brownfield path, asked on its own with the detected
   technology and the stack's conflicting picks in front of the user, and the
   application is announced - a stack section in the run summary and the PR body, and
   a commit a reviewer reads as "the Node stack is in". Against it: one more question
   round; and it does nothing for the 12:14 case if the announcement is text the user
   has to scroll to.

## What the accept path looked like when it ran (2026-09-03)

A private monorepo on the registered technology, driven from `A1` by its owner. The
router detected TypeScript on pnpm, looked the stack up, and offered it at 09:55 as the
second of four questions in one card, headed `[technology / Layer 2]` with no point id
because none is declared - `points.json` has `green.stack` on the greenfield path and
nothing on this one. The recommended option was **Layer 1 only now**, on the ground
that the stack's picks (Biome, Better Auth, CSS Modules) conflict with the repo's
(ESLint + Prettier, Cognito, NativeWind). The owner chose **Layer 1 + Node stack**.
The layer landed as `stack.manifest.json`, `.nvmrc`, two workspace keys and two stack
exceptions, in one commit among nine authored at 11:05 UTC, seventy minutes after the answer.

At 12:14, seventy minutes after that commit, the owner asked how the Node stack had
been taken into account, "because I do not see it". At the end of the day, asking for
this evidence to be contributed, they wrote that
the layer had not been adopted and had never been asked about, and that this needed
fixing. The transcript contradicts the first half and the tree contradicts the
second, and that is the finding, not a correction of it: the consent existed and was
not real to the person who gave it; the application existed and was invisible to the
person who reviewed it. From the owner's chair this is indistinguishable from the
silent-apply failure option 2 is feared for, reached by the opposite route.

So: the gate fires, and nothing is applied on its own - the doubt's first half is
answered. Whether asking is the right default is answered too, narrowly: asking is
right, asking *like this* is not. Three things the run shows are needed, in the
order they would have helped:

1. **A declared point.** The only point that gates `stack.manifest.json` is
   `green.stack` - the greenfield one, whose question is "Which stack, and which
   profile - core or scale?" - and this run never asked it. It satisfied the guard by
   filing the 09:55 answer under `green.stack` in the provenance ledger, which is
   where the ledger's own "asked, no point declares it" table had to note the
   discrepancy. The gate held on a borrowed point: the guard cannot tell a brownfield
   offer from a greenfield one, so a replay cannot assert which was made, and the
   intake's own offer has no id to be filed under.
2. **Its own question.** The stack was the one answer of twelve the owner gave against
   the recommendation, and the one they did not remember. A question that changes the
   build tooling does not belong in a card with the language of the docs.
3. **A visible landing.** Nothing between 09:55 and the pull request said "the Node
   stack is in" - not the run summary, not the PR body, not a commit message a
   reviewer reads as such. What the layer produced is a manifest; a manifest is not
   something anyone sees.

The work is `STACK-OFFER-2` in the backlog. `STACK-OFFER-1` keeps its decision, now
with one accept-path data point instead of none; its doubt narrows to whether option 4
is enough.
