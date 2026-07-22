# ADR-010: One artifact lifecycle - permanent vs ephemeral - and the tracker posture

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22 - owner directive; implemented: ideas space, spec statuses + clarify gate, tracker posture) |
| **Date** | 2026-07-21 |
| **Author** | Łukasz Bodurka |
| **Tags** | lifecycle, ideas, spec-kit, tracker, backlog |

## Context

Three questions kept re-opening (2026-07-21 notes pass; IDEA-1):

1. **Before a decision** - where does a speculative idea live without polluting the
   decision log? (ADR-008/#46 drew the rule; the concrete home was still undesigned.)
2. **After execution** - Spec Kit's `plan.md`/`tasks.md` are scaffolding; left in the repo
   after a feature ships they are noise agents keep reading. Do they stay "for history"?
3. **Around the work** - enabling/organizational tasks ("open an IT ticket for a token")
   are required for development but are not spec content, and are worthless once done.
   Where do they live? And which work tracker, given many projects can't pay for one?

These are one question: **which artifacts are permanent, which are ephemeral, and where
does each phase live?** Designing them separately yields inconsistent lifecycles.

## Options considered

- **A - Everything stays in the repo** (plans, tasks, done-work history). Full audit trail
  in git; but the repo accretes debris, agents read dead scaffolding as context, and
  "what is current" drowns in "what happened". Rejected - git already IS the history.
- **B - Everything lives in the tracker** (specs and decisions too). One tool; but
  knowledge leaves the repo, agents lose their context, and the wiki-rot failure mode
  returns. Rejected - it is the failure the standard exists to kill.
- **C - One arc, two classes, one bridge (recommended).**
  **Permanent & living** (repo): specs, decision records, docs, personas, backlog
  *intents*. **Ephemeral** (repo only while active): idea docs, `plan.md`/`tasks.md`
  (transition skills go further - they never enter the target repo at all, ADR-009).
  **Tracker**: execution state, enabling/organizational tasks, and the work history.

## Decision

Option **C**. The arc, phase by phase:

1. **Idea** - `docs/ideas/<slug>.md`, statuses
   `idea -> exploring -> approved | parked | dropped` (then `graduated`). Explored
   end-to-end, no records minted (ADR-008 rule). On approval it **graduates**: backlog
   intent + spec + ADR/BDR as needed; the idea doc gets `graduated` + links. `parked` /
   `dropped` docs stay - cheap memory of why not.
2. **Refinement** - the capability spec carries a **Status**:
   `in-refinement -> ready-to-develop -> in-development -> live`. `ready-to-develop`
   requires the **clarify gate** (a `## Clarifications` section, zero open
   `[NEEDS CLARIFICATION]`) - discovery is thereby mechanically separated from
   build-ready work (the PO's view of the pipeline).
3. **Enabling work** - anything required for development but not spec content (tokens,
   access, "agree X with Y") is encoded in spec front-matter
   (`needs_decision_records`-style keys), and the bridge emits it to the tracker as a
   **blocking Story**. The spec prose never mentions it (field-proven in a private production repo).
4. **Execution state & history** - live in the **tracker**, not the repo. The repo
   backlog holds intents; git holds the change history. Default tracker: **GitHub
   Issues** (free, unlimited, code-adjacent, `gh`-scriptable). Adapters behind the same
   bridge convention: **Jira** (free <= 10 users; a field-proven git -> Jira bridge is
   the reference), **Linear** (free tier: unlimited members, 250 active issues).
   Bridge convention: **one-way, git is the source of truth**, created keys written back
   into front-matter (field-proven).
5. **Close & cleanup** - when a feature reaches `live` and is reconciled, a cleanup step
   **verifies against the code** (not by interrogating the user) that the work landed,
   then removes the scaffolding: `plan.md`, `tasks.md`, satisfied enabling keys. The
   spec, records, and docs - the living truth - are what remains.

## Consequences

- Positive: agents read only living truth; the PO gets a real pipeline view
  (in-refinement vs ready-to-develop); enabling work stops leaking into specs; free-tier
  projects get a tracker posture that costs nothing; one bridge convention covers
  Jira/Linear/GH.
- Negative: cleanup must be reliable and code-verified (SKILL-1 mechanics, with ADR-009's
  transition-skill removal); teams without ANY tracker must at minimum use GitHub Issues;
  the work history moves out of the repo - accepting that git + tracker are the ledger.

## Confirmation

`docs/ideas/` exists with the status header and index; capability specs carry `Status:`;
self-verify flags a `live` capability that still has `plan.md`/`tasks.md`; the bridge
refuses a slice failing the clarify gate.

## Revisit when

A regulated project needs the full work history in-repo (then an `archive/` overlay, not
a reversal); or the tracker default stops being free.

## Related

- ADR-008 (no records for un-approved ideas), ADR-009 (transition skills are ephemeral),
  the clarify gate (field-proven, 2026-07), `LIFE-1/2`, `SKILL-1`, `IDEA-1` in
  [`backlog.md`](../../../backlog.md); tracker research: owner's private notes, 2026-07
  (free tiers verified: GH Issues unlimited, Jira <=10 users, Linear 250 active issues).
