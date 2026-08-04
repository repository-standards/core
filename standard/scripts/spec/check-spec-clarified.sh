#!/usr/bin/env bash
# PATCHED(repository-standards): ADR-010 clarify gate. This file is NOT an upstream
# github/spec-kit script - it is this standard's addition to the vendored engine.
#
# Blocks plan/tasks on a spec that is not ready-to-develop. A spec passes when:
#   1. it contains a "## Clarifications" section, and
#   2. it contains zero open markers of the "[NEEDS ..." family (ADR-024):
#      CLARIFICATION (a question), DECISION (a missing ADR/BDR), INPUT (e.g. a
#      UX design), ASSET (e.g. credentials) - each names what is missing and
#      who brings it, so the open markers double as the spec's gap list.
# Passing this gate is what earns the spec "Status: ready-to-develop".
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

echo "clarify gate: PASS - $SPEC_FILE has a '## Clarifications' section and no open [NEEDS ...] markers (ready-to-develop)."
exit 0
