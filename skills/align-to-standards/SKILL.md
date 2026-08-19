---
name: align-to-standards
description: The single entry point for moving any repo onto the standard. Opens with an intake (step 0) - measure the repo's state, then one short question round (intent, technology + Layer 2 consent, appetite, plan-only vs execute) - then routes by target state - an empty repo to the greenfield phase, an existing unpinned repo to assessment-first onboarding, a pinned repo to update-to-latest or a stack add - and reconciles the repo against the shipped tree in payoff-ordered waves until drift 0. Never blind-copy; reconcile - copy-class artifacts land verbatim, merge/fill-class are adapted (the manifest's adapt classes).
---

# align-to-standards

One entry point for the whole transition. Intake first, then route.

## Say where you are during the run

The shipped `standard/AGENTS.md` section "Say where you are, every minute or two" binds
this run in full, from the first intake read to the last wave close - including the routes
that install nothing, assessment-only and the check-up. Nothing about being the adopter
rather than the adopted repo exempts you from it.

It bites hardest here because this skill's quietest stretches are its longest: the
assessment reads a whole repo across eight passes, a wave classifies every manifest entry,
and the first thing to reach the chat is the finished report. Twenty minutes of empty
screen is indistinguishable from a hung run, and the user's only available move is to
interrupt the one pass that was working. Adoption runs get abandoned there, before anything
has actually gone wrong.

So name the pass you are on as you go ("reading the CI config and workflows, pass 5 of 8"),
on every route, greenfield through stack add. The report is not the substitute: the
health report, the counted plan and the wave list still land in full at their own steps,
and a progress line never carries a finding before the pass that found it is done.

## Step 0 - Intake (measure, then ask)

Every run starts here, before any phase and before any route is chosen. Read
[`intake.md`](intake.md) now. It carries the measurement pass, the signals a repo has
already written down about itself - lifecycle, governance config, its own decision
process, its policy on agents - and the question round, including which of those
questions are not this skill's to answer.

## Route by target state

| Target repo | Path |
|---|---|
| **EMPTY or brand new** | Follow the [greenfield phase](greenfield.md), then the align waves below. |
| **EXISTS, no `.standards-version`** | Assessment-first onboarding per the [brownfield phase](onboard.md), then the align waves below. |
| **HAS `.standards-version`, wants a check-up** | Run the [brownfield phase](onboard.md)'s assessment against the aligned repo: `self-verify` for the mechanical number, then the passes that machines cannot score - do the specs still describe what the code does, were the decisions since the last visit recorded, is the backlog still true. Deliver the health report and the counted list, same as a newcomer gets. **Do not route this to `/update-to-latest`** - drift happens without the standard moving, and a version bump answers a different question. |
| **HAS `.standards-version`, wants the pin moved** | Hand off to `/update-to-latest` - the repo is already on the standard; this skill gets a repo *to* the pin, not past it. |
| **HAS `.standards-version`, wants a technology stack added** | Run the **Technology best practices** step below against the stack's `stack.manifest.json`; skip the Layer 1 waves - the pin already covers them. |

`greenfield.md`, `onboard.md` and `stack.md` are phase files of this skill - they
run inside it, never as separate skills.

**Where this runs.** From a checkout of `repository-standards` - this skill is never
shipped to a client repo. The tree you reconcile the target against is `standard/` in
this checkout: the real-repo files a compliant repo carries (`AGENTS.md`,
`.claude/skills/`, `.github/`, `docs/`, `specs/`, `scripts/`, `SPEC.md`, ...). A client
can also pull that tree directly:

```
npx degit repository-standards/core/standard
```

## Steps

Read [`steps.md`](steps.md) once the route above is settled and you are reconciling the
target against the shipped tree. It carries the payoff-ordered waves, what each one
lands, and how copy-class and merge-class artifacts differ.

## Technology best practices (Layer 2)

Read [`layer2.md`](layer2.md) when the intake named a technology **and** the user
consented to Layer 2, or when the route is "add a technology stack". A repo staying on
Layer 1 never needs it, so loading it unconditionally spends the window on a phase that
will not run.

## Re-entrant: this is a process, not a pass

For a brownfield repo one PR never reaches drift 0 - and it should not try. Align is a
process the user **re-enters until the repo is compliant**, and every entry is guided:

- **Resume from measurement, not memory.** Each run starts by re-reading
  `.standards-version` + `standard.manifest.json` and running `self-verify`: what is
  already done stays done; the open delta is the work list. Never re-propose what exists.
