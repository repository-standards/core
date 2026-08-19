# Changelog + release notes - two outputs, one source, one cut

Two very different readers need two very different things, and one file cannot serve both:

- an **engineer** wants the complete, precise record - every change, in dev language;
- a **stakeholder** (PO, customer, exec) wants a short, plain-language story of what got
  better and why it matters.

So the standard keeps **two outputs of different kinds**, both fed from the same place - what
each pull request wrote under `## Unreleased`:

| Output | Kind | Contains | Voice | Produced by |
|--------|------|----------|-------|-------------|
| `CHANGELOG.md` | complete, mechanical | **every** change | developer, Keep-a-Changelog | written per PR under `## Unreleased` |
| `RELEASE-NOTES.md` ("What's new") | curated, narrative | only what a non-technical reader cares about | plain, lightly marketing | **written** by the maintainer at release |

The release notes are **not the changelog with the boring lines deleted** - they are a
short written narrative. Smaller on purpose: most changes (a refactor, a CSS fix, a
dependency bump) never appear in them. Never per-commit.

## You have this case - say this

**You are opening a PR.** One line, and the entry writes itself in the right voice:

```
> describe this change for the changelog
```

**It is release day and you are the maintainer.** The cut is a deliberate act, never a
side effect of merging:

```
> cut 0.8.0 from what is under Unreleased, and draft the stakeholder release notes from the same source
```

**A stakeholder asks what changed.** They are not asking for the changelog - they are
asking for the other output:

```
> what did the last release actually change for a host? plain language, no internals
```

**Corner case - a contributor bumped the version.** Revert that part. Versions are cut
by the maintainer, from `Unreleased`, once; a PR that adds a version heading has
decided a release happened.

## The only home of history

Change history accumulates here and nowhere else. A living document - a spec,
ARCHITECTURE, a runbook - describes the present and never grows its own
`## Change log` / `## History` section (R4, ADR-018): git holds every past state,
and this process holds the curated record for both audiences. When a change
alters behavior, the spec's *content* changes and the changelog records the
event - three competing histories (in-document, git, changelog) only drift.

## Why one place, and only one

**A pull request writes its change under `## Unreleased`, in `CHANGELOG.md`. There is no
second mechanism.**

There used to be one: a `changes/` folder holding a fragment per pull request, so parallel
PRs never collided on the changelog. It was removed on 2026-08-02, and the reason is worth
keeping because it will be proposed again.

The problem it solved is real but small - a changelog conflict is resolved in seconds by
keeping both lines. The cost was continuous: a folder in every team repo, a convention to
remember on every PR, frontmatter to fill, an assembly step, and a script. **Nothing enforced
it**, so the realistic outcome was a repo whose history was half fragments and half direct
edits - worse than either alone. And the folder was `required` while the practice was not
checked, so a team could be compliant and get no benefit at all.

The audience tagging it carried was the genuinely good part, and it survives without the
folder: a `## Unreleased` entry says who a change is for in its own words, and the maintainer
writes the release notes from that.


## More than one supported release line

A project that still ships fixes to `3.x` while `4.x` is current has more than one
present tense, and the single `## Unreleased` heading is not one slot they share - it is
one heading **per line**. Each maintained release line (R23) carries its own
`CHANGELOG.md` on its own branch, with its own `## Unreleased` and its own cut:
promoting Unreleased on `3.x` moves `3.x`'s version and touches nothing on `main`.

So a security fix shipping to four supported lines is four entries, one per branch it
lands on, each written for the release it will actually appear in - not one entry
claiming four releases at once. That is the mechanism above working per line rather
than an exception to it: FFmpeg's `Changelog` has kept a section per version for
exactly this reason for years. The ordering rule comes with it - the fix lands on the
mainline first, then each supported line as its own PR
([ADR-035](../decision-records/ADR-035-maintained-release-lines-are-integration-targets.md)) -
so no supported line is ever ahead of the mainline in fixes it has and the mainline
does not.

Most repos have one line and can read this section as not applying to them.

## At release (the maintainer cuts it)

1. **Changelog - mechanical.** Promote the `## Unreleased` section into a new
   `## x.y.z - <date>`, grouped by `type`, verbatim. Nothing is dropped.
2. **Release notes - written.** From the entries that name a non-technical audience, *write*
   a short narrative in `RELEASE-NOTES.md`: group by theme, lead with the benefit, cut
   anything a non-technical reader would not care about. Curate hard - three good
   paragraphs beat thirty bullets.
3. Bump `VERSION`; leave a fresh, empty `## Unreleased` heading behind.

Nothing before this writes a version heading or touches `VERSION`. The release is one
deliberate act - and the release notes are the one place **editorial judgement** is
expected, not mechanical assembly.

One repository diverges by design: the standards repository itself. Its PRs bump PATCH
by default and promote `Unreleased` as part of landing (R25, `CONTRIBUTING.md`) - the
maintainer is the reviewer on every PR there, so the separate cut added nothing. That is
its own workflow, never the rule this page describes for an adopting repo.

## Mechanization

The changelog half is mechanical and stack-agnostic (Layer 1: plain files, a maintainer
or an agent can assemble it; a Node/TypeScript repo may mechanize it with the `changesets`
tool, Layer 2). The **release-notes half is deliberately human** - or an agent told to
*write*, not assemble: the curation and the plain-language framing are the whole value,
and they cannot be generated from commit lines.

**No script ships for this, deliberately.** One did - `scripts/changelog.mjs`, which
assembled the block and scaffolded the notes - and it went out with the per-PR fragments
folder on 2026-08-02: with one `## Unreleased` section written in prose, promoting it is a
copy, a heading and a date, and a tool for that is a tool to keep in step for nothing. This
page described it as shipping for two months after it stopped existing, which is the
failure mode the standard is otherwise loud about.

What the manifest does check is that the record exists and has somewhere to write: the file
is a required entry and `## Unreleased` a required section, so a repo cannot lose the heading
and quietly start writing version headings per PR.
