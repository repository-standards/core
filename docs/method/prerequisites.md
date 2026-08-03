# Prerequisites - what has to be installed before the standard can hold

> The standard ships guards, not promises. A guard that cannot run does not fail loudly -
> it clears the command and prints nothing. This page lists what has to be present for
> the shipped protection to be real, and what happens when it is not.

## You have this case - say this

**You are about to adopt the standard into a repo.** Install the required set first, then
let the agent proceed. This page lives in the `repository-standards/core` checkout, not
in your repo (`docs/method/` is read by reference, never copied - ADR-023), so name it by
its checkout path or its permanent URL:

```
> check the prerequisites in docs/method/prerequisites.md (repository-standards/core) are
  installed before you touch anything
```

**The agent suddenly refuses every shell command.** That is the guards failing closed
because `jq` is missing. Install it and retry - nothing else is wrong:

```
brew install jq          # macOS
sudo apt-get install jq  # Debian/Ubuntu
```

**CI is green but you never see the guards fire locally.** Run their self-test - the
guards only print on a denial, so silence is ambiguous by construction:

```
bash scripts/verifyAgentGuards.sh
```

## Required

| Tool | Why | Without it |
|---|---|---|
| **Node**, exact version in `.nvmrc` | every guard is dependency-free Node (`scripts/*.mjs`) - `self-verify`, `spec-structure`, `spec-guard`, `cycle-guard` *(scale)*, `facts-check`, `schema-pair` | no compliance check runs; CI fails at setup |
| **git** | the coupling guard reads the PR diff; the spec engine resolves the active feature from the branch | `spec-guard` cannot compare anything |
| **bash** | the agent guards under `.claude/hooks/` and the spec engine under `scripts/spec/` | neither runs |
| **jq** | the `PreToolUse` guards parse the command out of the hook payload with it | **every Bash command is denied.** The guards fail closed on purpose: a guard that cannot read the command has not checked it, and the earlier behaviour - passing silently - meant the remote-database and force-push protection R19 promises was simply absent with nothing to show for it |

## Optional

| Tool | Why | Without it |
|---|---|---|
| **python3** | a fallback JSON parser inside the spec engine (`scripts/spec/common.sh` tries jq, then python3, then grep/sed) | nothing - jq is tried first and the grep/sed path covers the rest |
| **gitleaks** | the secret scan | the CI workflow installs it itself, so nothing breaks locally either way. `specs/enforcement.md` describes a local pre-commit pass as the intended design, but no pre-commit hook installer ships with the tree yet (no husky/lefthook config, nothing under `.git/hooks/`) - today the secret scan only ever runs in CI, gitleaks installed locally or not |

## Why this page exists rather than a check

`self-verify` scores the repo's structure, not the machine it runs on: a laptop missing
`jq` is not repository drift, and counting it as drift would make the number mean two
different things. The enforcement lives where the tool is used instead - the guards deny
when they cannot run, and `scripts/verifyAgentGuards.sh`
covers that path so a regression is caught rather than assumed.
