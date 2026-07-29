# ADR-021: Adoption feeds the standard - the loop closes upstream

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | feedback, ecosystem, issues, adoption |

## Context

Every adoption run generates exactly the signal a standard lives on - and all of
it stayed in the target repo: deviations became manifest `exceptions`, drift went
to the client's backlog, tribal knowledge landed at the client's taxonomy homes.
Nothing ever flowed back. The registry model has the same blind spot: when a
technology has no official stack, the fallback writes a local
`docs/stack-decisions.md` and the demand signal - which stack to build next, the
one thing the stacks backlog says it waits for - is silently discarded. The
standard's own North Star (guidance quality, retention) had no inbound channel;
the open-questions system invites human challengers but no adoption-path file
ever points the *executing agent* at it.

## Options considered

- **A - Automatic telemetry / auto-filed issues.** Maximum signal, but an agent
  publishing to a third-party repo without a per-run human yes is exactly the
  kind of silent side effect the standard bans elsewhere.
- **B - Leave it to humans.** The status quo: CONTRIBUTING invites people. In
  practice the human never sees the friction the agent hit - the signal dies in
  the session.
- **C - Consent-gated agent offers, structured channels (chosen).** The agent
  detects the trigger, proposes the upstream contribution, the user decides.
  Issue templates give the inbound signal a shape.

## Decision

Option **C**. Concretely:

1. **Missing-stack requests.** When the registry has no stack for the detected
   technology, the align flow - after offering the local fallback document -
   offers (with the user's consent, never automatically) to open a
   **stack request** issue on the standards repo, attaching the detection
   evidence and the generated `stack-decisions.md` as seed material.
2. **Adoption friction reports.** The align flow closes with an upstream review:
   if the run recorded manifest exceptions, hit an instruction it could not
   follow, had to ask the user something the standard should have answered, met
   a registry gap or a guard false-positive - the agent offers to file each as
   an **adoption friction** issue (or a PR, for a concrete doc fix) on the
   standards repo. `update-to-version` carries a lighter echo of the same step.
3. **Structured channels.** The core repo carries `.github/ISSUE_TEMPLATE/`
   forms - stack request, adoption friction, bug - so agent-filed and
   human-filed signal arrives in one shape. CONTRIBUTING gains a "Feedback from
   adopters" section naming the channels.
4. **Consent is per action.** The agent proposes with a ready title and body;
   the user says yes or no per issue. No consent, no upstream side effect - the
   learning still lands in the target repo's records as before.

## Consequences

- Positive: the registry gets its demand signal; the standard gets structured
  field evidence (the same genre as the case studies); the ecosystem stops
  depending on the owner noticing everything personally.
- Negative: one more decision point at the end of a run; issue quality depends
  on the agent's summary discipline - the templates carry required fields to
  keep the floor.

## Related

- ADR-016 (the registry this feeds), ADR-020 (the intake that gathers the
  consent context), ADR-012 (knowledge lands where it belongs - here, upstream),
  the open-questions system (human challengers; this ADR adds the agent path).
