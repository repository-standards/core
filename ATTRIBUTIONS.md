# Attributions

What this project took from others, and in what form. Four kinds, kept apart deliberately:
a **standard we conform to** is a claim a third party can falsify against the upstream spec,
**vendored code** carries a licence obligation, a **borrowed idea** carries a debt of
credit, and a project we merely **compare against** carries neither and must not appear as
an influence - claiming an influence that did not happen is its own kind of dishonesty.

## Standards this project conforms to

Formats and conventions written elsewhere, which this standard implements rather than
reinvents. They come first because they are the strongest of the four claims: an adopter can
check them against the upstream spec instead of taking our word for it, and because a
practice that arrives with a source attached is one nobody has to argue out again here.

### Agent Skills - [agentskills.io](https://agentskills.io), open standard published 2025-12-18

**What it is.** The open format for packaging agent capability: a directory whose `SKILL.md`
carries YAML frontmatter (`name`, `description`) followed by markdown instructions, loaded in
three stages - every skill's metadata at startup, one skill's instructions when a task matches
it, bundled files only when those instructions call for them. Anthropic wrote the format and
released it as an open standard; development is public at
[agentskills/agentskills](https://github.com/agentskills/agentskills), spec under Apache-2.0
and docs under CC-BY-4.0, and several dozen agent products read it unmodified.

**What conformance means here.** Every skill this project ships - the lifecycle procedures R22
requires, and the `align-to-standards` router itself - is a conforming skill: `name` lowercase
and hyphens only and identical to its own directory, `description` non-empty and inside the
1024-character limit, and no frontmatter key the spec does not define. Checked across both
repos on 2026-08-19, and it held. That is a measurement, not an intention.

**What that changes about R22.** The rule requires the lifecycle procedures to ship in a form
the repo's coding agent can execute, names `.claude/skills/` as the reference implementation,
and requires a strict port to the agent's own mechanism otherwise. The port is lighter than the
rule makes it sound, because the format is not Claude's: for any agent that reads the open
standard, the same unchanged directory under `.agents/skills` is the whole of the port.

**Where this standard differs on purpose.** The spec suggests a skill bundle its executables in
its own `scripts/`. The spec loop's skills share one engine, so it lives once in
`standard/scripts/spec/` and each skill calls it by relative path - the same idea with one copy
instead of one per caller.

**Where it does not meet the recommendation.** The spec asks for a `SKILL.md` under 500 lines
and roughly 5,000 tokens of instructions, because everything past that is context paid on every
activation. On 2026-08-19 the `align-to-standards` router and the two longest spec-loop skills
are over it. The router already splits its phases into sibling files, which is the spec's own
remedy applied halfway. Tracked in [the backlog](backlog.md) as `SKILL-BUDGET-1` - named here
rather than waived, because a conformance claim that quietly excludes its worst case is worth
less than no claim.

**Where the practice comes from.** The skill-creation guides on that site are the reference this
project writes its own procedures against, and they are the thing to read before writing a skill
for an adopting repo: [best
practices](https://agentskills.io/skill-creation/best-practices) - gotchas rather than general
advice, one default rather than a menu, a method rather than an answer;
[optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) - the
description carries the entire trigger, and trigger accuracy can be measured instead of guessed;
[evaluating skills](https://agentskills.io/skill-creation/evaluating-skills) - run the task with
the skill and without it, or the skill's value stays an assumption;
[using scripts](https://agentskills.io/skill-creation/using-scripts) - no interactive prompts,
structured output, errors an agent can act on.

**One layer above, and not adopted.** Agent Plugins 1.0 - published August 2026 by a technical
steering committee drawn from Amazon, Cursor, Microsoft, OpenAI and Vercel - packages skills
together with MCP server configuration behind a `plugin.json` manifest. It carries Agent Skills rather than competing
with them. This standard ships skills into a repository that already has a git history to carry
them, so it needs no distribution envelope, and nothing here depends on that spec.

### AGENTS.md - [agents.md](https://agents.md), an Agentic AI Foundation project since December 2025

R1 requires `AGENTS.md` at a repo's root as the single entry point for the agent working in it.
The file is not this project's invention: the convention came from OpenAI and now sits under the
Linux Foundation's Agentic AI Foundation, alongside MCP and goose. What this standard adds is
what has to be inside it and a check that fails when that drifts - the convention settles where
an agent looks, not what it must find when it gets there.

## Vendored code

### GitHub Spec Kit - `github/spec-kit` v0.13.2, MIT

**What was taken:** five prompts - specify, clarify, plan, tasks, implement - and the shell
runtime they call (`common.sh`, `check-prerequisites.sh`, `setup-plan.sh`,
`setup-tasks.sh`, the plan and tasks templates).

**What it is not, and this is the part worth being clear about.** Spec Kit builds specs.
This project runs a **repository** - decisions recorded as they are made, knowledge that
stays true to the code because a guard fails when it stops, an adoption path for a repo
nobody documented, and compliance as a number a fleet owner can sort by. The spec loop is
one component of that, and it is the component Spec Kit gave us a head start on.

So: this is not a Spec Kit distribution, a fork, or a wrapper. It is a different scope that
took a good implementation of one part, improved it against its own rules, and built the
rest. Anyone arriving expecting a spec tool will find one inside something larger; anyone
arriving from Spec Kit should know the prompts have moved a long way from where they
started and are not maintained in step with upstream.

**Where it lives:** `standard/.claude/skills/spec-*/` and `standard/scripts/spec/`.

**How the licence is honoured:** the upstream MIT text ships verbatim at
[`standard/scripts/spec/LICENSE`](standard/scripts/spec/LICENSE) with its copyright line
(Copyright GitHub, Inc.), and every derived file carries a provenance line naming
`github/spec-kit v0.13.2`. Every hunk this project wrote is marked
`PATCHED(repository-standards)` in place, so the boundary between what was taken and what
was written is readable in the file rather than only in a record.

**What the relationship actually is - and is not.** This is **not** an integration, a
dependency, or a vendored copy kept in sync. [ADR-015](docs/decision-records/ADR-015-spec-engine-extracted.md)
extracted the prompts and made them ours: there is no mechanical re-render, and upstream
improvements are read once per release and cherry-picked by hand when they earn it. The
earlier arrangement - a pinned vendored area re-synced with patches reapplied - is
[ADR-013](docs/decision-records/ADR-013-spec-kit-is-an-engine-by-reference.md), superseded.

**How far it has diverged.** Substantially, and mostly on 2026-08-02: the sections a spec
carries, the default depth tier, whether tests are optional, the question protocol, and the
unit of work tasks group by were all changed to match this standard rather than upstream's
model. The largest single departure is in `clarify`: upstream caps a session at five questions
and reports the remainder in a completion message. Here there is **no cap** - the loop is bounded
by coverage of the declared tier - and nothing unresolved may end up only in the conversation,
because the ambiguities the loop discovers for itself are not markers and were being discarded
with the report. What remains is the shape of the flow and parts of the prompt scaffolding - enough
that the attribution stands and must keep standing while any of it does.

**No claim is made** that upstream endorses this, reviewed it, or is responsible for how it
behaves here.

## Borrowed ideas, no code

Credited because the idea is theirs, even though nothing was copied.

Each row names the **version this project actually follows**, for the same reason R21 pins a
dependency: "we follow Conventional Commits" is unfalsifiable, "we follow Conventional Commits
1.0.0, and here it is" is a claim a reader can check and a later reader can find drifting. It
also settles a question the conventions leave open today - whether an adopter follows the
upstream spec or this project's paraphrase of it. It is the upstream spec, which is where
every link in the first column goes.

| Source | Version followed | What was taken |
|---|---|---|
| **[MADR](https://adr.github.io/madr/)** (Markdown Any Decision Records) | 4.0.0 (2024-09-17) | the decision-record form this standard uses for ADRs and BDRs - context, options considered, decision, consequences |
| **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** | 1.0.0 | the commit message shape the conventions require |
| **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)** | 2.0.0 | how the standard's own versions move |
| **[Keep a Changelog](https://keepachangelog.com/)** | 1.1.2 (2024-09-27) | the changelog's shape, including `## Unreleased` as the place a pull request writes |
| **[Linear](https://linear.app/)** | - (product, unversioned) | the word **sprint** for a bounded period of work, in almost exactly this meaning - chosen over "sprint" because it arrives without the ceremony argument attached ([ADR-028](docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md), [`work-periods`](docs/open-questions/work-periods.md)) |
| **[Backlog.md](https://github.com/MrLesk/Backlog.md)** | - | not taken from, but deliberately stayed compatible with - the shipped backlog is markdown a team can put that tool on top of, rather than a custom engine |
| **[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)** | BCP 14, as updated by [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) | the meaning of MUST, SHOULD and MAY in the spec |
| **[Impact Mapping](https://www.impactmapping.org/)** (Gojko Adzic) | - (book) | the goal -> persona -> impact -> deliverable technique the greenfield phase runs when breaking a product into capabilities |
| **[Story Mapping](https://jpattonassociates.com/story-mapping/)** (Jeff Patton) | - (book) | the journey-then-thinnest-slice technique in the same step |
| **[INVEST](https://xp123.com/invest-in-good-stories-and-smart-tasks/)** (Bill Wake) | - (article) | the Definition of Ready the shipped backlog requires of an item before it is pulled |
| **Jobs to be done** | - (no canonical spec) | the shape of a persona's motivation - "when \_\_\_, I want to \_\_\_, so I can \_\_\_" - in the persona template and the decision checklist |
| **[Nielsen Norman Group's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)** | - | named as the paved-road default for the UX axis of the decision checklist |
| **[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [SLSA](https://slsa.dev/)** | - (pinned where cited, not here) | referenced as the depth a security baseline can point at; nothing from them is reproduced here |

## Compared against, not borrowed from

Named in [the FAQ](docs/faq.md) so a reader can place this project among its neighbours.
**None of them influenced its design**, and they are listed here so that nobody later reads
a comparison as a debt:

- **OpenSpec**
- **BMAD**
- **Backstage**
- **adr-tools**
- **ProductSpec** - found on 2026-08-02 while researching how this project gets discovered,
  which is to say **after** every design decision here was already made. It is the closest
  neighbour of the five and the comparison is in [the FAQ](docs/faq.md); listing it here is
  the point of this section - a reader should learn about the nearest alternative from us.

## If something is missing

An unlisted debt is a bug in this file, not a policy. Open an issue - attribution is
cheaper to fix than to argue about, and this project would rather over-credit than have
someone find out later that it did not.