- **Propose the next wave, ordered by payoff - inside the gate order.** From the open
  delta, pick the few items with the biggest win first - typically: `docs/adoption-intake.md`
  itself (R26 - nothing else in this ordering is trustworthy if the intake it was read
  from was never recorded), then the agent entry point + taxonomy, then the intake
  gates' material (PRODUCT/personas - nothing downstream lands before them), then
  missing foundational decisions (ADRs), then folder structure, then guards. Say
  *why this wave, why now*, sized to land in one PR.
- **The delta is measured, not curated.** Ordering a wave is judgment; **what is in the
  plan at all is not.** The open list comes from the measurement - `self-verify` against
  the manifest once the repo is pinned, the assessment before that - and an entry does not
  leave it because this run classified it as belonging to the standard's own repo rather
  than to this one. The ship boundary is drawn already and is not the agent's to redraw:
  transition skills do not ship and this skill is the one that is left (ADR-009);
  everything under `standard/.claude/skills` does, `record-run` included - a lifecycle
  skill by ADR-045, not this repo's own tooling.
- **Hand-hold, do not dump.** For each wave item, guide the user through it (elicit,
  propose, record) rather than emitting a pile of TODOs.
- **Deferrals are recorded, not dropped - and the record is the number.** A deferred item
  stays open drift the next run re-reads from measurement, so every open entry is either in
  a wave or named to the user as still open. A third state - "consciously skipped", living
  only in this session's prose - is how a dropped item goes invisible the moment the session
  ends. Taking something out of the count for good is a different act with a different cost:
  a manifest exception the user approves, carrying its reason and lowering the adoption
  percentage rather than hiding the gap (R17).
- **Repeat until drift 0.** Close each wave with `self-verify`; the number falling is the
  progress bar. A multi-year brownfield may take many waves - that is the designed shape,
  not a failure. Every wave close includes the upstream review (step 8), the `record-run`
  offer (step 9) and the adoption ping (step 10) - friction is reported, the wave is
  recorded and the count is real while all three are fresh, not archaeologized at the end.

## Not this

- Not a blind overwrite (that recreates divergence) - adapt to the stack.
- Not company-specific values (tokens, tenant ids) - those stay as variables / overlay.


## Questions this phase must ask

Declared in `standard/.claude/elicitation/points.json`; the shape and the provenance states are in
`standard/.claude/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

**These are the floor, not the list.** They are the questions that can be *enforced* - the hook
refuses a write for a point somebody declared, and it cannot refuse one nobody wrote down. This
repository is not one of the repositories the list was written against, so ask the questions it
actually raises: a tracker nobody mentioned, a build step with two owners, a directory whose name
means something local. Two rules bind those questions exactly as they bind the declared ones.

**Offer the recommended answer first and label it as the recommended one** - both, not either.
Where `AskUserQuestion` renders a recommendation, it goes on that first option and on nothing
else; an option list in the right order with the label on the third entry is the same failure
with extra steps.

**The recommended answer is the one that converges on the standard** - its layout, its shape, all
of it rather than the parts that cost least - and where that is not the axis, the answer a person
gives now rather than defers. Keeping what the repository already does stays on the list, because
a standard imposed without consent gets reverted; it is not what leads. Measured on a live run on
2026-08-19: every question was asked properly and four of five recommendations pointed at the
least convergent answer on offer, including *keep your own layout and map the standard onto it*.
Most people take the recommendation, so that is a slower version of not asking.

**Record every question you invented** in the ledger's own section, `## Questions this run asked
that no point declares` - what you asked, which answer led, what was chosen. That table is where
the point list grows from: `adopt.tracker` is in it because one live adoption invented the
question and nothing would have remembered it otherwise.

### `[adopt.continue]` Checkpoint between phases

Fires **at the end of every phase, before the next one writes anything**.

Call `AskUserQuestion` with the header `[adopt.continue]` and the question:

> Phase finished. Continue to the next one, stop here, or hand the rest back to you?

Options, in order: **continue** / **stop here** / **hand it back**

A guided adoption that runs to the end unprompted and stops at a summary is not guided. This is also where the person can redirect before the next phase writes anything, which is the only cheap moment to do it.

Records to `docs/adoption-provenance.md`: the `adopt.continue` row takes the state, who answered, the date, and `the run record` as where the answer landed.
