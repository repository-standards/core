#!/usr/bin/env bash
# Shared helpers for the PreToolUse guards.

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":%s}}\n' \
    "$(jq -Rn --arg r "$1" '$r')"
  exit 0
}

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
