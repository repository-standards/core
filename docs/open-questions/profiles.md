# One repo, two profiles (core / scale)

**Decided:** ADR-011 - a `profile` field per manifest entry, views rendered,
never a second repo. The same axis now serves the stack layer: satellites reuse
core|scale verbatim instead of inventing light/corporate.

**Doubt:** two profiles may be too coarse (a regulated `audit` third looms), and
the discipline of "profile column, not parallel chapters" is untested at scale.

**A better answer would:** proof from a real solo adoption that core alone feels
light, before 1.0 hard-commits the split.
