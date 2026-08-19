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

# `-f` is matched attached as well as spaced, and a named .sql file counts on its own.
#
# Both gaps were the same shape: the statement never appears in the command line, so none of the
# verbs above are there to find. `psql -h prod -fmigration.sql` carried the file attached to the
# flag, and `cat migration.sql | psql -h prod` carried it through a pipe - each ran a whole
# migration against a production database with the guard silent, which is the one thing it exists
# to stop. Naming a .sql file next to a remote client is enough; what is inside it cannot be read
# from here, and a guard that cannot read what it would run has not checked it.
WRITE_RE='\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|merge|vacuum|reindex|cluster|refresh)\b|\bcopy\b.*\bfrom\b|\bcomment[[:space:]]+on\b|\breassign[[:space:]]+owned\b|\bpg_(terminate|cancel)_backend\b|(^|[[:space:]])-f|--file|\.sql([[:space:]]|["'"'"')]|$)|(^|[^<])<($|[^<])'

# Every SQL client, not only the Postgres ones.
#
# This guard shipped Postgres-only for its whole life - psql, pgcli, `postgres://` - and a repo
# that runs MySQL got no protection at all. `mysql -h db.prod.example.com -e "DROP TABLE users"`
# ran straight through, and so did a `mysql2://` connection string, because neither the client
# name nor the scheme appeared in any pattern. A guard that only prints on refusal makes that
# indistinguishable from approval. Found by probing it during a Rails adoption, not by reading.
#
# Scope, said plainly so it is not read as more: WRITE_RE above is SQL vocabulary, so this covers
# the SQL family. A document or key-value store reached remotely is NOT covered - `mongosh` and
# `redis-cli` write with verbs this pattern does not know, and implying otherwise here would be
# worse than the gap itself.
SQL_CLIENT_RE='psql|pgcli|mysql|mysqlsh|mysqladmin|mariadb|mariadb-admin'
SQL_SCHEME_RE='postgres(ql)?|mysql2?|mariadb'

# What may precede a client name. The old anchor was `[[:space:];|&]`, which rejected a preceding
# `/` or quote, so `/usr/local/bin/psql` and `bash -c "psql ..."` were not clients at all and every
# remote write through either shape ran unchecked. The trailing `([[:space:]]|$)` is what keeps
# `mysqldump` and `mariadb-dump` out of the client list, so loosening the front costs nothing.
CLIENT_BOUNDARY='(^|[^[:alnum:]_.-])'

# Write verbs are searched for in the WHOLE command; remote hosts are established PER SEGMENT.
#
# The asymmetry is the point. Per-segment host detection is what stops a local segment vouching
# for a remote one (`psql -h localhost -c 'select 1' && psql -h prod -c 'DROP TABLE x'`), so it
# stays. But requiring the verb in the SAME segment turned every ordinary way of writing a long
# command into a bypass: a pipe, a backslash line-wrap and a heredoc each put the host in one
# segment and the verb in another, and the guard fell silent. Nothing about a wrapped line is
# adversarial - an agent formatting a long psql call for readability disabled the control.
#
# The cost is false positives: a remote SELECT next to an unrelated `rm -f` denies, because `-f`
# is one of the write signals. That is the correct direction for this control, and the way out
# is to run the two commands separately, not to narrow the check.
WRITE_PRESENT=0
printf '%s' "${CMD}" | grep -qiE "${WRITE_RE}" && WRITE_PRESENT=1

# A command substitution is unknown content. `psql -h prod -c "$(cat migration.sql)"` carries any
# statement at all and no text scan can see it, so a guard that let it through has not checked it -
# the same reasoning that makes a missing jq a denial rather than a pass.
OPAQUE=0
printf '%s' "${CMD}" | grep -qE '\$\(|`' && OPAQUE=1

# libpq and mysql read the host from the environment when no flag gives one. The assignment is
# command-wide on purpose: `export PGHOST=prod; psql -c 'DROP TABLE t'` puts it in an earlier
# segment than the client, and an exported variable really does apply to what follows it. A
# segment that names its own host is judged on that host instead, so `-h localhost` still wins.
ENV_HOSTS=$(printf '%s' "${CMD}" \
  | grep -oE '(^|[^[:alnum:]_])(PGHOST|PGHOSTADDR|MYSQL_HOST)=[^[:space:]]+' \
  | sed -E 's/^[^=]*=//' || true)
