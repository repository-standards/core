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
- **Before a PR:** run the gate set from [`AGENTS.md`](./AGENTS.md) - all of it, it is
  longer than it looks - and self-review your diff (the `pre-pr-review` skill).
- **Changelog:** describe your change under `CHANGELOG.md`'s `## Unreleased`
  heading. A contribution never adds a version heading and never edits `VERSION`;
  the maintainer alone bumps it when cutting a release (see
  [`docs/method/changelog-process.md`](./docs/method/changelog-process.md) for
  the fragments mechanism team repos get).
- **One tree:** the standard is authored directly in `standard/` at client-repo
  paths (ADR-014). There is nothing to sync; `tree-check` fails if repo-own
  material leaks in or a manifest promise goes missing.
- **The spec wins:** [`standard/SPEC.md`](./standard/SPEC.md) is the normative
  text; a change that contradicts a rule amends the spec in the same PR or does
  not land. Accepted ADRs are binding - contradict one only via a superseding ADR.
- **Secrets never live in the repo.** Secret manager + env vars only; gitleaks
  gates on this.

## What this project is looking for

Not "help wanted" in general. Four things specifically, in the order they move the
standard:

- **Practices that beat the ones here.** Every rule is a bet. If you have run something
  that works better - a different way to keep specs honest, a gate that catches more with
  less ceremony, a decision format that survives a year - that is the most valuable thing
  you can bring, and it does not need to be polite about what it replaces.
- **People who think the way this repo thinks.** In-repo over wiki, executable over
  prose, decisions recorded with their rejected options, documents updated in place
  rather than appended to. If that reads as obvious, you will be at home here; if it reads
  as overhead, say why - that argument is worth more than agreement.
- **Maintainers.** This is a single-author project and that is a weakness, not a style.
  The clearest way in is [`docs/open-questions/`](docs/open-questions/README.md): every
  entry is a call made on judgment and openly held open. Win one and you have changed the
  standard.
- **AI practitioners.** How agents actually behave against instructions is the part with
  the least settled knowledge and the most consequence: which phrasings survive a long
  session, where an agent silently skips a gate, what to recommend to people working this
  way daily. [`docs/method/working-with-ai/`](docs/method/working-with-ai/README.md) is
  where that knowledge lands, and it is thin on purpose - it only takes what someone has
  actually observed.

**If your expertise is TypeScript or Node rather than methodology**, the higher-leverage
repo is the stack:
[repository-standards-node](https://github.com/bodurkalukasz/repository-standards-node).
Layer 1 here is stack-agnostic by rule, so technology opinions genuinely cannot land in
this repo - they land there.

**Where it goes:** GitHub issues and pull requests, nothing else to learn. Anyone can open
a PR against `main` and put it up for review. For a doc change a PR beats an issue; for a
disagreement about a decision, an issue referencing the open-questions entry is the right
shape, because the discussion is the deliverable.

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
