#!/usr/bin/env bash

# PATCHED(repository-standards): based on github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE).
# The clarify-gate call below (ADR-010) is this standard's addition; the rest is upstream.

set -e

# Parse command line arguments
JSON_MODE=false
ARGS=()

for arg in "$@"; do
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --help|-h)
            echo "Usage: $0 [--json]"
            echo "  --json    Output results in JSON format"
            echo "  --help    Show this help message"
            exit 0
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
done

# Get script directory and load common functions
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get all paths and variables from common functions
_paths_output=$(get_feature_paths) || { echo "ERROR: Failed to resolve feature paths" >&2; exit 1; }
eval "$_paths_output"
unset _paths_output

if [[ ! -f "$FEATURE_SPEC" ]]; then
    echo "ERROR: spec.md not found at $FEATURE_SPEC" >&2
    echo "Run /spec-specify first to create the feature structure." >&2
    exit 1
fi

# ADR-010 clarify gate, enforced here rather than only documented as a precheck in the
# /spec-plan prompt: a skill can only refuse to call this script, it cannot stop an agent
# that skips reading its own MANDATORY PRECHECK instruction. This call is what makes that
# instruction a bridge precondition instead of a request - re-run every time, including
# when plan.md already exists, since a spec can regain open markers after it was planned.
if ! "$SCRIPT_DIR/check-spec-clarified.sh" "$FEATURE_SPEC"; then
    exit 1
fi

# Ensure the feature directory exists
mkdir -p "$FEATURE_DIR"

# Copy plan template if plan doesn't already exist
if [[ -f "$IMPL_PLAN" ]]; then
    if $JSON_MODE; then
        echo "Plan already exists at $IMPL_PLAN, skipping template copy" >&2
    else
        echo "Plan already exists at $IMPL_PLAN, skipping template copy"
    fi
else
    TEMPLATE=$(resolve_template "plan-template" "$REPO_ROOT") || true
    if [[ -n "$TEMPLATE" ]] && [[ -f "$TEMPLATE" ]]; then
        cp "$TEMPLATE" "$IMPL_PLAN"
        if $JSON_MODE; then
            echo "Copied plan template to $IMPL_PLAN" >&2
        else
            echo "Copied plan template to $IMPL_PLAN"
        fi
    else
        if $JSON_MODE; then
            echo "Warning: Plan template not found" >&2
        else
            echo "Warning: Plan template not found"
        fi
        # Create a basic plan file if template doesn't exist
        touch "$IMPL_PLAN"
    fi
fi

# Output results
if $JSON_MODE; then
    if has_jq; then
        jq -cn \
            --arg feature_spec "$FEATURE_SPEC" \
            --arg impl_plan "$IMPL_PLAN" \
            --arg specs_dir "$FEATURE_DIR" \
            --arg branch "$CURRENT_BRANCH" \
            '{FEATURE_SPEC:$feature_spec,IMPL_PLAN:$impl_plan,SPECS_DIR:$specs_dir,BRANCH:$branch}'
    else
        printf '{"FEATURE_SPEC":"%s","IMPL_PLAN":"%s","SPECS_DIR":"%s","BRANCH":"%s"}\n' \
            "$(json_escape "$FEATURE_SPEC")" "$(json_escape "$IMPL_PLAN")" "$(json_escape "$FEATURE_DIR")" "$(json_escape "$CURRENT_BRANCH")"
    fi
else
    echo "FEATURE_SPEC: $FEATURE_SPEC"
    echo "IMPL_PLAN: $IMPL_PLAN"
    echo "SPECS_DIR: $FEATURE_DIR"
    echo "BRANCH: $CURRENT_BRANCH"
fi
