# ADR-012: In-repo instructions are the source of truth - never personal memory or config

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | consistency, agents, conventions, onboarding |

## Context

The "how to work here" knowledge - agent rules, repo-specific gotchas, tool settings,
"always pass the full tenant id when editing its template" - tends to accumulate in the
places closest to whoever learned it: a personal `~/.claude` config, an agent's memory,
a head. The repo then splits into invisible variants: each contributor (and each
contributor's agent) works under different rules, and the difference is undiscoverable
by construction. For a standard whose premise is "the repo is the context", this is the
quietest possible failure.

## Options considered

- **A - Tolerate personal stores, document the important bits sometimes.** Status quo
  everywhere; guarantees divergence and makes review impossible ("works under my
  rules").
- **B - In-repo instructions are the single source of truth (chosen).** Every rule
  about working in the repo lives in the repo, at its taxonomy-assigned home. Personal
  memory and global configs may *point* at repo rules, never *hold* them. "It's in my
  memory / my dotfiles" is rejected in review as a location for a repo rule.
- **C - Central org-wide rulebook outside any repo.** Solves per-person divergence but
  reintroduces the wiki-drift failure and breaks the self-contained-repo premise.

## Decision

Option **B**, with the two operational halves:

1. **Location discipline (CONS-2):** every rule kind has a named home - conventions in
   `AGENTS.md`/`docs/conventions`, process in `ways-of-working`, contribution mechanics
   in `CONTRIBUTING`, behavior in specs, decisions in records. A rule that exists only
   outside the repo (memory, personal config, chat) is treated as **missing**, and
   finding one is a defect to fix by landing it in its home.
2. **Elicitation on entry (CONS-3):** `align-to-standards` and `onboard-repo`
   explicitly ask for the unwritten rules - tribal knowledge, personal-config
   instructions, "everyone knows" gotchas - and land them in-repo at the right home,
   so a brownfield repo becomes self-describing instead of self-describing-except-
   for-the-important-parts.

## Consequences

- Positive: any agent or human, fresh, works under the same rules; review can check
  rule changes like code changes; the repo survives personnel and tool churn.
- Negative: personal convenience configs must be split (pointer vs content); the
  elicitation step adds questions to onboarding - deliberately.

## Confirmation

Conventions state the discipline; align/onboard skills carry the elicitation step;
review culture rejects "it's in my memory" as a rule location.

## Revisit when

Agent platforms ship portable, repo-scoped memory that is itself versioned in the repo
- at which point it *is* an in-repo instruction and the distinction dissolves.

## Related

- The CONS-1..3 epic in [`backlog.md`](../../backlog.md); ADR-004 (decisions by
  reference); the coding-agent persona's pains in
  [`docs/personas.md`](../personas.md).
