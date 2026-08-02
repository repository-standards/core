# Whether a stack ships its own skills, or only data

**Open.** Layer 2 currently ships **four data files** - `stack.manifest.json`, `DECISIONS.md`,
`starter/`, `ADAPTING.md` - and no procedures. Layer 1 ships 19 lifecycle skills. The asymmetry
was never decided; it is what fell out of building the core first.

## What is actually missing

Adoption is covered, thinly but genuinely: [`stack.md`](../../skills/align-to-standards/stack.md)
is 41 lines against the core router's 313, and it consumes the stack's data files rather than
carrying technology knowledge itself. That split is right and should stay.

What has no home at all is **the technology's recurring work** - the things a repo does weekly,
long after adoption:

- adding a dependency, under R21's exact-pin-plus-cooldown rule
- a framework major upgrade, which is the case where `DECISIONS.md`'s escape hatches matter
  most and where nobody reads them
- adding a test tier, or moving one
- a migration, in the stack's own idiom

Layer 1 treats exactly this class of work as skills - that is what `spec-impact`,
`add-to-backlog` and `pre-pr-review` are. Layer 2 treats it as nothing.

## The mechanism already exists and nobody has named it

`stack.manifest.json` is **the core manifest's schema** plus `technology` and the `registry`
back-pointer ([`ecosystem.md`](../ecosystem.md)). The core manifest ships `.claude/skills` as a
`copy`-class `files[]` entry. So a stack can ship skills into an adopting repo by the same
mechanism, today, with no code change - the possibility is latent and undocumented.

That is an argument for the answer being yes, and also a reason to decide it deliberately: a
mechanism that works by accident gets used inconsistently by the second stack.

## The questions that actually need answering

1. **Do stack skills ship into the adopting repo, or stay in the stack checkout?** Lifecycle
   skills ship and stay (ADR-009); transition skills never ship. Which is a stack skill?
   Probably both kinds exist, and the ADR-009 split applies unchanged - but that should be
   stated, not assumed.
2. **How do two skill families avoid colliding?** Nineteen core skills plus a stack's own share
   one namespace and one description-matching surface. The constraint recorded in
   [`shipped-skills`](shipped-skills.md) is **discriminability**, and a stack skill named
   `add-dependency` competing with nothing is fine, while one named `update-to-version` is not.
   Naming rules belong in whatever answers this.
3. **Who owns the port to non-Claude agents?** R22 makes the core procedures normative and
   requires a strict port. If a stack ships procedures, the same obligation follows them, and
   the stack repo has to carry it.
4. **Does a stack get its own `AGENTS.md` section, or does it merge into the repo's?** The
   manifest has a `merge` class; nothing says which side wins on conflict.

## What would settle it

**Running it once.** `STACK-ALIGN-1` has the node satellite aligning to Layer 1 and it is still
`todo` - so the Layer 2 path has never executed, in either direction, on any repo. Every
question above is currently being answered from the armchair.

The order that makes sense: align the satellite first, do the technology work by hand while
watching what recurs, and let the skills fall out of what was actually repeated. Writing them
first would be inventing a lifecycle for a layer whose lifecycle nobody has lived through yet.

## Related

- `STACK-ALIGN-1` and `STACKS-2` in [`backlog.md`](../../backlog.md).
- [ADR-016](../decision-records/ADR-016-stacks-are-satellite-repos.md) - one repo per
  technology; [ADR-022](../decision-records/ADR-022-stacks-linked-not-version-locked.md) -
  linked, never version-locked.
- [ADR-009](../decision-records/ADR-009-skills-lifecycle-vs-transition.md) - the lifecycle vs
  transition split this would have to respect.
