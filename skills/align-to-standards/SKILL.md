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
2. **Ask the user - one short round:**
   - **Intent.** Start a new repo / bring an existing repo to the standard /
     **assessment only** ("tell me where I stand and give me the plan") / update
     the pin.
   - **Technology.** Detect from the repo's own evidence first (`package.json`,
     `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`), then **confirm** with
     the user; greenfield has no evidence - ask outright. The answer carries the
     **Layer 2 consent up front**: "this repo is <technology> - I'll offer the
     <technology> best practices from the registry alongside Layer 1; ok?"
     Consent is gathered here; the actual stack reconciliation runs later, at its
     phase-defined place (the technology step below).
   - **Appetite.** One focused PR now, or a program of waves?
   - **Profile.** Core or scale (ADR-011)? Solo or small = core (knowledge stays
     alive, guards run locally); a team = scale (CI-enforced gates, tracker
     bridge). The answer is written into the manifest copy at step 5 - it is what
     `self-verify` and the CI gate read.
   - **Plan-only or execute?**
3. **Assessment-only is a legal, named outcome** - not a failure to proceed:
   deliver the health report and the counted plan (Gate 2 plus the Gate 5 count
   of the [adoption checkmap](../../docs/method/adoption.md)), then stop.

## Route by target state

| Target repo | Path |
|---|---|
| **EMPTY or brand new** | Follow the [greenfield phase](greenfield.md), then the align waves below. |
| **EXISTS, no `.standards-version`** | Assessment-first onboarding per the [brownfield phase](onboard.md), then the align waves below. |
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
npx degit bodurkalukasz/repository-standards/standard
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
   - Put conventions in `AGENTS.md` (single source); `CLAUDE.md` stays a thin router.
   - `docs/` and `specs/` in the shipped tree are **templates** - fill them with the
     target repo's content, in that repo's language.
   - Skills into the repo's skill dir (`.agents/skills` or `.claude/skills`).

4. **Watch repo gotchas** (e.g. a broad `settings.json` `.gitignore` rule swallowing
   `.claude/settings.json` - add a `!` negation).

   Also **elicit the unwritten rules (ADR-012):** ask the user for the tribal
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

6. **Self-verify.** Run `node scripts/self-verify.mjs --version <aligned>` (see
   `docs/self-verify.md`): the pin matches the manifest, every required entry is met, the
   guards are green - **drift 0**. Do not open the PR on a red self-verify.

7. **Open one focused PR.** Never push without the human's go. Never reference other
   repos.

8. **Close the loop upstream (ADR-021).** Review the run for what the standard
   should learn - the triggers: a manifest `exceptions` entry was written; an
   instruction could not be followed as written; you had to ask the user
   something the standard should have answered; the registry had a gap; a guard
   fired on a false positive. For each, **offer** (with a ready title and body;
   the user consents per item, never automatically) an issue on
   `bodurkalukasz/repository-standards` - the `adoption-friction` template - or
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
   and the offer notes that a real `repository-standards-<technology>` can grow
   from it later. Then **offer to file the demand upstream (ADR-021,
   consent-gated, never automatic):** a **stack request** issue on
   `bodurkalukasz/repository-standards` (the `stack-request` template) with the
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
