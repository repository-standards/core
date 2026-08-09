#!/usr/bin/env bash
# Runs every PreToolUse guard in this directory and relays the first denial.
#
# It exists because the guards were scrupulous about failing closed - a missing jq, an unreadable
# lib.sh - and then the outermost link failed open. settings.json used to name each guard as
# "$CLAUDE_PROJECT_DIR"/.claude/hooks/<name>.sh; with that variable unset, or the directory
# absent, the shell exits 127 with empty stdout, which Claude Code treats as a non-blocking
# error and runs the command anyway. Nothing distinguishes that from three clean passes.
#
# So this dispatcher resolves its siblings from its own path rather than from the environment,
# and turns every failure it can still observe - a guard missing, unreadable, or exiting nonzero
# because it is syntactically broken - into a denial. The one failure it cannot observe is its
# own absence, which is why settings.json keeps a `||` fallback that denies when this file
# cannot be run at all.
set -uo pipefail

# Not via lib.sh: this has to work when lib.sh is the thing that is gone.
hard_deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$1"
  exit 0
}

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || DIR=""
[ -n "${DIR}" ] || hard_deny "Blocked by repository policy: the agent guards could not locate their own directory, so this command was never checked."

GUARDS="no-remote-db-writes.sh no-force-push.sh no-ci-secret-writes.sh"

# stdin is the hook payload and can only be read once, so it is buffered and replayed per guard.
PAYLOAD="$(cat)"

for guard in ${GUARDS}; do
  path="${DIR}/${guard}"
  [ -r "${path}" ] \
    || hard_deny "Blocked by repository policy: the agent guard ${guard} is missing or unreadable, so this command was never checked. Restore .claude/hooks/ from the standard."

  out="$(printf '%s' "${PAYLOAD}" | bash "${path}" 2>/dev/null)"
  rc=$?

  if [ -n "${out}" ]; then
    printf '%s\n' "${out}"
    exit 0
  fi

  # Empty stdout and a nonzero exit is a broken guard, not a clean pass - the exact shape that
  # makes a syntax error in one of these files indistinguishable from approval.
  [ "${rc}" -eq 0 ] \
    || hard_deny "Blocked by repository policy: the agent guard ${guard} exited ${rc} without a verdict, so this command was never checked."
done

exit 0
