---
audience: both
type: added
headline: A repo can now measure its distance from the standard as a single number
---
- `standard.manifest.json` - new: the align-engine manifest (ADR-005, now Accepted). The standard describes **itself** at the pinned version - the files, sections, guards, and decisions an aligned repo must have, each with an `adapt` rule. Shipped to `dist/` and dogfooded here.
- `scripts/self-verify.mjs` - changed: **manifest-driven**. It reads `standard.manifest.json`, checks the repo against every entry, and reports **drift as a number** (`drift 0` = compliant); asserts the pin matches the manifest version. Falls back to the built-in skeleton when no manifest is present.
- `align-to-standards` / `update-to-version` - changed: read the manifest - align carries it in and uses its `adapt` rules; update treats the plan as the manifest-to-manifest delta and carries `exceptions` forward.
