# One repo, two profiles (core / scale)

**Decided:** ADR-011 - a `profile` field per manifest entry, views rendered,
never a second repo. The same axis now serves the stack layer: satellites reuse
core|scale verbatim instead of inventing light/corporate. ADR-040 replaced the
trigger: `scale` binds on what leaves the room, not on a second contributor.

**Doubt:** the split may be too weak to carry what the docs put on it. Measured
on the tree: 9 entries are `scale`, and only R11's blocking coupling guard and
R16's `spec-guard` step carry a *(scale)* marker. ADR-040 made the picker say so
plainly rather than move entries, because nothing observed yet says which way
they should move. A regulated `audit` third profile still looms.

**A better answer would:** come from an adoption by a repo with two to five
people - the range the binary decides hardest and the one the validation suite
has never covered. Every field run inferred its profile from committer counts,
and the smallest team any of them records is 38 authors.
