---
name: record-run
description: Use at the end of an align-to-standards run, success or failure - records the session as validation evidence for the human-prompting corpus (prompts.md + a scored runs/*.json file). One shape only, the full run fully anonymised, sent under the intake's adopt.evidence yes - the skill asks nothing at the close.
---

# record-run

Every number the human-prompting corpus reports today was produced by people who wrote the
standard - its own README names this as the corpus's weakest point. The only fix is real
adopters' real sessions, and nobody is going to reproduce a run by hand afterward to send it
in. So this skill does not ask for that: it assembles what already happened, in the tool the
person just used, under the one yes the intake round already took. A "no" at intake costs
the user nothing - nothing is assembled and nothing is sent. That asymmetry is the entire
design.

It is a transition skill, run from a checkout of this repository like `align-to-standards`
itself - never shipped into the adopted repo's `.claude/skills/` (ADR-045, as corrected).

**A failed or aborted run is more valuable evidence than a clean one, and this must be said
out loud** - a skill that only feels natural to run after success will only ever collect
successes, and the corpus already knows what those look like.

## One shape of record

A contributed run is the full run, fully anonymised, or it is nothing. There is no smaller
version to choose instead, because a record that cannot be checked is not evidence: every
finding this method has produced so far needed the agent's own text to explain, and the two
external records that arrived without it (`anon-r3k`, `anon-x8v`) carry verdicts nobody can
replay. A smaller yes that produces such a record is not worth having. What goes in:

- the literal user turns, every one;
- the agent's own text responses, verbatim (`said_verbatim: true` on each agent turn);
- which tools ran and in what order - names only, never their raw input or output;
- the per-turn scoring and the result line (final `self-verify` number, files touched - no
  names).

And nothing that identifies the repository: no slug, no owner, no paths, no hostnames, no
usernames. The record carries an opaque code instead, and that code is **not derived from the
repository's name** - a short hash of the name is still the name to anybody who can guess at
it.

## Steps

1. **When this fires.** At the close of an `align-to-standards` session (wired in at that
   skill's own step 8) - success, partial, or abandoned mid-run all count. It also runs by
   hand against any past session that used a shipped skill. Read the `adopt.evidence` answer
   from the **Evidence** line of `docs/adoption-intake.md`, never from memory. **send
   nothing** means this skill records nothing - say that you are skipping it, rather than
   skipping it quietly, and do not ask again. It also records nothing when the session never
   left Step 0 (nothing happened yet to score) or the intake named a dry run or
   assessment-only; say so in the same way. The run record is gated by that same point, and
   the guard reads the answer from the transcript of the session doing the writing: in the
   session that ran the intake it is already there, and a by-hand run in a later session asks
   `[adopt.evidence]` once, the intake's own wording, before it writes.

2. **Assemble.** Walk this session's turns in order and pull out every literal thing the user
   typed and every text response the agent gave. For each user turn, check whether it already
   has a row in `docs/validation/human-prompting/prompts.md` (same wording, allowing for typos
   and language) - unmatched ones are new rows this run is proposing, `source: reported`.
   Score every turn against the three-flag method already documented in
   `docs/validation/human-prompting/README.md` (`asked` / `checked` / `suggested`, plus a
   verdict and one line of evidence) - the same discipline a hand-submitted report gets,
   applied to the session that just ran. List the tools that ran, in order, as
   `tools_in_order` on each observation.

3. **Scrub before assembling further, not after.** Replace this session's own machine paths,
   the user's login, hostnames and IP addresses. Replace the repository's name, owner and
   slug with the opaque code wherever they occur - in `target` fields, in `$about`, in the
   result line. **Drop raw tool input and output entirely** - file contents, command output,
   anything a tool read or wrote - the same thing
   `docs/validation/human-prompting/reporting.md` already refuses to forward from a raw Claude
   Code transcript, and for the same reason: a tool result can carry secrets, customer data or
   code that never should have left the session, and no pattern match here is a substitute for
   not sending it. This is a pass over known shapes, not a guarantee: a client's name sitting
   inside a sentence the user typed, or inside a reply the agent wrote, needs a human read,
   and the pull request step 4 opens is where the person gets one - theirs to edit before
   anyone else reads it.

4. **Show it once, then send. No question.** Print the assembled `prompts.md` rows and the
   `runs/*.json` content in the session, whole, so the person sees what leaves - a courtesy,
   not a gate. Then open the pull request from the user's own GitHub account. The pull request
   itself is the review: it opens from their fork, under their name, and they can edit it or
   close it before anyone upstream reads it. That is why no review step sits in front of the
   send, and why consent is not re-asked here - it was given once at intake and governs the
   whole run (ADR-061), never re-asked per item.

5. **Where it goes.** A pull request to `repository-standards/core` adding the new
   `prompts.md` row(s) and the `docs/validation/human-prompting/runs/<date>-<code>.json` file -
   the same destination `reporting.md` already names for a hand-written report. Without a
   GitHub account the run can push from, an issue carrying the same assembled content is an
   equivalent path (`reporting.md` already allows this) and can be edited or closed by its
   author the same way.

6. **Name the commit and the pull request, and name them the same way every time.** One run
   is one commit and one pull request, both carrying this subject:

   ```
   feat(real-adoption): <code>, <stack> - what the run showed
   ```

   - `feat(real-adoption): anon-9q2, Node/TS - drift 14 to 0, three capability specs written from the code`
   - `feat(real-adoption): anon-4f2, Rust/Cargo - abandoned at intake, the registry missed and the honest-miss path never fired`

   This is prescribed rather than left to taste because the log is read as evidence and every
   agent that has contributed so far invented its own shape - the same class of contribution
   has arrived as `docs(validation)`, `feat(human-prompting)` and `feat(validation)`, which
   means nobody can count adoptions without opening files. The outcome half is not optional
   and an abandoned run states that it was abandoned: a subject line that only ever reports
   success rebuilds, one commit at a time, the bias this whole skill exists to correct.

   **The identity half is always the opaque code, and this is the part to get right.** The
   subject line is the one place step 3's scrub can be quietly undone - an assembled JSON
   file can still be edited or dropped, a subject in a merged history cannot. Stack and
   outcome carry, since neither identifies anyone.

   `real-adoption` is a claim about whose session it was, and it is read, not asked: the
   pull request opens from the adopter's own account, so the scope follows the author. A run
   a maintainer of this repository drove keeps the scope those commits already use
   (`validation`). Whether a person answered the questions or the agent answered them for
   itself is read from the record's own agent turns, which the one shape above always
   carries. The corpus's stated weakness is that its numbers come from the people who wrote
   the standard; a log that cannot tell the two apart reproduces that weakness in the one
   place everybody trusts.

## What this is not

- Not a substitute for `reporting.md` - a user who wants to write the report by hand, or
  found something this skill did not run for, still sends it exactly as that page describes.
- Not a menu. There is no prompts-only record, no named record and no held-for-review record:
  the intake yes sends the full anonymised run, the intake no sends nothing, and the pull
  request is where a second look happens.
- Not a question. This skill asks nothing at the close: consent is `adopt.evidence` at intake,
  whose run it is reads off the pull request author, and the guard holds the run record to
  that same intake answer.
- Not a new artifact type - the destination is the human-prompting corpus that already
  exists (`prompts.md`, `runs/`), scored by the method it already documents.

