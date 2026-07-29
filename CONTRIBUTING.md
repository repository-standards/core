# Contributing

The canonical guide for how to work in this repo - zones, commands, conventions -
is [`AGENTS.md`](./AGENTS.md). Read it first. It applies to humans and coding
agents alike.

**Want to help but don't know where?** Start with
[`docs/open-questions/README.md`](./docs/open-questions/README.md) - the owner's provisional calls,
each openly looking for a better answer. Winning a challenge there is the most valuable
contribution this repo takes.

## Quick rules

- **Branch:** short-lived, off an up-to-date `main`. **Base every PR on `main`, not
  on another feature branch.** A PR whose base is a feature branch strands its commits
  when the base is rebase-merged - if you must stack, merge the parent PR first.
- **Commits:** Conventional Commits. No AI/tool attribution trailers. ASCII
  hyphen only (no em/en dash).
- **Before a PR:** run the gate set from `AGENTS.md` (tree-check, link-check,
  docsite + site-check) and self-review your diff (the `pre-pr-review` skill).
- **Changelog:** describe your change under `CHANGELOG.md`'s `## Unreleased`
  heading; never add a version heading and never touch `VERSION` - the maintainer
  cuts every release (see
  [`standard/docs/changelog-process.md`](./standard/docs/changelog-process.md) for
  the fragments mechanism team repos get).
- **One tree:** the standard is authored directly in `standard/` at client-repo
  paths (ADR-014). There is nothing to sync; `tree-check` fails if repo-own
  material leaks in or a manifest promise goes missing.
- **The spec wins:** [`standard/SPEC.md`](./standard/SPEC.md) is the normative
  text; a change that contradicts a rule amends the spec in the same PR or does
  not land. Accepted ADRs are binding - contradict one only via a superseding ADR.
- **Secrets never live in the repo.** Secret manager + env vars only; gitleaks
  gates on this.

## Feedback from adopters

Adoption runs are the standard's field evidence - the loop is designed to close
here (ADR-021). Three structured channels, used by humans and by aligning agents
(always with the user's consent):

- **Stack request** - your technology has no official stack in `stacks.json`;
  the issue carries the detection evidence and, ideally, the generated
  `stack-decisions.md` as seed material.
- **Adoption friction** - an align/update run hit an unclear instruction,
  recorded an exception, or had to ask what the standard should have answered.
- **Bug** - a guard misfires, a doc contradicts the spec, a shipped file is
  broken.

A concrete PR beats an issue when the fix is a doc change. Challenging an entry
in [`docs/open-questions/`](docs/open-questions/README.md) remains the most
valuable contribution of all.
