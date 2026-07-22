# Spec Kit setup (capability-spec model)

Spec Kit is the **execution engine** (plan / tasks / implement / converge). Install
it, then wire it to the capability model - long-lived `specs/<capability>/`, not
disposable feature folders.

## Install

```
uvx --from git+https://github.com/github/spec-kit.git specify init
```

Creates `.specify/` (templates, scripts, memory) and the `/speckit-*` commands for
Claude Code and Cursor.

## Wire to the capability model

- Specs live at `specs/<capability>/spec.md` (domain, not `NNN-feature/`). See the
  [capability-spec template](capability-spec.template.md).
- The `/spec-*` skills (`.claude/skills/spec-*`) drive the capability workflow; Spec
  Kit's `plan` / `tasks` / `implement` / `converge` stay as the engine underneath.
- Set the governance bridge: `.specify/memory/constitution.md` from
  [`constitution.template.md`](constitution.template.md). The Constitution Check
  must consult the capability specs + ADR + standards, not restate them.
- Add the enforcement guard ([`enforcement.md`](enforcement.md)) so a merge cannot
  silently violate the spec policy.

## The loop (spec-first)

The spec is the driver. You change a spec, everything else is derived, then you
loop.

```
change a spec (target: how it should work)
  ->  /spec-impact     (which other specs, ADRs, files does it ripple to?)
    ->  /spec-update   (edit every affected spec to the target state)
      ->  /spec-analyze (do the specs contradict each other?)
        ->  plan  ->  tasks  ->  implement            (Spec Kit engine)
          ->  /spec-reconcile (spec <-> code <-> tests: no drift)
            ->  merge  ->  (loop for the next change)
```

`main` spec = current truth; branch spec = target; `git diff` = the change delta.
Plans and tasks are disposable; the capability specs are the product truth.

## The engine - a vendored, pinned Spec Kit (ADR-013)

The spec engine is **based on GitHub Spec Kit, vendored at a pinned version and
patched for this standard** (ADR-013, owner-amended 2026-07-22). What that means:

- **The surface**: the `speckit.*` command prompts (`specify` / `clarify` / `plan` /
  `tasks`), the helper scripts, and the constitution template - on the agent side Spec
  Kit is essentially prompt files + scripts, so the standard carries its own copy,
  **patched**: capability paths instead of `NNN-` dirs (ADR-002), the clarify gate
  pre-wired as mandatory hooks, spec `Status` integration (ADR-010).
- **Until `ENG-5` lands the vendored copy**, install upstream directly (tested with
  **0.10 - 0.13.x**, checked 2026-07; hooks need >= 0.10) and apply the patches per
  this doc. After `ENG-5`, `dist/` ships the working engine and **no upstream CLI is
  needed at all**.
- **Sync cadence:** upstream is re-checked only when the standard cuts a release -
  each sync records "based on github/spec-kit vX.Y" + the patch list. Upstream's
  breaking changes (e.g. v0.10.0 dropping the `--ai` flags) get absorbed here once;
  consumers only ever see an `update-to-version` delta.
- **Naming:** the `spec-*` skills are the standard's own layer; the vendored files
  keep upstream's `speckit.*` names - attribution honest in both directions (MIT
  notice ships with the copy).
- **Exit:** the gate, statuses, and `spec-*` skills survive an engine swap; a vendored
  copy even survives upstream vanishing.

## Make the loop self-triggering (the clarify gate)

Left to manual invocation the loop dies - a user who does not know `/speckit-clarify`
exists will never run it. Enforce it in layers (a pattern proven in production, 2026-07; ADR-010):

1. **Hook it** - `.specify/extensions.yml`: clarify is a mandatory `after_specify` hook
   (specify *chains into* the clarify loop automatically); `analyze` as an optional
   `after_tasks` hook.
2. **Gate it** - a check script + skill as mandatory `before_plan` / `before_tasks`
   hooks: BLOCK unless the spec has a `## Clarifications` section and zero open
   `[NEEDS CLARIFICATION]`. Passing the gate is what earns `Status: ready-to-develop`.
3. **Bind it** - a constitution rule: the flow is **AI-led and clarify-gated**; the AI
   drives the loop, proposes answers, and asks up front whether the user authors the
   technical detail or wants proposals. A deferral ("leaving this to the technical
   side") is recorded in `## Clarifications`, never lost.
4. **Load it** - restate the rule in `AGENTS.md` (and per-agent context files) so every
   session of every agent sees it without being told.
5. **Guard the bridge** - any git -> tracker mirror refuses (even dry-run) a slice that
   fails the gate.
