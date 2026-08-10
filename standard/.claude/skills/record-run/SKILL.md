---
name: record-run
description: Use at the end of an align-to-standards run, success or failure - offers to record the session as validation evidence for the human-prompting corpus (prompts.md + a scored runs/*.json file), at one of two consent levels, never sent without a per-item yes.
---

# record-run

Every number the human-prompting corpus reports today was produced by people who wrote the
standard - its own README names this as the corpus's weakest point. The only fix is real
adopters' real sessions, and nobody is going to reproduce a run by hand afterward to send it
in. So this skill does not ask for that: it assembles what already happened, in the tool the
person just used, and asks for one yes or no. A "no" costs the user nothing - the assembled
file stays local and nothing is sent. That asymmetry is the entire design.

Like every other lifecycle skill, it ships into the adopted repo and runs there: the trigger
it serves - the close of an align session - fires wherever that session runs, which is the
repo being aligned and not the standards repo (ADR-045). It is not that repo's own tooling,
and an align plan does not get to drop it on that reading.

**A failed or aborted run is more valuable evidence than a clean one, and this must be said
out loud before anything is asked** - a skill that only feels natural to offer after success
will only ever collect successes, and the corpus already knows what those look like.

## Steps

1. **When this fires.** At the close of an `align-to-standards` session (wired in at that
   skill's own step 9) - success, partial, or abandoned mid-run all count. It also runs by
   hand against any past session that used a shipped skill. It does **not** fire, or asks
   before assembling anything, when: the session never left Step 0 (nothing happened yet to
   score); the intake named a dry run or assessment-only with nothing the user intends to
   send anywhere; the user has said the repo is under NDA or otherwise cannot be named at all.

2. **Assemble first, ask nothing yet.** Walk this session's turns in order and pull out every
   literal thing the user typed. For each, check whether it already has a row in
   `docs/validation/human-prompting/prompts.md` (same wording, allowing for typos and
   language) - unmatched ones are new rows this run is proposing, `source: reported`. Score
   every turn against the three-flag method already documented in
   `docs/validation/human-prompting/README.md` (`asked` / `checked` / `suggested`, plus a
   verdict and one line of evidence) - the same discipline a hand-submitted report gets,
   applied to the session that just ran.

3. **Scrub before assembling further, not after.** Replace this session's own machine paths,
   the user's login, hostnames and IP addresses - the repo is named by its slug (`/git/<repo>`
   in prose), never by where it sits on disk. **Drop raw tool input and output entirely** -
   file contents, command output, anything a tool read or wrote - the same thing
   `docs/validation/human-prompting/reporting.md` already refuses to forward from a raw Claude
   Code transcript, and for the same reason: a tool result can carry secrets, customer data or
   code that never should have left the session, and no pattern match here is a substitute for
   not sending it. This is a pass over known shapes, not a guarantee: a client's name sitting
   inside a sentence the user typed needs the human read in step 5, the same limit
   `reporting.md` already states for a hand-written report.

4. **Two levels, and the user picks, or neither:**
   - **Level 1 - prompts only.** The literal user turns and nothing else: no agent text, no
     tool activity, no repo name, no paths. Plus three yes/no answers for the whole run (did it
     ask before acting, did it check existing state, did it name a next step) and one result
     line (final `self-verify` number, files touched - no names). Grows the prompt corpus and
     shows that something went right or wrong; cannot show *why*, and nobody can check the
     verdict against it.
   - **Level 2 - the full run.** Everything in Level 1, plus the agent's own text responses
     verbatim, **which tools ran and in what order** (names only, never their raw input or
     output - step 3's drop applies at every level, Level 2 included), and the repo slug.
     Every finding this method has produced so far required the agent's own text to explain -
     Level 1 alone would have found none of them. Say this difference to the user plainly; it
     is the reason to offer Level 2 at all, not a hidden upsell.

   Offering only "send everything or nothing" gets nothing, most of the time - most people
   will not send a transcript that carries their repo's structure and internal names. Level 1
   exists because a smaller yes beats a large no.

5. **Show the exact file before anything is sent.** Open the assembled `prompts.md` rows
   and/or `runs/*.json` content for the user to read - not a description of what would be in
   it. Let them edit or delete a row or a turn before answering the consent question; nothing
   goes out that they did not have the chance to change.

6. **Ask consent, per item, the same pattern as `ADR-021`.** A ready title and body, one
   yes/no per item, never automatic. No consent on an item means it stays out - the assembled
   file(s) remain wherever the user chooses (their own repo, a local scratch file), never
   silently discarded, never sent regardless.

7. **Where it goes, on yes.** A pull request to `repository-standards/core` adding the new
   `prompts.md` row(s) and the `docs/validation/human-prompting/runs/<date>-<slug>.json` file -
   the same destination `reporting.md` already names for a hand-written report. Without write
   access, an issue carrying the same assembled content is an equivalent path (`reporting.md`
   already allows this); do not treat write access as a gate on contributing.

8. **Name the commit and the pull request, and name them the same way every time.** One run
   is one commit and one pull request, both carrying this subject:

   ```
   feat(real-adoption): <repo slug or code>, <stack> - what the run showed
   ```

   - `feat(real-adoption): hagopj13/node-express-boilerplate, Node/TS - drift 14 to 0, three capability specs written from the code`
   - `feat(real-adoption): anon-4f2, Rust/Cargo - abandoned at intake, the registry missed and the honest-miss path never fired`

   This is prescribed rather than left to taste because the log is read as evidence and every
   agent that has contributed so far invented its own shape - the same class of contribution
   has arrived as `docs(validation)`, `feat(human-prompting)` and `feat(validation)`, which
   means nobody can count adoptions without opening files. The outcome half is not optional
   and an abandoned run states that it was abandoned: a subject line that only ever reports
   success rebuilds, one commit at a time, the bias this whole skill exists to correct.

   **The identity half is bound to the consent level the user picked, and this is the part to
   get right.** The subject line is the one place step 3's scrub can be quietly undone - an
   assembled JSON file can still be edited or dropped, a subject in a merged history cannot.
   Level 2 named the repository, so its slug goes in. Level 1 did not, so it gets an opaque
   code that is **not derived from the repository's name**: a short hash of the name is still
   the name to anybody who can guess at it. Stack and outcome carry at both levels, since
   neither identifies anyone.

   `real-adoption` is a claim about whose session it was. A run this project drove itself is
   not one, and keeps the scope those commits already use (`validation`). The corpus's stated
   weakness is that its numbers come from the people who wrote the standard; a log that cannot
   tell the two apart reproduces that weakness in the one place everybody trusts.

## What this is not

- Not a substitute for `reporting.md` - a user who wants to write the report by hand, or
  found something this skill did not run for, still sends it exactly as that page describes.
- Not automatic upstream delivery under any circumstance - consent is per run and per item,
  never inferred from a prior yes.
- Not a new artifact type - the destination is the human-prompting corpus that already
  exists (`prompts.md`, `runs/`), scored by the method it already documents.
