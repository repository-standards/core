---
name: align-to-standards
description: The single entry point for moving any repo onto the standard. Opens with an intake (step 0) - measure the repo's state, then one short question round (intent, technology + Layer 2 consent, appetite, plan-only vs execute) - then routes by target state - an empty repo to the greenfield phase, an existing unpinned repo to assessment-first onboarding, a pinned repo to update-to-version or a stack add - and reconciles the repo against the shipped tree in payoff-ordered waves until drift 0. Never blind-copy; reconcile - copy-class artifacts land verbatim, merge/fill-class are adapted (the manifest's adapt classes).
---

# align-to-standards

One entry point for the whole transition. Intake first, then route.

## Step 0 - Intake (measure, then ask)

Before any phase runs, one intake pass:

1. **Measure the state - evidence before questions.**
   - `.standards-version` present? Run `node scripts/self-verify.mjs` - the drift
     number is the open delta.
   - A partial skeleton (`AGENTS.md`, `docs/`, `specs/`) without a pin? Note it -
     the repo started aligning informally.
   - Nothing? A true greenfield or an unaligned brownfield - the intent question
     settles which.
   - **Read the repo's own lifecycle signals before asking anything** - a README or
     `CONTRIBUTING.md` banner saying deprecated/archived/legacy/frozen, a
     host-reported archived flag, a last-commit date years old, an explicit
     contribution policy. Four separate assessments this standard was tested
     against (a neglected small tool, an archived library, a defunct product's SDK,
     and a well-resourced org's deliberately-sunset repo) all had this answer sitting
     in the README or CONTRIBUTING the whole time - asking the standard intake round
     blind would have asked what the repo had already, plainly, said. Play the
     signal back as a confirmation ("this reads as deprecated as of <date> - is that
     still true?") instead of running the full round unconditionally.
   - **A repo's own policy can forbid what this skill does.** Some repos' `CONTRIBUTING.md`
     or a dedicated policy file state outright that autonomous agents may not
     contribute (found verbatim in `BurntSushi/ripgrep`'s `AI_POLICY.md` during
     testing). Treat this as a **red-flag stop** (same tier as a committed secret or
     a remote-database write) - halt and tell the human what the repo's own policy
     says, rather than proceeding to open a PR the repo's own rules forbid.
2. **Ask the user - one short round** (skip or compress this round when step 1
   already surfaced a strong lifecycle signal - confirm it instead of interviewing
   past it):
   - **Intent.** Start a new repo / bring an existing repo to the standard /
     **assessment only** ("tell me where I stand and give me the plan") / **a check-up on a
     repo already on the standard** ("we adopted a while back - review how we are doing") /
     update the pin (your repo records which version of the standard it follows; this moves
     it to a newer one).

     The check-up is a first-class intent, not a variant of the update. A repo drifts
     without the standard moving at all - specs stop matching code, decisions get made in
     chat again, the backlog stops being true - and a user asking for that review is doing
     the thing the product exists for. Never route them to a version bump instead.

     **A sixth answer is legitimate: this repo's own goal is to stay as it is** - deprecated,
     frozen, or intentionally minimal, with no plan to actively develop it further.
     Assessment-only still applies (the health report and counted plan are useful even
     here), but say plainly that closing the gap to drift 0 is not the point for a repo like
     this, and do not seed a backlog whose entire premise - working the list down - the
     repo has no intention of acting on. **When step 1 already found a strong lifecycle
     signal, lead with this answer as the likely one and confirm it**, rather than asking
     appetite, tracked-work location, or profile - all of which presuppose a team coming
     back to act on what gets produced.
   - **Technology.** Detect from the repo's own evidence first (`package.json`,
     `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`), then **confirm** with the user.
     Greenfield has no evidence, so ask - but never as a blank question: name what the
     registry actually has, so the user's answer is informed rather than a guess that gets
     silently downgraded three steps later.
     **Look the technology up in `stacks.json` before making the offer**, and say the true
     thing:
     - a registered stack: "this repo is <technology> - the registry has a boot-verified
       stack for it, so I'll offer those best practices alongside Layer 1; ok?"
     - no entry: "this repo is <technology>, and the registry has no stack for it yet.
       Layer 1's rules and specs are unaffected - but its guards are dependency-free Node
       scripts (`self-verify`, `spec-structure`, `spec-guard`, `facts-check`,
       `schema-pair`), so a Node runtime has to be installed to run them even though the
       repo itself is <technology> (see `docs/method/prerequisites.md`). For the
       technology layer I can research best practices and write them into your repo as
       your own record instead, and offer to file a stack request upstream. Ok?"

     Promising "the <technology> best practices from the registry" before the lookup makes
     a promise the registry cannot keep, and the user only finds out when the offer
     quietly becomes something else.
     Consent is gathered here; the actual stack reconciliation runs later, at its
     phase-defined place (the technology step below).
   - **Appetite.** One focused pull request now - a single reviewable change carrying the
     highest-payoff items only - or a programme of **waves**: several sessions over days or
     weeks, each closing as its own small PR, until the repo is fully aligned? Say the cost
     out loud; "waves" means coming back, and a user who expected one afternoon should hear
     that now rather than in week three.
   - **Profile.** Core or scale (ADR-011)? Solo or small = core (knowledge stays
     alive, guards run locally); a team = scale (CI-enforced gates, tracker
     bridge). The answer is written into the manifest copy at step 5 - it is what
     `self-verify` and the CI gate read.
   - **Where work is tracked.** The repo always keeps the **intents** - that is R15 and it
     is not the question. The question is where **execution** lives, and it decides what
     gets scaffolded, so it is asked rather than assumed:
     - **In the repo.** `docs/backlog.md` is the whole system; at `scale`, work cycles and
       a timeline on top of it (ADR-028). Nothing to buy, nothing to log into, and the
       agent can read the plan the same way it reads the code.
     - **In a tracker.** The team already lives in Jira, Linear or GitHub Issues. The repo
       keeps a thin intents list and the tracker holds execution state, assignment and
       history - the split ADR-010 describes.
     - **Both, bridged.** Intents in the repo, mirrored out for the people who will never
       open it. Honest cost: two places to keep in step, and the standard's own backlog
       doc warns against exactly that unless the team genuinely already lives there.

     **Detect before asking.** Ticket keys in the commit log (`ABC-123` in subjects), a
     `.github/ISSUE_TEMPLATE/`, a tracker link in the README - any of these is evidence,
     so play it back instead of asking cold: "your commits reference `PAY-###`, so you are
     on a tracker already - keep execution there and hold only intents here?" A confirmed
     inference costs the user one word; an open question costs them a paragraph.

     There is no wrong answer and none of it is permanent - a repo that starts in-repo and
     later adopts a tracker changes one thing, not its history.
   - **Existing knowledge - where else does this project already write things down?**
     Ask this **before** reconstructing anything, and **suggest rather than
     interrogate** - people do not think of their own wiki when asked an open
     question. Offer the list and let them point:
     - a tracker with real discussion in it (Jira, Linear, GitHub Issues/Projects)
     - a wiki or knowledge base (Confluence, Notion, Slab, Coda, an internal handbook)
     - decisions already written *somewhere*, in some other shape - `DECISIONS.md`,
       `rfcs/`, `adr/`, `design/`, a `docs/` folder nobody maintains, an old README
     - contracts and diagrams (OpenAPI/GraphQL schemas, Postman collections, Miro,
       FigJam, Lucid, Figma)
     - operational memory (runbooks, incident postmortems, on-call notes)
     - product material (a roadmap, PRDs, a pitch deck, research)
     - long-running threads people still quote (a Slack channel, a mail thread, a
       recorded meeting with a transcript)

     Then ask the part that decides whether any of it is usable: **can you actually
     reach it, and may it be quoted here?** An export, a paste, a link the agent can
     read, or "I can copy the relevant pages" are all fine; so is "it exists and I
     cannot share it" - that is an answer, and it belongs in the assessment as a known
     blind spot rather than a silence.

     **Say what happens to it**, so nobody hands over a wiki blindly: whatever arrives
     lands in `docs/discovery/<topic>/` with its provenance (ADR-024), **never as
     normative text**. It becomes a claim to be checked against the code, not a fact.
     And it is subject to the same discipline as everything else that enters the repo -
     no secrets (R19), and if the repo is or will be public, extracts get anonymized
     the way case studies are.

     **Never let this block the run.** "Nothing" and "not now" are complete answers.
     The code is always the primary source and alignment proceeds from it alone; align
     is re-entrant, so material handed over next week is folded in on the next pass
     with nothing repeated. Say this out loud - a user who thinks they must assemble
     their documentation first will postpone the whole adoption, which is the one
     outcome worse than adopting without it.
   - **Plan-only or execute?**
3. **Assessment-only is a legal, named outcome** - not a failure to proceed:
   deliver the health report and the counted plan (Gate 2 plus the Gate 5 count
   of the [adoption checkmap](../../docs/method/adoption.md)), then stop.

## Route by target state

| Target repo | Path |
|---|---|
| **EMPTY or brand new** | Follow the [greenfield phase](greenfield.md), then the align waves below. |
| **EXISTS, no `.standards-version`** | Assessment-first onboarding per the [brownfield phase](onboard.md), then the align waves below. |
| **HAS `.standards-version`, wants a check-up** | Run the [brownfield phase](onboard.md)'s assessment against the aligned repo: `self-verify` for the mechanical number, then the passes that machines cannot score - do the specs still describe what the code does, were the decisions since the last visit recorded, is the backlog still true. Deliver the health report and the counted list, same as a newcomer gets. **Do not route this to `/update-to-version`** - drift happens without the standard moving, and a version bump answers a different question. |
| **HAS `.standards-version`, wants the pin moved** | Hand off to `/update-to-version` - the repo is already on the standard; this skill gets a repo *to* the pin, not past it. |
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

1. **Read the shipped tree** (`standard/` in this checkout): `AGENTS.md`, `CLAUDE.md`,
   `.claude/` (settings + skills), `.github/`, `.gitleaks.toml`, `scripts/`, `docs/`
   (PRINCIPLES, ARCHITECTURE, conventions, decision-records), `specs/`,
   `SPEC.md`. Note the checkout's `VERSION`. The method docs (adoption, taxonomy,
   the decision checklist, ...) live beside it in this checkout's
   [`docs/method/`](../../docs/method/README.md) - read, never copied.

