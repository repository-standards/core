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
check "${PUSH}" allow "git commit -m 'do not force push'"
check "${PUSH}" allow "git commit --amend --no-edit && git push origin feature"

SEC=no-ci-secret-writes.sh
echo "== CI secrets guard"
check "${SEC}" DENY  "gh secret set MY_TOKEN --body abc"
check "${SEC}" DENY  "gh variable delete FOO"
check "${SEC}" DENY  "gh pr list && gh secret set TOKEN --body x"
check "${SEC}" allow "gh pr create --title x"
check "${SEC}" allow "gh run list"

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
# it says nothing when it allows, so a dead one is indistinguishable from a quiet one. These
# three cases are the minimum that tells them apart - one refusal, one pass-through, and one
# path it must leave alone entirely.
echo "== elicitation guard"
ELICIT="${HOOKS}/elicitation-guard.mjs"
if [ ! -f "${ELICIT}" ]; then
  printf '  FAIL %s is missing, so nothing checks that artifacts were asked about\n' "${ELICIT}"
  FAILURES=$((FAILURES + 1))
elif ! command -v node >/dev/null 2>&1; then
  printf '  FAIL node is not on PATH, so the elicitation guard cannot run at all\n'
  FAILURES=$((FAILURES + 1))
else
  elicit() { # elicit <json payload>
    verdict "$(printf '%s' "$1" | node "${ELICIT}" 2>/dev/null)"
  }
  assert "a gated artifact with nothing asked is refused" DENY \
    "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"docs/personas.md"}}')"
  assert "a declared stub is allowed through" allow \
    "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"docs/personas.md","content":"adopt.personas: absent"}}')"
  assert "a path no point gates is left alone" allow \
    "$(elicit '{"tool_name":"Write","tool_input":{"file_path":"src/index.ts"}}')"
fi

echo
if [ "${FAILURES}" -eq 0 ]; then
  echo "all guards behave as specified"
  exit 0
fi
echo "${FAILURES} guard check(s) failed" >&2
exit 1
