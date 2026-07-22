#!/usr/bin/env bash
# PATCHED(repository-standards): ADR-010 clarify gate. This file is NOT an upstream
# github/spec-kit script - it is this standard's addition to the vendored engine.
#
# Blocks plan/tasks on a spec that is not ready-to-develop. A spec passes when:
#   1. it contains a "## Clarifications" section, and
#   2. it contains zero open "[NEEDS CLARIFICATION" markers.
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
    echo "clarify gate: run the clarify loop first (/speckit.clarify); record answers and deferrals under '## Clarifications'." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

OPEN_MARKERS=$(grep -cF '[NEEDS CLARIFICATION' "$SPEC_FILE") || true
OPEN_MARKERS=${OPEN_MARKERS:-0}

if [ "$OPEN_MARKERS" -gt 0 ]; then
    echo "clarify gate: FAIL - $SPEC_FILE still has $OPEN_MARKERS open [NEEDS CLARIFICATION ...] marker(s):" >&2
    grep -nF '[NEEDS CLARIFICATION' "$SPEC_FILE" >&2
    echo "clarify gate: resolve each marker via the clarify loop (/speckit.clarify) - answer it or record an explicit deferral under '## Clarifications'." >&2
    echo "clarify gate: do not plan or generate tasks for a spec that is not ready-to-develop." >&2
    exit 1
fi

echo "clarify gate: PASS - $SPEC_FILE has a '## Clarifications' section and no open [NEEDS CLARIFICATION] markers (ready-to-develop)."
exit 0
