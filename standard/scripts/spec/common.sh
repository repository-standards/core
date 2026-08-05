#!/usr/bin/env bash
# Common functions and variables for all scripts
# PATCHED(repository-standards): based on github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE)
# scripts/bash/common.sh, adapted throughout rather than marked hunk-by-hunk given the extent:
# .specify/ paths renamed to scripts/spec/ and specs/ (ADR-014), speckit-prefixed identifiers
# renamed to spec-* (ADR-015), and the unused preset-manifest template-composition engine
# (resolve_template_content) removed as dead code.

# Find repository root by searching upward for the scripts/spec directory
# (the spec engine's home) - the primary marker for spec-enabled projects
find_specify_root() {
    local dir="${1:-$(pwd)}"
    # Normalize to absolute path to prevent infinite loop with relative paths
    # Use -- to handle paths starting with - (e.g., -P, -L)
    dir="$(cd -- "$dir" 2>/dev/null && pwd)" || return 1
    local prev_dir=""
    while true; do
        if [ -d "$dir/scripts/spec" ]; then
            echo "$dir"
            return 0
        fi
        # Stop if we've reached filesystem root or dirname stops changing
        if [ "$dir" = "/" ] || [ "$dir" = "$prev_dir" ]; then
            break
        fi
        prev_dir="$dir"
        dir="$(dirname "$dir")"
    done
    return 1
}

# Resolve an explicit SPECIFY_INIT_DIR project override (the directory that
# *contains* scripts/spec/), for non-interactive / CI use - e.g. running a spec
# command against a member project from a monorepo root without cd.
#
# Precondition: SPECIFY_INIT_DIR is non-empty. Echoes the validated absolute
# project root, or prints an error and returns 1. Strict by design: the path
# must exist and contain scripts/spec/, with no silent fallback to cwd or the
# script-location default (which would silently write to the wrong project).
resolve_specify_init_dir() {
    local init_root
    # Normalize: relative paths resolve against $(pwd); a trailing slash collapses.
    # CDPATH="" so a relative value cannot be resolved against the caller's CDPATH
    # (which would also echo to stdout and corrupt the captured path).
    if ! init_root="$(CDPATH="" cd -- "$SPECIFY_INIT_DIR" 2>/dev/null && pwd)"; then
        echo "ERROR: SPECIFY_INIT_DIR does not point to an existing directory: $SPECIFY_INIT_DIR" >&2
        return 1
    fi
    if [[ ! -d "$init_root/scripts/spec" ]]; then
        echo "ERROR: SPECIFY_INIT_DIR is not a spec-enabled project (no scripts/spec/ directory): $init_root" >&2
        return 1
    fi
    printf '%s\n' "$init_root"
}

# Get repository root, prioritizing the scripts/spec directory
# This prevents using a parent repository when the spec engine lives in a subdirectory
get_repo_root() {
    # Explicit project override wins (see resolve_specify_init_dir).
    if [[ -n "${SPECIFY_INIT_DIR:-}" ]]; then
        resolve_specify_init_dir
        return
    fi

    # First, look for the scripts/spec directory (the spec engine's marker)
    local specify_root
    if specify_root=$(find_specify_root); then
        echo "$specify_root"
        return
    fi

    # Final fallback to script location (this file lives at <root>/scripts/spec/)
    local script_dir="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    (cd "$script_dir/../.." && pwd)
}

# Get current feature name from explicit state only.
# Returns the feature identifier or empty string if none is set.
# Feature state is set by SPECIFY_FEATURE or implicitly via specs/feature.json.
get_current_branch() {
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi

    # No explicit feature set - caller must handle this via feature.json
    # in get_feature_paths(). Return empty to signal "unknown".
    echo ""
}

