---
name: align-to-standards
description: The single entry point for moving any repo onto the standard. Routes by target state - an empty repo to the greenfield phase, an existing unpinned repo to assessment-first onboarding, a pinned repo to update-to-version - then reconciles the repo against the shipped tree in payoff-ordered waves until drift 0. No file copying; the agent compares and reconciles.
disable-model-invocation: true
---

# align-to-standards

One entry point for the whole transition. Route first:

| Target repo | Path |
|---|---|
| **EMPTY or brand new** | Follow the [greenfield phase](greenfield.md), then the align waves below. |
| **EXISTS, no `.standards-version`** | Assessment-first onboarding per the [brownfield phase](onboard.md), then the align waves below. |
| **HAS `.standards-version`** | Hand off to `/update-to-version` - the repo is already on the standard; this skill gets a repo *to* the pin, not past it. |

`greenfield.md` and `onboard.md` are phase files of this skill - they run inside it,
never as separate skills.

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
   (PRINCIPLES, ARCHITECTURE, adoption, conventions, decision-records), `specs/`,
   `SPEC.md`. Note the checkout's `VERSION`.

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
   reads. Use the manifest's `files` / `sections` / `guards` / `decisions` as the coverage
   list, and each entry's `adapt` rule (copy / merge / fill-from-repo / reference) to
   decide *how* it lands - never blind-copy a `fill-from-repo` artifact. Record any
   deliberate deviation as a manifest `exceptions` entry so a later update does not
   silently overwrite it.

6. **Self-verify.** Run `node scripts/self-verify.mjs --version <aligned>` (see
   `docs/self-verify.md`): the pin matches the manifest, every required entry is met, the
   guards are green - **drift 0**. Do not open the PR on a red self-verify.

7. **Open one focused PR.** Never push without the human's go. Never reference other
   repos.

## Technology best practices (Layer 2)

After routing, always run the stack step - detection first, question second:

1. **Detect** the target repo's technology from its own evidence: `package.json`
   (Node), `pyproject.toml`/`requirements.txt` (Python), `go.mod` (Go),
   `Cargo.toml` (Rust), `*.csproj` (.NET). Greenfield repos have none - ask
   instead.
2. **Look it up** in the registry - `stacks.json` in this checkout. The registry
   is the only source of official stacks; never offer an unlisted repo.
3. **Offer, never impose:** "This repo is <technology>. Add the <technology>
   best practices from <repo>?" Greenfield: degit the stack's `starter/`, then
   copy `stack.manifest.json` from the stack checkout into the new repo.
   Brownfield: the same machinery as Layer 1, on the stack's own data - read
   `stack.manifest.json` from a checkout of the stack repo, classify the target
   against every entry (missing / drifted / ok; `merge`-class configs diff
   against the starter's reference copy), propose payoff-ordered waves, apply
   adapted - never a second scaffold beside the code. Close by copying the
   stack manifest into the repo: from then on `self-verify` counts one drift
   across both layers. The DECISIONS file is the why behind every entry -
   quote it when the user asks.
4. **No match in the registry:** say so plainly, then offer the fallback: a
   researched best-practices document for the detected technology, shaped like
   the node stack's DECISIONS (summary table first; per axis the pick, a short
   why, an escape hatch; provenance = current community consensus with linked
   sources, clearly dated). It lands in the target repo as
   `docs/stack-decisions.md` - the repo's own record, not an official stack -
   and the offer notes that a real `repository-standards-<technology>` can grow
   from it later. Either way Layer 1 continues unchanged - the methodology is
   stack-agnostic by design.

The user may also name the stack up front ("align this repo, with the node
stack" / "greenfield with node"): skip detection, verify the registry entry,
and weave the stack step into the phase flow so one conversation carries both.

## Re-entrant: this is a process, not a pass

For a brownfield repo one PR never reaches drift 0 - and it should not try. Align is a
process the user **re-enters until the repo is compliant**, and every entry is guided:

- **Resume from measurement, not memory.** Each run starts by re-reading
  `.standards-version` + `standard.manifest.json` and running `self-verify`: what is
  already done stays done; the open delta is the work list. Never re-propose what exists.
- **Propose the next wave, ordered by payoff.** From the open delta, pick the few items
  with the biggest win first - typically: the agent entry point + taxonomy, then missing
  foundational decisions (ADRs), then folder structure, then product descriptions
  (PRODUCT/personas), then guards. Say *why this wave, why now*, sized to land in one PR.
- **Hand-hold, do not dump.** For each wave item, guide the user through it (elicit,
  propose, record) rather than emitting a pile of TODOs. Deferrals are recorded, not
  dropped.
- **Repeat until drift 0.** Close each wave with `self-verify`; the number falling is the
  progress bar. A multi-year brownfield may take many waves - that is the designed shape,
  not a failure.

## Not this

- Not a blind overwrite (that recreates divergence) - adapt to the stack.
- Not company-specific values (tokens, tenant ids) - those stay as variables / overlay.
