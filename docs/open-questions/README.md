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
| [One authored tree](one-tree.md) | ADR-014: single `standard/` tree, no source/dist split | template shells and read-as-is docs mix in one tree |
| [Twenty rules](twenty-rules.md) | SPEC.md, the numbered rules on one page | the count is past the top of the winners' range and only grew; some rules bundle several MUSTs |
| [Stacks as satellite repos](stacks-satellite.md) | ADR-016: one repo per technology + registry | two repos to run; registry is a solo-merge gate |
| [Genesis history for the org move](genesis-history.md) | clean-slate, curated commit sequence, honest dates | narrative order vs the record of what really happened |
| [Engine cherry-pick](engine-cherry-pick.md) | ADR-015: prompts are ours; upstream read at release | five prompts could quietly fall behind upstream |
| [Shipped skills](shipped-skills.md) | one family, 12 skills in every adopted repo | ecosystem ceiling is 8-10; engine steps might merge |
| [The repo specs its own tooling](own-specs.md) | four buildable capability specs in `specs/` | specs for small scripts risk documentation theatre |
| [Folder self-description](folder-readmes.md) | three-section `README.md` per folder | READMEs may bloat; one file serves two audiences |
| [`checklist.md` as the name](checklist-name.md) | `docs/method/checklist.md` | "checklist" undersells the paved-road defaults |
| [Work history in the tracker](tracker-history.md) | ADR-010: repo holds intents, tracker holds history | kills in-repo who-did-what; regulated shops may object |
| [GitHub Issues as default tracker](default-tracker.md) | ADR-010: free wins; Jira/Linear adapters | weakest PO experience of the three |
| [Spec Status in front matter](status-frontmatter.md) | the clarify gate flips it mechanically | status exists in two places once a tracker mirrors |
| [Ideas are slugs](ideas-slugs.md) | `docs/ideas/<slug>.md`, never numbers | slugs are wordier and renames break links |
| [Core and scale profiles](profiles.md) | ADR-011: one repo, two profiles | two may be too coarse; an `audit` third looms |
| [Personas as a hard gate](personas-gate.md) | gate is core, roster is scale | ceremony for solo tools and no-product repos |
| [One source, two surfaces](docs-funnel.md) | docs site renders the same md agents read | in-place READMEs may not sequence into a learning path |
| [Case-study anonymization](case-anonymization.md) | describe the situation, never the company | the identifiability line is unwritten judgment |
| [Rebase-merge as the paved road](rebase-merge.md) | ADR-026: linear `main`, rebase-merge, squash as the alternative | squash asks less and delivers most of it; the option that wins on merits is missing from GitHub |

Stack-pick doubts (Better Auth, CSS Modules vs Tailwind) moved with Layer 2 to
[repository-standards-node](https://github.com/bodurkalukasz/repository-standards-node)'s
DECISIONS - the stack owns its own doubts now.
