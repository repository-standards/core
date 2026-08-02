# How a repo finds out the standard moved

**Open, and the doubt is structural rather than a matter of tooling.**
[ADR-025](../decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) named a
channel - a Renovate custom manager watching `.standards-version`, plus a shipped watch workflow
for repos without a bot - and the workflow is built and shipped. What was never resolved is that
**the channel is release-based while the standard is main-based**, and those are different
things.

## The mismatch, concretely

`standards-update-watch.yml` asks GitHub for `releases/latest` and compares it to the repo's
recorded state. That is a good, quiet design: it fires rarely and only on a deliberate
milestone.

But ADR-025 also says the target of every align and update is **latest**, that references
resolve at `main` deliberately, and that `main` *is* the living standard. Between two releases,
`main` moves - sometimes a great deal, as it did on 2026-08-02 - and no adopter is told
anything. A repo can be months behind the standard it follows and see a green watch the whole
time.

So the notification answers "has a milestone been cut" when the question the design implies is
"has the thing I true up to changed".

## Why not simply watch `main`

Because the obvious fix is worse. A watch on `main` fires on every commit, including a typo in
a FAQ. An adopter who gets told to update fourteen times in a week stops reading the
notification, and a channel nobody reads is worse than none - it is the same failure mode as a
gate that fires when nothing is wrong.

The interesting middle ground is that **not every change to `main` is worth an adopter's
attention**, and nothing in the repo currently distinguishes them. A rule change touches every
adopted repo; a reworded FAQ touches none. The standard already knows how to make that
distinction for other purposes - the manifest names what an aligned repo must have, and
`CHANGELOG.md` is written per change - so the signal may exist without a new mechanism.

## Options, none of them chosen

- **A - Releases only** (what ships today). Quiet and deliberate; goes silent for as long as the
  maintainer does not cut a tag, which pre-1.0 has been forever.
- **B - Watch `main`.** Always current, unusable in practice, for the reason above.
- **C - Watch the manifest, not the repo.** Fire when `standard.manifest.json` changes - the
  file that defines what compliant means. Prose changes stay silent, requirement changes speak.
  Attractive, and it under-reports: a rule can tighten in `SPEC.md` with the manifest untouched.
- **D - The maintainer marks adopter-affecting changes**, and the channel watches for that mark.
  Most accurate, and it depends on a human remembering - the class of thing this project
  usually refuses to rely on.
- **E - Drop the notification; re-run alignment on a cadence.** The owner's own framing is that
  adoption is not work-done - a repo can point at the standard again every couple of months and
  take the delta. That makes staying current a habit rather than a channel, and it needs no
  mechanism at all. It also means a repo is only as current as its last deliberate run.

## What settles it

Not argument. **One adopter running behind for a while, and someone noticing what they missed
and how they found out.** That is `FIELD-1` territory, and until a repo that is not ours has
been out of date for a month or two, every option above is a guess about a cost nobody has paid.

Until then the shipped watch stays as it is - it is honest about having nothing to say when no
release exists, which is the correct behaviour for a mechanism whose premise is unresolved.

## Related

- [ADR-025](../decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) - the
  decision this implements and the one it does not fully satisfy.
- `standard/.github/workflows/standards-update-watch.yml` - the shipped watch.
- [`npm-as-a-channel`](npm-as-a-channel.md) - ADR-025 floated npm as part of the same channel;
  that half is its own open question.
