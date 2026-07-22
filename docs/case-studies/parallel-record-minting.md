# Parallel record minting (antipattern)

**Situation.** Two branches in the same repo, both moving fast, both doing the right
thing: recording their decisions as they went.

**What happened.** Each branch minted the next free record number - the same one. A
business-decision record numbered on one branch collided with a different decision
carrying the same number already merged on `main`. The collision surfaced at review;
the fix was a renumbering commit and a re-read of every reference to the old number.

**The antipattern.** *Minting identifiers off a stale view.* Record numbers are global,
gapless, and never reused - which means the only safe moment to claim one is against
current `main`, not against however old your branch is.

**What the standard does about it.** The records README states the discipline (gapless,
never reused, check `main` before minting); the record index in each stream's README
makes the current highwater number one glance away; and review treats a number collision
as a blocker, not a nit.

**Where it lives now.** `decision-records/README.md` + the per-stream index
(`adr/README.md`, `bdr/README.md`).
