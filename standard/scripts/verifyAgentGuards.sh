#!/usr/bin/env bash
#
# Checks every guard in .claude/hooks/ denies and allows what it should.
# A broken guard is silent - the hooks only emit output on a denial - so this is the only signal.
#
#   bash scripts/verifyAgentGuards.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS="${ROOT}/.claude/hooks"
FAILURES=0

command -v jq >/dev/null 2>&1 || { echo "jq is required (brew install jq)" >&2; exit 2; }

payload() { jq -Rn --arg c "$1" '{tool_input:{command:$c}}'; }

# Scores one guard invocation. Any output used to count as a denial, which scored two failures as
# passes: a guard emitting JSON that is not the deny shape (Claude Code ignores it and runs the
# command) read as `ok DENY`, and a guard with a syntax error - stderr, empty stdout, nonzero exit -
# read as `ok allow` against every allow assertion in this file. So a denial now has to be
# well-formed deny JSON, and a nonzero exit or any stderr is its own failure rather than a verdict.
#
# Prints one of: DENY, allow, or BROKEN:<why>.
score() { # score <script> <command>
  local script="$1" cmd="$2" out rc err errtext
  err="$(mktemp)"
  out="$(payload "${cmd}" | "${HOOKS}/${script}" 2>"${err}")"
  rc=$?
  errtext="$(cat "${err}")"
  rm -f "${err}"

  if [ "${rc}" -ne 0 ]; then printf 'BROKEN:exit %s' "${rc}"; return; fi
  if [ -n "${errtext}" ]; then printf 'BROKEN:stderr %s' "${errtext%%$'\n'*}"; return; fi
  if [ -z "${out}" ]; then printf 'allow'; return; fi
  if printf '%s' "${out}" \
    | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
    printf 'DENY'
  else
    printf 'BROKEN:output is not a deny verdict: %s' "${out%%$'\n'*}"
  fi
}

check() { # check <script> <DENY|allow> <command>
  local script="$1" expect="$2" cmd="$3" got label
  got="$(score "${script}" "${cmd}")"
  # A command with newlines in it would break the one-line-per-case listing.
  label="$(printf '%s' "${cmd}" | awk 'BEGIN { ORS = "" } NR > 1 { print "\\n" } { print }')"
  if [ "${got}" = "${expect}" ]; then
    printf '  ok   %-5s %s\n' "${got}" "${label}"
  else
    printf '  FAIL expected %s, got %s: %s\n' "${expect}" "${got}" "${label}"
    FAILURES=$((FAILURES + 1))
  fi
}

assert() { # assert <what> <expected> <actual>
  if [ "$2" = "$3" ]; then
    printf '  ok   %-5s %s\n' "$2" "$1"
  else
    printf '  FAIL expected %s, got %s: %s\n' "$2" "$3" "$1"
    FAILURES=$((FAILURES + 1))
  fi
}

DB=no-remote-db-writes.sh
echo "== remote-database write guard"
check "${DB}" DENY  'psql -h prod-db.example.com -U admin -c "DELETE FROM users"'
check "${DB}" DENY  "psql -h prod-db.example.com -U admin -f migration.sql"
check "${DB}" DENY  "psql postgresql://admin:pw@prod-db.example.com/db -c 'CREATE TABLE t (id int)'"
check "${DB}" DENY  "psql -h prod-db.example.com -d db < schema.sql"
check "${DB}" DENY  "psql -h 10.0.0.5 -c 'TRUNCATE landlord_rollout_state'"
# A local segment must not vouch for a remote one in the same command line.
check "${DB}" DENY  "psql -h localhost -c 'select 1' && psql -h prod-db.example.com -c 'DROP TABLE users'"
# A hostname that merely starts with localhost is not loopback.
check "${DB}" DENY  "psql postgresql://u:p@localhost.evil.example.com:5432/prod -c 'DROP TABLE users'"
check "${DB}" allow "psql -h prod-db.example.com -U admin -c 'SELECT count(*) FROM users'"
check "${DB}" allow "psql -h localhost -p 55432 -c 'TRUNCATE t'"
check "${DB}" allow "psql -h 127.0.0.1 -c 'CREATE TABLE t (id int)'"
check "${DB}" allow "psql postgresql://postgres:postgres@localhost:55432/console -c 'TRUNCATE t'"
check "${DB}" allow "docker exec console-e2e-db psql -U postgres -c 'DROP TABLE t'"
# A unix-socket directory cannot be anywhere but this machine.
check "${DB}" allow "psql -h /var/run/postgresql -c 'TRUNCATE t'"
# curl's -H is not psql's -h: a local psql whose argument came from curl is still local.
check "${DB}" allow "psql -h localhost -f <(curl -sS -H 'Host: files.example.com' https://files.example.com/schema.sql)"

