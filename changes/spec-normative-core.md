---
audience: both
type: added
headline: The whole standard now fits on one page
---
- `standard/SPEC.md` - new: the normative core as twenty numbered MUST/SHOULD rules
  (R1-R20, RFC 2119), versioned with the standard; ships as `dist/SPEC.md`. Where any
  other document appears to add a requirement, the spec wins.
- `standard.manifest.json` - changed: every entry now cites the spec rule it enforces
  (`rule: "R#"`) - the manifest is the spec's machine-readable projection, one
  authority instead of two parallel texts.
- `README.md`, `llms.txt`, docs site - changed: each surface now points at the spec
  first (new "The spec" page on the site).
