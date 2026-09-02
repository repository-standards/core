---
status: Accepted
date: 2026-09-02
---

# ADR-056: the release tag is made by CI, and the version is stated only where something reads it

## Context

[ADR-025](ADR-025-the-standard-is-living-latest-is-the-target.md) settled what a tag is here:
a milestone for changelogs and update notifications, never an anchor a reference resolves
against. What it never settled is who makes one. Two exist - `1.0.0` and `1.0.1` - and both
were typed by hand after the fact; no workflow, script or gate in this repository creates a
tag or notices a missing one. The project rejects that arrangement explicitly elsewhere:
`docs/open-questions/staying-current.md` turns down the maintainer-marks-it option as
depending on "a human remembering - the class of thing this project usually refuses to rely
on". It was relying on it here.

The second half is what a release cost. `docs/facts.json` declared the version on **nine**
surfaces, and the declaration was itself an undercount of the page it mattered most on:
`site/index.html` stated a version in five places - header pill, disclosure prose, footer,
and twice inside the hero script - of which exactly one was declared, because only the pill
had a structural hook a pattern could bind to. `tools/docsite.mjs` rendered the same number
into the shared shell, so every page of the deployed documentation restated it too -
not in the diff, since `site/docs/` is generated in CI and ignored, but on the site
any reader actually sees.

Two of those places sit inside coupled capabilities, so every version cut fired the spec
coupling guard on `web-surface` and `verify-engine` and was merged past with `--admin`
(`COUPLING-VERSION-1`, measured on this repository 2026-08-19; the same finding is recorded
in the changelog). A guard that fires on every pull request regardless of what changed is
one its own authors are being trained to override, and `--admin` is also the response to a
real coupling violation, so the override carries no information either way.

So: the number that names a release lived in ten places and was checked by two guards, and
the one artifact that actually publishes a release - the tag - was made by memory.

## Decision

**The tag is created by CI.** `.github/workflows/release-tag.yml` runs on every push to
`main`: it reads `VERSION`, exits successfully if that version is already tagged, builds an
annotated tag whose body is that release's own `###` headings from `CHANGELOG.md`, and
pushes it. Its own workflow file rather than a job in `pages.yml`, because tagging needs
`contents: write` where the deploy runs on `contents: read`, and because `pages.yml` carries
`cancel-in-progress: true` - a cancelled deploy costs nothing, a cancelled tag is
unrecoverable, since the next run reads only the newer `VERSION` and the version it stepped
over is never tagged and never mentioned.

**The landing reads the newest tag at runtime.** The header pill fetches the repository's
tag list from the GitHub API, picks the highest `x.y.z`, and shows it - the same shape as
the "Live adoptions" badge, which has read its count from the stats Worker since
[ADR-047](ADR-047-adoption-ping-is-informed-not-asked-and-minimal.md). The pill starts
hidden and stays hidden if the fetch fails, so the page is silent about the version rather
than confidently wrong about it.

**Nothing else states the version.** The prose that named a number now names the release
line ("the first stable release line"), the usage examples read `--version <x.y.z>`, and
`standard/SPEC.md` says the number lives in `VERSION` instead of repeating it. One
restatement survives, in `standard/standard.manifest.json`, because `self-verify` compares
it against an adopter's `.standards-version` - it is read by a program, not by a reader.

The two gates invert to match. `site-check` fails **any** version-shaped string on the
landing, not merely a wrong one; `tree-check` fails a shipped tree that restates the version
at all. Requiring none rather than the right one is the part that makes the rule decidable:
"the current version appears somewhere" is satisfied by a page showing two numbers, and one
shipped that way - four places reading `0.8.12` beside a pill reading `0.8.13`, with both
gates green.

## Consequences

- A release is now `VERSION`, the `CHANGELOG.md` section, and the manifest's `version` field.
  None of those is code inside a coupled capability, so a cut stops firing the coupling guard
  and `--admin` stops being the routine way a release merges. That is `COUPLING-VERSION-1`'s
  definition of done, reached by the second of its two permitted routes: the version string
  stopped living inside coupled code.
- **Tags from `1.0.2` on are authored by `github-actions[bot]`, not by the maintainer.** That
  is visible on every tag and is the price of the tag existing at all.
- The pill is a network read. A rate-limited or offline visitor sees no version, where before
  they saw one that was occasionally stale. Silence is the failure this trades for.
- The deployed HTML no longer states the version anywhere, so an agent reading the site
  cannot get it from the page. `VERSION` in the repository and the tag list are the sources,
  and both are machine-readable without scraping.
- Eight declared restatements left `docs/facts.json`. The guard watching them was doing real
  work - it caught a landing that was wrong in four places - and the answer here is the one
  `docs/tree/docs-facts-json.md` already named as preferable: a restatement you can delete
  instead of declaring.

## Compliance

`.github/workflows/release-tag.yml` exists and runs on push to `main`; `site/index.html`
contains no version-shaped string and carries the tag fetch beside the adoptions fetch;
`tools/site-check.mjs` fails any version on the landing and `tools/site-check-test.mjs`
drives four fixtures over that rule; `tools/tree-check.mjs` fails a shipped tree that
restates the version; `docs/facts.json`'s `standard-version` fact declares one claim.

## Revisit when

- A release reaches `main` and no tag appears. The workflow would then have failed the way
  memory did, and the next lever is a gate that fails a `VERSION` move whose tag never
  followed - which cannot live in this workflow, because a workflow that did not run cannot
  report that it did not run.
- The pill is empty for a meaningful share of visitors. The GitHub API is rate-limited per
  IP and unauthenticated here; if that bites, the version gets baked in at deploy time from
  the same tag list, which is still a generated copy with a bounded life rather than a
  hand-maintained one.
- Something that cannot read the manifest needs the shipped tree to state its own version.
  The rule is "stated only where something reads it", not "stated once for its own sake", so
  a real reader is a reason to add one back - declared in `docs/facts.json` when it lands.

## Related

- [ADR-025](ADR-025-the-standard-is-living-latest-is-the-target.md) - what a tag is for here,
  and why no reference resolves against one.
- [ADR-047](ADR-047-adoption-ping-is-informed-not-asked-and-minimal.md) - the client-side
  fetch this pill copies, and the one named non-GitHub host on the landing.
