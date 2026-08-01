# The cleanup comes later

**Practice:** merge is not where the cost is settled. Budget for the maintenance tail, and
refuse to merge code that nobody on the team can explain - un-owned code is the expensive
kind, whoever or whatever wrote it.
**Confidence:** **mixed** - the practitioner testimony is loud, consistent and independent,
but it is testimony from a self-selecting sample; the code-level measurements point the same
way without proving the causal chain.
**Decays:** **slow**. The maintenance tail is an economic and organizational fact; a better
model shortens the writing, not the owning.
**What would change this:** the consolidation measures recovering - refactored share of
changed lines and long-term maintenance of older code turning back up while volume stays
high.
**Last checked:** 2026-08-01

## The report

The clearest signal is not a complaint about a tool, it is a change in what work exists. In
August 2025 a freelance engineer of about eight years described his inbound shifting from
building systems to repairing AI-built ones; the thread drew about 4,300 points and 473
comments `[Field: slop cleanup 2025]`. Eight months later a consultant of about ten years
described the same shift independently `[Field: repair calls 2026]`.

The complaints inside those threads are specific and repeat: the happy path works, the
structure has no discernible intent, common wheels are reinvented, and nobody currently on
the project can explain why anything is where it is.

## Is it true

**The testimony is real and consistent. Read it for what it is.** People hired to fix broken
software see broken software - that is their sample, and it is not the population. The honest
claim is not "AI produces unmaintainable code"; it is that **a maintenance market appeared
where there was not one before**, quickly, and the people in it describe the same failure
shape.

**The measurements are less ambiguous than the testimony.** Across 623 million analyzed
changes, the share of changed lines that is *moved* - the signature of refactoring rather
than adding - fell from 21% in 2022 to 13% in 2023 to **3.8% in 2026**; block duplication
rose from 40.3 to **73.0 duplicated lines per million changed** (+81%); and the share of
work going into **long-term maintenance of older code fell from 1.7% to 0.46%, a 74% drop**
`[Data: GitClear 2026]`. The earlier dataset shows the same turn: copy/paste exceeded moved
code for the first time on record `[Data: GitClear 2025]`. Whatever is causing it, the
industry stopped going back to old code at roughly the moment it started generating much more
new code.

**One report comes closer to a controlled comparison than the rest.** An engineer described
two greenfield projects of the same kind, in the same language, built at the same time - one
roughly 90% AI-generated, one not - and listed the differences in the AI-generated one
`[Field: parallel projects 2026]`:

- about 80% of the input models carried nullability and shape mistakes;
- there were many tests, mostly asserting trivial validation, and by their reading only about
  a tenth were worth having - the rest asserting the wrong behavior confidently;
- **comment density was inverted**: more comments than code around simple CRUD, almost none
  in the dense mathematical parts (see
  [comments-that-earn-their-tokens.md](comments-that-earn-their-tokens.md));
- a common utility was reimplemented where a well-known library existed;
- defensive checks everywhere that tracing the flow would have shown to be unnecessary;
- no narrative: no reason why a given piece of logic lives where it lives.

It is one engineer's read of one pair of projects, and it says so. It is also the most
concrete comparison in the public record, and every item on it has an independent echo -
the duplication and refactoring numbers above, the "almost right" frustration in the survey
data `[Survey: Stack Overflow 2025]`, and the negative stability relationship in DORA's
`[Survey: DORA 2025]`.

## What is actually happening

Two costs are being confused with each other.

| | Paid at | Visible to |
|---|---|---|
| **Generation** | the moment | the person who feels fast |
| **Review** | the same week | the reviewer ([review-is-where-the-cost-lands.md](review-is-where-the-cost-lands.md)) |
| **Maintenance** | the first change request, months later | whoever is on the team then |

Agents optimize for a plausible working result now. Nothing in that objective rewards
consolidation, a coherent module boundary, or deleting the thing that duplicates something
else - and the falling refactor and legacy-maintenance shares say this is exactly what does
not happen. The codebase keeps growing where a human would have stopped and reorganized.

The deeper problem is ownership. A team's real asset is not the code, it is the shared mental
model of the code. Generated code that no one read closely never produced that model, so the
first non-trivial change starts with an archaeology session. That is why "the happy path
works" is faint praise: the happy path is the part that needed no model.

## What works

- **The explanation bar.** Nothing merges unless someone on the team can explain what it does
  and why it is shaped that way, without opening a chat window. This is one rule and it kills
  most of the tail.
- **Keep the intent, not just the code.** A spec that survives the session is what a future
  maintainer reads instead of reverse-engineering. It is also what makes a regeneration safe:
  you can throw the implementation away and keep the meaning.
- **Commission consolidation explicitly.** Agents add; they do not tidy unasked. A periodic
  "find and remove duplication introduced in the last N changes" pass is real work that has to
  be scheduled, because nothing else will trigger it - the measured refactor share is what
  happens when nobody schedules it.
- **Check for an existing solution before accepting a new one.** Reinvented utilities are a
  recognizable, cheap-to-catch class in review.
- **Judge tests by what they would catch.** A large green suite that asserts trivia is worse
  than a small one, because it buys confidence it has not earned.
- **Consider regenerating rather than patching** when a module is un-owned, small and
  specified. Patching code nobody understands is how the archaeology gets inherited.

## What does not

- **Treating merge as the finish line.** The metric that matters is what the change costs over
  its life, and the collapse in long-term maintenance of older code is the early warning.
- **"We will refactor it later."** The tool that produced the mess does not refactor
  spontaneously, and the people who could are the ones you saved time from.
- **Volume-based confidence.** Many files, many tests and many comments are all cheap now, so
  none of them is evidence of anything.
- **Assuming the maintenance cost lands on the person who created it.** It usually lands on
  the next person, which is precisely why it needs a rule rather than good intentions.

## How we run it here

- The **spec is the durable artifact** and stays true after merge, so intent outlives the
  session that produced the code ([working-with-specs.md](../working-with-specs.md)).
- `spec-reconcile` refuses the silent divergence that makes archaeology necessary later.
- Decisions are recorded, so "why is it shaped this way" has an answer that is not folklore
  ([taxonomy.md](../taxonomy.md)).
- One capability per change keeps the unit of ownership small enough that someone can
  actually hold it.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Field: slop cleanup 2025]` | a freelancer's inbound shifting toward repairing AI-built codebases (2025-08-02, ~4,300 points) |
| `[Field: repair calls 2026]` | the same shift described independently by a different consultant eight months later |
| `[Data: GitClear 2026]` | moved code down to 3.8%, block duplication +81%, long-term maintenance of older code down 74% |
| `[Data: GitClear 2025]` | copy/paste exceeding moved code for the first time on record |
| `[Field: parallel projects 2026]` | inverted comment density, low-value tests, reinvented utilities, no structural intent |
| `[Survey: Stack Overflow 2025]`, `[Survey: DORA 2025]` | the perceived "almost right" tax and the negative stability relationship |
