# The silently skipped clarify (antipattern)

**Situation.** An internal console at a property group, running spec-driven development
with an agent: specify -> clarify -> plan -> tasks, mirrored one-way into a paid tracker.

**What happened.** A slice went specify -> plan -> tasks with the clarify step never
run - nobody noticed, because running it depended on someone *remembering* a command.
The open decisions sat unresolved inside a spec that looked finished, and were on their
way to a developer as "ready".

**The antipattern.** *Process by memory*: any loop step that fires only when a human
recalls its name will be skipped, and the artifacts downstream will look done while
carrying the gap. The user cannot be blamed - they never knew the step existed.

**What the standard does about it.** The loop is **AI-led and gated in layers** (five of
them - a skill-level precheck, the gate script, the policy doc that states the rule, loaded
context, and a script-level bridge precondition): clarify chains automatically after
specify; plan/tasks/mirror are mechanically blocked unless the spec has a
`## Clarifications` section and zero open `[NEEDS CLARIFICATION]`; the gate is what earns
`Status: ready-to-develop`. None of the five is a Claude Code `hooks/`-mechanism hook -
this repo's three shipped hooks guard unrelated risky Bash commands, and "does a skill
cover this request" is a judgment call no hook can make.

**Where it lives now.** [`standard/specs/README.md`](../../standard/specs/README.md)
("Make the loop self-triggering"), [`standard/specs/enforcement.md`](../../standard/specs/enforcement.md)
(the clarify gate, and the scripts that call it as a bridge precondition), ADR-010, the
"loop runs itself" section of the AGENTS template.
