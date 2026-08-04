#!/usr/bin/env bash
# Shared helpers for the PreToolUse guards.

# JSON-escapes its argument on stdout without jq - deny() has to work when jq is the very
# thing that is missing. Denial reasons are literals authored in these scripts, so backslash,
# quote and the whitespace that would otherwise break the string are the whole alphabet.
json_escape() {
  printf '%s' "$1" \
    | LC_ALL=C sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' \
    | LC_ALL=C tr '\t\r' '  ' \
    | LC_ALL=C awk 'BEGIN { ORS = "" } NR > 1 { print "\\n" } { print }'
}

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
    "$(json_escape "$1")"
  exit 0
}

# Fail closed. Without jq, read_command() returns empty, every guard clears its own
# `[ -n "${CMD}" ]` check and exits 0 - a silent pass on exactly the commands these guards
# exist to stop, with nothing printed to say the protection is gone. A guard that cannot
# read the command has not checked it, so it denies instead.
command -v jq >/dev/null 2>&1 || deny "Blocked by repository policy: the agent guards cannot run because 'jq' is not installed, and a guard that cannot read the command has not checked it. Install jq (macOS: brew install jq; Debian/Ubuntu: apt-get install jq - see https://github.com/repository-standards/core/blob/main/docs/method/prerequisites.md) and retry."

read_command() {
  jq -r '.tool_input.command // ""'
}

# Splits a command line into segments on ; && || | and newlines.
#
# Every guard evaluates segments independently. Judging the whole string lets one harmless segment
# vouch for a dangerous one - `psql -h localhost -c 'select 1' && psql -h prod -c 'DROP TABLE x'`
# reads as local because `localhost` appears somewhere in it.
split_segments() {
  printf '%s' "$1" | sed -E 's/(\|\||&&|[;|])/\n/g'
}

# Matches only when the host ends at the match, so localhost.evil.example.com is not loopback.
LOCAL_HOST_RE='(localhost|127\.0\.0\.1|\[::1\]|::1)([:/[:space:]"'"'"']|$)'
