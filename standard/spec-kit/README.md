# spec-kit (vendored engine)

This directory is the standard's copy of the agent-side GitHub Spec Kit assets -
the spec execution engine behind the `/speckit.*` commands (ADR-013: vendored,
pinned, patched; synced only when the standard cuts a release).

**Based on [github/spec-kit](https://github.com/github/spec-kit) v0.13.2 (MIT -
see [LICENSE](LICENSE), shipped verbatim).** Only the agent-side surface the
skills actually need is vendored: command prompts, the ephemeral-scaffolding
templates, and the bash helper scripts. Upstream's CLI, PowerShell/Python script
variants, extensions, workflows, and `templates/vscode-settings.json` are
intentionally not vendored - consumers need no upstream install at all.

**Deliberately dropped from the vendored set (single source of truth):**
upstream's `spec-template.md` and `constitution-template.md`. The standard
already owns those shapes - `specs/capability-spec.template.md` and
`specs/constitution.template.md` in a consuming repo - and two spec templates
in one repo would violate the standard's own single-source rule. The vendored
commands and scripts are patched to instantiate from the standard's templates
(patch 4 below). The vendored templates that DO ship (`plan-template.md`,
`tasks-template.md`, `checklist-template.md`) produce only ephemeral
scaffolding that ADR-010 deletes at close - no SSOT conflict.

## Layout (source, zone 2)

- `commands/` - the 10 `speckit.*` command prompts (upstream `templates/commands/*.md`)
- `templates/` - the ephemeral-scaffolding templates only: `plan-template.md`,
  `tasks-template.md`, `checklist-template.md` (upstream `templates/*.md`)
- `scripts/bash/` - the helper scripts (upstream `scripts/bash/*`), plus this
  standard's own `check-spec-clarified.sh`
- `LICENSE` - upstream's MIT license, byte-identical

## The patch list

Every deviation from upstream v0.13.2 is marked in-file with a
`PATCHED(repository-standards)` comment. Unmarked vendored files are
byte-identical to upstream. The patches:

1. **Capability paths (ADR-002)** - upstream creates numbered `specs/NNN-slug/`
   feature dirs; here the directory is `specs/<slug>/` (capability/domain slug,
   no numeric or timestamp prefix) and the branch name is the slug itself.
   - `scripts/bash/create-new-feature.sh` - slug-only dir + branch; `--number`/
     `--timestamp` are ignored; `FEATURE_NUM` stays in the output (empty) for
     shape compatibility.
   - `commands/specify.md` - the auto-generation rule now produces
     `specs/<short-name>` and forbids prefixes; an existing capability dir is
     updated in place, never re-minted as a sibling.
   - `templates/plan-template.md`, `templates/tasks-template.md` -
     `[###-feature-name]`-style placeholders replaced with slug-only forms.
2. **Clarify gate pre-wired (ADR-010)** - the gate is part of the engine, not an
   optional add-on.
   - `scripts/bash/check-spec-clarified.sh` (ours, not upstream) - exits
     non-zero unless the spec has a `## Clarifications` section and zero open
     `[NEEDS CLARIFICATION` markers.
   - `commands/plan.md`, `commands/tasks.md` - mandatory precheck at the top:
     run the gate; on failure STOP and run the clarify loop.
   - `commands/specify.md` - states that clarify chains automatically after
     specify (AI-led loop; deferrals are recorded in `## Clarifications`).
3. **Statuses (ADR-010)** - carried by the standard's own spec template (see
   patch 4): `specs/capability-spec.template.md` declares
   `**Status:** in-refinement | ready-to-develop | in-development | live`, and
   ready-to-develop is earned by the clarify gate. The engine ships no
   competing spec template.
4. **Spec/constitution shape comes from the standard** - the engine instantiates
   the standard's templates instead of its own (dropped, see above).
   - `commands/specify.md` + `scripts/bash/create-new-feature.sh` - new specs
     are copied from `specs/capability-spec.template.md`.
   - `commands/constitution.md` - `.specify/memory/constitution.md` is
     initialized from `specs/constitution.template.md`, and the propagation
     checklist reads `specs/capability-spec.template.md`.

## How this ships to dist/

`dist/` carries the consumer layout the upstream CLI would have produced for
Claude Code (sh variant), generated from this directory:

- `templates/*.md` -> `dist/.specify/templates/*.md` - upstream's template
  install (`refresh_shared_templates`): `__SPECKIT_COMMAND_<NAME>__` ->
  `/speckit.<name>`; otherwise verbatim
- `scripts/bash/*.sh` -> `dist/.specify/scripts/bash/*.sh` (executable) -
  upstream's script install (`install_shared_infra`): the same command-token
  resolution plus `$(format_speckit_command <name> ...)` calls baked to
  `/speckit.<name>`; otherwise verbatim
- `LICENSE` -> `dist/.specify/LICENSE` (byte copy; the MIT notice ships with the copy)
- `commands/<name>.md` -> `dist/.claude/skills/speckit-<name>/SKILL.md`, applying
  upstream's own install-time render (from its `CommandRegistrar`):
  1. frontmatter `scripts:` values: `scripts/` -> `.specify/scripts/`
  2. body `{SCRIPT}` -> the frontmatter `sh` command (with the same path rewrite)
  3. `{ARGS}` -> `$ARGUMENTS`; `__AGENT__` -> `claude`
  4. `__SPECKIT_COMMAND_<NAME>__` -> `/speckit.<name>` (dot separator)
  5. body top-level `memory/`, `scripts/`, `templates/` refs -> `.specify/`-prefixed

Do not hand-edit the generated `dist/` files; change this directory and
re-generate. Upstream is re-synced only at release time (ADR-013): bump the
version pin here, re-apply this patch list, re-verify.

## Layout decision (owner, 2026-07-22)

The engine ships as **skills**, not slash-commands: each command renders to
`dist/.claude/skills/speckit-<name>/SKILL.md` (frontmatter + a provenance note naming
the upstream version and the patch list), beside the standard's own nine lifecycle
skills - one distribution mechanism for everything. The shared runtime (scripts,
ephemeral templates, LICENSE) stays in `dist/.specify/`. Upstream v0.13.2 itself
installs Claude assets as skills, so this matches their current direction.
