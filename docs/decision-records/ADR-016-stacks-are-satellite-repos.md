# ADR-016: Technology best practices live in satellite repos, discovered by a registry

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22); standards-range clause revised by ADR-022 - stacks are linked, not version-locked |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | structure, layer-2, distribution, governance |

## Context

Layer 2 (technology best practices - the Node/TS DECISIONS and the boot-verified
starter) lived inside this repo at `stacks/node-ts/`. Three pressures argued for
moving it out: the two layers run on different clocks (the methodology changes
slowly, technology picks fast - Next majors should never force a standard
release); the starter needs living CI (boot heartbeat, dependency updates) in a
repo whose rule is that workflows are templates and never run; and measured
coupling was three links. Research across ecosystems that split (ESLint,
Terraform, Backstage, Homebrew) and template ecosystems that exploded (Yeoman's
twelve near-identical Backbone generators, cookiecutter's thousands) or stayed
coherent (Rails omakase, Spring Initializr, Vite's eighteen org-owned templates)
gave the shape.

## Options considered

- **A - Keep stacks/ in this repo.** One clone; carries the clock conflict and
  the dead-CI starter forever.
- **B - Monorepo of packages.** Two version axes and workspace machinery inside
  one repo - the worst of both.
- **C - Satellite repo per technology + a registry in the core (chosen).**

## Decision

Option **C**. Concretely:

1. One repo per technology in the `repository-standards` organization, named for the
   technology alone; first: [repository-standards/node](https://github.com/repository-standards/node).
   (This shipped as a standalone `repository-standards-<technology>` while the repos
   still lived under a personal account; the org holds the family now, so the prefix
   moved out of the name and into the namespace.)
   Inside it: `DECISIONS.md`, the runnable `starter/`, its own CI, and
   `stack.manifest.json` - the stack contract and manifest.
2. **The registry is the officialdom** (`stacks.json` in this repo): the align
   router reads only it; a stack not listed is not official, wherever it lives
   and whatever it is named. Copycat repos elsewhere are expected and harmless -
   the registry, the history and the domains mark the canonical line.
3. **Anti-explosion policy** (in the registry's `$about`, binding): one stack per
   technology; backend-only and friends are subtractive adoption modes (the
   Rails `--api` shape), never sibling repos; "light vs corporate" is the core
   `core|scale` profile axis reused verbatim, never a second vocabulary; an
   official stack keeps a named owner and a live boot CI or is delisted (the
   Create React App lesson).
4. **Compatibility is one line, owned by the satellite:** the stack repo's
   `stack.manifest.json` declares `standards: ">=X <Y"` - the spec range it implements.
   The registry carries no versions; the core moves and satellites chase, never
   the reverse. Adopters degit stacks at tags.
5. The align router detects the target repo's technology (lockfiles, manifests)
   and offers the matching best practices; greenfield asks, then degits the
   stack's starter.

**Alignment mechanics (added 2026-07-22, same change):** a stack ships
`stack.manifest.json` - the same schema as the core manifest (ADR-005), plus
`technology` and its `standards` range. The core's align machinery is reused
whole: the router classifies a brownfield repo against the stack manifest's
entries and walks it there in waves; an adopting repo carries the stack
manifest beside the core one, and `self-verify` merges both into one drift
number. Greenfield gets the same file copied in at scaffold time. The stack's
update story (a versioned manifest delta, like `update-to-version`) is future
work, noted here so it is not mistaken for done.

## Consequences

- Positive: the core repo is technology-silent (R20 reworded); stack releases
  never touch the standard's version; the starter gets real CI; a new technology
  is one new repo plus one registry line; `repository-standards/node` becomes the
  standard's first genuinely aligned adopter once it pins `.standards-version`.
- Negative: two repos to maintain (different kinds of care - that is the point);
  cross-repo links replace relative ones; the registry is one more file whose
  entries the owner alone merges.

## Confirmation

`stacks.json` exists and lists node; `stacks/` is gone from this repo; the align
router's technology step reads the registry; the stack repo's `stack.manifest.json`
declares its standards range and points back here.

## Revisit when

A second maintainer or organization wants in (the registry's solo-merge gate
needs a policy then), or stack repos multiply past what one registry file reads
cleanly.

## Related

- ADR-008 (zones - its stacks-beside-core overlay clause is superseded by this),
  ADR-014 (one tree), ADR-011 (core|scale - the profile axis stacks reuse),
  R20 in [`standard/SPEC.md`](../../standard/SPEC.md).