2. **Read the target repo.** For each part of the shipped tree, classify: missing /
   present-but-drifted / up to date (by content).

3. **Apply, adapted - do NOT blind-copy:**
   - Merge the `settings.json` guards + deny/ask into the target's
     `.claude/settings.json`; keep repo-specific entries; adapt migration/deploy CLIs
     to the real stack.
   - Drop in the guard + workflows; wire the pre-commit into the repo's hook mechanism.
     **Ask before the workflows land - this is the one step whose blast radius is other
     people.** They are live on merge, not dormant: `spec-guard.yml` runs `self-verify` on
     every pull request, so until alignment finishes, **your colleagues' unrelated PRs go
     red on a change they did not make**. That is how an adoption gets reverted and never
     retried. Offer the three real options and let the user pick: (a) land them now and
     accept red CI while the waves run, (b) hold them until the final wave, (c) land them
     now with the self-verify step set to `--warn` and flip it to blocking at drift 0.
     Never land them silently.
   - `.github/workflows/spec-guard.yml` is a **reference implementation of the R16 gate**
     (run `self-verify`, block the PR on nonzero drift), written for GitHub Actions because
     that is the common case - it is not a mandate to use GitHub Actions. If the repo's
     real CI is somewhere else (CircleCI, Buildkite, GitLab CI, Jenkins, ...), translate the
     gate's intent into that system's own config instead of running a second, parallel CI
     product just to host this one workflow. The standard does not ship per-CI-product
     adapters (that is an unbounded surface); the two commands are the contract:
     `node scripts/self-verify.mjs --version <pinned>` and, at `scale`, the coupling guard
     `node scripts/spec-guard.mjs`.
   - **Check the prerequisites before the guards, not after.** The `.claude/hooks/` guards
     need `jq`, and without it they deny **every** Bash command by design - an agent that
     suddenly refuses everything, with no explanation the user can connect to this step.
     Name what is needed - this checkout's
     [`docs/method/prerequisites.md`](../../docs/method/prerequisites.md), read by
     reference like the rest of `docs/method/` (it never ships to the target repo) - and
     confirm it is installed first.
   - Put conventions in `AGENTS.md` (single source). `CLAUDE.md` is a router **plus** the
     one rule that has to be in context before the agent is asked anything: check whether a
     shipped skill covers the request before acting, and again when the work closes. It is
     the first file Claude Code loads, which is the whole reason the rule lives there rather
     than one hop away. If the repo's agent is not Claude Code, put the same content in
     whatever that agent loads first - and if it loads nothing automatically, say so to the
     user, because then the rule only holds while someone remembers it.
   - `docs/` and `specs/` in the shipped tree are **templates** - fill them with the
     target repo's content, in that repo's language.
   - Skills into the repo's skill dir (`.agents/skills` or `.claude/skills`).

