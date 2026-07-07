# Changelog + release notes - two outputs, one source, one cut

Two very different readers need two very different things, and one file cannot serve both:

- an **engineer** wants the complete, precise record - every change, in dev language;
- a **stakeholder** (PO, customer, exec) wants a short, plain-language story of what got
  better and why it matters.

So the standard keeps **two outputs of different kinds**, both fed from the same per-PR
fragments:

| Output | Kind | Contains | Voice | Produced by |
|--------|------|----------|-------|-------------|
| `CHANGELOG.md` | complete, mechanical | **every** change | developer, Keep-a-Changelog | assembled from fragments |
| `RELEASE-NOTES.md` ("What's new") | curated, narrative | only what a non-technical reader cares about | plain, lightly marketing | **written** by the maintainer at release |

The release notes are **not the changelog with the boring lines deleted** - they are a
short written narrative. Smaller on purpose: most changes (a refactor, a CSS fix, a
dependency bump) never appear in them. Never per-commit.

## Why fragments

One `CHANGELOG.md` edited by every PR conflicts on every parallel PR - two branches both
add a line under `## Unreleased` and collide. The fix: each PR drops its **own** file, so
nothing shares a line and the conflict is gone by construction. A PR adds a fragment; it
does **not** edit `CHANGELOG.md` / `RELEASE-NOTES.md` and does **not** bump `VERSION`.

## The fragment

`changes/<short-slug>.md`:

```
---
audience: technical               # technical | stakeholder | both
type: added                       # added | changed | fixed | removed  (Keep a Changelog)
headline: Self-serve CSV export   # OPTIONAL - only for stakeholder/both; the plain-language hook
---
- `exports/csv` - new: streaming CSV export endpoint with signed URLs.
```

- **audience** - `technical` (most changes), `stakeholder`, or `both`. Only
  `stakeholder`/`both` reach the release notes.
- **type** - groups the line under a Keep-a-Changelog heading in the changelog.
- **headline** - only for stakeholder-facing changes: the plain-language "what got
  better" line the maintainer weaves into the narrative. The bullet body stays the
  technical record.

## At release (the maintainer cuts it)

1. **Changelog - mechanical.** Assemble **every** fragment into `CHANGELOG.md` under a new
   `## x.y.z - <date>`, grouped by `type`, verbatim. Nothing is dropped.
2. **Release notes - written.** From the `stakeholder`/`both` fragments' headlines, *write*
   a short narrative in `RELEASE-NOTES.md`: group by theme, lead with the benefit, cut
   anything a non-technical reader would not care about. Curate hard - three good
   paragraphs beat thirty bullets.
3. Bump `VERSION`; clear the assembled fragments from `changes/`.

Nothing before this writes a version heading or touches `VERSION`. The release is one
deliberate act - and the release notes are the one place **editorial judgement** is
expected, not mechanical assembly.

## Mechanization

The changelog half is mechanical and stack-agnostic (Layer 1: plain files, a maintainer
or an agent can assemble it; a Node/TypeScript repo may mechanize it with the `changesets`
tool, Layer 2). The **release-notes half is deliberately human** - or an agent told to
*write*, not assemble: the curation and the plain-language framing are the whole value,
and they cannot be generated from commit lines.
