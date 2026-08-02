#!/usr/bin/env bash
# Denies force-push and history rewriting. A plain git push is untouched.
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

PUSH_RE='(^|[^[:alnum:]_])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-c[[:space:]]+[^[:space:]]+|--[^[:space:]]+|-[a-zA-Z]+))*[[:space:]]+push([[:space:]]|$)'
# `--force` with no tail restriction on purpose: git accepts any unambiguous abbreviation of a long
# option, so --force-with-l and --force-if-inc are real force-pushes. Every one of them starts with
# --force (--forc alone is ambiguous and git rejects it), and no benign push option shares the prefix.
FORCE_RE='(--force|(^|[[:space:]])-[a-zA-Z]*f([[:space:]]|$)|(^|[[:space:]])\+[A-Za-z0-9_./-]+)'

# Per segment, so a force flag in one command cannot be attributed to a `git push` in another - and
# so an apostrophe in a commit message cannot swallow the flag the way whole-string quote-stripping
# did (`git commit -m "it's fine" ; git push --force origin main # don't tell`).
while IFS= read -r segment; do
  [ -n "${segment}" ] || continue
  printf '%s' "${segment}" | grep -qE "${PUSH_RE}" || continue
  if printf '%s' "${segment}" | grep -qE "${FORCE_RE}"; then
    deny "Blocked by repository policy: never force-push or rewrite published history (--force, --force-with-lease, --force-if-includes, -f, +refspec). A normal git push is allowed. If a force-push is genuinely needed, hand the exact command to a human."
  fi
done <<EOF
$(split_segments "${CMD}")
EOF

exit 0
