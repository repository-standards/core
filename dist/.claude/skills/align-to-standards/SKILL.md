---
name: align-to-standards
description: Bring the current repo up to the reference skeleton (repository-standards) - read both, see what is missing or drifted, apply it adapted to this repo's stack and language, and open a PR. No file copying; the agent compares and reconciles.
disable-model-invocation: true
---

# align-to-standards

Align the current repo to the reference skeleton `repository-standards`. The skeleton
looks like a real repo; you read it and this repo, see the difference, and apply it -
adapted to this repo's stack and language. Works the same for a new or an existing
repo.

## Steps

1. **Read the reference skeleton** (`repository-standards`): `AGENTS.md`, `CLAUDE.md`,
   `.claude/` (settings + skills), `.github/`, `.gitleaks.toml`, `scripts/`, `docs/`
   (PRINCIPLES, ARCHITECTURE, PRODUCT, ADR/BDR, conventions), `specs/`. Note its VERSION.

2. **Read the current repo.** For each part of the skeleton, classify: missing /
   present-but-drifted / up to date (by content).

3. **Apply, adapted - do NOT blind-copy:**
   - Merge the `settings.json` guards + deny/ask into this repo's
     `.claude/settings.json`; keep repo-specific entries; adapt migration/deploy CLIs
     to the real stack.
   - Drop in the guard + workflows; wire the pre-commit into the repo's hook mechanism.
   - Put conventions in `AGENTS.md` (single source); `CLAUDE.md` stays a thin router.
   - `docs/` and `specs/` in the skeleton are **templates** - fill them with this
     repo's content, in this repo's language.
   - Skills into the repo's skill dir (`.agents/skills` or `.claude/skills`).

4. **Watch repo gotchas** (e.g. a broad `settings.json` `.gitignore` rule swallowing
   `.claude/settings.json` - add a `!` negation).

5. **Record the aligned version** (e.g. `.standards-version`) so drift is measurable.

6. **Open one focused PR.** Never push without the human's go. Never reference other
   repos.

## Not this

- Not a blind overwrite (that recreates divergence) - adapt to the stack.
- Not company-specific values (tokens, tenant ids) - those stay as variables / overlay.
