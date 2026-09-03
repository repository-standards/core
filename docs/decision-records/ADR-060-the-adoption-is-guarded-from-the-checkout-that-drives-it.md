# ADR-060: The adoption is guarded from the checkout that drives it

| | |
| --- | --- |
| **Status** | Accepted (2026-09-03) |
| **Date** | 2026-09-03 |
| **Author** | Łukasz Bodurka |
| **Tags** | elicitation, guards, adoption, bootstrap |

## Context

ADR-054 made asking a mechanism in three layers. ADR-059, the same day as this record, closed
the gap that mechanism could not close for itself - the guard is wired when a session starts,
so it does not cover the run that installs it - with three layers of its own: Step -1,
a mechanical precondition at each phase's first write, and a commit-ancestry backstop.

Hours later, a fresh adoption skipped the intake question round entirely and wrote
`docs/adoption-intake.md` out of the skill's own prose. Asked why, the run's own account is
the clearest statement of the failure this repository has on record:

> I read the skill instead of running it. I took Step 0's routing table, picked the route, and
> never executed the question round inside it. Worse: I read `intake.md`'s structure - the list
> of points and what each is for - and used it to write `docs/adoption-intake.md` with my own
> answers, rather than to ask.

Nothing refused that write, and the reason is measured rather than inferred. The guard was
wired nowhere the session could see it:

- `standard/.claude/settings.json` wires it - but that is the tree that *ships into* an adopted
  repository, and it binds there only after Step -1 lands it and the session restarts.
- The standard's own checkout carried `launch.json`, `serve.json` and `settings.local.json`
  under `.claude/`, no `settings.json` and no hooks at all.
- The user-level settings on the machine wire the other shipped guards and not this one.

`align-to-standards` says where it runs: "From a checkout of `repository-standards` - this
skill is never shipped to a client repo." So the repository that authors, ships, tests and
documents this guard is the one repository that never ran it, and the session it never ran in
is the adoption - the single run the whole mechanism exists for. ADR-059's three layers do not
reach it: Step -1 and the phase precondition land and check the guard in the *target*, hooks
bind from the session's own project directory, and a target's `.claude/settings.json` is never
read by a session rooted in the driving checkout. The ancestry backstop is after the fact and
fires only once the run commits into a repository it has also given a guard.

**Why it had never been wired is the part that decides the fix.** Unscoped, it cannot be. The
standard's own repository carries the same gated paths any adopter does - `PRODUCT.md`,
`docs/personas.md`, `backlog.md`, `docs/decision-records/**`, `specs/**/spec.md`, `AGENTS.md` -
and the only ledger under it is the shipped template, every row `pending` by design. Wiring the
guard here the way an adopter wires it refuses every ordinary write in the repository, which
ends the way ADR-054 already says it ends: a guard nobody can work under gets removed.

A second defect surfaced in the same reading. The guard resolved the ledger, and the
`git show HEAD:` check behind a committed answer, relative to the working directory. Its
rename check had already learned better - "asked in the right repository, which is not always
this one" - and the ledger lookup had not. A driving checkout holding answered rows would have
vouched for writes into a repository that answered nothing.

## Options considered

- **Restate that the question round is executed, not read.** The shape ADR-054 was written
  against, and the shape ADR-059 was written against again eight hours earlier. Rejected as a
  layer of its own; the prose in `intake.md` already says exactly this and was read as content.
- **Wire the guard in this repository the way an adopter wires it.** Rejected: every ordinary
  write here is to a gated path with a `pending` ledger behind it, so the first hour of use
  ends with the wiring deleted.
- **Let a repository declare the narrower scope for itself, through an environment variable.**
  The first shape this fix took, and rejected on reading the capability's own invariant: an
  adopted repository could set the same variable and exempt every write it makes, because its
  own writes land in its own tree. The tree's shape cannot be set from a settings file.
- **Give this repository its own answered ledger and adopt itself fully.** A real option and a
  larger question than this defect. Rejected here because the honest state for a question the
  mechanism never asked is not `human`, and writing `human` so that daily work passes is
  precisely the fabrication ADR-054 exists to catch.
