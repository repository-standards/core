# Stacks as satellite repos (ADR-016)

**Decided:** technology best practices live in one repo per technology
(`repository-standards/<technology>`), official only when listed in the core's
`stacks.json` registry. First satellite: repository-standards/node.

## Options weighed

| Option | Why not |
|---|---|
| Keep `stacks/` in the core | two release clocks in one version axis (Next majors would force standard releases); the starter needs living CI in a repo whose rule is that workflows never run; measured coupling was 3 links |
| Monorepo of packages (`@core`, `@env-node`) | two version axes plus workspace machinery inside one repo - both costs, neither benefit |
| **Satellite repos + registry (chosen)** | each layer on its own clock; the starter gets real CI; a new technology is one repo plus one registry line |

Naming was its own deliberation: `env-node` (owner's first instinct - but "env"
reads as environment variables), bare `node` (prettiest degit, but the family
scatters and the name says nothing), `stack-node` (the project's own vocabulary)
It first settled as a standalone `repository-standards-<technology>`, with the note
that it would shorten if the org migration happened. It did: the repos live in the
`repository-standards` organization now, so the family is held by the namespace and
each repo is named for its technology alone - `repository-standards/node`. The
objection to bare `node` was that the name says nothing; inside this org it says
everything it needs to.

Governance rests on research, not hope: officialdom = the registry file the
owner alone merges (the Homebrew core-vs-taps model); copycat repos elsewhere
are expected and harmless - Terraform's "verified" badge and npm's @types prove
the signal is curation, never naming policing. Anti-explosion policy is written
into the registry itself: one stack per technology; variation is a profile or a
subtractive adoption mode (the Rails `--api` shape), never a sibling repo -
Yeoman's twelve near-identical Backbone generators are the grave this rule
fences off.

**Doubt:** two repos to maintain, different kinds of care; the registry is a
solo-merge gate with no policy for a second maintainer.

**A better answer would:** the second stack (Python, evidence-gated) landing as
exactly one new repo plus one registry line with the core untouched - or
failing to, which reopens the seam.