# The verb and the host in different segments. None of these is an attack shape - a pipe, a
# backslash line-wrap and a heredoc are how anyone writes a long command - and every one of them
# turned the guard off while the rest of this file stayed green. The line-wrap is the one that
# matters: formatting a psql call for readability disabled the control, and because the guard only
# prints on denial, nothing said so.
echo "== remote-database write guard: host and verb in different segments"
check "${DB}" DENY  'echo "DROP TABLE users" | psql -h prod-db.example.com'
check "${DB}" DENY  $'psql -h prod-db.example.com \\\n  -c "DROP TABLE users"'
check "${DB}" DENY  $'psql -h prod-db.example.com <<SQL\nDROP TABLE users;\nSQL'
check "${DB}" DENY  $'mysql -h prod-db.example.com \\\n  -e "DROP TABLE users"'
# Still allowed: nothing in the command line reaches a remote database.
check "${DB}" allow $'psql -h localhost \\\n  -c "DROP TABLE users"'
check "${DB}" allow 'cat schema.sql | psql -h 127.0.0.1'

# Ordinary spellings of the same call. Each one used to make the client or the host invisible.
echo "== remote-database write guard: client and host spellings"
check "${DB}" DENY  '/usr/local/bin/psql -h prod-db.example.com -c "DROP TABLE users"'
check "${DB}" DENY  "bash -c \"psql -h prod-db.example.com -c 'DROP TABLE users'\""
check "${DB}" DENY  'psql -hprod-db.example.com -c "DROP TABLE users"'
check "${DB}" DENY  'psql --host=prod-db.example.com -c "DROP TABLE users"'
check "${DB}" DENY  'PGHOST=prod-db.example.com psql -c "DROP TABLE users"'
check "${DB}" DENY  'PGHOSTADDR=10.0.0.5 psql -c "DROP TABLE users"'
check "${DB}" DENY  $'export PGHOST=prod-db.example.com\npsql -c "DROP TABLE users"'
check "${DB}" DENY  'psql "host=prod-db.example.com dbname=app" -c "DROP TABLE users"'
check "${DB}" DENY  'psql -h "prod-db.example.com" -c "DROP TABLE users"'
# An explicit host beats the environment, because psql resolves it that way too.
check "${DB}" allow 'PGHOST=prod-db.example.com psql -h localhost -c "DROP TABLE users"'
check "${DB}" allow 'PGHOST=localhost psql -c "DROP TABLE users"'
# The environment reaches a client from the segment that exports it, or from a bare assignment
# that names a remote host - and from nowhere else. Read from the whole command, a search for
# the assignment is a remote client, and an early local assignment vouches for a later client
# that never saw it.
check "${DB}" DENY  'export PGHOST=prod-db.example.com; psql -c "DROP TABLE users"'
check "${DB}" DENY  $'PGHOST=prod-db.example.com\npsql -c "DROP TABLE users"'
check "${DB}" allow 'grep -rn "PGHOST=prod-db.example.com" docs/; psql -c "DROP TABLE t"'
check "${DB}" allow 'export PGHOST=prod-db.example.com; PGHOST=localhost psql -c "DROP TABLE t"'
# Quoting a local host does not make it remote.
check "${DB}" allow 'psql -h "localhost" -c "TRUNCATE t"'
check "${DB}" allow "psql -h '127.0.0.1' -c \"DROP TABLE t\""

# What the SQL is cannot be read out of a command substitution, and a guard that cannot read the
# command has not checked it - the same reasoning that makes a missing jq a denial.
echo "== remote-database write guard: unreadable SQL fails closed"
check "${DB}" DENY  'psql -h prod-db.example.com -c "$(cat migration.sql)"'
check "${DB}" DENY  'psql -h prod-db.example.com -c "`cat migration.sql`"'
check "${DB}" allow 'psql -h localhost -c "$(cat migration.sql)"'

# Verbs that write without appearing to. Kept narrow - `comment on`, not the word `comment`, so a
# remote SELECT over a column named comment is still a read.
echo "== remote-database write guard: less obvious write verbs"
check "${DB}" DENY  'psql -h prod-db.example.com -c "REASSIGN OWNED BY a TO b"'
check "${DB}" DENY  "psql -h prod-db.example.com -c \"COMMENT ON TABLE users IS 'x'\""
check "${DB}" DENY  'psql -h prod-db.example.com -c "SELECT pg_terminate_backend(1)"'
check "${DB}" allow 'psql -h prod-db.example.com -c "SELECT comment FROM tickets"'

