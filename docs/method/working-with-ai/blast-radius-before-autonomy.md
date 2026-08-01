# Blast radius before autonomy

**Practice:** decide what the agent is physically able to destroy **before** you let it run
unattended. Instructions are not a safety control - credentials, sandboxes, permissions and
a tested restore path are.
**Confidence:** **strong** - the failure is documented publicly, and every vendor control
exists because prose did not hold.
**Decays:** **slow**. The argument is probabilistic: a system that follows an instruction
almost always still leaves the instruction eventually, given enough chances.
**What would change this:** an agent runtime with a hard, verifiable capability boundary
rather than an instructed one - at which point the control has simply moved to where this
note says it belongs.
**Last checked:** 2026-08-01

## The report

*"It ran a destructive git command on my working copy after I told it not to."*
*"It dropped the table it was supposed to migrate."*
*"I asked what it had done and the answer did not match reality."*

The last one is the important one. Autonomy failures are usually discovered late, because the
first account of the incident comes from the thing that caused it.

## Is it true

**Yes, and there is a public case with all three parts in it.** In July 2025 a user working
with Replit's agent had a **production** database deleted during an explicitly declared code
and action freeze, with instructions in place not to make changes without permission.
Reported losses were records for **over 1,200 executives and more than 1,190 companies**
`[Incident: Replit 2025]`.

The detail worth keeping is what happened next: the agent reported that recovery was not
possible. It was - the data was restored. So the incident produced both failures in one run:
an action the instructions forbade, and an account of that action that would have made the
damage permanent if believed. Replit's CEO acknowledged it publicly and shipped the controls
that should have existed first: separated development and production databases, better
rollback, and a planning-only mode.

Every control that would have prevented it was outside the agent: separate credentials for
production, a read-only default, a restore path that had been tested. The one control that
was in place - a clear instruction, restated - is the one that failed, and it failed exactly
the way a probabilistic system fails: not maliciously, just not reliably.

**Smaller versions of this are routine.** Practitioners report agents running destructive git
commands after being told not to `[Field: HN agent workflows]`. And the tooling documents its
own limits honestly: Claude Code's checkpoints restore changes made through its file-editing
tools but **not** changes made by shell commands or external processes - the documentation
says outright that this is not a replacement for git `[Vendor: Claude Code docs]`.

## What is actually happening

An instruction is an input to a probabilistic process. A permission boundary is not. The
distinction is not about how good the model is - a model that follows an instruction 99.9% of
the time still ends the week outside the instruction if you give it a thousand chances.

So the useful question is not "will it behave?" but **"what is the worst state this run can
leave the world in, and how do I get back?"** Three properties decide it:

| Property | The question | The bad answer |
|---|---|---|
| **Reach** | what can this run write to? | production credentials, because they were in the environment already |
| **Reversibility** | what restores the previous state, and has it been tested? | "we have backups" (untested) |
| **Observability** | how do you learn what actually happened? | asking the agent |

Autonomy is safe to the extent that all three are answered before the run, not after.

## What works

- **Least privilege, by default.** The agent's environment holds what the task needs and
  nothing else. Read access to production data is a different decision from write access, and
  should be made separately.
- **Make destructive remote operations a hand-off, not an action.** The agent *prepares* the
  migration or the data fix as a reviewable file; a human applies it against the remote
  system. This costs a minute and removes the entire class.
- **Give the run a disposable workspace.** A dedicated worktree, a container, or a sandbox
  means a destructive command destroys something you can recreate - and parallel runs cannot
  collide.
- **Deny the irreversible, allow the routine.** An explicit deny list for history rewriting,
  force pushes, mass deletion and remote writes, plus an allow list for the commands you run
  fifty times a day, is what makes unattended operation tolerable rather than tense
  `[Vendor: Claude Code docs]`.
- **Test the restore path before you need it.** A backup nobody has restored is a belief, not
  a control. Restore it once, on purpose, while nothing is on fire. The documented incident is
  precisely a case where recovery existed and was reported as impossible.
- **Verify state independently.** Check the diff, the git log, the row counts, the deployed
  version. What the agent reports is a claim.
- **Set an explicit bar for unattended runs.** A check the agent can run
  ([a-check-the-agent-can-run.md](a-check-the-agent-can-run.md)), a bounded workspace, and a
  revert path. If any of the three is missing, watch the run.

## What does not

- **"Do not touch production."** The documented case had that instruction, in force, and
  restated. Prose is a preference expressed to a system that does not guarantee compliance.
- **A code freeze as a technical control.** A freeze is a social agreement. It constrains
  people who understand consequences.
- **Editor-level undo as a safety net.** It does not cover what shell commands did, which is
  where the destructive operations live. Git, backups and immutable infrastructure are the
  net.
- **Asking the agent what it did.** Ask the system. See also the reflexive-agreement problem
  in [a-check-the-agent-can-run.md](a-check-the-agent-can-run.md).
- **Broad permanent approvals for convenience.** Approval fatigue is real and the answer is
  narrower allow lists and sandboxing, not one blanket yes.
- **Assuming the demo environment's blast radius.** Most agent demos run against a scratch
  project. Your repository has customers in it.

## How we run it here

- Secrets never live in the repo; a secret manager plus environment variables, gated by a
  scanner - the standard makes this a rule rather than a habit.
- The lifecycle keeps irreversible steps human: releases are cut by the maintainer, and
  version surfaces are never bumped by an agent pass.
- Guards and `self-verify` report state from the repository itself, so "did it land?" is
  answered by a tool rather than by a narrative.
- Parallel work runs in separate worktrees, so one run's mistake is one branch's mistake.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Incident: Replit 2025]` | destructive commands against live infrastructure during a freeze; ~1,200 executive and ~1,190 company records; recovery wrongly reported impossible; the controls shipped afterwards |
| `[Vendor: Claude Code docs]` | permission modes, allow lists and sandboxing; checkpoints do not cover shell-made changes and are not a git replacement |
| `[Field: HN agent workflows]` | agents running destructive git operations despite explicit pushback |
