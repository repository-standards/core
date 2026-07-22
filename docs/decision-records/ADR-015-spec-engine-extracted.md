# ADR-015: The spec engine is extracted - five prompts of ours, not a vendored area

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22) - supersedes ADR-013 |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | spec-kit, engine, skills, simplification, licensing |

## Context

ADR-013 vendored Spec Kit v0.13.2 as a pinned engine area (`standard/spec-kit/`
-> `dist/.specify/` + ten `speckit-*` skills) with patches re-applied at each
sync. The 2026-07-22 review measured the result: 42 files / ~8,600 lines
committed twice - 36% of the repo's markdown; `create-new-feature.sh` (326 lines)
invoked by nothing; ~600 lines of extension-hook boilerplate scanning for an
`extensions.yml` that never shipped; the largest shipped skill referenced by no
doc; two parallel skill families (`spec-*` and `speckit-*`) competing for the
same verbs; a hand-maintained 15-file render with no render tool. Upstream
reality: the pin was current, churn rarely touches the agent-side surface, but
upstream has had one breaking change and one near-abandonment scare - the hedge
of carrying our own copy remains right; the shape of it was wrong.

## Options considered

- **A - Status quo** (vendored area + renderer + 10 skills). Works, but ships the
  weight above and its own docs contradicted it.
- **B - Extract only the used surface (chosen).** The five load-bearing prompts
  become the standard's own skills; scripts and templates move beside our guards;
  everything else goes.
- **C - No vendoring** (clients run upstream's CLI at a pin). Re-creates what
  ADR-013 rejected: unpatched layouts, no gate, a Python toolchain at adoption.

## Decision

Option **B**. Concretely:

1. Five prompts ship as the standard's own skills - `spec-specify`,
   `spec-clarify`, `spec-plan`, `spec-tasks`, `spec-implement` - one skill family
   beside `spec-impact`, `spec-update`, `spec-reconcile`. Each carries a
   provenance line: based on github/spec-kit v0.13.2 (MIT).
2. Their runtime lives at `scripts/spec/`: `common.sh`, `check-prerequisites.sh`,
   `check-spec-clarified.sh` (the clarify gate - ours), `setup-plan.sh`,
   `setup-tasks.sh`, the plan/tasks templates, and the upstream LICENSE. MIT
   compliance is that license file plus the per-file provenance notes.
3. Deleted: the vendored area, `.specify/`, the `speckit-*` namespace,
   `create-new-feature.sh`, the extension-hook boilerplate, the checklist /
   taskstoissues / constitution-as-shipped-skill extras, and the bespoke
   renderer. The thin `spec-analyze` / `spec-converge` stubs fold into
   `spec-reconcile`'s consistency step.
4. Upstream sync changes meaning: there is no mechanical re-render. Upstream
   improvements to the five prompts are cherry-picked by hand when worth it -
   the surface is five stable files, and we own them. ADR-013's exit clause is
   now the resting state: the gate, statuses and skills survive upstream
   entirely.

## Consequences

- Positive: the shipped engine drops from ~4,240 lines in 21 files to ~1,950 in
  ~12; one skill family; no hidden dotdir; the entry point can finally name the
  whole loop; the manifest covers the skills (`.claude/skills` entry).
- Negative: byte-diffability against upstream is gone - porting an upstream
  improvement is a manual read; adopters wanting upstream's checklist or
  tasks-to-issues bridges re-add them per repo.

## Confirmation

`tree-check` finds no `.specify/` or `speckit-*` path in the tree; the loop runs
end to end through the renamed skills (specify -> clarify gate -> plan -> tasks
-> implement -> reconcile); `scripts/spec/LICENSE` ships.

## Related

- Supersedes ADR-013. ADR-002 (capability paths - now simply how our skills are
  written), ADR-009 (ship/never-ship classes), ADR-010 (statuses + gate);
  the 2026-07-22 review, Level 4.