4. **Watch repo gotchas** (e.g. a broad `settings.json` `.gitignore` rule swallowing
   `.claude/settings.json` - add a `!` negation).

   Also **elicit the unwritten rules (ADR-012)** - and ask with candidates, not into the
   void, because "what rules live in people's heads?" reliably returns "none" from someone
   who has six. Offer the usual suspects and let them recognise their own: a deploy window
   or freeze day, a file or service nobody may touch, a test everyone reruns because it is
   flaky, a manual step missing from the README, an env var that breaks staging, someone
   who must review certain changes, a release ritual. If there is nobody left to ask -
   inherited codebases often have no team - mine the git log's authors, the review comments
   on old pull requests and any handover doc, propose what you find, and confirm it.
   Then ask the user for the tribal
   knowledge - rules living in heads, personal configs (`~/.claude`, dotfiles), agent
   memories, or pinned chats - and land each at its taxonomy home (`AGENTS.md`,
   conventions, `CONTRIBUTING`, a spec, a record). A repo rule that stays outside the
   repo is missing, not stored.

5. **Pin the aligned version, carry the manifest.** Write the standard's version to
   `.standards-version`, and copy that version's `standard.manifest.json` into the repo
   (ADR-005) - it is the checklist the align was measured against, and what `self-verify`
   reads. Write the intake's profile answer into the copy as a top-level
   `"profile"` field - `self-verify` uses it as the default, and the shipped CI
   gate blocks or advises by it. Use the manifest's `files` / `sections` / `guards` / `decisions` as the coverage
   list, and each entry's `adapt` rule (copy / merge / fill-from-repo / reference) to
   decide *how* it lands - never blind-copy a `fill-from-repo` artifact. Record any
   deliberate deviation as a manifest `exceptions` entry so a later update does not
   silently overwrite it.

