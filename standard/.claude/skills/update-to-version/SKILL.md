---
name: update-to-version
description: Update a repo that already follows repository-standards from its current pinned version to a target version - read the delta between the two versions, apply just that (adapted to this repo, preserving local deviations), bump .standards-version, then self-verify. Not a re-scaffold.
disable-model-invocation: true
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

2. **Read the delta, not the whole standard.** The precise delta is the diff of the two
   versions' **`standard.manifest.json`** (ADR-005), keyed by kind + id/path: entries
   added (their `since` equals the target or a version in between), changed, or removed
   between current and target. The `CHANGELOG.md` between the two versions gives the prose
   for each. Enumerate **only** what the update introduces, changes, or removes.

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

5. **Bump the pin and the manifest.** Write the target version to `.standards-version`,
   and replace `standard.manifest.json` with the target version's manifest (carrying the
   repo's `exceptions` forward). The pin and the manifest move together.

6. **Self-verify.** Run the compliance check - `node scripts/self-verify.mjs --version <target>`
   (see `docs/self-verify.md`). It must pass: the pin matches the manifest, every required
   entry is met, the guards are green - **drift 0**. Do not open the PR on a red self-verify.

7. **One focused PR.** Title it with the version move (`update to repository-standards
   @<target>`); summarize what the delta changed and any preserved deviation. Never push
   without the human's go; never reference other repos.

## Not this

- **Not a re-scaffold** - re-applying every template overwrites the repo's real content
  with placeholders and erases local adaptation. Apply the delta only.
- **Not a clobber of deviations** - a client-owned superseding decision outranks the
  standard's default; surface the conflict, do not silently overwrite it.
- **Not "done" on an unread changelog** - if you cannot determine the delta between the
  versions, stop and say so rather than re-applying blindly.
- **Not merged on a red self-verify** - the update is complete only when the repo proves
  it complies with the target version.
