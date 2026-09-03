---
status: Accepted, revised by ADR-061 (adopt.evidence gets a recommended default)
date: 2026-08-19
---

# ADR-055: the close of an adoption runs before the pull request, and the consent it needs is asked at the intake

## Context

An `align-to-standards` wave ends with three steps that produce everything this project
learns from an adoption: the upstream friction review (ADR-021), the `record-run` offer that
asks whether the session may be kept as evidence (ADR-045), and the anonymous adoption ping
that feeds the count the site publishes (ADR-047). All three were written as the last items
of the phase file, after "open one focused PR".

Measured on 2026-08-19, on the largest field adoption this standard has had - 25 commits,
253 files, 20 questions asked, a run good enough that its own guard findings were adopted
back into this repository - **none of the three ran**. No friction issue was offered, no
transcript was mentioned, and `GET https://stats.repositorystandards.workers.dev` still
returned `{"count":12}` after the run finished. It is not a lapse of that run: across every
adoption ever performed, no adopter has been asked for a transcript even once, which is the
single piece of evidence the human-prompting corpus's own README names as the thing it
lacks.

The cause is placement, and it is the same defect ADR-054 was written about one level up.
A step at the tail of a phase file competes with a user waiting for a pull request, at the
point in a long run where context is thinnest and the work feels done. The pull request is
the visible finish line, so everything printed after it is read as optional.

Two fixes were considered and rejected. Gating the push itself - denying `git push` until
the consent question has fired - puts the elicitation guard on an action rather than an
artifact and, because consent is `work`-scoped and no committed row can settle it, would
demand a telemetry-consent answer before every push in every adopting repository forever;
that is the unlivable-guard failure the same branch had already learned to avoid. Leaving
the steps where they are and instructing harder is what the standard has been doing, and
this record exists because it does not work.

## Decision

**The close comes before the pull request.** The phase file's steps are renumbered so that
reading order is execution order: 7 upstream friction, 8 `record-run`, 9 the ping, 10 the
pull request, which is stated to be the final action of the wave.

**The consent the close needs is asked in the intake round, as a declared point.**
`adopt.evidence` is added to `.claude/elicitation/points.json`, gating
`docs/adoption-intake.md` - the artifact an adoption writes early and cannot skip - and asked
in the intake block beside `adopt.intent`:

> This session can be kept as evidence for the standard - the questions it asked, the answers
> you gave, what it produced. May it be kept, and may an excerpt be sent upstream after you
> have read it?

Options, in order: **keep it, and I will read the excerpt before anything is sent** / **keep
it local - assemble it, send nothing** / **record nothing**. `recommended` is `null` and
`allowed_provenance` is `human` alone: consent is never nudged, never inferred and never
stubbed. This adds no new way for an adoption to stall, because `adopt.intent` already gates
the same file on a human answer.

The answer governs step 8 and nothing else. `record-run` still shows the assembled file and
takes a per-item yes before anything leaves the machine (ADR-045) - the intake answer is
permission to assemble and to come back, not permission to send. It does not govern the ping,
which carries no session content and is disclosed rather than asked (ADR-047).

**The ping reports the count it produced.** The step reads the counter before and after its
POST and states both numbers. A count that did not move is reported as a ping that did not
land.

## Consequences

- One more question in the intake round, in exchange for the only evidence this project
  cannot generate for itself.
- `record-run`'s own `record.participation` point is unchanged. It gates the write of the run
  record, a path that exists in this repository and not in an adopted one, which is why it
  could never have fired during an adoption - `adopt.evidence` is what fires there.
- An adoption that answers **record nothing** says so in the ledger and skips step 8 out
  loud. A skipped step that announces itself is the outcome this record is buying; a silently
  skipped one is what it is replacing.
- The site's live badge becomes a check on this record: if it stops moving while adoptions
  complete, step 9 has drifted again.

## Compliance

`skills/align-to-standards/steps.md` orders the wave 7-8-9-10 with the pull request last;
`adopt.evidence` appears in `standard/.claude/elicitation/points.json` with `recommended:
null` and `allowed_provenance: ["human"]`, in the shipped ledger template, and as a real
`AskUserQuestion` block in `skills/align-to-standards/intake.md` - which
`tools/elicitation-points-check.mjs` verifies for every declared point.

## Revisit when

- An adoption completes and the counter still does not move, or a run reaches step 10 with
  step 8 unmentioned. Ordering would then have failed the same way instruction did, and the
  next lever is the guard on the action rather than on the artifact - with the livability
  problem above solved first.
- Consent at the intake proves to be worth less than consent at the close - an adopter who
  said yes early and objects to what was assembled from it. The two-stage design (permission
  to assemble now, per-item consent to send later) is what this record bets against that.

## Related

- [ADR-054](ADR-054-asking-is-a-mechanism-with-provenance-not-an-instruction.md) - the same
  defect one level up: an instruction to ask, with nothing making it happen.
- [ADR-045](ADR-045-record-run-feeds-the-existing-corpus-consent-gated.md) - what `record-run`
  assembles and the per-item consent it still takes before sending.
- [ADR-047](ADR-047-adoption-ping-is-informed-not-asked-and-minimal.md) - why the ping is
  disclosed rather than asked, and the payload it is held to.