# MySQL and MariaDB. The guard shipped Postgres-only for its whole life, and every case above
# passed the whole time - because not one of them was MySQL. That is what a case list proves when
# it only covers the shape somebody already had in mind, and it is why an adopting repo running
# MySQL had a guard that never once refused anything.
echo "== remote-database write guard: MySQL and MariaDB"
check "${DB}" DENY  'mysql -h prod-db.example.com -u root -e "DROP TABLE users"'
check "${DB}" DENY  "mysql mysql://admin:pw@prod-db.example.com:3306/db -e 'UPDATE users SET admin = 1'"
check "${DB}" DENY  "mariadb -h prod-db.example.com -e 'ALTER TABLE t ADD COLUMN c INT'"
check "${DB}" DENY  "mysql -h prod-db.example.com -D app < migration.sql"
check "${DB}" DENY  'MYSQL_HOST=prod-db.example.com mysql -e "DROP TABLE users"'
check "${DB}" allow "mysql -h 127.0.0.1 -u root -e 'DROP TABLE t'"
check "${DB}" allow "mysql -h localhost -u root -e 'TRUNCATE t'"
check "${DB}" allow "mysql -h prod-db.example.com -e 'SELECT count(*) FROM users'"
# A dump is a read, and reads are allowed - the same reason pg_dump is not in the client list.
check "${DB}" allow "mysqldump -h prod-db.example.com app > dump.sql"
check "${DB}" allow "pg_dump -h prod-db.example.com -t users > users.sql"
check "${DB}" allow "pnpm test:unit"

# Four holes an adopter found in 2026-08-19 by probing the guards it had just been handed, rather
# than by reading them. Each is asserted in both directions on purpose: a fix that only tightens
# turns a bypass into a false positive, and a guard that refuses ordinary work gets switched off,
# which is the same failure one direction over.
echo "== remote-database write guard: the statement is never in the command line"
# The file arrives through a pipe or attached to the flag, so no write verb appears anywhere.
check "${DB}" DENY  "cat migration.sql | psql -h prod-db.example.com"
check "${DB}" DENY  "psql -h prod-db.example.com -fmigration.sql app"
# A semicolon inside the quoted statement used to cut the client away from its own host.
check "${DB}" DENY  'psql -c "UPDATE t SET x = 1; SELECT 1" -h prod-db.example.com'
check "${DB}" DENY  'mysql -e "DROP TABLE users; SELECT 1" -h prod-db.example.com'
check "${DB}" allow 'psql -h localhost -c "UPDATE t SET x = 1; SELECT 1"'
check "${DB}" allow "cat migration.sql | psql -h localhost"
# Reading the guard's own documentation is not running what it documents.
check "${DB}" allow "grep -rn 'psql -h prod-db.example.com' docs/"

echo "== remote-database write guard: restoring a dump is a write"
# The restore clients carry every statement inside the archive, so no verb, no `-f` and no
# `.sql` name ever reaches the command line for the write scan to find. Found by an adopting
# repository whose own guard already covered both.
check "${DB}" DENY  "pg_restore -d postgresql://admin:pw@prod-db.example.com/app dump.tar"
check "${DB}" DENY  "pg_restore -h prod-db.example.com -d app dump.tar"
check "${DB}" DENY  "mysqlimport -h prod-db.example.com app /tmp/users.txt"
# Restoring locally and reading an archive's table of contents are not remote writes.
check "${DB}" allow "pg_restore -h localhost -d app dump.tar"
check "${DB}" allow "pg_restore --list dump.tar"

# A migration or seed runner names no client and no statement, so every case above is blind to
# it, and it applies a whole migration to whatever host its environment resolves. The guard
# resolves that host the way the runner does - the command, an earlier export, the process
# environment, the env files - so the suite has to own every one of those places: the process
# variables are cleared here and set per case, and the env files are fixtures selected per case.
# Found by an adopting monorepo whose own guard already covered its runner.
echo "== remote-database write guard: migration and seed runners"
for v in DB_HOST DATABASE_HOST POSTGRES_HOST PGHOST PGHOSTADDR MYSQL_HOST DATABASE_URL DB_URL DB_SSL_TUNNEL PGSSLTUNNEL; do
  unset "${v}"