ENV_REMOTE=0
if [ -n "${ENV_HOSTS}" ] && printf '%s\n' "${ENV_HOSTS}" | grep -viE "^${LOCAL_HOST_RE}" | grep -q .; then
  ENV_REMOTE=1
fi

while IFS= read -r segment; do
  [ -n "${segment}" ] || continue
  # A segment that searches for text is not a segment that runs it, so documenting a remote psql
  # call does not read as making one. The write signals above are still taken from the whole
  # command, so a search piped into a client is judged on the client's segment.
  segment_is_search "${segment}" && continue

  remote=0

  # A connection URI whose host is not loopback.
  urls=$(printf '%s' "${segment}" | grep -oiE "(${SQL_SCHEME_RE})://[^[:space:]\"']+" || true)
  if [ -n "${urls}" ]; then
    if printf '%s\n' "${urls}" \
      | sed -E "s#^(${SQL_SCHEME_RE})://([^@/]*@)?##" \
      | grep -viE "^${LOCAL_HOST_RE}" \
      | grep -q .; then
      remote=1
    fi
  fi

  # A SQL client invocation whose host is not loopback. Three spellings, because libpq accepts
  # three: the flag (`-h HOST`, `-hHOST`, `--host=HOST`), keyword-value conninfo
  # (`psql "host=HOST dbname=app"`), and the environment. The flag match is case-sensitive on
  # purpose: psql takes a lowercase -h, while -H is curl's header flag, and reading one as the
  # other denies a local psql whose argument merely came from a curl call. mysql and mariadb
  # take the same lowercase -h, so the same reasoning covers them.
  #
  # `pg_dump` and `mysqldump` are deliberately absent from the client list: a dump is a read.
  if printf '%s' "${segment}" | grep -qiE "${CLIENT_BOUNDARY}(${SQL_CLIENT_RE})([[:space:]]|$)"; then
    # `^[^-]*` rather than `.*` so a host containing `-h` (`-h my-host`) is not re-split on itself.
    flag_hosts=$(printf '%s' "${segment}" \
      | grep -oE '(^|[^[:alnum:]_-])(-h[[:space:]]*|--host[[:space:]=]+)[^[:space:]]+' \
      | sed -E 's/^[^-]*(-h[[:space:]]*|--host[[:space:]=]+)//' || true)
    # Lowercase `host=` only, so the uppercase tail of `PGHOST=` is not read as conninfo.
    kv_hosts=$(printf '%s' "${segment}" \
      | grep -oE "(^|[[:space:]\"'])host=[^[:space:]\"']+" \
      | sed -E 's/^[^h]*host=//' || true)
    # Quoting a host is ordinary (`-h "localhost"`) and it used to read as non-loopback, because
    # the loopback pattern is anchored and the quote sits where the anchor is. A guard that denies
    # local work gets switched off, so the quotes come off before the comparison.
    hosts=$(printf '%s\n%s' "${flag_hosts}" "${kv_hosts}" \
      | sed -E 's/^["'"'"']+//; s/["'"'"']+$//' \
      | grep -v '^$' || true)

    if [ -n "${hosts}" ]; then
      # A host beginning with `/` is a unix-socket directory, which cannot be anywhere but here.
      if printf '%s\n' "${hosts}" | grep -v '^/' | grep -viE "^${LOCAL_HOST_RE}" | grep -q .; then
        remote=1
      fi
    elif [ "${ENV_REMOTE}" = 1 ]; then
      remote=1
    fi
  fi

  if [ "${remote}" = 1 ]; then
    if [ "${WRITE_PRESENT}" = 1 ]; then
      deny "Blocked by repository policy: never WRITE to a remote database - no DDL, no DML, no migration CLI, no executing .sql files. Read-only SELECT is fine. Ship a schema change as a reviewed .sql file under database/schema/ for a human to apply."
    fi
    if [ "${OPAQUE}" = 1 ]; then
      deny "Blocked by repository policy: this command reaches a remote database and builds its SQL from a command substitution, so what it would run cannot be read here. A guard that cannot read the command has not checked it. Inline the statement, or read the file and ship the change as a reviewed .sql under database/schema/."
    fi
  fi
done <<EOF
$(split_segments_quoted "${CMD}")
EOF

exit 0
