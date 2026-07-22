# Case studies - patterns and antipatterns, earned in the field

Real situations from production repos (anonymized - no company or repository names,
ever), each distilled to the pattern or antipattern it proves and the rule the standard
carries because of it. This is the *evidence* layer: when a rule in this standard feels
arbitrary, the case that earned it should be here.

## Contents

| Case | Kind | One-liner |
|---|---|---|
| [the-silently-skipped-clarify.md](the-silently-skipped-clarify.md) | antipattern | a spec reached plan/tasks with open decisions because a loop step relied on being remembered |
| [proposed-does-not-mean-maybe.md](proposed-does-not-mean-maybe.md) | antipattern | a speculative direction was minted as `Proposed` records, making the decision log lie |
| [enabling-work-out-of-the-spec.md](enabling-work-out-of-the-spec.md) | pattern | an external IT dependency encoded in front-matter, mirrored as a blocking tracker Story |
| [stacked-prs-on-a-moving-base.md](stacked-prs-on-a-moving-base.md) | antipattern | PRs stacked on feature branches "merged" into dead bases and dropped work |
| [parallel-record-minting.md](parallel-record-minting.md) | antipattern | two branches minted the same record number; the collision surfaced at review |

## Why this shape, and how to use it

- **One file per case.** A case is: *Situation -> What happened -> The pattern /
  antipattern -> What the standard does about it -> Where it lives now (links)*. Keep it
  under a page; the value is the distillation, not the war story.
- **Anonymize hard.** Describe the *kind* of product ("an internal console at a property
  group", "a hospitality booking product") - never the name. If a case cannot be told
  without identifying someone, it is not told.
- **Only cases that earn a rule.** A story that does not end in a rule, a guard, or a
  record is a blog post, not a case study.
- **Written when the lesson lands** - a case is added in the same PR that adds/changes
  the rule it justifies, and linked from that rule's home (README, ADR, or catalog row).
