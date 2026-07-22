# Repo assessment - the analysis an agent runs before it changes anything

When you are handed a repo - to bring it up to the standard, or as a periodic health
check - you run this assessment **first**. It is **analysis, not change** (like
`spec-impact`): you read the repo, detect what is there and what is missing, and produce
a picture plus concrete recommendations. The fixing happens afterwards - the skeleton
via `align-to-standards`, the content via `onboard-repo` - drained from the backlog this
assessment seeds.

## When to run

- **First contact** with a repo you are about to onboard.
- **Periodically**, as a maintainability health check on a repo already on the standard.

## What it produces (analysis only)

1. A short **health report**: for each area below, maturity (absent / partial / solid)
   and the top risks.
2. **Recommendations**: what to **suggest** and what to **set up** (the paved road).
3. A **seeded backlog**: every gap becomes an item in [`backlog`](backlog.md) with a
   definition of done, feeding `onboard-repo`.

Do **not** modify code during the assessment. Detect and record; fix later, in priority
order. The exception is a **red-flag stop** (below), which halts and asks the human now.

## The passes

Each pass: what to **detect**, what **good** looks like (the paved road), and what to
**suggest / set up**.

| Pass | Detect | Good looks like | Suggest & set up |
|---|---|---|---|
| **1. Skeleton & docs** | Is there `AGENTS.md`, `PRODUCT`, `ARCHITECTURE`, `specs/`, `decision-records/`, a backlog? | The standard skeleton present and pointed-to from `AGENTS.md` | Run `align-to-standards` to seed the missing skeleton (structure only) |
| **2. Decisions in code** | Walk the [decision checklist](decision-records/checklist.md): which forks are decided / undecided / decided **inconsistently** | Every contestable fork has an ADR/BDR; the rest are conscious conventions | Retroactive ADR/BDR for decided-but-unrecorded; backlog item for each undecided fork |
| **3. Capabilities & specs** | Domains present in the code; any specs; a `capability-map.json`? | Specs [by capability, buildable](../specs/README.md); code mapped | Seed `capability-map.json`; backlog items to spec the risky capabilities first |
| **4. Quality gates** | Tests (present? tiers? which paths?), typecheck strictness, lint/format | Named test tiers, strict types, one formatter/linter | Set up the missing gate; backlog coverage for money/security/contract paths |
| **5. CI/CD** | Is there a pipeline? Least-privilege permissions? Actions pinned? Reproducible build? | Hardened, pinned, least-privilege CI/CD | Add or harden the pipeline; pin actions; scope permissions down |
| **6. Security & supply chain** | Secret scanning, secrets committed, dependency audit, lockfile, release cooldown | Secret scan + audit in CI; no committed secrets; supply-chain cooldown | Set up scanning + audit; **committed secret = red-flag stop** |
| **7. Dependencies & stack** | Detect the stack; outdated / risky / unmaintained deps; does it match a known stack layer? | Current, minimal, justified deps | Map to the stack layer (Node/TS) where it applies; ADR for each risky/heavy dep |
| **8. Drift & health** | Code<->doc contradictions, dead code, `TODO`/debt density, churn hotspots | Docs match code; no silent drift; hotspots understood | Backlog item per contradiction; spec/ADR the churn hotspots first |

## Turn findings into work

The assessment does not fix - it **routes**:

- Missing **skeleton or gates** -> `align-to-standards`.
- **Capabilities to spec** and **decisions to record** -> `onboard-repo`.
- Everything not done in the first pass -> the **backlog**, ordered by risk x leverage
  (money, security, external contracts, data integrity first; then churn).
- **Red-flag stops** - halt and ask the human, do not proceed silently:
  - a **secret committed** to the repo,
  - anything that would **write to a remote database** (deliver a migration instead),
  - a change that would contradict an existing Accepted ADR.

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
