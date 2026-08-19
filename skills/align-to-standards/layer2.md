# Technology best practices (Layer 2)

Phase file of `align-to-standards`. Runs inside it, never as a separate skill.

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

