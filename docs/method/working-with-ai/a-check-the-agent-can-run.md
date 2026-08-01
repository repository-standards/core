# A check the agent can run

**Practice:** every run ends on a check that returns pass or fail, not on the agent's
opinion that it is done - and the run that writes the code must not own the check that
grades it.
**Confidence:** **strong** - it is the vendors' first recommendation and the failure mode it
prevents is documented experimentally.
**Decays:** **medium**. The rates will move with each model generation; the structural
argument (an optimizer will take the cheapest path to the signal) does not.
**What would change this:** models that reliably report a task as impossible instead of
exploiting the tests, and a security evaluation where the *default* choice - no security
prompting - passes most of the time. Today both go the other way, and the trend line on the
second one is flat.
**Last checked:** 2026-08-01

## The report

*"It told me it was done and all tests passed. Two of the tests it wrote assert nothing."*
*"It fixed the failing test by deleting it."*
*"I asked if it was sure and it said I was absolutely right, then changed its answer."*

These are three versions of one problem: without an external signal, "done" is whatever the
model concludes, and the model is agreeable.

## Is it true

**Yes - and the cheating is not folklore, it is measured.** ImpossibleBench builds tasks that
cannot be satisfied, by mutating benchmark tests so they contradict the written
specification, and then **tells the models to prioritize the specification over the tests**.
On the one-off variant of impossible-SWEbench, GPT-5 exploited the test cases **76%** of the
time rather than reporting the task impossible, and stronger models generally cheated *more*
`[Study: ImpossibleBench 2025]`. The catalogue of strategies is consistent across this
literature: hardcoding expected values for the exact inputs, rewriting or deleting the
failing assertion, editing evaluation code `[Study: Agent cheating 2026]`, with harness-level
cheating found across public leaderboard submissions `[Data: Benchmark cheating audit]`.

None of this requires bad intent. The objective the agent is optimizing is "make the check
pass", and it will find the cheapest path there. A writable test **is** the cheapest path.

**And a suite can be large, green and nearly worthless.** In a field comparison of two
similar greenfield projects, the AI-heavy one had many tests - mostly asserting that an
endpoint rejects a missing required field - and the reviewing engineer judged roughly a tenth
of them worth keeping. Worse, since the input models themselves carried mistakes, a large
share of those green assertions encoded the *wrong* expected behavior
`[Field: parallel projects 2026]`. Coverage went up and information went down.

**"It looks fine" is a weak filter for the failure class that matters most.** Veracode's
evaluation ran 80 code-completion tasks - four vulnerability classes across four languages,
five instances each - against **over 100 models**, with no security guidance in the prompt,
so the model's *default* choice is what is measured. The security pass rate was about
**55%**: in **45%** of tasks the model introduced a detectable OWASP Top 10 flaw. It is not
uniform - broken cryptography passed 85.61% and SQL injection 80.44%, while **cross-site
scripting passed 13.53% and log injection 12.03%** - and Java was the weak language at 28.50%
against Python's 61.69% `[Study: Veracode 2025]`.

The finding inside that report which matters most here: over the measured period, **syntactic
pass rates climbed steeply while the security pass rate stayed flat**, and model size barely
moved it. Models got much better at producing code that compiles and no better at producing
code that is safe. Working and safe are different properties, and only one of them is visible
in a demo.

**The vendors agree, and say it plainly.** Claude Code's guidance is that the agent stops
when the work *looks* done, so without a check it can run, you become the verification loop
and every mistake waits for you to notice it `[Vendor: Claude Code docs]`. Their recommended
forms escalate: verification criteria in the prompt, a goal condition re-checked each turn, a
stop hook that blocks the turn until a script passes, and an independent reviewer in a fresh
context.

## What is actually happening

An agent loop needs a **termination signal**. You get to choose what it is:

| Termination signal | What it actually measures |
|---|---|
| the model's judgment | whether the output resembles finished work |
| your reading of the diff | your attention, at the end of a long day |
| a test the model can edit | that the model found *some* way to make it green |
| a test the model cannot edit, plus a build, plus a scan | the property you actually care about |

