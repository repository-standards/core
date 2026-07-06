---
name: align-to-standards
description: Reconcile the current repo to the shared repository-standards baseline - detect what is missing or drifted, apply it adapted to this repo's stack, and open a PR. Agent-native alternative to a blind file copy.
disable-model-invocation: true
---

# Align to standards

Bring the current repo up to the shared `repository-standards` baseline. Unlike
`bin/sync.sh` (a dumb, safe file copy), this adapts each standard to *this* repo's
stack instead of overwriting.

## Steps

1. **Get the standard.** Read the `repository-standards` repo (its `core/`,
   `manifest.json`, and `VERSION`). Note the version you are aligning to.

2. **Diff, per core item.** For each file in `core/`, classify this repo:
   - **missing** - not present here.
   - **drifted** - present but differs from canonical.
   - **up to date** - matches (by content or by manifest sha256).

3. **Apply, adapted to the stack - do NOT blind-copy.** Examples:
   - `settings.baseline.json`: MERGE the two PreToolUse guards + the deny/ask
     baseline into this repo's existing `.claude/settings.json`. Keep the repo's
     own `allow` entries and any repo-specific deny/ask. Adapt migration-CLI /
     deploy entries to the real stack (Fly vs AWS/CDK/Terraform, Prisma vs Kysely).
   - `gitleaks.yml`: drop in as-is; wire the pre-commit step into whatever hook
     mechanism the repo already uses (lefthook / husky / `.githooks`). If none
     exists, note it - do not invent one silently.
   - `commits.mdc`: if the repo already states commit conventions, extend rather
     than duplicate; keep one voice.
   - `pre-pr-review` skill: place under the repo's skill dir
     (`.agents/skills` or `.claude/skills`).

4. **Watch for repo gotchas.** e.g. a broad `settings.json` `.gitignore` rule can
   swallow `.claude/settings.json` - add a `!.claude/settings.json` negation.

5. **Record the version.** Write the aligned standard version into the repo
   (e.g. a `.standards-version` file) so drift is measurable next time.

6. **Open a PR.** One focused PR: `chore(standards): align to repository-standards vX.Y.Z`.
   List what was added vs. adapted. Never push or open the PR without the human's go.

## Not this

- Not a blind overwrite - that recreates divergence. Adapt to the stack.
- Not a place to drop company-specific values (tenant ids, tokens) - those stay
  as variables or in a private overlay.
