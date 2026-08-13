# ADR-039: A capability may be bound to a repository this one does not own

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |

## Context

R11 says every capability has an entry in `specs/capability-map.json` binding it to code
globs, and the coupling guard reads that map. The rule assumes the code is in this repo.

Validation case `GATE-11` found the assumption breaks on a shape that is entirely ordinary.
The worked target was `bazelbuild/bazel`, whose rule implementations for several languages
live in satellite `rules_*` repositories it does not own: the capability is real, its spec
belongs here, and no glob written here can reach a line of its code. The same shape covers a
plugin architecture, a vendor SDK, and a service whose client is generated from another
repo's schema.

The map had no vocabulary for it, so an author had two moves, both defects:

1. **A glob that matches nothing.** `--audit` reports it, correctly - a map full of globs
   matching no files is a guard watching an empty set, and that check has caught real
   refactors.
2. **No map entry at all.** `--audit` reports the spec as an orphan, also correctly - a
   capability with no entry has no coupling and rots silently.

So the map was wrong about a normal situation, in a way the author has to route around. That
is worse than a gap: a map you argue with is a map that stops being maintained, and every
capability in it loses its guard together.

## Options considered

- **Leave it.** Write the glob that matches nothing and let the audit stay red, or drop the
  capability from the map. Rejected: it teaches people to ignore the audit, which is the
  only check standing between the map and quiet rot.
- **A repo-level exemption list** (`$unwatchable: ["rules-go", ...]`). Rejected: it separates
  the declaration from the capability it describes, so reading the capability's entry no
  longer tells you the truth about it, and the list is a place things accumulate.
- **Cross-repo coupling** - resolve the satellite repo and check its diff too. Rejected
  outright for now: it needs network, credentials and a checkout of somebody else's repo in
  a guard whose entire value is that it is dependency-free and runs in five seconds. It also
  cannot work at all for a vendor SDK.
- **An entry form that names the repository, with a reason.** Chosen.

## Decision

An entry in `specs/capability-map.json` may be
`{ "external": "<repo>", "reason": "<why no glob here reaches it>" }`.

- **Both fields are required.** An external entry with no reason is refused by the guard
  with the map unusable, exactly like a malformed glob entry. Without the reason this is a
  way to move a capability out of the guard's reach; with it, it is a record of where the
  code lives, readable by the next person.
- **Nothing is enforced for it.** The code is not here; the guard says so rather than
  pretending. It is not counted as a glob, and it is never reported as a glob matching
  nothing.
- **The capability still has its spec here.** An external binding satisfies R11's entry
  requirement; it does not exempt the capability from having a spec, and `--audit` still
  reports a map key with no spec directory.
- **It is printed on every audit run**, and counted in the verdict line. A hatch nobody sees
  is a hatch that widens.
- **Mixing is allowed and unchanged.** A capability may hold globs *and* an external entry -
  the part of it that lives here still couples, as its own case asserts.

## Consequences

- A repo with satellite implementations can hold a complete, honest map instead of a map
  with a permanent red mark or a missing capability.
- The audit's numbers now distinguish three states rather than two: watched, deliberately
  unwatchable, and broken. Only the third fails.
- **Cost accepted:** a capability's code can genuinely go unguarded, by declaration. That is
  a true statement about a repo that does not contain the code, and the reason plus the
  per-run note is what keeps it from being used as a shortcut for code that *is* here.
- **Cost accepted:** the guard cannot verify the named repository exists, is spelled right,
  or still holds that code. It is a record, not a link that is followed.

## Confirmation

`GATE-11` is the case. Six cases in `tools/spec-guard-test.mjs` hold both directions: an
external binding passes and is named out loud, is not reported as an empty glob, is refused
when it carries no reason, still needs a spec, does not claim any local path, and does not
weaken coupling on a capability's local globs.

## What this rules out

Reading another repository from inside the coupling guard. If cross-repo coupling is ever
built, it is a different mechanism with different costs (network, credentials, a resolvable
checkout) and it gets its own record; this entry form is a declaration, not a link.

## Revisit when

External entries start appearing for code that is in this repo - the reason fields would
read as excuses rather than as facts about where code lives - or a repo's audit line shows
more external bindings than globs, which would mean the map has stopped describing anything
this guard can check.

## Related

- R11 (capability map and same-PR coupling), amended here by one clause.
- [ADR-002](ADR-002-specs-by-capability.md) - specs are organized by capability, which is why
  the spec stays here even when the code does not.
- [ADR-016](ADR-016-stacks-are-satellite-repos.md) - the standard's own satellite-repo split;
  the same shape, one level up.