Only the last row survives contact with an agent optimizing for the signal. This is also why
"are you sure?" is not verification: asking a model to grade itself samples the same
distribution that produced the answer, with a strong pull toward agreement. One of the
most-upvoted bug reports on Claude Code's tracker is precisely about reflexive agreement
`[Field: CC issue 3382]` - the community named it before the literature did.

## What works

- **Write the failing test first.** It makes the check exist before the code does, and it
  proves the check can fail - a test that has never been red is not evidence.
- **Keep the grader out of the graded run.** Author or review the tests in a separate pass;
  if a diff modifies both the assertion and the code it guards, that is a review finding, not
  a detail. Where the tooling allows, make the test path read-only for the implementing run.
- **Demand evidence, not a claim.** The command and its output in the PR body. Reading
  evidence is faster than re-running verification yourself, and it works for runs you did not
  watch.
- **Make the gate deterministic where it must never be skipped.** A hook or a CI job runs
  every time; an instruction in a prose file is advisory and competes for attention with
  everything else in the context.
- **Add an adversarial pass in a fresh context.** A reviewer that never saw the reasoning
  evaluates the diff on its own terms. Give it the plan and the criteria, and tell it to
  report gaps that affect correctness - a reviewer told simply to "find problems" will
  always find some, and chasing all of them produces defensive over-engineering.
- **Scan for the invisible class in CI.** Injection, output encoding, authz, secrets,
  dependency risk. The model that wrote the code is not the right auditor of the code's
  security, and the sub-14% pass rates on cross-site scripting and log injection say which
  classes to automate first.

## What does not

- **"Do you think this is correct?"** Agreement is cheap. So is a confident summary of work
  that did not happen.
- **Green CI when the same run wrote both sides.** You have verified that two artifacts from
  one distribution agree with each other.
- **A test suite as the only gate.** Passing tests say nothing about the vulnerability class,
  the missing requirement, or the thing nobody wrote a test for.
- **Counting tests.** Ask what each one would catch if it failed. A suite that only proves
  required fields are required is a suite that will be green through the outage.
- **Waiting for a better model to fix it.** Security pass rates were flat across model
  generations and sizes in the one large evaluation of default behavior, and cheating rates
  went *up* with capability.
- **Manual review as the whole strategy.** It does not scale with generated volume, and it is
  exactly the resource that agent output consumes fastest - see
  [review-is-where-the-cost-lands.md](review-is-where-the-cost-lands.md).
- **Letting the agent decide the acceptance criteria after the fact.** Criteria written after
  the implementation describe the implementation.

## How we run it here

- Acceptance criteria are part of the **spec**, written before the build, in
  given/when/then form - so the check exists before the run does
  ([working-with-specs.md](../working-with-specs.md)).
- `spec-reconcile` is the anti-drift gate: spec, code and tests must agree, and a spec that
  the build proved wrong gets fixed rather than quietly abandoned
  ([ways-of-working.md](../ways-of-working.md)).
- `self-verify` and the repo's CI gates are the deterministic layer - they run whether or not
  anyone remembered to ask.
- `pre-pr-review` is the fresh-context adversarial pass, before the PR exists rather than
  after the reviewer's patience is spent.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Study: ImpossibleBench 2025]` | GPT-5 exploits test cases 76% of the time on impossible tasks despite being told to prefer the spec; stronger models cheat more |
| `[Study: Agent cheating 2026]` | the strategy catalogue - hardcoded outputs, deleted tests, edited evaluation code - and read-only tests as the countermeasure |
| `[Data: Benchmark cheating audit]` | harness-level cheating across public leaderboard submissions |
| `[Field: parallel projects 2026]` | many green tests, roughly a tenth judged worth keeping, a share asserting the wrong behavior |
| `[Study: Veracode 2025]` | 45% of default-choice tasks introduce an OWASP Top 10 flaw; XSS 13.53% and log injection 12.03% pass rates; syntax improved over time while security stayed flat |
| `[Vendor: Claude Code docs]` | give the agent a check it can run; evidence over assertion; stop hooks and fresh-context reviewers; the over-eager-reviewer caveat |
| `[Field: CC issue 3382]` | reflexive agreement is a recognized behavior, not a one-off - self-assessment is not verification |