# Safely read specs/feature.json's "feature_directory" value.
# Prints the raw value (possibly relative) to stdout, or empty string if the file
# is missing, unparseable, or does not contain the key. Always returns 0 so callers
# under `set -e` cannot be aborted by parser failure.
# Parser order mirrors the historical get_feature_paths behavior: jq -> python3 -> grep/sed.
read_feature_json_feature_directory() {
    local repo_root="$1"
    local fj="$repo_root/specs/feature.json"
    [[ -f "$fj" ]] || { printf '%s' ''; return 0; }

    # Try parsers in order (jq -> python3 -> grep/sed), falling through on
    # failure. Selection is by *parse success*, not mere availability: on
    # Windows `python3` commonly resolves to the Microsoft Store App Execution
    # Alias stub, which passes `command -v` but fails at runtime (exit 49), so
    # an availability-gated `elif` would pick python3, swallow its failure, and
    # never reach the grep/sed fallback -- leaving feature.json unreadable even
    # though it is valid (issue #3304).
    local _fd=''
    if command -v jq >/dev/null 2>&1; then
        if ! _fd=$(jq -r '.feature_directory // empty' "$fj" 2>/dev/null); then
            _fd=''
        fi
    fi
    if [[ -z "$_fd" ]] && command -v python3 >/dev/null 2>&1; then
        # Use Python so pretty-printed/multi-line JSON still parses correctly.
        if ! _fd=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); v=d.get('feature_directory'); print(v if v else '')" "$fj" 2>/dev/null); then
            _fd=''
        fi
    fi
    if [[ -z "$_fd" ]]; then
        # Last-resort single-line grep/sed fallback. The `|| true` guards against
        # grep returning 1 (no match) aborting under `set -e` / `pipefail`.
        _fd=$( { grep -E '"feature_directory"[[:space:]]*:' "$fj" 2>/dev/null || true; } \
            | head -n 1 \
            | sed -E 's/^[^:]*:[[:space:]]*"([^"]*)".*$/\1/' )
    fi

    printf '%s' "$_fd"
    return 0
}

# Persist a feature_directory value to specs/feature.json.
# Writes only when the file is missing or the value differs from what's stored.
# Accepts the raw (possibly relative) path - callers should pass the original
# user-supplied value, not the normalized absolute path.
_persist_feature_json() {
    local repo_root="$1"
    local feature_dir_value="$2"
    local fj="$repo_root/specs/feature.json"

    # Strip repo_root prefix if the value is absolute and under repo_root
    if [[ "$feature_dir_value" == "$repo_root/"* ]]; then
        feature_dir_value="${feature_dir_value#"$repo_root/"}"
    fi

    # Read current value (if any) and skip write when unchanged
    local current_val
    current_val=$(read_feature_json_feature_directory "$repo_root")
    if [[ "$current_val" == "$feature_dir_value" ]]; then
        return 0
    fi

    # Ensure specs/ directory exists
    mkdir -p "$repo_root/specs"

    # Write feature.json - prefer jq for safe JSON, fall back to printf
    if command -v jq >/dev/null 2>&1; then
        jq -cn --arg fd "$feature_dir_value" '{feature_directory:$fd}' > "$fj"
    else
        printf '{"feature_directory":"%s"}\n' "$(json_escape "$feature_dir_value")" > "$fj"
    fi
}

