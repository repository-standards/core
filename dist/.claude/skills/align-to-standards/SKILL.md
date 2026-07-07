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

5. **Pin the aligned version, carry the manifest.** Write the standard's version to
   `.standards-version`, and copy that version's `standard.manifest.json` into the repo
   (ADR-005) - it is the checklist the align was measured against, and what `self-verify`
   reads. Use the manifest's `files` / `sections` / `guards` / `decisions` as the coverage
   list, and each entry's `adapt` rule (copy / merge / fill-from-repo / reference) to
   decide *how* it lands - never blind-copy a `fill-from-repo` artifact. Record any
   deliberate deviation as a manifest `exceptions` entry so a later update does not
   silently overwrite it.

6. **Self-verify.** Run `node scripts/self-verify.mjs --version <aligned>` (see
   `docs/self-verify.md`): the pin matches the manifest, every required entry is met, the
   guards are green - **drift 0**. Do not open the PR on a red self-verify.

7. **Open one focused PR.** Never push without the human's go. Never reference other
   repos.

## Then, for an existing repo: hand off to `onboard-repo`

This skill puts the **skeleton** in place (files, guards, structure). It does not fill
`docs/` and `specs/` with the repo's real content. For an existing, undocumented repo,
continue with `onboard-repo`: read the code, derive its capabilities, seed specs and
the decisions the code already implies, and turn the rest into a prioritized backlog -
incrementally, not in one dump. Greenfield repos skip this: their content is written as
features land.

## Not this

- Not a blind overwrite (that recreates divergence) - adapt to the stack.
- Not company-specific values (tokens, tenant ids) - those stay as variables / overlay.
