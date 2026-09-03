#!/usr/bin/env bash
# Denies any write against a database that is not on this machine: a SQL client, a dump restore,
# or a migration/seed runner judged by the host its environment would hand it.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Fail closed on a missing or unreadable lib.sh: without it deny() is undefined, read_command
# is undefined, CMD comes out empty and the guard exits 0 - protection gone, nothing printed.
. "${DIR}/lib.sh" || {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked by repository policy: the agent guard could not load .claude/hooks/lib.sh, so this command was never checked."}}\n'
  exit 0
}

CMD=$(read_command)
# Nonzero here means the payload could not be read at all, not that there was no command to
# read - jq exits 0 on a well-formed call with none. Passing on the first would let a
# malformed or truncated payload through as if it were the second, silently.
[ $? -eq 0 ] || deny "Blocked by repository policy: this guard could not parse its input as JSON, so the command was never checked."
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
# Loading a dump is the one remote write that names no statement and no file flag of its own:
# `pg_restore -d <remote> dump.tar` carries every verb in WRITE_RE without spelling out any of
# them, so the verb scan has nothing to find and the client list above does not know the name.
RESTORE_RE='pg_restore|mysqlimport'

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

# libpq and mysql read the host from the environment when no flag gives one. An assignment is
# read from the client's own segment first (`PGHOST=prod psql ...`), else carried from an earlier
# segment that was nothing but assignments (`export PGHOST=prod; psql ...`) - carried_value in
# lib.sh says exactly what carries. Not from anywhere in the command: that lets a
# `grep "PGHOST=prod"` deny an unrelated local client, and lets `PGHOST=localhost psql -c 'select 1'`
# vouch for a `psql` two segments on that reads a different host. A segment that names its own
# host is judged on that host instead, so `-h localhost` still wins.
CLIENT_ENV_VARS='PGHOST PGHOSTADDR MYSQL_HOST'

# Migration and seed runners: a package runner or interpreter followed anywhere by the migrate or
# seed verb, or by an entry file under migrate/ or seed/. Tools whose write verb is a word too
# common to trust after any runner (`update`, `upgrade` - `pnpm update` is not a migration) are
# matched with their own name in front.
#
# A runner shows no client and no statement, so nothing above sees it, and it applies a whole
# migration to whatever host its environment names. That host is resolved the way dotenv and libpq
# resolve it: an inline assignment on the runner's segment, else one carried from an earlier
# assignment-only segment, else this process's own environment (the Bash tool inherits it), else
# the env files the runner would read - last assignment in a file wins, `export` and a trailing
# comment stripped, CRLF tolerated. REMOTE_DB_ENV_FILES (space-separated, relative to the repo
# root or absolute) overrides the file list for a repo that keeps its env elsewhere.
#
# No host visible in any of those is a denial, not a pass. A runner reaches a host from
# somewhere; one that shows none is reading a place this guard cannot see, and a guard that
# cannot see the target has not checked it - the same reasoning that makes a missing jq a denial.
RUNNER_TOOLS='pnpm|npm|yarn|npx|bun|bunx|deno|node|tsx|ts-node|python[0-9.]*|php|bundle|rake|rails|mix|knex|prisma|drizzle-kit|sequelize(-cli)?|typeorm'
RUNNER_VERB_RE='(db:)?migrate(:[a-z-]+)*|(db:)?seed(-with-reset)?(:[a-z-]+)*|migration:(run|revert)|ecto\.(migrate|rollback)|db[[:space:]]+(push|seed)|([^[:space:]]*/)?(migrate|seed)/[^[:space:]]+'
RUNNER_RE="${CLIENT_BOUNDARY}(${RUNNER_TOOLS})[[:space:]]+([^[:space:]]+[[:space:]]+)*(${RUNNER_VERB_RE})([[:space:]]|$)"
RUNNER_NAMED_RE="${CLIENT_BOUNDARY}(alembic[[:space:]]+(upgrade|downgrade)|flask[[:space:]]+db[[:space:]]+(upgrade|downgrade)|flyway[[:space:]]+(migrate|undo|clean|baseline|repair)|liquibase[[:space:]]+(update|rollback)[[:alnum:]-]*|dotnet[[:space:]]+ef[[:space:]]+database[[:space:]]+(update|drop))([[:space:]]|$)"
# The runners' read-only modes: reading a remote database is allowed, so these pass regardless
# of host - unless `--reset` rides along, which is a write whatever else the line says. A
# read-only name is trusted anywhere; a read-only flag only where it reaches the program it
# names. A package manager appends the flag to the end of whatever its script expands to, so
# `pnpm seed-with-reset --status` runs the reset and hands `--status` to the seed - after a
# package-manager script the flag proves nothing and the host is judged.
RUNNER_READ_NAMED_RE='migrate:(status|verify|list|current[a-z]*|check[a-z-]*)([[:space:]]|$)|migrate[[:space:]]+(status|diff)([[:space:]]|$)'
RUNNER_READ_FLAG_RE='--(status|verify|dry-run|plan)([[:space:]]|$)'
PM_SCRIPT_RE="${CLIENT_BOUNDARY}(pnpm|npm|yarn|bun)[[:space:]]+([^[:space:]]+[[:space:]]+)*((db:)?migrate(:[a-z-]+)*|(db:)?seed(-with-reset)?(:[a-z-]+)*)([[:space:]]|$)"
RUNNER_HOST_VARS='DB_HOST DATABASE_HOST POSTGRES_HOST PGHOST PGHOSTADDR MYSQL_HOST DATABASE_URL DB_URL'
# A tunnel terminates on loopback and still ends at a remote database.
RUNNER_TUNNEL_VARS='DB_SSL_TUNNEL PGSSLTUNNEL'
RUNNER_ENV_FILES="${REMOTE_DB_ENV_FILES:-.env .env.local database/.env}"
REPO_ROOT="$(cd "${DIR}/../.." && pwd)"