6. **Self-verify, and read the number correctly.** Run
   `node scripts/self-verify.mjs --version <aligned>` (see `docs/self-verify.md`).
   - **Greenfield: drift 0 before the PR.** Nothing legitimate is missing from a repo you
     just scaffolded, so a red run means something is genuinely wrong.
   - **Brownfield: wave one closes red, by design.** A multi-year repo does not reach drift
     0 in one pull request and must not try - forcing it produces exactly the unreviewable
     big-bang the brownfield phase forbids. State the number, list what remains and which
     wave takes it, and **open the PR anyway**. The gate for a brownfield wave is "this
     wave's items are complete and the build is green", never drift 0; drift 0 is where the
     programme ends, not the entry price for its first step.

7. **Open one focused PR.** Never push without the human's go. Never reference other
   repos.

8. **Close the loop upstream (ADR-021).** Review the run for what the standard
   should learn - the triggers: a manifest `exceptions` entry was written; an
   instruction could not be followed as written; you had to ask the user
   something the standard should have answered; the registry had a gap; a guard
   fired on a false positive. For each, **offer** (with a ready title and body;
   the user consents per item, never automatically) an issue on
   `repository-standards/core` - the `adoption-friction` template - or
   a PR when the fix is a concrete doc change. No consent, no side effect: the
   learning still lands in the target repo's records either way.

## Technology best practices (Layer 2)

This step **consumes the intake's technology answer** (step 0) - detection and
consent already happened there; do not re-detect, do not re-ask. **When it runs
is phase-defined:** brownfield - **right after the assessment** (its pass 7
confirms the detection), not at the end; greenfield - after personas and product
(for whom -> what -> how holds); a pinned repo adding a stack - immediately (the
fourth route).

