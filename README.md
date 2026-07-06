# repository-standards

The engineering + AI-agent standard, as a framework. Two parts:

- **The repo itself, organized by concern** (`agents/`, `claude/`, `decision-records/`,
  `docs/`, `github/`, `gitleaks/`, `skills/`, `specs/`) - the **source**. This is
  where the standard is maintained and read, grouped so it is clear what it covers.
- **[`dist/`](dist/)** - the **result**: the same standard assembled as a real repo
  skeleton (root-level `.claude/`, `.github/`, `docs/`, `specs/`, `AGENTS.md`, ...).
  This is the final product you reflect into a repo.

## How to use it

To standardize any repo (new or existing), an agent **reads the standard and the
target repo, sees the difference, and applies it** - adapted to that repo's stack and
language (see [`skills/align-to-standards`](skills/align-to-standards/SKILL.md)). No
copy mechanism; the agent compares and reconciles. `dist/` is also a ready starting
point for a brand new repo.

## What each concern is

| Folder | What it is | Per repo |
|--------|-----------|----------|
| `agents/` | `conventions.md` - commit / hyphen / no-attribution (merges into AGENTS.md) | as-is |
| `claude/` | `settings.baseline.json` - agent permissions + PreToolUse guards (remote-DB, secrets) | extend |
| `skills/` | `pre-pr-review`, `/spec-*` (spec-first workflow), `align-to-standards` | as-is |
| `github/` | PR template + CI workflows (`gitleaks`, `spec-guard`) | as-is |
| `gitleaks/` | secret-scan config | as-is |
| `decision-records/` | `adr/` (technical *why*) + `bdr/` (business *why*) + a README that explains them | fill |
| `docs/` | templates: `PRODUCT` (vision), `ARCHITECTURE` (structure), `PRINCIPLES`, docs hub | fill |
| `specs/` | living capability specs: methodology, template, `/spec-*` commands, enforcement, Spec Kit setup, constitution, the guard | fill specs; methodology as-is |

## The model

- **Behavior** = `specs/<capability>/` - living capability specs, "what the system
  does now", by domain not ticket. Changed spec-first (change a spec -> impact ->
  update -> plan -> tasks -> implement -> reconcile -> loop).
- **Decisions** = `decision-records/adr` + `bdr` - the *why*, kept lean.
- **Structure** = `docs/ARCHITECTURE`. **Vision** = `docs/PRODUCT`.
- **Guardrails** = hooks (`claude/settings.baseline.json`), secret scan, spec-policy
  guard, PR template, `pre-pr-review`.
- **Altitude** (wins on conflict): `PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE ->
  conventions/rules -> code`.

## dist is the result of the source

`dist/` mirrors the source assembled at real-repo paths. Today it is a committed
snapshot; because a manual snapshot drifts, the next step is a small build so `dist/`
is always regenerated from the source (edit the concern folders, rebuild `dist/`).

## Shape vs content, and language

The standard carries the **shape** (structure, conventions, methodology). Each repo
fills the **content** (its own specs, ADRs, product vision) - never another repo's.
The standard is written in English so it is reusable; filled content in a repo
follows that repo's language.

Versioned with semver (`VERSION` + `CHANGELOG.md`).
