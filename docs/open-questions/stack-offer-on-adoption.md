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
