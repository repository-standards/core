#!/usr/bin/env bash
# PATCHED(repository-standards): ADR-010 clarify gate. This file is NOT an upstream
# github/spec-kit script - it is this standard's addition to the vendored engine.
#
# Blocks plan/tasks on a spec that is not ready-to-develop. A spec passes when:
#   1. it contains a "## Clarifications" section, and
#   2. it contains zero open markers of the "[NEEDS ..." family (standard ADR-024):
#      CLARIFICATION (a question), DECISION (a missing ADR/BDR), INPUT (e.g. a
#      UX design), ASSET (e.g. credentials) - each names what is missing and
#      who brings it, so the open markers double as the spec's gap list, and
#   3. nothing in it is merely SHAPED like a marker - a translated family name or
#      an invented type is a gap the gate cannot read, so it fails instead, and
#   4. it contains a "## Open questions" section that says there are none.
# Passing this gate is what earns the spec "Status: ready-to-develop".
#
# Every check fails CLOSED, and that is the point of the file: three separate
# fail-open bugs got a spec to ready-to-develop with its questions still live,
# and each one looked exactly like a passing gate.
#
# Usage: check-spec-clarified.sh <path-to-spec.md>
# Exit codes: 0 = gate passed; 1 = gate failed (message on stderr).
# Plain bash + grep only - no jq, no python, no other dependencies.

set -u

SPEC_FILE="${1:-}"

if [ -z "$SPEC_FILE" ]; then
    echo "clarify gate: usage: $0 <path-to-spec.md>" >&2
    exit 1
fi

if [ ! -f "$SPEC_FILE" ]; then
    echo "clarify gate: FAIL - spec file not found: $SPEC_FILE" >&2
    exit 1
fi

if ! grep -q '^## Clarifications' "$SPEC_FILE"; then
    echo "clarify gate: FAIL - $SPEC_FILE has no '## Clarifications' section." >&2
    echo "clarify gate: run the clarify loop first (/spec-clarify); record answers and deferrals under '## Clarifications'." >&2
    echo "clarify gate: that heading is SYNTAX, not prose - it stays exactly '## Clarifications' in a spec written in any language (see docs/method/working-language.md). Translating it does not satisfy this check, it hides the spec from it." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

OPEN_MARKERS=$(grep -cF '[NEEDS ' "$SPEC_FILE") || true
OPEN_MARKERS=${OPEN_MARKERS:-0}

