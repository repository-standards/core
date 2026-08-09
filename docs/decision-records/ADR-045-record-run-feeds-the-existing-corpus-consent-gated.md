# ADR-045: `record-run` feeds the existing corpus, consent-gated

| | |
| --- | --- |
| **Status** | Accepted (2026-08-09) |
| **Date** | 2026-08-09 |
| **Author** | Łukasz Bodurka |
| **Tags** | validation, skills, feedback, consent |

## Context

`docs/validation/human-prompting/README.md` names its own weakest point plainly: the
corpus is written almost entirely by people who already know the product, which
systematically produces prompts the product can already handle. `reporting.md` already
tells a stranger exactly what to send - three headings, a script to extract a Claude Code
transcript - but the request lives on a page nobody reads until something has already gone
wrong, and asks for work (extract, scrub, write up) that a real adopter will not do after
the fact. The signal that would fix the weakest point dies in the session it was produced
in, every time, unless something captures it before the session ends.

## Options considered

- **A - Automatic capture and send, no consent.** Maximum signal, but a run's own turns can
  contain a client's name, internal paths, real code - sending it without a per-run human
  yes is the exact silent side effect ADR-021 already rejected for upstream issues, and
  this carries strictly more of the user's own text than a friction report does.
- **B - Leave `reporting.md` as the only path.** The status quo. Correct in principle, dead
  in practice: nobody reconstructs a session by hand once it is over, which is exactly why
  the corpus is as thin as its own README admits.
- **C - Consent-gated auto-assembly, two levels, at the point of use (chosen).** A skill
  assembles the record from the session that just happened and asks once, at the moment
  the user is already there - the same shape ADR-021 already uses for adoption-friction and
  stack-request issues, applied to the corpus that has no inbound channel at all today.

## Decision

Option **C**, as the shipped skill `standard/.claude/skills/record-run/SKILL.md` (the 21st
lifecycle skill). Four choices inside it, each checked against an alternative before being
settled:

1. **It feeds the corpus that already exists, not a new one.** The output is a
   `prompts.md` row (`source: reported`) plus a scored `docs/validation/human-prompting/runs/*.json`
   file, using the three-flag method (`asked`/`checked`/`suggested`) that page already
   documents. A dedicated transcript archive was the design's first instinct; rejected,
   because the corpus this problem is actually about already has a shape, a scoring method
   and a destination, and a second artifact type would need its own review process nothing
   currently provides.
2. **Two consent levels, not one.** Level 1 sends only the user's literal turns, three
   summary yes/nos and one result line - no agent text, no repo name. Level 2 adds the
   agent's own responses, the tool log and the repo slug. All-or-nothing was rejected on the
   idea document's own evidence: every finding the human-prompting method has produced so
   far required the agent's text to explain, which Level 1 alone would never carry - but a
   skill that only offers the large ask will collect nothing from most real sessions, which
   defeats the point as completely as option B does.
3. **Ships as a lifecycle skill, not a zone-1 transition one.** `align-to-standards`
   itself never ships (`skills/align-to-standards/`, run from a checkout or fetched live);
   `record-run` ships into every adopted repo instead, because the trigger it serves - the
   close of an align session - fires wherever that session actually runs, including a
   re-entrant wave against an already-aligned repo that carries `.claude/skills/` locally
   and has no reason to re-fetch a zone-1 file that was never meant to leave this repo.
4. **No new script, no new dependency.** The scrub step (machine paths, login, hostnames)
   is written as agent-executed procedure inside the skill, the same form every other
   shipped skill already uses, not a standalone `scripts/*.mjs` guard. A guard script
   ships into every adopted repo whether or not that repo ever runs `record-run`; a
   procedural step costs nothing until the skill is actually invoked, and R16's
   dependency-free-tooling rule governs compliance guards, which this is not one of.

## Consequences

- Positive: the corpus gets its only realistic inbound channel from real adopters, at the
  exact moment consent is cheapest to give; a failed or abandoned run - the design's own
  emphasis - counts as evidence for the first time, correcting a corpus that today only
  ever hears from sessions that went well enough to write up.
- Positive: nothing new to build server-side or to maintain as a second corpus - the same
  `prompts.md` / `runs/` / `reporting.md` machinery this repo already has absorbs it.
- Negative: the automatic scrub is a pattern match, not a guarantee (stated in the skill
  itself) - a client's name inside a typed sentence still needs the human read at the
  show-before-send step; this is the same limit `reporting.md` already accepts for a
  hand-written report, not a new gap `record-run` introduces.
- Negative: one more offer at the end of every align session - mitigated by making the
  cost of declining exactly zero (the file stays local, nothing sent) and by wiring it
  beside the step 8 upstream review that already exists, rather than as a separate stop.

## Confirmation

`standard/.claude/skills/record-run/SKILL.md` ships as the 21st entry under
`.claude/skills` (manifest hash regenerated via `tools/manifest-hashes.mjs`, grouped in
`tools/skill-map.mjs`'s "Closing the work"); `skills/align-to-standards/SKILL.md` offers it
at a new step 9, mirroring step 8's consent pattern; `CONTRIBUTING.md` names both the
automated and the manual path under "Contributing by validation"; `reporting.md` points
back at it for anyone who already ran an align session.

## Related

- [ADR-021](ADR-021-adoption-feeds-the-standard.md) (the consent-gated, ready-title-and-body
  pattern this ADR reuses for a second upstream channel).
- [ADR-019](ADR-019-lifecycle-procedures-are-agent-portable.md) (why this ships as an
  executable skill rather than a prose request on a page nobody reads until too late).
- `docs/validation/human-prompting/README.md` (the corpus and the three-flag method this
  skill's output is scored against - unchanged by this decision, only fed by it).
