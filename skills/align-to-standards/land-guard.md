# Land the elicitation guard

Phase file of `align-to-standards`. Runs inside it, never as a separate skill.

A one-time bootstrap action, not a wave - it has no step number of its own inside
the reconcile waves (`steps.md`) and runs before intake's question round starts,
not after it.

Land the elicitation guard before anything else, and stop for a restart. Copy
`.claude/hooks/elicitation-guard.mjs`, `.claude/elicitation/points.json`, the
`PreToolUse` matcher that wires them from `.claude/settings.json`, and
`docs/adoption-provenance.md` into the target - nothing else. Then **tell the human the
session has to restart before the adoption continues**: a `PreToolUse` hook binds when a
session starts, so a session that began in an unaligned repository has no wiring, and the
adoption run - the one this whole mechanism exists to stop - would be the single run
nothing enforces. None of the four files above is gated by any point, so this costs an
ordering and nothing else. Say it out loud rather than proceeding: an adoption that
silently ran without the guard looks exactly like one that ran with it.

## Next

After the restart, continue with [`intake.md`](intake.md) - the question round has not
started yet.