done
ENVDIR="$(mktemp -d 2>/dev/null || printf '')"
if [ -z "${ENVDIR}" ] || [ ! -d "${ENVDIR}" ]; then
  printf '  FAIL could not create a temp dir, so the runner cases never ran\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'DB_HOST=localhost\nDB_PORT=5432\n' > "${ENVDIR}/local.env"
  printf 'DB_HOST=localhost\nDB_HOST=prod-db.example.com # the last assignment wins\n' > "${ENVDIR}/remote.env"
  printf 'export DB_HOST="prod-db.example.com"\r\n' > "${ENVDIR}/export-crlf.env"
  printf 'DATABASE_URL=postgres://app:pw@prod-db.example.com:5432/app\n' > "${ENVDIR}/url.env"
  printf 'DATABASE_URL=postgresql://app:pw@localhost:5432/app\n' > "${ENVDIR}/url-local.env"
  printf 'DB_HOST=localhost\nDB_SSL_TUNNEL=true\n' > "${ENVDIR}/tunnel.env"
  printf '# DB_HOST=prod-db.example.com\n' > "${ENVDIR}/commented.env"

  # runner <env files under ENVDIR, or -> <NAME=value for the process environment, or -> <DENY|allow> <command>
  # The env files default to one that does not exist, so a case that names none is judged on
  # the command and the process environment alone. No subshell: FAILURES has to survive.
  runner() {
    local files="" f got label
    for f in $1; do
      [ "${f}" = - ] || files="${files}${files:+ }${ENVDIR}/${f}"
    done
    export REMOTE_DB_ENV_FILES="${files:-${ENVDIR}/missing.env}"
    [ "$2" = - ] || export "$2"
    got="$(score "${DB}" "$4")"
    [ "$2" = - ] || unset "${2%%=*}"
    unset REMOTE_DB_ENV_FILES
    label="$4"
    [ "$2" = - ] || label="${label}  [env: $2]"
    [ "$1" = - ] || label="${label}  [env file: $1]"
    assert "${label}" "$3" "${got}"
  }

  # The host named on the command, across the runners a repo is likely to have.
  runner - - DENY  'DB_HOST=prod-db.example.com pnpm migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com pnpm --filter @app/database-schema migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com pnpm seed'
  runner - - DENY  'DB_HOST=prod-db.example.com npm run db:migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com node scripts/migrate/run.mjs'
  runner - - DENY  'DATABASE_URL=postgres://app:pw@prod-db.example.com:5432/app npx prisma migrate deploy'
  runner - - DENY  'DATABASE_URL=postgres://app:pw@prod-db.example.com/app prisma db push'
  runner - - DENY  'DB_HOST=prod-db.example.com bundle exec rails db:migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com python manage.py migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com alembic upgrade head'
  runner - - DENY  'DB_HOST=prod-db.example.com flyway migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com dotnet ef database update'
  runner - - DENY  'DB_HOST=prod-db.example.com mix ecto.migrate'
  runner - - DENY  'DB_HOST=prod-db.example.com docker compose exec app pnpm migrate'
  runner - - allow 'DB_HOST=localhost pnpm migrate'
  runner - - allow 'DB_HOST=127.0.0.1 pnpm seed'
  runner - - allow 'DATABASE_URL=postgresql://app:pw@localhost:5432/app npx prisma migrate deploy'
  runner - - allow 'DATABASE_URL=sqlite:./dev.db pnpm migrate'
  runner - - allow 'DB_HOST=localhost bundle exec rails db:migrate'
  runner - - allow 'DB_HOST=localhost python manage.py migrate'
  # Reading a remote database is allowed, and the runners' read-only modes read - unless
  # `--reset` rides along.
  runner - - allow 'DB_HOST=prod-db.example.com pnpm migrate:status'
  runner - - allow 'DB_HOST=prod-db.example.com pnpm migrate --dry-run'
  runner - - allow 'DB_HOST=prod-db.example.com npx prisma migrate status'
  runner - - allow 'DB_HOST=prod-db.example.com bundle exec rails db:migrate:status'
  runner - - allow 'DB_HOST=prod-db.example.com flyway info'
  runner - - DENY  'DB_HOST=prod-db.example.com pnpm migrate:status --reset'
  # Words that look like the verb and are not, and reading about the runner rather than running it.
  runner - - allow 'pnpm update'
  runner - - allow 'npm run build'
  runner - - allow 'pnpm --filter web-app dev'
  runner - - allow "grep -rn 'pnpm migrate' docs/"
  runner - - allow 'git log --oneline -- database/migrate/'
  # A host carried from an earlier segment: an export carries what it names; a bare assignment
  # carries only a remote host, because nothing says a later command will read it - so a bare
  # local one after an exported remote one does not clear it. The maintainer's call, made on
  # the safe side. An assignment on the runner's own segment beats anything carried.
  runner - - DENY  'export DB_HOST=prod-db.example.com; pnpm migrate'
  runner - - DENY  $'DB_HOST=prod-db.example.com\npnpm migrate'
  runner - - DENY  'export DATABASE_URL=postgres://app:pw@prod-db.example.com/app && npx prisma migrate deploy'
  runner - - allow 'export DB_HOST=localhost; pnpm migrate'
  runner - - allow 'export DB_HOST=prod-db.example.com; DB_HOST=localhost pnpm migrate'
  runner - - allow 'DB_HOST=prod-db.example.com pnpm migrate:status; DB_HOST=localhost pnpm migrate'
  runner - - DENY  'export DB_HOST=prod-db.example.com; DB_HOST=localhost; pnpm migrate'
  # The process environment, which the Bash tool inherits. The command beats it.
  runner - DB_HOST=prod-db.example.com DENY  'pnpm migrate'
  runner - DB_HOST=localhost allow 'pnpm migrate'
  runner - DATABASE_URL=postgres://app:pw@prod-db.example.com/app DENY  'npx prisma migrate deploy'
  runner - PGHOST=prod-db.example.com DENY  'python manage.py migrate'
  runner - DB_SSL_TUNNEL=true DENY  'pnpm migrate'
  runner - DB_HOST=localhost DENY  'DB_HOST=prod-db.example.com pnpm migrate'
  runner - DB_HOST=prod-db.example.com allow 'DB_HOST=localhost pnpm migrate'
  # The env files the runner reads: the last assignment wins, `export`, quotes, a trailing
  # comment and CRLF are all stripped, a commented-out host is no host, every listed file that
  # names a host is judged, and a tunnel ends at a remote database whatever host it names.
  runner local.env - allow 'pnpm migrate'
  runner remote.env - DENY  'pnpm migrate'
  runner export-crlf.env - DENY  'pnpm migrate'
  runner url.env - DENY  'npx prisma migrate deploy'
  runner url-local.env - allow 'npx prisma migrate deploy'
  runner tunnel.env - DENY  'pnpm migrate'
  runner commented.env - DENY  'pnpm migrate'
  runner 'local.env remote.env' - DENY  'pnpm migrate'
  runner remote.env - allow 'DB_HOST=localhost pnpm migrate'
  runner remote.env - allow 'pnpm migrate:status'
  runner remote.env DB_HOST=localhost allow 'pnpm migrate'
  runner local.env DB_HOST=prod-db.example.com DENY  'pnpm migrate'
  runner local.env - DENY  'DB_SSL_TUNNEL=true pnpm migrate'
  # No host anywhere is a denial, not a pass: the runner is reading a place the guard cannot see.
  runner - - DENY  'pnpm migrate'
  runner - - DENY  'yarn seed'
  runner - - DENY  'docker compose exec app pnpm migrate'
  runner - - allow 'pnpm migrate:status'

  rm -f "${ENVDIR}"/*.env
  rmdir "${ENVDIR}"
fi

PUSH=no-force-push.sh
echo "== force-push guard"
check "${PUSH}" DENY  "git push --force origin main"
check "${PUSH}" DENY  "git push --force-with-lease origin feature"
check "${PUSH}" DENY  "git push -f"
check "${PUSH}" DENY  "git -C /some/dir push --force-if-includes origin x"
check "${PUSH}" DENY  "git push origin +main"
# git accepts any unambiguous abbreviation of a long option, so these push for real.
check "${PUSH}" DENY  "git push --force-with-l origin main"
check "${PUSH}" DENY  "git push --force-if-inc origin main"
# Apostrophes elsewhere must not swallow the flag.
check "${PUSH}" DENY  "git commit -m \"it's fine\" ; git push --force origin main # don't tell"
# Deleting a remote branch destroys published history without any force flag.
check "${PUSH}" DENY  "git push --delete origin somebranch"
check "${PUSH}" DENY  "git push -d origin somebranch"
check "${PUSH}" DENY  "git push origin :somebranch"
check "${PUSH}" allow "git push origin feature"
check "${PUSH}" allow "git push -u origin feature"
check "${PUSH}" allow "git push --dry-run origin feature"
check "${PUSH}" allow "git push origin main:main"
check "${PUSH}" allow "git -C /some/dir push origin feature"
# The force flag inside a cluster, wherever it sits in it. -qf was denied and -fq was not.
check "${PUSH}" DENY  "git push -qf origin main"
check "${PUSH}" DENY  "git push -fq origin main"
check "${PUSH}" DENY  "git push -dq origin somebranch"
# A cluster without f or d is an ordinary push and stays one.
check "${PUSH}" allow "git push -qu origin feature"
check "${PUSH}" allow "git commit -m 'do not force push'"
check "${PUSH}" allow "git commit --amend --no-edit && git push origin feature"

SEC=no-ci-secret-writes.sh
echo "== CI secrets guard"
check "${SEC}" DENY  "gh secret set MY_TOKEN --body abc"
check "${SEC}" DENY  "gh variable delete FOO"
check "${SEC}" DENY  "gh pr list && gh secret set TOKEN --body x"
check "${SEC}" allow "gh pr create --title x"
check "${SEC}" allow "gh run list"
# Searching for the phrase is not running it. Denying this is how a repository ends up unable to
# document its own guard, or writing the documentation through a file tool to get around it.
check "${SEC}" allow "grep -rn 'gh secret set' docs/"
check "${SEC}" allow "rg 'gh variable delete' --glob '*.md'"
# But a search tool that runs the command in a substitution really does run it.
check "${SEC}" DENY  "echo \$(gh secret set TOKEN --body x)"
# The REST route sets the same secret without the `gh secret` verb. Nothing asserted this branch
# before, so its pattern could rot unnoticed - and it had: `\+` in a basic regex is a GNU and BSD
# extension, not POSIX, and only a case here proves the match on the grep that is running.
check "${SEC}" DENY  "gh api -X PUT repos/o/r/actions/secrets/NAME --input -"
check "${SEC}" DENY  "gh api --method PATCH repos/o/r/actions/variables/NAME -f value=x"
check "${SEC}" allow "gh api repos/o/r/actions/secrets"
check "${SEC}" allow "grep -rn 'gh api' docs/"

# The dispatcher, and the wiring that reaches it. Every guard above fails closed on a missing jq
# or an unreadable lib.sh, and then the outermost link failed open: settings.json named each guard
# through "$CLAUDE_PROJECT_DIR", and with that unset the shell exits 127 with empty stdout, which
# Claude Code treats as a non-blocking error and runs the command anyway.
echo "== dispatcher and hook wiring fail closed"
DISPATCH_PAYLOAD='{"tool_input":{"command":"psql -h prod-db.example.com -c \"DROP TABLE users\""}}'
# Empty is tested before jq is asked anything: `jq -e` on no input at all does not agree with
# itself across versions, and reading "no output" as a verdict is the exact mistake this file
# is being repaired for.
verdict() { # verdict <output>
  if [ -z "$1" ]; then printf 'allow'
  elif printf '%s' "$1" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1
  then printf 'DENY'
  else printf 'BROKEN'; fi
}

out="$(printf '%s' "${DISPATCH_PAYLOAD}" | "${HOOKS}/guards.sh" 2>/dev/null)"
assert "dispatcher relays a guard's denial" DENY "$(verdict "${out}")"
out="$(printf '{"tool_input":{"command":"pnpm test:unit"}}' | "${HOOKS}/guards.sh" 2>/dev/null)"
assert "dispatcher passes a clean command" allow "$(verdict "${out}")"

SANDBOX="$(mktemp -d 2>/dev/null || printf '')"
if [ -z "${SANDBOX}" ] || [ ! -d "${SANDBOX}" ]; then
  printf '  FAIL could not create a temp dir, so the wiring cases never ran\n'
  FAILURES=$((FAILURES + 1))
else
  # A guard file that is present but broken: stderr, empty stdout, nonzero exit. Before the
  # dispatcher this was indistinguishable from a clean pass.
  mkdir -p "${SANDBOX}/broken"
  cp "${HOOKS}/guards.sh" "${HOOKS}/lib.sh" "${SANDBOX}/broken/"
  cp "${HOOKS}/no-force-push.sh" "${HOOKS}/no-ci-secret-writes.sh" "${SANDBOX}/broken/"
  printf '#!/usr/bin/env bash\nif [ 1 ; then\nfi\n' > "${SANDBOX}/broken/no-remote-db-writes.sh"
  chmod +x "${SANDBOX}/broken"/*.sh
  out="$(printf '%s' "${DISPATCH_PAYLOAD}" | "${SANDBOX}/broken/guards.sh" 2>/dev/null)"
  assert "dispatcher denies when a guard is syntactically broken" DENY "$(verdict "${out}")"

  # A guard file that is simply not there.
  mkdir -p "${SANDBOX}/incomplete"
  cp "${HOOKS}/guards.sh" "${HOOKS}/lib.sh" "${SANDBOX}/incomplete/"
  chmod +x "${SANDBOX}/incomplete"/*.sh
  out="$(printf '%s' "${DISPATCH_PAYLOAD}" | "${SANDBOX}/incomplete/guards.sh" 2>/dev/null)"
  assert "dispatcher denies when a guard is missing" DENY "$(verdict "${out}")"

  # The command string settings.json actually ships, run the three ways it can fail.
  #
  # Its absence is named rather than scored. `.claude/settings.json` is a merge entry, so a repo
  # part-way through adoption has the guards on disk and nothing calling them - and reading that
  # as three broken guards sends whoever is adopting to debug files that are fine.
  if [ ! -f "${ROOT}/.claude/settings.json" ]; then
    printf '  FAIL .claude/settings.json is missing, so nothing wires these guards to Claude Code and the hooks on disk are never called. It is a merge entry: merge the shipped settings.json into yours, then run this again.\n'
    FAILURES=$((FAILURES + 1))
  else
    HOOK_CMD="$(jq -r '.hooks.PreToolUse[0].hooks[0].command' "${ROOT}/.claude/settings.json")"
    mkdir -p "${SANDBOX}/empty"
    out="$(printf '%s' "${DISPATCH_PAYLOAD}" \
      | (cd "${SANDBOX}/empty" && env -u CLAUDE_PROJECT_DIR bash -c "${HOOK_CMD}") 2>/dev/null)"
    assert "wiring denies with CLAUDE_PROJECT_DIR unset" DENY "$(verdict "${out}")"
    out="$(printf '%s' "${DISPATCH_PAYLOAD}" \
      | env CLAUDE_PROJECT_DIR="${SANDBOX}/empty" bash -c "${HOOK_CMD}" 2>/dev/null)"
    assert "wiring denies when .claude/hooks is absent" DENY "$(verdict "${out}")"
    out="$(printf '%s' "${DISPATCH_PAYLOAD}" \
      | env CLAUDE_PROJECT_DIR="${ROOT}" bash -c "${HOOK_CMD}" 2>/dev/null)"
    assert "wiring denies a remote write end to end" DENY "$(verdict "${out}")"
  fi

  rm -rf "${SANDBOX}"
fi

# The regression this exists for: read_command() is jq, so without jq CMD came out empty,
# every guard cleared its own `[ -n "${CMD}" ]` check and exited 0. Protection absent, output
# identical to a clean pass. Runs one guard on a PATH that has everything except jq.
echo "== fail-closed when jq is missing"
NOJQ="$(mktemp -d 2>/dev/null || printf '')"
if [ -z "${NOJQ}" ] || [ ! -d "${NOJQ}" ]; then
  printf '  FAIL could not create a temp dir, so the jq-absent case never ran\n'
  FAILURES=$((FAILURES + 1))
else
  for tool in bash dirname sed awk tr grep cat; do
    src="$(command -v "${tool}" 2>/dev/null)" && ln -sf "${src}" "${NOJQ}/${tool}"
  done
  nojq_out=$(printf '{"tool_input":{"command":"echo hello"}}' \
    | env -i PATH="${NOJQ}" "${NOJQ}/bash" "${HOOKS}/no-force-push.sh" 2>/dev/null)
  if printf '%s' "${nojq_out}" | grep -q '"permissionDecision":"deny"'; then
    printf '  ok   DENY  a guard that cannot read the command denies it\n'
  else
    printf '  FAIL expected DENY with jq absent, got: %s\n' "${nojq_out:-<no output - the guard passed silently>}"
    FAILURES=$((FAILURES + 1))
  fi
  rm -rf "${NOJQ}"
fi

# This file went green while a live bypass sat in the guard it checks, so the scoring itself is
# now checked against guards that are deliberately wrong. Without this, tightening score() is a
# claim nobody verifies until the next silent failure.
echo "== the harness scores broken guards as broken"
STUBS="$(mktemp -d 2>/dev/null || printf '')"
if [ -z "${STUBS}" ] || [ ! -d "${STUBS}" ]; then
  printf '  FAIL could not create a temp dir, so the self-check never ran\n'
  FAILURES=$((FAILURES + 1))
else
  printf '#!/usr/bin/env bash\nprintf %s\n' "'{\"permissionDecision\":\"DENY\"}'" > "${STUBS}/wrong-shape.sh"
  printf '#!/usr/bin/env bash\nif [ 1 ; then\nfi\n' > "${STUBS}/syntax-error.sh"
  printf '#!/usr/bin/env bash\necho oops >&2\n' > "${STUBS}/noisy.sh"
  chmod +x "${STUBS}"/*.sh
  saved_hooks="${HOOKS}"; HOOKS="${STUBS}"
  assert "JSON without a deny verdict is not a denial" \
    BROKEN "$(score wrong-shape.sh 'psql -h prod -c "DROP TABLE t"' | cut -d: -f1)"
  assert "a syntax error is not an allow" \
    BROKEN "$(score syntax-error.sh 'psql -h prod -c "DROP TABLE t"' | cut -d: -f1)"
  assert "unexpected stderr is not an allow" \
    BROKEN "$(score noisy.sh 'pnpm test:unit' | cut -d: -f1)"
  HOOKS="${saved_hooks}"
  rm -rf "${STUBS}"
fi

# == elicitation guard ==
# Node, not bash, and it reads a written path rather than a command - so it needs its own
# payload and cannot go through check(). What it shares with the rest is the failure mode:
# it says nothing when it allows, so a dead one is indistinguishable from a quiet one. Each
# thing it watches therefore gets a refusal and a pass-through: a write to a gated artifact,
# a declared stub, a path it must leave alone, and a rename of something already tracked.
echo "== elicitation guard"
ELICIT="${HOOKS}/elicitation-guard.mjs"
if [ ! -f "${ELICIT}" ]; then
  printf '  FAIL %s is missing, so nothing checks that artifacts were asked about\n' "${ELICIT}"
  FAILURES=$((FAILURES + 1))
elif ! command -v node >/dev/null 2>&1; then
  printf '  FAIL node is not on PATH, so the elicitation guard cannot run at all\n'
  FAILURES=$((FAILURES + 1))
else
  # The guard reads the point list and the committed ledger from the repository it runs in, so
  # in a repo whose adoption already answered these points the DENY cases would score the
  # mechanism working as a failure. The cases run in a scratch repository instead: no ledger,
  # no fired question, one tracked file - the state their expectations were written for.
  FIX="$(mktemp -d 2>/dev/null || printf '')"
  if [ -z "${FIX}" ]; then
    printf '  FAIL could not create a scratch repo, so the elicitation cases never ran\n'
    FAILURES=$((FAILURES + 1))
  else
    git -C "${FIX}" init -q
    mkdir -p "${FIX}/.claude/elicitation"
    cp "${HOOKS}/../elicitation/points.json" "${FIX}/.claude/elicitation/points.json"
    printf 'tracked\n' > "${FIX}/tracked-file.txt"
    git -C "${FIX}" add -A
    git -C "${FIX}" -c user.name=suite -c user.email=suite@local commit -qm fixture
    elicit() { # elicit <json payload>
      # Node can fail in a way the bash guards cannot: a crash writes to stderr, exits nonzero
      # and leaves stdout empty, which verdict() on its own reads as `allow`. Two of the three
      # cases below expect exactly that, so a dead guard would score two passes.
      local err out st
      err="$(mktemp)"
      out="$(printf '%s' "$1" | (cd "${FIX}" && node "${ELICIT}") 2>"${err}")"
      st=$?
      if [ "${st}" -ne 0 ] || [ -s "${err}" ]; then
        rm -f "${err}"
        printf 'BROKEN'
        return
      fi
      rm -f "${err}"
      verdict "${out}"
    }
    assert "a gated artifact with nothing asked is refused" DENY \
      "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"docs/personas.md"}}')"
    assert "a declared stub is allowed through" allow \
      "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"docs/personas.md","content":"adopt.personas: absent"}}')"
    assert "a path no point gates is left alone" allow \
      "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"src/index.ts"}}')"
    # A rename reaches the agent as a shell command, not a write, and it is the move that did
    # the damage this guard exists for. The tracked path comes from the scratch repo, so the
    # case is the same in every repository this suite ships to.
    TRACKED="$(git -C "${FIX}" ls-files | head -1)"
    assert "moving a path the repository already tracks is refused" DENY \
      "$(elicit "$(printf '{"tool_name":"Bash","tool_input":{"command":"git mv %s moved-aside"}}' "${TRACKED}")")"
    # The destination-first spellings. Detached `-t DIR` was handled; attached `-tDIR` and
    # `--target-directory=DIR` read as unknown flags, so the only source was popped as the
    # destination and a gated tree moved with the guard silent.
    assert "moving a tracked path with --target-directory=DIR is refused" DENY \
      "$(elicit "$(printf '{"tool_name":"Bash","tool_input":{"command":"mv --target-directory=moved-aside %s"}}' "${TRACKED}")")"
    assert "moving a tracked path with -tDIR is refused" DENY \
      "$(elicit "$(printf '{"tool_name":"Bash","tool_input":{"command":"git mv -tmoved-aside %s"}}' "${TRACKED}")")"
    assert "moving a tracked path with -t DIR is refused" DENY \
      "$(elicit "$(printf '{"tool_name":"Bash","tool_input":{"command":"mv -t moved-aside %s"}}' "${TRACKED}")")"
    assert "moving a file the repository never tracked is not this guard's business" allow \
      "$(elicit '{"tool_name":"Bash","tool_input":{"command":"mv untracked-scratch.tmp elsewhere.tmp"}}')"
    assert "an ordinary shell command is not read as a rename" allow \
      "$(elicit "$(printf '{"tool_name":"Bash","tool_input":{"command":"ls %s"}}' "${TRACKED}")")"
    # A points file that exists but does not parse is not the same as none declared: the gate
    # is declared, a guard that cannot read it has not checked anything, so it refuses.
    cp "${FIX}/.claude/elicitation/points.json" "${FIX}/points.json.good"
    printf '{ not json\n' > "${FIX}/.claude/elicitation/points.json"
    assert "a points file that does not parse refuses the gated write" DENY \
      "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"docs/personas.md"}}')"
    mv "${FIX}/points.json.good" "${FIX}/.claude/elicitation/points.json"
    # Two of the three above expect `allow`, and a guard that never ran also produces no output.
    # So the scorer is shown catching a dead one, on the same payload that legitimately passes.
    printf 'throw new Error("dead");\n' > "${FIX}/crash.mjs"
    saved_elicit="${ELICIT}"; ELICIT="${FIX}/crash.mjs"
    assert "a guard that throws is not read as a pass-through" BROKEN \
      "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"src/index.ts"}}')"
    ELICIT="${saved_elicit}"
    rm -rf "${FIX}"
  fi
fi

echo
if [ "${FAILURES}" -eq 0 ]; then
  echo "all guards behave as specified"
  exit 0
fi
echo "${FAILURES} guard check(s) failed" >&2
exit 1
