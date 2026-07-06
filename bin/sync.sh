#!/usr/bin/env bash
# Apply the core standards baseline into a target repo.
#
# Usage:  bin/sync.sh /path/to/target-repo [--force]
#
# Safe by default: never overwrites a file that already exists and differs -
# it reports the drift and moves on. Pass --force to overwrite. Files that are
# genuinely repo-specific to merge (notably .claude/settings.json when the repo
# already has one) are reported, not clobbered - reconcile those by hand or with
# the `align-to-standards` skill.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE="$HERE/core"
TARGET="${1:-}"
FORCE=0
[ "${2:-}" = "--force" ] && FORCE=1

if [ -z "$TARGET" ] || [ ! -d "$TARGET/.git" ]; then
  echo "usage: bin/sync.sh /path/to/target-repo [--force]  (target must be a git repo)" >&2
  exit 1
fi

# Where the target keeps agent skills.
if [ -d "$TARGET/.agents/skills" ]; then
  SKILL_DIR=".agents/skills"
else
  SKILL_DIR=".claude/skills"
fi

# src (relative to core/)            dest (relative to target repo)
MAP="
gitleaks/.gitleaks.toml|.gitleaks.toml
github/workflows/gitleaks.yml|.github/workflows/gitleaks.yml
github/workflows/spec-guard.yml|.github/workflows/spec-guard.yml
specs/spec-guard.mjs|scripts/spec-guard.mjs
github/pull_request_template.md|.github/pull_request_template.md
CONTRIBUTING.md|CONTRIBUTING.md
skills/pre-pr-review/SKILL.md|$SKILL_DIR/pre-pr-review/SKILL.md
"

apply() {
  local src="$CORE/$1" dest="$TARGET/$2"
  if [ ! -f "$src" ]; then echo "!! missing in core: $1"; return; fi
  if [ -f "$dest" ]; then
    if cmp -s "$src" "$dest"; then echo "== up to date: $2"; return; fi
    if [ "$FORCE" = 1 ]; then cp "$src" "$dest"; echo "~~ overwritten (--force): $2"; return; fi
    echo "!! DRIFT (kept target): $2  - reconcile by hand or with align-to-standards"; return
  fi
  mkdir -p "$(dirname "$dest")"; cp "$src" "$dest"; echo "++ added: $2"
}

echo "Applying core standards -> $TARGET"
while IFS='|' read -r src dest; do
  [ -z "$src" ] && continue
  apply "$src" "$dest"
done <<< "$MAP"

# .claude/settings.json is policy that repos often already have with local
# deny/ask entries; never clobber it - report so it can be merged deliberately.
if [ -f "$TARGET/.claude/settings.json" ]; then
  echo "ii .claude/settings.json exists - merge the baseline's hooks + deny/ask by hand (see core/claude/settings.baseline.json)"
else
  mkdir -p "$TARGET/.claude"; cp "$CORE/claude/settings.baseline.json" "$TARGET/.claude/settings.json"
  echo "++ added: .claude/settings.json (from baseline)"
fi

# Conventions are single-sourced in the target's AGENTS.md, not duplicated into
# tool files. core/agents/conventions.md is a block to MERGE there by hand or with
# the align-to-standards skill - it is not a drop-in file, so it is not copied.
echo "ii conventions: merge core/agents/conventions.md into $TARGET/AGENTS.md (do not copy it as a file; CLAUDE.md / .cursor should point to AGENTS.md, not restate)"

echo "Done. Review the diff, then commit on a branch and open a PR."
