---
audience: both
type: added
headline: One command turns per-PR notes into a changelog and a release-notes draft
---
- `tools/changelog.mjs` - new: assembles the `changes/` fragments into the two outputs. `--check` validates every fragment's frontmatter (CI-friendly); the default assembles the complete technical `CHANGELOG.md` (grouped by type, verbatim) plus a curated release-notes **draft** from the stakeholder-facing headlines. Prints to stdout; never writes a version heading or touches `VERSION` - the maintainer cuts the release.
