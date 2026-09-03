---
name: update-to-latest
description: Use when someone wants to move to a newer version of the standard - "update me to the latest", "bump the standard", "what changed since we adopted?". Applies only the delta between the tree this repo last aligned to and latest, adapted to this repo and preserving its recorded deviations - never a re-scaffold.
---

# update-to-latest

The recurring half of the versioned-standard mechanism. `align-to-standards` adopts the
standard the first time; **this** brings an already-aligned repo up to the standard's
latest - the way you'd bump a dependency, not re-scaffold from scratch.

The target is always latest, never a pin: `.standards-version` is a bookmark of where the
repo got to, not a version it is held at (standard ADR-025). Updating reads the **delta** between the
tree the repo last aligned to and latest, applies only what changed, and proves the result
with `self-verify`.

## Preconditions

- The repo has a `.standards-version`. If it does not, this is a first adoption - use
  `align-to-standards` instead (which writes it).

## Steps

1. **Find the tree this repo aligned to.** Read `provenanceCommit` from
   `standard.manifest.json` - the standards repo commit this repo last aligned to. That
   commit, not a version string, is what the delta is measured from.

   **If the field is absent or null** (a repo aligned before it shipped), back-fill it once:
   resolve `.standards-version` to the commit that cut it - `git log --format='%h %s' --
   VERSION` in a checkout of the standards repo, then `git show <commit>:VERSION` to confirm
   which version a commit carries - and use that. It is a one-time approximation, and it is
   approximate on purpose: since the standard's own PRs bump PATCH by default (R25), `main` carries unreleased change
   under a version number that has not shipped, so a version string names a range of trees
   rather than one (standard ADR-052). Say in the PR that the base was back-filled. From this run on,
   the field is exact.

   Target = the standard's latest (`origin/main`), unless the user named something else.
   Already at latest? There is nothing to apply - skip to step 6 and self-verify.

2. **Read the delta, not the whole standard.** The delta is the **file diff between the two
   trees**: in a checkout of the standards repo, `git diff <provenanceCommit> <target-ref> --
   standard/`. Nothing else sees all of the delta. The manifest and the changelog index that
   diff; neither stands in for it.

   - The **manifest diff** (`standard.manifest.json`, standard ADR-005, keyed by kind + id/path)
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
   the target's and this repo's `provenanceCommit`. That needs its history, not a snapshot of
   latest, so it is a clone and never a `degit`:

   ```
   git clone https://github.com/repository-standards/core.git /tmp/repository-standards-core
   ```

   Clone it outside this repo (or into a gitignored path); it is a reference to read the
   delta from, never a directory to commit. If the repo follows a fork of the standard,
   clone that instead - the `STANDARD_REPO` the update-watch workflow names is the same
   pointer. Nothing in the steps below can run before this exists, which is why it is
   written here rather than left to the standard's own README, a file this repo does not
   carry.

   **If the aligned-to tree cannot be had,** the delta is partial and must be
   reported as partial rather than as the whole. The manifest copy this repo carries records
   a `sha256` for every `copy` entry, so those files can still be compared exactly against
   the target's; every `merge` and `fill-from-repo` file is then unenumerated, with only the
   changelog covering it. Say which half you could not diff. (A manifest from before hashes
   shipped carries none, and then that half is gone too - read the changelog and say so.)

   **The stack layer updates too:** if the repo carries a `stack.manifest.json` - or one
   `stack.<technology>.manifest.json` per stack, where more than one coexists - re-read
   each from its stack repo's checkout and apply its entry deltas the same way. A stack
   is linked by the registry pointer, never by a core version (standard ADR-022), so each one's
   update rides on its own clock, and updating one never implies the others.