# The host a variable's value names. A connection URL is stripped to its host part; a sqlite or
# file URL is this machine by construction; anything else is taken as a host name.
host_of() { # host_of <NAME> <value>
  case "$1" in
    *URL)
      if printf '%s' "$2" | grep -qiE "^(${SQL_SCHEME_RE})://"; then
        printf '%s' "$2" | sed -E 's#^[^:]+://([^@/]*@)?##; s#/.*$##'
      elif printf '%s' "$2" | grep -qiE '^(sqlite|file):'; then
        printf 'localhost'
      else
        printf '%s' "$2"
      fi ;;
    *) printf '%s' "$2" ;;
  esac
}
url_is_remote() { host_is_remote "$(host_of DATABASE_URL "$1")"; }
tunnel_is_on() { printf '%s' "$1" | grep -qiE '^["'"'"']?(true|1|yes|on)["'"'"']?$'; }
# Which values a bare (unexported) assignment carries forward: the ones that would be refused.
unsafe_fn_for() { # unsafe_fn_for <NAME>
  case "$1" in *URL) printf 'url_is_remote' ;; *TUNNEL) printf 'tunnel_is_on' ;; *) printf 'host_is_remote' ;; esac
}
file_value() { # file_value <NAME> <file> - the file's last assignment; empty when none or unreadable
  [ -r "$2" ] || return 0
  grep -E "^[[:space:]]*(export[[:space:]]+)?$1=" "$2" \
    | tail -1 \
    | tr -d '\r' \
    | sed -E "s/^[[:space:]]*(export[[:space:]]+)?$1=//; s/[[:space:]]+#.*$//; s/^[\"']//; s/[\"']$//"
}
# Every value NAME resolves to for the runner in <segment>, as `value<TAB>source` lines, in the
# runner's own precedence: the first source that has it ends the search, except the env files,
# which are all reported - which file a runner reads is not known, so each one that names a
# host is judged.
runner_values() { # runner_values <NAME> <segment>
  local name="$1" segment="$2" value ref file path
  value="$(inline_value "${name}" "${segment}")"
  [ -n "${value}" ] && { printf '%s\t%s\n' "${value}" "the command"; return; }
  ref="CARRY_${name}"
  value="${!ref:-}"
  [ -n "${value}" ] && { printf '%s\t%s\n' "${value}" "an earlier assignment"; return; }
  value="${!name:-}"
  [ -n "${value}" ] && { printf '%s\t%s\n' "${value}" "the environment"; return; }
  for file in ${RUNNER_ENV_FILES}; do
    case "${file}" in /*) path="${file}" ;; *) path="${REPO_ROOT}/${file}" ;; esac
    value="$(file_value "${name}" "${path}")"
    [ -n "${value}" ] && printf '%s\t%s\n' "${value}" "${file}"
  done
  return 0
}

while IFS= read -r segment; do
  [ -n "${segment}" ] || continue

  # A segment that is nothing but assignments runs nothing, so there is nothing to judge here;
  # what it hands to the segments after it is recorded and the loop moves on.
  if printf '%s' "${segment}" | grep -qE "${ASSIGNMENT_ONLY_RE}"; then
    for name in ${RUNNER_HOST_VARS} ${RUNNER_TUNNEL_VARS}; do
      ref="CARRY_${name}"
      printf -v "${ref}" '%s' "$(carried_value "${name}" "${segment}" "${!ref:-}" "$(unsafe_fn_for "${name}")")"
    done
    continue
  fi
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
  # The restore clients join it here so their `-h` host is read the same way.
  if printf '%s' "${segment}" | grep -qiE "${CLIENT_BOUNDARY}(${SQL_CLIENT_RE}|${RESTORE_RE})([[:space:]]|$)"; then
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
    else
      for name in ${CLIENT_ENV_VARS}; do
        value="$(inline_value "${name}" "${segment}")"
        if [ -z "${value}" ]; then ref="CARRY_${name}"; value="${!ref:-}"; fi
        if [ -n "${value}" ] && host_is_remote "${value}"; then remote=1; fi
      done
    fi
  fi

  if [ "${remote}" = 1 ]; then
    # Restoring a dump only ever loads it into the database it connects to, so a remote
    # restore is a write whether or not any write signal appeared in the command text.
    if printf '%s' "${segment}" | grep -qiE "${CLIENT_BOUNDARY}(${RESTORE_RE})([[:space:]]|$)"; then
      deny "Blocked by repository policy: restoring a dump writes to the database, and this one is not local. Restore into a local database instead, or hand the dump to a human to load."
    fi
    if [ "${WRITE_PRESENT}" = 1 ]; then
      deny "Blocked by repository policy: never WRITE to a remote database - no DDL, no DML, no migration CLI, no executing .sql files. Read-only SELECT is fine. Ship a schema change as a reviewed .sql file under database/schema/ for a human to apply."
    fi
    if [ "${OPAQUE}" = 1 ]; then
      deny "Blocked by repository policy: this command reaches a remote database and builds its SQL from a command substitution, so what it would run cannot be read here. A guard that cannot read the command has not checked it. Inline the statement, or read the file and ship the change as a reviewed .sql under database/schema/."
    fi
  fi

  if printf '%s' "${segment}" | grep -qE "${RUNNER_RE}|${RUNNER_NAMED_RE}"; then
    read_only=0
    printf '%s' "${segment}" | grep -qiE "${RUNNER_READ_NAMED_RE}" && read_only=1
    if [ "${read_only}" = 0 ] && printf '%s' "${segment}" | grep -qE -- "${RUNNER_READ_FLAG_RE}" \
      && ! printf '%s' "${segment}" | grep -qE "${PM_SCRIPT_RE}"; then
      read_only=1
    fi
    printf '%s' "${segment}" | grep -qE -- '--reset([[:space:]]|$)' && read_only=0
    [ "${read_only}" = 1 ] && continue
    for name in ${RUNNER_TUNNEL_VARS}; do
      while IFS=$'\t' read -r value source; do
        [ -n "${value}" ] || continue
        if tunnel_is_on "${value}"; then
          deny "Blocked by repository policy: ${name}=${value} (from ${source}) means the local port this runner would reach is a tunnel to a remote database, and a migration is a write. Ship the schema change as a reviewed .sql under database/schema/ for a human to apply."
        fi
      done <<VALUES
$(runner_values "${name}" "${segment}")
VALUES
    done
    hosts_seen=0
    for name in ${RUNNER_HOST_VARS}; do
      while IFS=$'\t' read -r value source; do
        [ -n "${value}" ] || continue
        hosts_seen=1
        host="$(host_of "${name}" "${value}")"
        if host_is_remote "${host}"; then
          deny "Blocked by repository policy: this migration or seed runner would write to ${host} (${name} from ${source}), which is not a local database. Never WRITE to a remote database - a migration is a write. Point ${name} at the local database, or ship the schema change as a reviewed .sql under database/schema/ for a human to apply."
        fi
      done <<VALUES
$(runner_values "${name}" "${segment}")
VALUES
    done
    if [ "${hosts_seen}" = 0 ]; then
      deny "Blocked by repository policy: this looks like a migration or seed runner and no database host is visible - not on the command, not carried from an earlier export, not in this process's environment (${RUNNER_HOST_VARS// /, }) and not in ${RUNNER_ENV_FILES// /, }. A runner reaches a host from somewhere, and a guard that cannot see it has not checked it. Name the host on the command (DB_HOST=localhost ...), or set REMOTE_DB_ENV_FILES in the hook command in .claude/settings.json to the env file this runner reads."
    fi
  fi
done <<EOF
$(split_segments_quoted "${CMD}")
EOF

exit 0