- **Gate the question round on something other than an artifact - the phase boundary itself.**
  Rejected: no such event reaches a `PreToolUse` hook. `points.json` already names this blind
  spot for `adopt.continue` and `adopt.commit-plan`, and nothing here changes it.

## Decision

1. **The guard reads which side of an adoption it is on, from the tree's own shape.** A
   checkout that carries the shipped tree under `standard/` is one that drives adoptions; an
   adopter has that tree unpacked at its root and never matches. On the driving side the guard
   judges only writes whose owning work tree is not its own, and leaves the driving
   repository's tree to its own process. Deliberately not an environment variable: a switch
   would be an exemption any repository could set for itself - its own writes land in its own
   tree, so sparing those spares everything - and this capability's own invariant says no
   configuration adds an outcome. The shape decides *whose* writes are judged, never what
   happens to a judged one.
2. **This repository wires it,** in its own `.claude/settings.json`, with the same
   `Write|Edit|NotebookEdit|Bash` matcher and the same deny-on-failure fallback the shipped
   settings use, pointed at `standard/.claude/hooks/elicitation-guard.mjs`.
3. **The ledger is read in the tree that owns the write** - both the file and the committed row
   behind a settled repository-scoped point - mirroring what the rename check already does.
   A move that reaches two work trees at once has no single owner, so no ledger answers for it
   and it is refused: the segment rule these guards already apply to chained commands, applied
   across repositories.
4. **The guard's own test asserts all of it**: that the driving checkout wires the guard it
   ships, that a driving tree's own writes go through *and* that the identical write is
   refused in a tree without that shape, and that an answer committed over here settles nothing
   over there. It runs in `checks.yml`, so unwiring this fails a required check rather than going
   quiet.

## Consequences

- **The adoption run is covered from its first write.** Verified against the write that
  prompted this record: `docs/adoption-intake.md` in another repository, no question asked, is
  refused naming the point that is missing.
- **This repository's own work is untouched, and that escape cannot widen silently.** The test
  asserts the same write refused in a tree without the driving shape, so a rule that started
  waving through more than the driving checkout fails a case rather than passing quietly.
- **Both ways of running an adoption now behave the same.** Driven from this checkout, the
  guard covers the writes it makes into the target; run inside the target after Step -1, it
  covers that repository's own.
  Step -1 stays exactly as ADR-059 left it - the target needs its own guard for every session
  after the adoption, and this changes nothing about that.
- **A driving checkout is trusted about its own tree.** That is a real hole, named rather than
  papered over: an unasked artifact written *here* is not refused. It is accepted because this
  repository's writes are reviewed as its own work, under its own gates, and because the
  alternative is the unwired state this record exists to end.
- **A run that skips the questions and writes nothing gated is still not caught here.** Intake
  is a required artifact (ADR-042), so such a run meets the guard the moment it writes the
  intake record; a run that never writes it fails the artifact gate instead.

## Revisit when

- This repository gains its own honest provenance ledger - then the narrower judgement can
  shrink to the paths that are genuinely template-only, or go.
- A second checkout starts driving adoptions. The wiring assertion knows about this one only,
  and a new driver would be unguarded in exactly the way this record describes.
- A defect lands in the driving checkout's own tree that this waved through - that is the
  cost above coming due, and it argues for the self-adoption option rather than for a fourth
  restatement.

## Related

- [ADR-054](ADR-054-asking-is-a-mechanism-with-provenance-not-an-instruction.md) - the three
  layers this one extends, and the reason a guard that cannot be worked under is not a guard.
- [ADR-059](ADR-059-landing-the-guard-is-a-mechanism-too-not-only-an-instruction.md) - the
  bootstrap gap on the target's side; this is the same gap on the driver's side.
- [ADR-042](ADR-042-intake-is-a-required-artifact-not-a-performed-step.md) - why the skipped
  question round still has to meet a write.
- [ADR-020](ADR-020-intake-first-adoption.md) - intake runs before any route is chosen.
- `standard/SPEC.md` R28 - the rule the guard and the ledger checks enforce.