if [ "$OPEN_MARKERS" -gt 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE still has $OPEN_MARKERS open [NEEDS ...] marker(s) (the gap list - what is missing and who brings it):" >&2
    grep -nF '[NEEDS ' "$SPEC_FILE" >&2
    echo "clarify gate: resolve each marker - answer it (/spec-clarify), land the missing decision/input/asset, or record an explicit deferral under '## Clarifications'." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

# A spec that names the marker family (CLARIFICATION/DECISION/INPUT/ASSET) as a
# numbered list item without the bracket form is still an open gap - it is
# invisible to the check above, which only counts the literal string, and this
# exact shape has been produced by hand (a spec not authored through
# /spec-clarify): "- **CLARIFICATION-1 (owner: ...).** ...". Catching the family
# name is enough to close the gap without trying to parse arbitrary free text.
UNBRACKETED=$(grep -ncE '^[[:space:]]*-[[:space:]]*\*\*(CLARIFICATION|DECISION|INPUT|ASSET)-[0-9]+' "$SPEC_FILE") || true
UNBRACKETED=${UNBRACKETED:-0}

if [ "$UNBRACKETED" -gt 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE has $UNBRACKETED open marker(s) written as a numbered list item instead of the required [NEEDS ...] bracket form (invisible to the check above otherwise):" >&2
    grep -nE '^[[:space:]]*-[[:space:]]*\*\*(CLARIFICATION|DECISION|INPUT|ASSET)-[0-9]+' "$SPEC_FILE" >&2
    echo "clarify gate: rewrite each as [NEEDS CLARIFICATION: ...] / [NEEDS DECISION: ...; owner: ...] / [NEEDS INPUT: ...; owner: ...] / [NEEDS ASSET: ...; owner: ...], then resolve or defer it." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

# Reaching here means the file holds zero markers of the four known forms - the check
# above counts them literally and exits on the first one. So any remaining token that is
# SHAPED like a typed marker is one the gate cannot read: a translated family name
# ("[BRAK DECYZJI: ...]", "[需要澄清: ...]"), or an invented type. That is the fail-open
# this catches, and it was reproduced: a spec written in Chinese, its markers translated
# with the family, printed PASS with four unresolved items including a missing decision.
#
# The asymmetry is what made it inevitable rather than unlucky. The '## Clarifications'
# check above fails CLOSED and names the exact English string, so a team that hits it
# "fixes" the error by translating the heading and lands in a silent pass.
#
# Marker-shaped, structurally: [<ALL-CAPS words>: ...] or [<anything containing a
# non-ASCII character>: ...], where the closing bracket is not followed by ( or [ - a
# markdown link is not a marker. Byte semantics (LC_ALL=C) so the non-ASCII class is
# predictable whatever the locale.
ASCII_SHOUT='\[[A-Z][A-Z0-9_-]*([ _-]+[A-Z0-9_-]+)*[[:space:]]*:[^]]*\]([^([]|$)'
NON_ASCII='\[[^]]*[^ -~][^]]*(:|：)[^]]*\]([^([]|$)'
UNKNOWN=$(LC_ALL=C grep -ncE "$ASCII_SHOUT|$NON_ASCII" "$SPEC_FILE") || true
UNKNOWN=${UNKNOWN:-0}

if [ "$UNKNOWN" -gt 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE has $UNKNOWN bracketed token(s) shaped like an open marker but not one of the four forms the gate can read:" >&2
    LC_ALL=C grep -nE "$ASCII_SHOUT|$NON_ASCII" "$SPEC_FILE" >&2
    echo "clarify gate: the four marker forms and the structural headings ('## Clarifications', '## Open questions') are SYNTAX, not prose - they stay ASCII, exactly as written, in a spec authored in any language (docs/method/working-language.md). The gate greps for those literal strings; a translated marker is invisible to it, so the gate would pass a spec with every gap still open." >&2
    echo "clarify gate: write each as [NEEDS CLARIFICATION: ...] / [NEEDS DECISION: ...; owner: ...] / [NEEDS INPUT: ...; owner: ...] / [NEEDS ASSET: ...; owner: ...] - the text INSIDE the marker is prose and may be in any language - then resolve or defer it." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

# --- the spec's own open-questions section -------------------------------------------
# The capability template makes "## Open questions" a REQUIRED section, in free prose, and
# the gate never read it. Four shapes were reproduced passing with questions live: prose
# markers, a question phrased as a statement, a table of open items, and an item resolved
# above but still listed here. Reading intent out of free text is not the answer; the rule
# is structural, and it is the whole rule:
#
#   this section passes only when it says there are none.
#
# So an unresolved gap goes where it belongs - a typed marker in its functional section,
# which the checks above hold closed - a settled note goes into the section it describes,
# and anything worth keeping but not worth blocking on goes to the backlog with a link.
# HTML comments and fenced blocks are stripped first: that is where the template's own
# guidance lives, and the template must not trip the rule it teaches.
#
# Pure bash and grep, per this engine's dependency rule. grep runs only on the handful of
# lines inside the section, not per line of the file.
OQ_FOUND=0
OQ_LIVE=""
OQ_COUNT=0
in_section=0
in_comment=0
in_fence=0
lineno=0
while IFS= read -r raw || [ -n "$raw" ]; do
    lineno=$((lineno + 1))
    line="$raw"

    # HTML comments, scanned within the line: an example block that opens and closes on
    # one line must not swallow the rest of the file.
    if [ "$in_comment" -eq 1 ]; then
        case "$line" in
            *"-->"*)
                line="${line#*-->}"
                in_comment=0
                ;;
            *) continue ;;
        esac
    fi
    case "$line" in
        *"<!--"*)
            before="${line%%<!--*}"
            rest="${line#*<!--}"
            case "$rest" in
                *"-->"*) line="$before${rest#*-->}" ;;
                *)
                    line="$before"
                    in_comment=1
                    ;;
            esac
            ;;
    esac

    case "$line" in
        '```'* | '~~~'*)
            if [ "$in_fence" -eq 1 ]; then in_fence=0; else in_fence=1; fi
            continue
            ;;
    esac
    [ "$in_fence" -eq 1 ] && continue

    case "$line" in
        "## Open questions"*)
            OQ_FOUND=1
            in_section=1
            continue
            ;;
        "## "* | "# "*)
            in_section=0
            continue
            ;;
    esac

    [ "$in_section" -eq 0 ] && continue
    printf '%s' "$line" | grep -q '[^[:space:]]' || continue
    # The only content that reads as "nothing is open".
    printf '%s' "$line" | grep -qiE '^[[:space:]]*(none|none known|none at this time|no open questions|no known gaps)\.?[[:space:]]*$' && continue
    OQ_COUNT=$((OQ_COUNT + 1))
    OQ_LIVE="${OQ_LIVE}${lineno}:${line}
"
done < "$SPEC_FILE"

if [ "$OQ_FOUND" -eq 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE has no '## Open questions' section (the capability template requires it)." >&2
    echo "clarify gate: add it, and write 'None known.' under it when there genuinely are none - an absent section is indistinguishable from nothing being open, which is the difference this gate exists to hold." >&2
    echo "clarify gate: that heading is SYNTAX and stays exactly '## Open questions' in a spec written in any language (docs/method/working-language.md)." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

if [ "$OQ_COUNT" -gt 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE has $OQ_COUNT live line(s) under '## Open questions':" >&2
    printf '%s' "$OQ_LIVE" >&2
    echo "clarify gate: that section passes only when it says there are none ('None known.'). Anything else there is an open item, however it is phrased - prose, a statement, a table row, or one resolved above and still listed below." >&2
    echo "clarify gate: move each one: an unresolved gap becomes a typed [NEEDS ...] marker in the section it belongs to (this gate holds those), a settled note goes into the section it describes, and a known gap the repo will not block on goes to the backlog with a link from there." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

echo "clarify gate: PASS - $SPEC_FILE has a '## Clarifications' section, no open [NEEDS ...] markers, and nothing live under '## Open questions' (ready-to-develop)."
exit 0