3. **Apply the delta, adapted - never a blind re-scaffold.** For each changed item:
   - the repo has **not** diverged here -> apply it, adapted to this repo's stack and
     language (same rule as `align-to-standards`: reconcile, do not blind-copy);
   - the item **changed upstream and this repo also changed it locally** -> this is the
     ordinary case, not the exception: `merge` and `fill-from-repo` entries are adapted
     at adoption by definition, so almost every one of them is diverged the moment the
     release touches it. **Merge the two, three-way**, against the entry's own reference
     copy at the aligned-to commit - that file is the base, the target's file is
     theirs, the repo's file is ours. Take the upstream addition, keep the local
     adaptation, and where the two genuinely collide, say what collided and let the human
     choose; a `copy` entry resolves as step 4 describes, by hash. **Never skip the file
     because it "has local content"** - it always does, and skipping is how a release's
     additions go unapplied while `self-verify` still says drift 0: these entries carry
     no `sha256`, so nothing downstream will ever notice the miss. Report every file
     merged this way and every collision the human decided;
   - the item **moved** - a renamed file, or a directory the standard reorganised -> move
     this repo's content to the new path, rather than adding the new path beside the old one.
     A rename reaches the manifest as one entry gone and one entry arrived, and the target's
     `removedPaths` names the old path; a repo that ends up carrying both satisfies every
     "required entry is present" check and is still wrong, with its content split across two
     places and every link pointing at the older half;
   - the item was **removed** in the target -> remove or migrate the repo's use of it, and
     check the target manifest's `removedPaths` for an entry naming it. That list is what
     self-verify checks in step 6, so a removal skipped here fails there rather than passing
     quietly the way it used to (standard ADR-052). Where the repo deliberately keeps a removed path,
     record it as an exception in step 4 - not as a silent miss;
   - re-applying the whole standard is wrong - it erases the repo's local adaptation.

   **A layer that binds the session lands first, and then the session restarts.** Some of
   what the standard ships is not a file the repo merely carries - it changes what an agent is
   allowed to do while it runs. The elicitation layer is the one that exists today:
   `.claude/hooks/elicitation-guard.mjs`, `.claude/elicitation/points.json`, the `PreToolUse`
   entry in `.claude/settings.json`, and `docs/adoption-provenance.md`. A `PreToolUse` hook
   binds when the session starts, so a session that began before those files existed has no
   guard however faithfully this update copied them in. Apply those four first, commit them,
   then stop and have the user restart the session before the rest of the delta is applied.
   None of the four is gated by any point, so the ordering costs nothing - and skipping it
   means the remainder of this update writes gated artifacts with the guard inert, which is
   the exact run the layer was built to stop.

   The `PreToolUse` entry is the half that gets dropped, because `.claude/settings.json` is a
   `merge` entry every repo has edited: adding a matcher to a list somebody else also writes to
   is not a file copy, and an update that lands the hook script without wiring it produces a
   guard that never runs and a repo that believes it has one.

   **Do not back-fill the ledger.** It arrives with every row `pending`, and that is accurate -
   nobody in this repo has been asked anything. Rows move to a real state when a question is
   really put, which for most points is the next time this repo does something they gate.
   Writing `human` across the table so the check goes quiet is precisely the fabrication this
   layer exists to catch, committed by the run that installed it.

4. **Preserve local deviations.** Where the repo deliberately deviates from a standard
   default (its own superseding ADR, per standard ADR-004 on link-not-copy), the update **must
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

5. **Bump the bookmark and the manifest.** Write the target's version to
   `.standards-version`, and replace `standard.manifest.json` with the target's manifest
   (carrying the repo's `exceptions` **and its top-level `profile`** forward - both are this
   repo's answers, not the standard's, and the shipped manifest carries a default `profile`
   that would silently move a core repo onto the scale gate). Set `provenanceCommit` to the
   **full SHA of the target ref you actually diffed against** - not latest-as-of-now, which
   may have moved while the update was being applied. Bookmark, manifest and provenance move
   together; the next update measures from the SHA.

   **This write is gated, and the refusal is the point.** `adopt.profile` gates
   `standard.manifest.json`, so once the layer from step 3 is live the guard stops this write
   until the profile has actually been put to somebody in this session. Carrying the existing
   `profile` forward is not an answer to it - a repo that grew from two people to a team
   between versions is exactly the case where the value on disk is stale and nothing else in
   the update would ever notice. Ask, confirm what the history suggests, and carry the
   confirmed value. Do not stub it and do not take the matcher back out to get past it.