1. **Take the intake answer** - the confirmed technology and the Layer 2
   consent. Re-confirm only if the phase surfaced contradicting evidence (e.g.
   the assessment's pass 7 disagrees with what the user said).
2. **Look it up** in the registry - `stacks.json` in this checkout. The registry
   is the only source of official stacks; never offer an unlisted repo.
3. **Check compatibility - loose by design (ADR-022).** The stack's
   `stack.manifest.json` links it to the ecosystem (the `registry` back-pointer
   plus `technology`) - it declares no core version range, so there is nothing
   version-shaped to evaluate. The real contract is the manifest schema and its
   adapt classes, and it breaks only when the core records that migration in its
   changelog - if the stack has not chased such a break yet, **warn and let the
   user decide** - never hard-stop.
4. **Apply, never impose** (the intake's consent covers the offer; the user
   still approves each wave). Greenfield: compose per the greenfield phase's
   composition rule - the starter degits into the repo root first, the Layer 1
   tree lays over it (see `greenfield.md`, step 4) - then copy
   `stack.manifest.json` from the stack checkout into the new repo.
   Brownfield: run the [stack adaptation phase](stack.md) - the same machinery
   as Layer 1, on the stack's own data - read `stack.manifest.json` from a
   checkout of the stack repo, classify the target against every entry
   (missing / drifted / ok; `merge`-class configs diff against the starter's
   reference copy), propose waves ordered by blast radius, apply adapted -
   never a second scaffold beside the code. Close by copying the stack
   manifest into the repo: from then on `self-verify` counts one drift across
   both layers. The DECISIONS file is the why behind every entry - quote it
   when the user asks; technology-specific migration notes come from the stack
   repo's ADAPTING.md, never from this skill.
5. **No match in the registry:** say so plainly, then offer the fallback: a
   researched best-practices document for the detected technology, shaped like
   the node stack's DECISIONS (summary table first; per axis the pick, a short
   why, an escape hatch; provenance = current community consensus with linked
   sources, clearly dated). It lands in the target repo as
   `docs/stack-decisions.md` - the repo's own record, not an official stack -
   and the offer notes that a real stack repo in the `repository-standards` org can grow
   from it later. Then **offer to file the demand upstream (ADR-021,
   consent-gated, never automatic):** a **stack request** issue on
   `repository-standards/core` (the `stack-request` template) with the
   detection evidence and the generated document as seed material - this is the
   signal the registry decides its next stack on. Either way Layer 1 continues
   unchanged - the methodology is stack-agnostic by design.

The user may also name the stack up front ("align this repo, with the node
stack" / "greenfield with node") - that answers the intake's technology question
early; verify the registry entry and continue.

## Re-entrant: this is a process, not a pass

For a brownfield repo one PR never reaches drift 0 - and it should not try. Align is a
process the user **re-enters until the repo is compliant**, and every entry is guided:

- **Resume from measurement, not memory.** Each run starts by re-reading
  `.standards-version` + `standard.manifest.json` and running `self-verify`: what is
  already done stays done; the open delta is the work list. Never re-propose what exists.
- **Propose the next wave, ordered by payoff - inside the gate order.** From the open
  delta, pick the few items with the biggest win first - typically: the agent entry
  point + taxonomy, then the intake gates' material (PRODUCT/personas - nothing
  downstream lands before them), then missing foundational decisions (ADRs), then
  folder structure, then guards. Say *why this wave, why now*, sized to land in one PR.
- **Hand-hold, do not dump.** For each wave item, guide the user through it (elicit,
  propose, record) rather than emitting a pile of TODOs. Deferrals are recorded, not
  dropped.
- **Repeat until drift 0.** Close each wave with `self-verify`; the number falling is the
  progress bar. A multi-year brownfield may take many waves - that is the designed shape,
  not a failure. Every wave close includes the upstream review (step 8) - friction is
  reported while it is fresh, not archaeologized at the end.

## Not this

- Not a blind overwrite (that recreates divergence) - adapt to the stack.
- Not company-specific values (tokens, tenant ids) - those stay as variables / overlay.
