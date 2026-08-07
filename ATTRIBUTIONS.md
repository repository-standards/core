# Attributions

What this project took from others, and in what form. Three kinds, kept apart deliberately:
**vendored code** carries a licence obligation, a **borrowed idea** carries a debt of
credit, and a project we merely **compare against** carries neither and must not appear as
an influence - claiming an influence that did not happen is its own kind of dishonesty.

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

| Source | What was taken |
|---|---|
| **MADR** (Markdown Any Decision Records) | the decision-record form this standard uses for ADRs and BDRs - context, options considered, decision, consequences |
| **Conventional Commits** | the commit message shape the conventions require |
| **Semantic Versioning** | how the standard's own versions move |
| **Keep a Changelog** | the changelog's shape, including `## Unreleased` as the place a pull request writes |
| **Linear** | the word **sprint** for a bounded period of work, in almost exactly this meaning - chosen over "sprint" because it arrives without the ceremony argument attached ([ADR-028](docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md), [`work-periods`](docs/open-questions/work-periods.md)) |
| **[Backlog.md](https://github.com/MrLesk/Backlog.md)** | not taken from, but deliberately stayed compatible with - the shipped backlog is markdown a team can put that tool on top of, rather than a custom engine |
| **RFC 2119** | the meaning of MUST, SHOULD and MAY in the spec |
| **Impact Mapping** (Gojko Adzic) | the goal -> persona -> impact -> deliverable technique the greenfield phase runs when breaking a product into capabilities |
| **Story Mapping** (Jeff Patton) | the journey-then-thinnest-slice technique in the same step |
| **INVEST** (Bill Wake) | the Definition of Ready the shipped backlog requires of an item before it is pulled |
| **Jobs to be done** | the shape of a persona's motivation - "when \_\_\_, I want to \_\_\_, so I can \_\_\_" - in the persona template and the decision checklist |
| **Nielsen Norman Group's usability heuristics** | named as the paved-road default for the UX axis of the decision checklist |
| **OWASP ASVS, SLSA** | referenced as the depth a security baseline can point at; nothing from them is reproduced here |

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
