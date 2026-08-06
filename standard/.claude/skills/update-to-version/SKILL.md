---
name: update-to-version
description: Use when someone wants to move to a newer version of the standard - "update me to the latest", "bump the standard", "what changed since we adopted?". Applies only the delta between the state this repo last aligned to and latest, adapted to this repo and preserving its recorded deviations - never a re-scaffold.
---

# update-to-version

The recurring half of the versioned-standard mechanism. `align-to-standards` adopts the
standard the first time; **this** brings an already-aligned repo up to a newer version -
the way you'd bump a dependency, not re-scaffold from scratch.

The repo records the version it is aligned to in **`.standards-version`**. Updating reads
the **delta** between that version and the target, applies only what changed, and proves
the result with `self-verify`.

## Preconditions

- The repo has a `.standards-version`. If it does not, this is a first adoption - use
  `align-to-standards` instead (which writes it).

## Steps

1. **Read current and target versions.** Current = `.standards-version`; target = the
   requested version (or the standard's latest). Equal? There is nothing to apply - skip
   to step 6 and self-verify.

2. **Read the delta, not the whole standard.** The delta is the **file diff between the two
   versions' shipped trees**: in a checkout of the standards repo, `git diff <current-ref>
   <target-ref> -- standard/`. A ref is a release tag where tags exist; where they do not,
   it is the commit each version was cut at, and `VERSION`'s own history names those -
   `git log --format='%h %s' -- VERSION`, then `git show <commit>:VERSION` to see which
   version a commit carries. Nothing else sees all of the delta. The manifest and the
   changelog index that diff; neither stands in for it.

   - The **manifest diff** (`standard.manifest.json`, ADR-005, keyed by kind + id/path)
     says which *entries* arrived, changed shape, or went away: a new required file, an
     entry that stopped being required, a changed profile, changed `requiredKeys`. It does
     not say what changed *inside* a file the standard already shipped. Only `copy` entries
     carry a `sha256`; `merge` and `fill-from-repo` entries carry none, by design - so a
     release that rewrote a spec template, a workflow or `AGENTS.md` can move nothing in the
     manifest but the version string. Read it as an index, never as the delta.
   - The **`CHANGELOG.md`** between the two versions gives the prose: what each change is
     for and what it asks of you. It is not a file list and does not claim to be one.

   Enumerate **only** what the update introduces, changes, or removes - from the file diff,
   read against the other two.

   **Where the two trees come from:** one checkout of the standards repo, read at two refs -
   the target version's and the one in `.standards-version`. That needs its history, not a
   snapshot of latest.

   **If the current version's tree cannot be had,** the delta is partial and must be
   reported as partial rather than as the whole. The manifest copy this repo carries records
   a `sha256` for every `copy` entry, so those files can still be compared exactly against
   the target's; every `merge` and `fill-from-repo` file is then unenumerated, with only the
   changelog covering it. Say which half you could not diff. (A manifest from before hashes
   shipped carries none, and then that half is gone too - read the changelog and say so.)

   **The stack layer updates too:** if the repo carries a `stack.manifest.json` - or one
   `stack.<technology>.manifest.json` per stack, where more than one coexists - re-read
   each from its stack repo's checkout and apply its entry deltas the same way. A stack
   is linked by the registry pointer, never by a core version (ADR-022), so each one's
   update rides on its own clock, and updating one never implies the others.

3. **Apply the delta, adapted - never a blind re-scaffold.** For each changed item:
   - the repo has **not** diverged here -> apply it, adapted to this repo's stack and
     language (same rule as `align-to-standards`: reconcile, do not blind-copy);
   - the item was **removed** in the target -> remove or migrate the repo's use of it;
   - re-applying the whole standard is wrong - it erases the repo's local adaptation.

4. **Preserve local deviations.** Where the repo deliberately deviates from a standard
   default (its own superseding ADR, per ADR-004 on link-not-copy), the update **must
   not** clobber it. Such deviations live as `exceptions` entries in the repo's manifest;
   carry them forward. Detect the conflict, keep the repo's decision, and record what the
   new version would otherwise have changed so the human can reconcile it consciously.

   **A `copy` file the repo edited will surface here as content drift, and that is the
   mechanism working**, not a regression: the manifest records what each `copy` entry must
   hash to, so a locally changed guard, `.nvmrc` or skill is now visible instead of silent.
   Take the standard's copy where the change was accidental; where it was deliberate, record
   `{ "kind": "content", "match": "<path>", "reason": "..." }` and leave the repo's file
   alone. Never resolve it by excepting a guard's script file - that is refused, because it
   would disable a live check rather than record a difference.

5. **Bump the pin and the manifest.** Write the target version to `.standards-version`,
   and replace `standard.manifest.json` with the target version's manifest (carrying the
   repo's `exceptions` forward). The pin and the manifest move together.

6. **Self-verify.** Run the compliance check - `node scripts/self-verify.mjs --version <target>`
   (see `self-verify.md` (by reference)). It must pass: the pin matches the manifest, every required
   entry is met, the guards are green - **drift 0**. Do not open the PR on a red self-verify.

7. **One focused PR.** Title it with the version move (`update to repository-standards
   @<target>`); summarize what the delta changed and any preserved deviation. Never push
   without the human's go; never reference other repos.

## Not this

- **Not a re-scaffold** - re-applying every template overwrites the repo's real content
  with placeholders and erases local adaptation. Apply the delta only.
- **Not a clobber of deviations** - a client-owned superseding decision outranks the
  standard's default; surface the conflict, do not silently overwrite it.
- **Not a delta read off the manifest alone** - it records entries, and the content of the
  `copy` ones. A release that only moved templates, workflows or prose changes nothing in it
  and still has to be applied. Diff the trees.
- **Not "done" on an unread changelog** - if you cannot determine the delta between the
  versions, stop and say so rather than re-applying blindly.
- **Not merged on a red self-verify** - the update is complete only when the repo proves
  it complies with the target version.

## Close the loop upstream

If the update hit friction - a delta entry that could not be applied as written, a
deviation the new version silently collides with, a question the changelog should
have answered - **offer** the user (per item, never automatically) to file it as an
`adoption-friction` issue on `repository-standards/core`, or a PR when the
fix is a concrete doc change. The standard absorbs what its updates teach.
