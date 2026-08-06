# Repo assessment - the analysis an agent runs before it changes anything

When you are handed a repo - to bring it up to the standard, or as a periodic health
check - you run this assessment **first**. It is **analysis, not change** (like
`spec-impact`): you read the repo, detect what is there and what is missing, and produce
a picture plus concrete recommendations. The fixing happens afterwards: the skeleton
lands via the align router, the content via its brownfield onboarding phase, and both
drain the backlog this assessment seeds.

## You have this case - say this

**Someone handed you a repo and you have no idea what you are holding.** Start with the
picture, not with fixes:

```
> assess this repo against the standard - what is here, what is missing, what is risky. Do not change anything yet
```

You get the picture plus concrete recommendations, and nothing is edited. That
separation is the point: the first PR against an unfamiliar repo should never be a
sweep.

**You are deciding whether to take the work at all.** The same pass answers it:

```
> is this repo worth onboarding, or is the honest answer a rewrite? show me what that judgement rests on
```

**You already ran the assessment and want the work to exist.** Findings that never
became items are just an opinion:

```
> turn the assessment findings into backlog items, ordered by risk
```

**Corner case - the repo is huge.** Assess by capability boundary rather than by
directory, and say which parts you did not look at. An assessment that silently skipped
half the repo reads as a clean bill of health.

## When to run

- **First contact** with a repo you are about to onboard.
- **Periodically**, as a maintainability health check on a repo already on the standard.

## What it produces (analysis only)

1. A short **health report**: for each area below, maturity (absent / partial / solid)
   and the top risks.
2. **Recommendations**: what to **suggest** and what to **set up** (the paved road).
3. A **seeded backlog**: every gap becomes an item in [`backlog`](../../standard/docs/backlog.md) with a
   definition of done, feeding the onboarding phase.

**Who must act.** The health report groups its findings by the **owner role** that must
act - the same split the backlog items carry: **product/business** (the vision in
`PRODUCT.md`, BDRs, confirming personas), **architect** (ADRs, boundaries), **dev**
(specs, code, guards), **agent** (mechanical work it can run alone). Maintainers then
see which gaps are *theirs* - "the business must write the vision; the architects must
record the datastore decision" - not one undifferentiated pile.

Do **not** modify code during the assessment. Detect and record; fix later, in priority
order. The exception is a **red-flag stop** (below), which halts and asks the human now.

## The passes

Each pass: what to **detect**, what **good** looks like (the paved road), and what to
**suggest / set up**.

| Pass | Detect | Good looks like | Suggest & set up |
|---|---|---|---|
| **1. Skeleton & docs** | Is there `AGENTS.md`, `PRODUCT`, `ARCHITECTURE`, `specs/`, `decision-records/`, a backlog? | The standard skeleton present and pointed-to from `AGENTS.md` | Run `align-to-standards` to seed the missing skeleton (structure only) |
| **2. Decisions in code** | Walk the [decision checklist](checklist.md): which forks are decided / undecided / decided **inconsistently**. Read the repo's machine-readable governance config first (`.jcheck/conf`, `.gitreview`, `CODEOWNERS`) - those are decisions already written as data, not gaps | Every contestable fork has an ADR/BDR; the rest are conscious conventions | Retroactive ADR/BDR for decided-but-unrecorded; backlog item for each undecided fork |
| **3. Capabilities & specs** | Domains present in the code; any specs; a `capability-map.json`? | Specs [by capability, buildable](../tree/specs.md); code mapped | Seed `capability-map.json`; backlog items to spec the risky capabilities first |
| **4. Quality gates** | Tests (present? tiers? which paths?), typecheck strictness, lint/format | Named test tiers, strict types, one formatter/linter | Set up the missing gate; backlog coverage for money/security/contract paths |
| **5. CI/CD** | Is there a pipeline, and **does its PR gate actually fire**? Least-privilege permissions? Actions pinned? Reproducible build? | Hardened, pinned, least-privilege CI/CD, demonstrably running on pull requests | Add or harden the pipeline; pin actions; scope permissions down |
| **6. Security & supply chain** | Secret scanning, secrets committed, dependency audit, lockfile, release cooldown | Secret scan + audit in CI; no committed secrets; supply-chain cooldown | Set up scanning + audit; **committed secret = red-flag stop** |
| **7. Dependencies & stack** | Detect the stack; outdated / risky / unmaintained deps; does it match a known stack layer? | Current, minimal, justified deps | Map to the stack layer (Node/TS) where it applies; ADR for each risky/heavy dep |
| **8. Drift & health** | Code<->doc contradictions, dead code, `TODO`/debt density, churn hotspots | Docs match code; no silent drift; hotspots understood | Backlog item per contradiction; spec/ADR the churn hotspots first |

