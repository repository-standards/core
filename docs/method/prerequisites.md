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

## On a machine with no POSIX shell (Windows)

The `bash` and `jq` rows above are not a formality there. The three `PreToolUse` guards
ship as `.sh` files and the settings baseline invokes them as commands, so a session with
no POSIX shell runs none of them - and that is silent by construction, because a guard
only prints when it denies something. Git Bash or WSL supplies the shell; `jq` is a
separate install on top of either. Whichever you use, run
`bash scripts/verifyAgentGuards.sh` once and watch it print its denials, since that is the
only positive evidence this design can give you.

Installing a shell does not finish the job. The deny/ask lists match command strings, and
every destructive entry in the shipped baseline names a POSIX tool - `sudo`, `rm -rf`,
`dd`, `diskutil`, `shred`, `launchctl`, `crontab`. The same action spelled in another
shell's vocabulary matches none of them, so it is neither denied nor queried. A repo whose
agents work in that shell extends the lists with the equivalents they actually run and
records what it added under the security baseline's agent-boundaries axis. The shipped
baseline keeps the vocabulary it has been tested against rather than growing a second one
nobody here can exercise: a deny entry that has never once fired on the platform it claims
to cover is the same silence, in a longer file.

## Why this page exists rather than a check

`self-verify` scores the repo's structure, not the machine it runs on: a laptop missing
`jq` is not repository drift, and counting it as drift would make the number mean two
different things. The enforcement lives where the tool is used instead - the guards deny
when they cannot run, and `scripts/verifyAgentGuards.sh`
covers that path so a regression is caught rather than assumed.
