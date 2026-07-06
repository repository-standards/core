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