get_feature_paths() {
    # Read-only callers (e.g. check-prerequisites.sh --paths-only) pass
    # --no-persist so pure path resolution never writes specs/feature.json,
    # which would dirty the working tree or overwrite a pinned value (issue #3025).
    local no_persist=false
    if [[ "${1:-}" == "--no-persist" ]]; then
        no_persist=true
        shift
    fi

    # Split decl/assignment so a SPECIFY_INIT_DIR validation failure in
    # get_repo_root propagates as a hard error instead of being masked by `local`.
    local repo_root
    repo_root=$(get_repo_root) || return 1
    local current_branch
    current_branch=$(get_current_branch)

    # Resolve feature directory.  Priority:
    #   1. SPECIFY_FEATURE_DIRECTORY env var (explicit override)
    #   2. specs/feature.json "feature_directory" key (persisted by /spec-specify)
    #   3. Error - no feature context available
    local feature_dir
    if [[ -n "${SPECIFY_FEATURE_DIRECTORY:-}" ]]; then
        feature_dir="$SPECIFY_FEATURE_DIRECTORY"
        # Normalize relative paths to absolute under repo root
        [[ "$feature_dir" != /* ]] && feature_dir="$repo_root/$feature_dir"
        # Persist to feature.json so future sessions without the env var still
        # work - unless the caller opted out for read-only resolution (#3025).
        if [[ "$no_persist" != true ]]; then
            _persist_feature_json "$repo_root" "$SPECIFY_FEATURE_DIRECTORY"
        fi
    elif [[ -f "$repo_root/specs/feature.json" ]]; then
        local _fd
        _fd=$(read_feature_json_feature_directory "$repo_root")
        if [[ -n "$_fd" ]]; then
            feature_dir="$_fd"
            # Normalize relative paths to absolute under repo root
            [[ "$feature_dir" != /* ]] && feature_dir="$repo_root/$feature_dir"
        else
            echo "ERROR: Feature directory not found. Set SPECIFY_FEATURE_DIRECTORY or ensure specs/feature.json contains feature_directory." >&2
            return 1
        fi
    else
        echo "ERROR: Feature directory not found. Set SPECIFY_FEATURE_DIRECTORY or run /spec-specify to create specs/feature.json." >&2
        return 1
    fi

    # When no branch context exists (no SPECIFY_FEATURE, feature resolved via
    # SPECIFY_FEATURE_DIRECTORY or feature.json), fall back to the feature
    # directory basename so CURRENT_BRANCH is a usable identifier rather than
    # an empty, misleading value (issue #3026).
    if [[ -z "$current_branch" ]]; then
        local feature_dir_trimmed="${feature_dir%/}"
        current_branch="${feature_dir_trimmed##*/}"
    fi

    # Use printf '%q' to safely quote values, preventing shell injection
    # via crafted branch names or paths containing special characters
    printf 'REPO_ROOT=%q\n' "$repo_root"
    printf 'CURRENT_BRANCH=%q\n' "$current_branch"
    printf 'FEATURE_DIR=%q\n' "$feature_dir"
    printf 'FEATURE_SPEC=%q\n' "$feature_dir/spec.md"
    printf 'IMPL_PLAN=%q\n' "$feature_dir/plan.md"
    printf 'TASKS=%q\n' "$feature_dir/tasks.md"
    printf 'RESEARCH=%q\n' "$feature_dir/research.md"
    printf 'DATA_MODEL=%q\n' "$feature_dir/data-model.md"
    printf 'QUICKSTART=%q\n' "$feature_dir/quickstart.md"
    printf 'CONTRACTS_DIR=%q\n' "$feature_dir/contracts"
}

# Check if jq is available for safe JSON construction
has_jq() {
    command -v jq >/dev/null 2>&1
}

get_invoke_separator() {
    local repo_root="${1:-$(get_repo_root)}"
    if [[ "${_SPECIFY_INVOKE_SEPARATOR_CACHE_REPO_ROOT:-}" == "$repo_root" && -n "${_SPECIFY_INVOKE_SEPARATOR_CACHE_VALUE:-}" ]]; then
        printf '%s\n' "$_SPECIFY_INVOKE_SEPARATOR_CACHE_VALUE"
        return 0
    fi

    local integration_json="$repo_root/specs/integration.json"
    local separator="."
    local parsed=0

    if [[ -f "$integration_json" ]]; then
        # Try parsers in order (jq -> python3 -> awk), falling through on
        # failure. Selection is by *parse success*, not mere availability: on
        # Windows `python3` commonly resolves to the Microsoft Store App
        # Execution Alias stub, which passes `command -v` but fails at runtime
        # (exit 49). An availability-gated branch would pick python3, swallow
        # its failure, and - because this function historically had no text
        # fallback - silently return "." even for `-`-separator integrations
        # (e.g. forge, cline), yielding wrong command hints (issue #3304).
        if command -v jq >/dev/null 2>&1; then
            local jq_separator
            if jq_separator=$(jq -r '(.default_integration // .integration // "") as $k | if $k == "" then "." else (.integration_settings[$k].invoke_separator // ".") end' "$integration_json" 2>/dev/null); then
                case "$jq_separator" in
                    "."|"-") separator="$jq_separator"; parsed=1 ;;
                esac
            fi
        fi

        if [[ "$parsed" -eq 0 ]] && command -v python3 >/dev/null 2>&1; then
            local py_separator
            if py_separator=$(python3 - "$integration_json" <<'PY' 2>/dev/null
import json
import sys

try:
    with open(sys.argv[1], encoding="utf-8") as fh:
        state = json.load(fh)
    key = state.get("default_integration") or state.get("integration") or ""
    settings = state.get("integration_settings")
    separator = "."
    if isinstance(key, str) and isinstance(settings, dict):
        entry = settings.get(key)
        if isinstance(entry, dict) and entry.get("invoke_separator") in {".", "-"}:
            separator = entry["invoke_separator"]
    print(separator)
except Exception:
    sys.exit(1)
PY
); then
                case "$py_separator" in
                    "."|"-") separator="$py_separator"; parsed=1 ;;
                esac
            fi
        fi

        if [[ "$parsed" -eq 0 ]]; then
            # Last-resort text fallback for environments with neither jq nor a
            # working python3 (e.g. stock Windows + Git Bash). Reads the active
            # integration key (default_integration, else integration) and its
            # invoke_separator from within the integration_settings object.
            # Handles both pretty-printed (the written form) and compact JSON.
            # Accumulate all lines into one buffer in END rather than using
            # gawk-only whole-file slurp (RS="^$"), so this stays portable to
            # the BSD awk on macOS.
            local awk_separator
            awk_separator=$(awk '
                function keyval(d, name,   v) {
                    if (match(d, "\"" name "\"[ \t\r\n]*:[ \t\r\n]*\"[^\"]*\"")) {
                        v=substr(d,RSTART,RLENGTH); sub(/^.*:[ \t\r\n]*"/,"",v); sub(/"$/,"",v); return v
                    }
                    return ""
                }
                { doc = doc $0 "\n" }
                END {
                    key=keyval(doc,"default_integration"); if (key=="") key=keyval(doc,"integration")
                    sep="."
                    if (key!="") {
                        settings=doc
                        if (match(doc, /"integration_settings"[ \t\r\n]*:[ \t\r\n]*[{]/)) {
                            settings=substr(doc, RSTART+RLENGTH-1)
                        }
                        if (match(settings, "\"" key "\"[ \t\r\n]*:[ \t\r\n]*[{]")) {
                            start=RSTART+RLENGTH-1
                            depth=0
                            obj=""
                            for (i=start; i<=length(settings); i++) {
                                c=substr(settings,i,1)
                                obj=obj c
                                if (c=="{") depth++
                                else if (c=="}") { depth--; if (depth==0) break }
                            }
                            if (match(obj, /"invoke_separator"[ \t\r\n]*:[ \t\r\n]*"[-.]"/)) {
                                tok=substr(obj,RSTART,RLENGTH); s=substr(tok,length(tok)-1,1)
                                if (s=="." || s=="-") sep=s
                            }
                        }
                    }
                    print sep
                }
            ' "$integration_json" 2>/dev/null)
            case "$awk_separator" in
                "."|"-") separator="$awk_separator" ;;
            esac
        fi
    fi

    _SPECIFY_INVOKE_SEPARATOR_CACHE_REPO_ROOT="$repo_root"
    _SPECIFY_INVOKE_SEPARATOR_CACHE_VALUE="$separator"
    printf '%s\n' "$separator"
}

