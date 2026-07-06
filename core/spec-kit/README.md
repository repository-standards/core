# Spec-driven development (spec-kit)

Every repo uses GitHub spec-kit for feature work: a `spec -> plan -> tasks ->
implement` pipeline, with a lightweight governance bridge so it never duplicates
the repo's ADRs / standards.

## Install

spec-kit is a vendored toolchain, not a dependency. Install per its docs:

    uvx --from git+https://github.com/github/spec-kit.git specify init

This creates `.specify/` (templates, scripts, memory) and the `/speckit-*`
commands for Claude Code and Cursor.

## Flow

    /speckit-constitution   (once) establish / refresh the governance bridge
    /speckit-specify        feature description -> specs/NNN-slug/spec.md
    /speckit-clarify        resolve ambiguities into the spec
    /speckit-plan           spec -> plan.md (+ research, data-model, contracts)
    /speckit-tasks          plan -> tasks.md
    /speckit-analyze        cross-check spec / plan / tasks (read-only gate)
    /speckit-implement      execute tasks, edit code

Features live under `specs/NNN-slug/`. Numbers are gapless, never reused, in a
different namespace from the issue tracker so the two never get confused.

## Governance bridge (do not fork the rulebook)

`.specify/memory/constitution.md` is a THIN bridge, not a second rulebook. It
forces the `/speckit-plan` Constitution Check to consult the repo's `AGENTS.md` +
ADR index + `CODING_STANDARDS` - it must not restate them. See
[`constitution.template.md`](constitution.template.md). It hard-stops on an ADR
contradiction or a red-flag trip without maintainer sign-off.
