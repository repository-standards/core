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

# Exit status carries a parse failure the way stdout cannot: a malformed or truncated payload
# and a well-formed call with no command both print nothing, and only jq's own exit code tells
# them apart (0 either way jq actually produced a result, nonzero on a parse error). Callers
# check it before trusting an empty CMD as "nothing to look at" rather than "could not look".
# jq's own parse error goes to stderr and stays there - the caller's denial message names the
# failure in the guard's own words, and a guard invoked outside guards.sh's own stderr
# redirection should not leak jq's diagnostics as if they were part of its verdict.
read_command() {
  jq -r '.tool_input.command // ""' 2>/dev/null
}

# Splits a command line into segments on ; && || | & and newlines.
#
# Every guard evaluates segments independently. Judging the whole string lets one harmless segment
# vouch for a dangerous one - `psql -h localhost -c 'select 1' && psql -h prod -c 'DROP TABLE x'`
# reads as local because `localhost` appears somewhere in it.
#
# A lone `&` runs both sides just as `&&` does, so it separates; the `&` of a redirection
# (`2>&1`, `&>log`) does not.
split_segments() {
  printf '%s' "$1" | sed -E 's/(\|\||&&|[;|])/\n/g; s/(^|[^<>])&([^>]|$)/\1\n\2/g'
}

# The same split, except a metacharacter inside quotes is text rather than a separator.
#
# The naive split cuts inside a quoted statement, and the cut separates a write from the host it
# runs against: `psql -c "UPDATE t SET x = 1; SELECT 1" -h prod` becomes one segment holding the
# client and another holding the host, so neither segment is a remote client and the guard says
# nothing. Semicolons inside SQL are ordinary, which makes this a shape anybody writes by accident.
#
# The force-push guard keeps the naive split on purpose: there, quotes carry a commit message
# rather than a statement, and treating an apostrophe in "it's fine" as an opening quote would
# swallow the `git push --force` that follows it.
split_segments_quoted() {
  printf '%s' "$1" | LC_ALL=C awk '
    BEGIN { ORS = ""; sq = 0; dq = 0; esc = 0 }
    {
      n = length($0)
      for (i = 1; i <= n; i++) {
        c = substr($0, i, 1)
        if (esc) { printf "%s", c; esc = 0; continue }
        if (c == "\\" && sq == 0) { esc = 1; printf "%s", c; continue }
        if (c == "'"'"'" && dq == 0) { sq = 1 - sq; printf "%s", c; continue }
        if (c == "\"" && sq == 0) { dq = 1 - dq; printf "%s", c; continue }
        if (sq == 0 && dq == 0) {
          if (c == ";") { printf "\n"; continue }
          if (c == "|") { printf "\n"; if (substr($0, i + 1, 1) == "|") i++; continue }
          if (c == "&" && substr($0, i + 1, 1) == "&") { printf "\n"; i++; continue }
          if (c == "&" && substr($0, i + 1, 1) != ">" && (i == 1 || substr($0, i - 1, 1) !~ /[<>]/)) { printf "\n"; continue }
        }
        printf "%s", c
      }
      # A backslash at end of line continues the command; it does not escape the next line first
      # character, and carrying esc across records would swallow a separator there.
      esc = 0
      printf "\n"
    }'
}

# Tools whose arguments are text to look at, not a command to run. Searching for the phrase
# `gh secret set` is not setting a secret, and a guard that cannot tell the difference denies
# `grep -rn "gh secret set" docs/` - which is how a repository ends up with its own guards
# switched off, or its documentation written through a file tool to dodge them.
SEARCH_CMD_RE='(grep|egrep|fgrep|rg|ag|ack|sed|awk|echo|printf|cat|head|tail|less|more|find|fd|diff|comm|sort|uniq|wc|jq|tr|cut|column|tee)'

# True when the segment's own command is one of those. Leading environment assignments and the
# usual prefixes are stepped over; a command substitution anywhere in the segment disqualifies it,
# because `echo $(gh secret set X --body Y)` really does set the secret.
segment_is_search() { # segment_is_search <segment>
  printf '%s' "$1" | grep -qE '\$\(|`' && return 1
  printf '%s' "$1" \
    | grep -qE "^[[:space:]]*(([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*|sudo|env|command|nohup|time)[[:space:]]+)*([^[:space:]]*/)?(${SEARCH_CMD_RE}|git[[:space:]]+grep)([[:space:]]|$)"
}

# Matches only when the host ends at the match, so localhost.evil.example.com is not loopback.
LOCAL_HOST_RE='(localhost|127\.0\.0\.1|\[::1\]|::1)([:/[:space:]"'"'"']|$)'

# True when the host a value names is not this machine. A path is a unix-socket directory, which
# cannot be anywhere else; quotes come off first because `-h "localhost"` is ordinary and the
# loopback pattern is anchored where the quote would sit.
host_is_remote() { # host_is_remote <host>
  local host
  host="$(printf '%s' "$1" | sed -E 's/^["'"'"']+//; s/["'"'"']+$//')"
  [ -n "${host}" ] || return 1
  case "${host}" in /*) return 1 ;; esac
  ! printf '%s' "${host}" | grep -qiE "^${LOCAL_HOST_RE}"
}

# The value of the last inline assignment to NAME in the text, quotes stripped; empty when none.
inline_value() { # inline_value <NAME> <text>
  printf '%s\n' "$2" \
    | grep -oE "(^|[[:space:]\"'])$1=[^[:space:]]*" \
    | tail -1 \
    | sed -E "s/^[[:space:]\"']*$1=//; s/^[\"']//; s/[\"']$//"
}

# A segment that is nothing but assignments, exported or bare, and so runs no command of its own.
ASSIGNMENT_ONLY_RE='^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]*)+$'

# What NAME is worth to the segments after this one: the value this segment assigns when it
# carries forward, otherwise <previous> unchanged.
#
# Only a segment that is nothing but assignments outlives itself. `export PGHOST=prod; psql ...`
# reaches the client two segments on, and an exported value carries whatever it names. A bare
# `PGHOST=prod` might reach it too (`set -a`, an export further on), so it carries when it names
# something <unsafe_fn> refuses - and does not when it names a local host, because a value nobody
# exported is no evidence about what a later command will read. An inline prefix on some other
# command (`PGHOST=prod psql -c 'select 1'; psql ...`) reaches that command alone, and a search
# pattern that spells an assignment reaches nothing; neither has this segment's shape, so neither
# carries. Never the whole command: that is how a harmless first segment vouches for the rest.
carried_value() { # carried_value <NAME> <segment> <previous> <unsafe_fn>
  local value
  printf '%s' "$2" | grep -qE "${ASSIGNMENT_ONLY_RE}" || { printf '%s' "$3"; return; }
  value="$(inline_value "$1" "$2")"
  [ -n "${value}" ] || { printf '%s' "$3"; return; }
  if printf '%s' "$2" | grep -qE '^[[:space:]]*export[[:space:]]' || "$4" "${value}"; then
    printf '%s' "${value}"
  else
    printf '%s' "$3"
  fi
}
