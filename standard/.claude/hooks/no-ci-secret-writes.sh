#!/usr/bin/env bash
# Denies changes to CI secrets and variables.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Fail closed on a missing or unreadable lib.sh: without it deny() is undefined, read_command
# is undefined, CMD comes out empty and the guard exits 0 - protection gone, nothing printed.
. "${DIR}/lib.sh" || {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked by repository policy: the agent guard could not load .claude/hooks/lib.sh, so this command was never checked."}}\n'
  exit 0
}

CMD=$(read_command)
[ -n "${CMD}" ] || exit 0

while IFS= read -r segment; do
  [ -n "${segment}" ] || continue
  # Looking for the phrase is not running it. Without this, `grep -rn "gh secret set" docs/` is
  # refused as an attempt to set a secret, so the phrase cannot be searched for, documented, or
  # written into this repository's own guidance without routing around the guard.
  segment_is_search "${segment}" && continue

  if printf '%s' "${segment}" | grep -qiE 'gh[[:space:]]+(secret|variable)[[:space:]]+(set|delete|remove)'; then
    deny "Blocked by repository policy: CI secrets and variables are not edited from here. Rotating or changing one is a deliberate human action in the repository settings."
  fi

  if printf '%s' "${segment}" | grep -qi 'gh[[:space:]]\+api' \
    && printf '%s' "${segment}" | grep -qiE 'secrets|variables' \
    && printf '%s' "${segment}" | grep -qiE '(-X|--method)[[:space:]=]*(DELETE|PATCH|PUT|POST)|(^|[[:space:]])-(f|F)[[:space:]]|--field|--raw-field|--input'; then
    deny "Blocked by repository policy: CI secrets and variables are not edited from here. Rotating or changing one is a deliberate human action in the repository settings."
  fi
done <<EOF
$(split_segments "${CMD}")
EOF

exit 0
