# Skills - the standard, executable

The agent-runnable procedures that make the standard something a repo *does*, not reads.
Lifecycle skills ship to a consuming repo as `.claude/skills/<name>/SKILL.md`
(byte-identical, via `tools/reflect.mjs`); transition skills stay here and run from
this repo (ADR-009).

## Contents

Two classes (ADR-009 - lifecycle skills ship and stay; transition skills NEVER ship - they run from this repo):

| Skill | Class | One-liner |
|---|---|---|
| [spec-impact](spec-impact/SKILL.md) | lifecycle | which specs/ADRs/code a change ripples to |
| [spec-update](spec-update/SKILL.md) | lifecycle | edit every affected spec to the target state |
| [spec-analyze](spec-analyze/SKILL.md) | lifecycle | do the specs contradict each other? |
| [spec-converge](spec-converge/SKILL.md) | lifecycle | close the spec <-> branch gap (missing impl/tests) |
| [spec-reconcile](spec-reconcile/SKILL.md) | lifecycle | spec == code == tests, no drift |
| [add-to-backlog](add-to-backlog/SKILL.md) | lifecycle | capture an intent as a well-formed backlog item |
| [backlog-from-specs](backlog-from-specs/SKILL.md) | lifecycle | derive backlog items from spec deltas |
| [pre-pr-review](pre-pr-review/SKILL.md) | lifecycle | clean-context self-review before the PR |
| [update-to-version](update-to-version/SKILL.md) | lifecycle | apply the delta to a newer standard version |
| [align-to-standards](align-to-standards/SKILL.md) | transition | reconcile a repo to the standard (re-entrant, wave-based) |
| [onboard-repo](onboard-repo/SKILL.md) | transition | derive capabilities/specs/decisions from an existing codebase |
| [modernize](modernize/SKILL.md) | transition | plan-then-refactor an outdated stack (ADR-007) |
| [greenfield-start](greenfield-start/SKILL.md) | transition | guided for-whom -> what -> how start for a new repo |

## Why this shape, and how to use it

- **One folder per skill, one `SKILL.md`** - the whole procedure in one file an agent
  loads on demand; no shared hidden state between skills.
- **Lifecycle vs transition matters to consumers:** lifecycle skills ARE the ways of
  working and ship to the target repo forever; transition skills are this repo's own
  utility - the agent runs them from here when a user points a repo at the standard
  (`greenfield-start` even runs before the target exists). They never appear in `dist/`;
  `reflect --check` guards it and `self-verify` flags hand-copies (`SKILL-1`).
- **Editing:** change the skill here (zone 2), run `node tools/reflect.mjs --write`,
  never edit the `dist/` copy by hand. A new skill needs: the folder here, a class in
  this table, and - for a transition skill - an entry in reflect's `TRANSITION_SKILLS`
  set so it stays out of `dist/`.
