#!/usr/bin/env bash
# Denies any write against a database that is not on this machine.
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

WRITE_RE='\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|merge|vacuum|reindex|cluster|refresh)\b|\bcopy\b.*\bfrom\b|(^|[[:space:]])-f[[:space:]]|--file|(^|[^<])<($|[^<])'

while IFS= read -r segment; do
  [ -n "${segment}" ] || continue

  remote=0

  # A connection URI whose host is not loopback.
  urls=$(printf '%s' "${segment}" | grep -oiE "postgres(ql)?://[^[:space:]\"']+" || true)
  if [ -n "${urls}" ]; then
    if printf '%s\n' "${urls}" \
      | sed -E 's#^postgres(ql)?://([^@/]*@)?##' \
      | grep -viE "^${LOCAL_HOST_RE}" \
      | grep -q .; then
      remote=1
    fi
  fi

  # A psql/pgcli invocation with an explicit non-loopback -h/--host. The flag match is
  # case-sensitive on purpose: psql takes a lowercase -h, while -H is curl's header flag, and
  # reading one as the other denies a local psql whose argument merely came from a curl call.
  if printf '%s' "${segment}" | grep -qiE '(^|[[:space:];|&])(psql|pgcli)([[:space:]]|$)'; then
    hosts=$(printf '%s' "${segment}" \
      | grep -oE '(^|[[:space:]])(-h|--host)[[:space:]=]+[^[:space:]]+' \
      | sed -E 's/.*(-h|--host)[[:space:]=]+//' || true)
    if [ -n "${hosts}" ] && printf '%s\n' "${hosts}" | grep -viE "^${LOCAL_HOST_RE}" | grep -q .; then
      remote=1
    fi
  fi

  if [ "${remote}" = 1 ] && printf '%s' "${segment}" | grep -qiE "${WRITE_RE}"; then
    deny "Blocked by repository policy: never WRITE to a remote database - no DDL, no DML, no migration CLI, no executing .sql files. Read-only SELECT is fine. Ship a schema change as a reviewed .sql file under database/schema/ for a human to apply."
  fi
done <<EOF
$(split_segments "${CMD}")
EOF

exit 0
