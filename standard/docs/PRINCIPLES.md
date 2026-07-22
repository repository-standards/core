# Engineering principles

The top of the altitude hierarchy. These outrank local preference; nothing outranks
them except an explicit change to this file.

- **Boring, proven tech.** Prefer the dull, well-understood option. A new library
  or a new pattern needs an ADR.
- **Small, focused PRs.** One logical change; reviewable in minutes.
- **Exact versions, everywhere.** Dependencies, overrides, container images, CI
  runners and actions are pinned exact - no ranges, no `latest`, no floating tags;
  a committed lockfile seals the graph. Nothing a repo consumes moves without a
  reviewed diff (R21, ADR-017).
- **Supply-chain cooldown.** Never install a package version published less than 7
  days ago (enforced via the package manager's release-age cooldown - the mechanism per stack lives in your stack's DECISIONS). A critical security fix
  gets a temporary exclude, not a global lowering.
- **Single source of truth.** Every rule and every fact lives in exactly one place.
  No duplicated conventions across files; no invented data where a real source
  exists.
- **Decisions are recorded before they are built** (ADR / BDR). Accepted
  records are binding - if a change disagrees with one, stop and supersede it.
- **Reads OK, remote writes never.** No DML/DDL/migrations against a remote (dev or
  prod) database - hand a `.sql` file to a developer to apply.
- **Secrets never live in the repo.** Secret manager + env vars only; gitleaks gates.
- **Leave the door open, do not walk through it.** Build the simple thing that runs
  now, with a documented path to scale later (see each ADR's "Revisit when").
- **Implement only what actually runs.** No speculative abstractions for a single
  use; no features nobody asked for.
