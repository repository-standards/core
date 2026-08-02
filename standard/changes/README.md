# changes/ - changelog fragments

Instead of editing `CHANGELOG.md`, a PR drops one fragment here - so parallel PRs never
collide on the changelog. At release the maintainer assembles them into two outputs: the
complete **`CHANGELOG.md`** (mechanical) and the curated, written **`RELEASE-NOTES.md`**
("what's new" for non-technical readers). See the standard's
[changelog process](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/changelog-process.md)
(adopted by reference from the living standard - always latest). Fragments are **scale profile** -
they stop parallel PRs from colliding; a solo repo writes the `## Unreleased` section
of `CHANGELOG.md` directly.

**The standard ships no `CHANGELOG.md`** - it is yours, and its history is not ours to
seed. Create it at the repo root the first time a change needs describing, with a
`## Unreleased` heading; that is the whole requirement. A repo with no changelog yet is not
in violation of anything, but a repo whose rule says "describe it under Unreleased" and has
nowhere to write is, which is why this note exists.

## Add one per change

`changes/<short-slug>.md`:

```
---
audience: technical               # technical | stakeholder | both
type: added                       # added | changed | fixed | removed
headline: Self-serve CSV export   # OPTIONAL - only for stakeholder/both
---
- `path/to/thing` - new: one line, in the changelog's voice.
```

Only `stakeholder`/`both` reach the release notes; `headline` is the plain-language hook
the maintainer weaves into that narrative. Do **not** edit `CHANGELOG.md`,
`RELEASE-NOTES.md`, or `VERSION` in a PR - the maintainer assembles and cuts the release,
then clears this folder.

Everything except this `README.md` is a pending fragment awaiting the next release.