6. **Self-verify - against the whole tree, not against the delta.** Run the compliance check -
   `node scripts/self-verify.mjs --version <target>` (see `self-verify.md` (by reference)). It
   must pass: the bookmark matches the manifest, every required entry is met, every
   `removedPaths` entry is actually gone, the guards are green - **drift 0**. Do not open the PR
   on a red self-verify.

   Reading the whole tree is the point of running it here rather than trusting that the delta
   was applied. An update is measured against what changed between two versions; compliance is
   measured against the target, and those are different sets. A directory the standard
   reorganised three versions ago that this repo never followed, a required entry someone
   deleted locally, a `removedPaths` path still sitting there - none of that is in this update's
   diff, and all of it is drift against the target. If self-verify surfaces drift the delta
   never mentioned, that is not noise to route around: it is the older miss this update finally
   made visible, and it is fixed here.

7. **One focused PR.** Title it with the version move (`update to repository-standards
   @<target>`); summarize what the delta changed and any preserved deviation. Never push
   without the human's go; never reference other repos.

## Not this

- **Not a re-scaffold** - re-applying every template overwrites the repo's real content
  with placeholders and erases local adaptation. Apply the delta only.
- **Not a clobber of deviations** - a client-owned superseding decision outranks the
  standard's default; surface the conflict, do not silently overwrite it.
- **Not a skip of the diverged files either** - the opposite failure, and the quieter one.
  A `merge` or `fill-from-repo` file left untouched because the repo has its own content in
  it drops the release's change on the floor, and no hash exists to report it.
- **Not a delta read off the manifest alone** - it records entries, and the content of the
  `copy` ones. A release that only moved templates, workflows or prose changes nothing in it
  and still has to be applied. Diff the trees.
- **Not "done" on an unread changelog** - if you cannot determine the delta between the
  two trees, stop and say so rather than re-applying blindly.
- **Not a removal left half-applied** - a path the target removed and this repo still carries
  is drift, and since standard ADR-052 self-verify says so. Delete it, migrate it, or except it
  deliberately; do not leave it and call the update done.
- **Not a delta measured from the version string** - two trees can carry the same version
  number, since the standard's own PRs bump PATCH by default (R25) and `main` runs ahead of what shipped.
  `provenanceCommit` names one tree; `.standards-version` names a bookmark for humans.
- **Not a hook landed without its wiring** - copying `elicitation-guard.mjs` while leaving
  `.claude/settings.json` unmerged ships a guard that never fires, and a repo that thinks it is
  guarded is worse off than one that knows it is not. The guard and `points.json` move as a pair
  for the same reason: the guard reads each point's `scope` to know which questions a committed
  answer already settles, so a new guard over an old point list refuses ordinary work until
  somebody re-asks an adoption question.
- **Not a ledger back-filled to make the check quiet** - `pending` is the honest state for a
  repo nobody has asked yet, and it is not a failure to be cleared.
- **Not a compliance claim scoped to the delta** - drift 0 is a statement about the whole tree
  against the target. An update that applied its own diff perfectly and left a three-version-old
  structural miss in place has not reached it.
- **Not merged on a red self-verify** - the update is complete only when the repo proves
  it complies with the target.

## Close the loop upstream

If the update hit friction - a delta entry that could not be applied as written, a
deviation the new version silently collides with, a question the changelog should
have answered - **offer** the user (per item, never automatically) to file it as an
`adoption-friction` issue on `repository-standards/core`, or a PR when the
fix is a concrete doc change. The standard absorbs what its updates teach.
