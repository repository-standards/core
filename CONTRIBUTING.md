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
  how the two outputs are cut).
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
[repository-standards/node](https://github.com/repository-standards/node).
Layer 1 here is stack-agnostic by rule, so technology opinions genuinely cannot land in
this repo - they land there.

## Where to put it

Three places, and picking the right one is most of the etiquette here.

| | for | example |
|---|---|---|
| **[Discussions](https://github.com/repository-standards/core/discussions)** | anything without a defined outcome yet | does this fit a monorepo, is R21 too strict, has anyone run this on a Python service |
| **Issue** | something specific that should change | a guard misfires, a doc contradicts the spec, your technology has no stack |
| **Pull request** | you already know what the change is | any doc fix, a new case study, a sharper rule |

The line between the first two: an **issue** says something is wrong; a **discussion** works
out whether it is. Opening an issue to ask a question is not a faux pas, but you will get a
better answer in Discussions, because there the disagreement is allowed to be the point.

**For a doc change, a pull request beats an issue.** Describing the wording you would prefer
takes longer than writing it.

**For a disagreement about a decision**, open an issue that references the
[open-questions](docs/open-questions/README.md) entry - or add one to
[`backlog.md`](backlog.md) (`type: open-question`) if the decision is not listed there yet.
Those entries exist precisely to be argued with.

### Opening a pull request

1. Branch off an up-to-date `main`, and base the PR on `main`.
2. Make the change, and update whatever it makes untrue: the spec if it changes a rule, the
   affected capability spec if it changes behaviour, `CHANGELOG.md` under `## Unreleased`.
3. Run the gate set from [`AGENTS.md`](./AGENTS.md) locally. All of it.
4. Read your own diff as if someone else wrote it, then open the PR.

There is no CLA, no template to fill beyond the checklist, and no expectation that you are
already familiar with the standard. A first pull request that gets the reasoning right and
the conventions wrong is easy to land; the reverse is not.

## How this repository is laid out

You only need this if you are changing the standard itself. It has **two zones**, and the
difference between them is enforced rather than remembered:

| | what it is |
|---|---|
| `standard/` | the tree an adopter receives, authored directly at client-repo paths |
| everything else | this project's own life - its docs, its site, its tooling, its specs |

`docs/` is this repo's documentation and `docs/method/` is the method manual adopters read
**by reference**, never copied. `tools/` holds this repo's own checks, which never ship.
`site/` is the landing plus the generated docs. `skills/` holds the transition skills that
run from a checkout of this repo and deliberately never ship into an adopted one.

`tree-check` fails if repo-own material leaks into `standard/`, or if the manifest promises
a file the tree does not have. That is why there is nothing to keep in sync by hand.

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

## Contributing by validation

The human-prompting corpus that scores whether this product actually hand-holds
(`docs/validation/human-prompting/`) is built almost entirely from prompts written by
people who already know it - its own README names that as the corpus's weakest point. A
real adoption run, on a real repo, by someone who does not know the product from the
inside, is worth more than anything the maintainer can write.

**Two ways in, and neither requires reading a method page first:**

- **Run an adoption.** Any `align-to-standards` session ends by offering `record-run`
  (the 21st shipped skill) - it assembles the session that just happened, shows you
  exactly what it would send, and asks a single yes or no at one of two consent levels
  (prompts only, or the full run including the agent's own responses). A "no" leaves the
  file on your machine and sends nothing. **A failed or abandoned run is more valuable
  evidence than a clean one** - report it too.
- **Report by hand.** Ran into something odd, or want to send a session `record-run`
  never got to close? [`docs/validation/human-prompting/reporting.md`](docs/validation/human-prompting/reporting.md)
  says exactly what to send: what you typed, what you expected, what happened instead.
  An issue with the transcript is entirely enough - a pull request adding it directly to
  [`prompts.md`](docs/validation/human-prompting/prompts.md) is the more direct route.

Either way lands on `repository-standards/core` the same way any other contribution
does - see "Where to put it" above.