**Pass 5 rates what fires, not what exists.** A workflow file is evidence of intent;
the evidence that a **gate** exists is a **recent run on a pull request** - `gh run list
--workflow <file> --event pull_request --limit 5`, or the checks list on the last few
merged PRs. Four shapes carry a workflow file and gate nothing, and all four were found
in the field:

- **No pull-request trigger at all** - the workflow runs on push, on a schedule or on
  `workflow_dispatch` only. Often deliberate: postgres and openjdk run their real CI
  outside GitHub Actions, and postgres says so in a comment inside the workflow.
- **A filter that excludes the change** - `paths:`, `paths-ignore:` or `branches:` on the
  `pull_request` trigger. The trigger is present, the job never queues.
- **Disabled at the platform** - a workflow set to `disabled_manually`, or Actions turned
  off for the whole repo. Nothing in the file says so. LibreOffice/core goes further: its
  only PR-triggered workflow auto-closes every pull request opened against the mirror.
- **A runner that does not exist** - `runs-on:` naming a self-hosted label with nothing
  registered behind it. The job queues until it is cancelled, which reads as *no run*
  rather than as *failed*.

So report the two facts separately - which gates **exist**, and which of them **ran on a
pull request** recently. A workflow nobody can show running rates `partial` at best,
never `solid`, and the finding says which of the two was observed.

**And CI outside the host is still CI.** No workflow directory does not mean no pipeline:
the gate may be Gerrit, buildbot, Jenkins, or a patch queue on a mailing list. Look for it
before writing "no CI" into a health report handed to maintainers who have run one for
twenty years.

When the run history is not reachable - no API access, a mirror with no runs, CI on a
system you cannot query - say so in the health report the way pass 8 says it for a shallow
clone ("gate execution unverified - no accessible run history") instead of promoting file
existence to a passing gate.

**Pass 8's churn-hotspot check needs real history.** A shallow clone (`git clone --depth
1`, common when assessing someone else's repo from outside) has exactly one commit -
`git log` cannot rank hotspots from that, no matter how the rest of the pass goes. When
this happens, say so explicitly in the health report ("churn analysis unavailable -
shallow clone") rather than silently reporting the rest of the pass as if it were
complete; un-shallow the clone or use the host's API for commit stats if the churn signal
matters enough to be worth the cost.

## Turn findings into work

The assessment does not fix - it **routes**:

- Missing **skeleton or gates** -> `align-to-standards`.
- **Capabilities to spec** and **decisions to record** -> the onboarding phase.
- Everything not done in the first pass -> the **backlog**, ordered by risk x leverage
  (money, security, external contracts, data integrity first; then churn).
- **Red-flag stops** - halt and ask the human, do not proceed silently:
  - a **secret committed** to the repo,
  - anything that would **write to a remote database** (deliver a migration instead),
  - a change that would contradict an existing Accepted ADR,
  - **the repo's own policy forbids autonomous agent contribution** (a `CONTRIBUTING.md`
    or dedicated policy file says so outright) - tell the human what it says rather than
    opening a PR the repo's own rules disallow.

Onboarding then drains the backlog in small PRs (`spec-impact` -> `spec-update` ->
implement -> `spec-reconcile`). Re-run this assessment periodically to measure that the
backlog is shrinking, not growing.

## Not this

- **Not a rewrite** and not a fix-everything pass - the assessment only analyzes.
- **Not a vanity score** - maturity ratings exist to prioritize the backlog, not to grade.
- **Not tool maximalism** - recommend a gate the repo's risk warrants, not every gate
  that exists (right-size, per the [taxonomy](taxonomy.md)).
- **Not capability-invention** - derive domains from the code that exists, not from a
  wish-list.
