# Open questions - decided, provisionally

Every entry here is a call the owner made on judgment, at the simplicity-vs-
universality boundary - good enough to ship, honestly held, and **actively open
to a better answer**. This is not indecision: each has a decision in force
(linked). It is an invitation: argue a better option in an issue or PR
referencing the entry. A winning challenge lands as a superseding record or rule
change, and the resolved entry is deleted - the resolution lives in the record
that settled it.

How this differs from the neighbors: an **ADR** records a fork taken; an
**idea** is a feature that may never ship; an open question is a standing
"I chose X, convince me of Y". One file per topic; entries that carry real
deliberation history keep it in an **Options weighed** section - for the future
maintainer who would otherwise re-derive it. (This was one flat file until it
outgrew itself - as its own meta entry predicted it would.)

| Topic | Decided | The doubt, in one line |
|---|---|---|
| [Conformance: threshold or degree](conformance-is-a-degree.md) | not decided | the spec says MUST, the tooling reports a number - and the number needs a denominator |
| [One authored tree](one-tree.md) | ADR-014: single `standard/` tree, no source/dist split | template shells and read-as-is docs mix in one tree |
| [How many rules](twenty-rules.md) | SPEC.md, the numbered rules on one page | the count is past the top of the winners' range and only grew; some rules bundle several MUSTs |
| [Stacks as satellite repos](stacks-satellite.md) | ADR-016: one repo per technology + registry | two repos to run; registry is a solo-merge gate |
| [Genesis history for the org move](genesis-history.md) | clean-slate, curated commit sequence, honest dates | narrative order vs the record of what really happened |
| [Engine cherry-pick](engine-cherry-pick.md) | ADR-015: prompts are ours; upstream read at release | five prompts could quietly fall behind upstream |
| [Shipped skills](shipped-skills.md) | discriminability is the constraint, not the count - 21 ship today | four sibling authoring skills could drift apart |
| [npm as a channel](npm-as-a-channel.md) | no package, for now (2026-08-09) | neither of the two things that would settle it either way has happened, and there is still no tag |
| [Stack lifecycle skills](stack-lifecycle-skills.md) | **open** - Layer 2 ships four data files and zero procedures | the mechanism to ship stack skills exists and is unnamed; nothing has run once |
| [Staying current](staying-current.md) | **open** - the shipped watch compares against releases | the standard lives on `main` and there are no releases, so the channel is silent by construction |
| [The repo specs its own tooling](own-specs.md) | four buildable capability specs in `specs/` | specs for small scripts risk documentation theatre |
| [Folder self-description](folder-readmes.md) | the manifest says *what it is* (map generated from it); a folder README says only *what goes in here* | nothing checks that a README stays in its lane; an adopted repo gets no map |
| [`checklist.md` as the name](checklist-name.md) | `docs/method/checklist.md` | "checklist" undersells the paved-road defaults |
| [Work history in the tracker](tracker-history.md) | ADR-010: repo holds intents, tracker holds history | kills in-repo who-did-what; regulated shops may object |
| [GitHub Issues as default tracker](default-tracker.md) | ADR-010: free wins; Jira/Linear adapters | weakest PO experience of the three |
| [Spec Status in front matter](status-frontmatter.md) | the clarify gate flips it mechanically | status exists in two places once a tracker mirrors |
| [Ideas are slugs](ideas-slugs.md) | `docs/ideas/<slug>.md`, never numbers | slugs are wordier and renames break links |
| [Core and scale profiles](profiles.md) | ADR-011 + ADR-040: one repo, two profiles, triggered by reach | the split may be too weak to carry the weight - 9 entries and two rule clauses; an `audit` third looms |
| [Personas as a hard gate](personas-gate.md) | gate is core, roster is scale | ceremony for solo tools and no-product repos |
| [One source, two surfaces](docs-funnel.md) | docs site renders the same md agents read | in-place READMEs may not sequence into a learning path |
| [Case-study anonymization](case-anonymization.md) | describe the situation, never the company | the identifiability line is unwritten judgment |
| [Rebase-merge as the paved road](rebase-merge.md) | ADR-026: linear `main`, rebase-merge, squash as the alternative | squash asks less and delivers most of it; the option that wins on merits is missing from GitHub |
| [What to call a bounded period of work](work-periods.md) | ADR-041: `sprint`, per team, several in parallel - `cycle` was tried first and lost to use | the borrowed word arrives carrying points and velocity, which the record has to deny in one place |
| [Skills that co-author a document](authoring-skills.md) | one per document type - `adr-write`, `bdr-write`, `product-write`, `personas-write` | four sibling files can drift apart; the count objection fell away once the ceiling was measured rather than assumed |

Stack-pick doubts (Better Auth, CSS Modules vs Tailwind) moved with Layer 2 to
[repository-standards/node](https://github.com/repository-standards/node)'s
DECISIONS - the stack owns its own doubts now.

## This is the front door for new maintainers

A single author decided every entry above, which is the honest weakness of this project.
Winning a challenge here is the most valuable contribution it takes - more than a feature,
because a rule this project got wrong propagates into every repo that adopts it.

You do not need to have used the standard to argue one. Each entry states the decision in
force, the doubt in one line, and - where there was real deliberation - the options already
weighed, so you can start from where the thinking stopped rather than from scratch. Bring
evidence from how you actually work; "we ran the other way for two years and here is what
broke" ends an argument that abstract reasoning cannot.

**If your expertise is a technology rather than the method**, this is the wrong repo to
spend it in: Layer 1 is stack-agnostic by rule, so a TypeScript or Node opinion cannot land
here no matter how right it is. It lands in
[repository-standards/node](https://github.com/repository-standards/node),
which owns its own picks and its own doubts. Same for any future stack - one repo per
technology, and each carries the argument for what it chose.