# Format a spec command name for display (e.g. "specify" -> "/spec-specify").
# The repo's skills are named spec-<command>, so the separator is always "-".
format_spec_command() {
    local command_name="$1"

    command_name="${command_name#/}"
    command_name="${command_name#spec-}"

    printf '/spec-%s\n' "$command_name"
}

# Escape a string for safe embedding in a JSON value (fallback when jq is unavailable).
# Handles backslash, double-quote, and JSON-required control character escapes (RFC 8259).
json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\t'/\\t}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\b'/\\b}"
    s="${s//$'\f'/\\f}"
    # Escape any remaining U+0001-U+001F control characters as \uXXXX.
    # (U+0000/NUL cannot appear in bash strings and is excluded.)
    # LC_ALL=C ensures ${#s} counts bytes and ${s:$i:1} yields single bytes,
    # so multi-byte UTF-8 sequences (first byte >= 0xC0) pass through intact.
    local LC_ALL=C
    local i char code
    for (( i=0; i<${#s}; i++ )); do
        char="${s:$i:1}"
        printf -v code '%d' "'$char" 2>/dev/null || code=256
        if (( code >= 1 && code <= 31 )); then
            printf '\\u%04x' "$code"
        else
            printf '%s' "$char"
        fi
    done
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }

# Resolve a template name to a file path using the priority stack:
#   1. scripts/spec/overrides/
#   2. scripts/spec/presets/<preset-id>/templates/ (sorted by priority from .registry)
#   3. scripts/spec/extensions/<ext-id>/templates/
#   4. scripts/spec/ (core)
# The override stack below (overrides/, presets/, extensions/) is an optional
# extension point; only the scripts/spec/ core ships with the standard.
resolve_template() {
    local template_name="$1"
    local repo_root="$2"
    local base="$repo_root/scripts/spec"

    # Priority 1: Project overrides
    local override="$base/overrides/${template_name}.md"
    [ -f "$override" ] && echo "$override" && return 0

    # Priority 2: Installed presets (sorted by priority from .registry)
    local presets_dir="$base/presets"
    if [ -d "$presets_dir" ]; then
        local registry_file="$presets_dir/.registry"
        if [ -f "$registry_file" ] && command -v python3 >/dev/null 2>&1; then
            # Read preset IDs sorted by priority (lower number = higher precedence).
            # The python3 call is wrapped in an if-condition so that set -e does not
            # abort the function when python3 exits non-zero (e.g. invalid JSON).
            local sorted_presets=""
            if sorted_presets=$(SPEC_REGISTRY="$registry_file" python3 -c "
import json, sys, os
try:
    with open(os.environ['SPEC_REGISTRY']) as f:
        data = json.load(f)
    presets = data.get('presets', {})
    for pid, meta in sorted(presets.items(), key=lambda x: x[1].get('priority', 10) if isinstance(x[1], dict) else 10):
        if isinstance(meta, dict) and meta.get('enabled', True) is not False:
            print(pid)
except Exception:
    sys.exit(1)
" 2>/dev/null); then
                if [ -n "$sorted_presets" ]; then
                    # python3 succeeded and returned preset IDs - search in priority order
                    while IFS= read -r preset_id; do
                        local candidate="$presets_dir/$preset_id/templates/${template_name}.md"
                        [ -f "$candidate" ] && echo "$candidate" && return 0
                    done <<< "$sorted_presets"
                fi
                # python3 succeeded but registry has no presets - nothing to search
            else
                # python3 failed (missing, or registry parse error) - fall back to unordered directory scan
                for preset in "$presets_dir"/*/; do
                    [ -d "$preset" ] || continue
                    local candidate="$preset/templates/${template_name}.md"
                    [ -f "$candidate" ] && echo "$candidate" && return 0
                done
            fi
        else
            # Fallback: alphabetical directory order (no python3 available)
            for preset in "$presets_dir"/*/; do
                [ -d "$preset" ] || continue
                local candidate="$preset/templates/${template_name}.md"
                [ -f "$candidate" ] && echo "$candidate" && return 0
            done
        fi
    fi

    # Priority 3: Extension-provided templates
    local ext_dir="$base/extensions"
    if [ -d "$ext_dir" ]; then
        for ext in "$ext_dir"/*/; do
            [ -d "$ext" ] || continue
            # Skip hidden directories (e.g. .backup, .cache)
            case "$(basename "$ext")" in .*) continue;; esac
            local candidate="$ext/templates/${template_name}.md"
            [ -f "$candidate" ] && echo "$candidate" && return 0
        done
    fi

    # Priority 4: Core templates
    local core="$base/${template_name}.md"
    [ -f "$core" ] && echo "$core" && return 0

    # Template not found in any location.
    # Return 1 so callers can distinguish "not found" from "found".
    # Callers running under set -e should use: TEMPLATE=$(resolve_template ...) || true
    return 1
}
