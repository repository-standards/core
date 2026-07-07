---
audience: technical
type: added
---
- `tools/reflect.mjs` - new: encodes the `source -> dist/` reflection as a declarative map in four classes (copy / divergent / authored-only / source-only). `--check` reports **drift as a number** and catches orphaned `dist/` files and source-only leaks; `--write` syncs the copy class - retiring the by-hand `dist/` maintenance the README flagged. On landing it caught and fixed real drift: `dist/scripts/spec-guard.mjs` (a stray header line) and `dist/docs/decision-records/adr/_template.md` (missing its `Confirmation` section).
- `CONTRIBUTING.md` - changed: edit source, not `dist/`; `reflect` must be green before a PR.
