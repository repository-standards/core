#!/usr/bin/env bash
#
# Checks every guard in .claude/hooks/ denies and allows what it should.
# A broken guard is silent - the hooks only emit output on a denial - so this is the only signal.
#
#   pnpm verify:agent-guards

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS="${ROOT}/.claude/hooks"
FAILURES=0

command -v jq >/dev/null 2>&1 || { echo "jq is required (brew install jq)" >&2; exit 2; }

check() {
  local script="$1" expect="$2" cmd="$3" out got
  out=$(printf '{"tool_input":{"command":%s}}' "$(jq -Rn --arg c "${cmd}" '$c')" \
    | "${HOOKS}/${script}" 2>/dev/null)
  if [ -n "${out}" ]; then got="DENY"; else got="allow"; fi
  if [ "${got}" = "${expect}" ]; then
    printf '  ok   %-5s %s\n' "${got}" "${cmd}"
  else
    printf '  FAIL expected %s, got %s: %s\n' "${expect}" "${got}" "${cmd}"
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
# curl's -H is not psql's -h: a local psql whose argument came from curl is still local.
check "${DB}" allow "psql -h localhost -f <(curl -sS -H 'Host: files.example.com' https://files.example.com/schema.sql)"
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
check "${PUSH}" allow "git push origin feature"
check "${PUSH}" allow "git push -u origin feature"
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

echo
if [ "${FAILURES}" -eq 0 ]; then
  echo "all guards behave as specified"
  exit 0
fi
echo "${FAILURES} guard check(s) failed" >&2
exit 1
