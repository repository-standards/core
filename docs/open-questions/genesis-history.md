# Genesis history for the org move

**Decided:** if the repos move to the `repository-standards` org, they start
clean-slate - no transfer of the build-era history and its 51 PRs. The genesis
is a curated commit sequence in dependency order (spec -> entry -> records ->
specs -> skills -> verify -> surface), each commit a chapter, with honest dates.
The product's past lives in the CHANGELOG, which travels; the old repo stays as
the owner's private archive.

**Why:** git is mechanics, the changelog is the history - the repo's own
doctrine. A dependency-ordered sequence is also documentation an agent can walk:
what stands on what.

**Options weighed:** transferring full history (drags scaffolding-era noise into
a repo that sells clarity); synthetic backdated history simulating an evolution
that never happened (theatre - order may be narrative, timestamps may not lie);
plain squash to one commit (loses the didactic sequence for free).

**The boundary that stays:** rationale and considered alternatives live in
records and in this catalog - never in PR comments or commit bodies alone. R3
and ADR-012 bind the genesis too: knowledge existing only in a conversation does
not exist. This catalog is itself the distillation of one such conversation,
made durable before it expired.

**A better answer would:** proof either way from executing it - a genesis
sequence agents actually navigate better, or evidence nobody reads history and
one commit would have done.

**Applied a second time, narrower (2026-08-10, cutting 0.9.0):** the org-move
pass above rewrote everything up to 0.8.13 from scratch. This one only touched
the 270 commits since: six of them existed solely to correct the commit
immediately before them - three self-review follow-ups and three manifest-hash
regenerations, real work but with no standalone content once folded. Each was
merged into the commit it corrected, taking that commit's tree and the later,
correcting commit's date; the other 264 keep their own words, order and dates
untouched. No commit was reordered or re-narrated, and the resulting tree is
byte-identical to the branch before the fold - only which commit a diff belongs
to changed, never what the diff contains. The same doctrine as above, applied
at release-cut granularity rather than as a one-time clean start.

**Applied a third time (2026-08-19, cutting 1.0.0):** this pass, unlike the second,
changed bytes - deliberately and in one dimension. The releases that had shipped as
1.0.0-1.0.13 and 1.1.0-1.1.25 were renumbered to 0.8.0-0.8.13 and 0.9.0-0.9.25 in every
commit since the tree first shipped: version strings in blobs and commit messages,
release-cut subjects, changelog headings, and the manifest's own hashes recomputed where
a hashed file's bytes moved. The reason is the number itself: the line was called 1.x
before it had earned stability, and cutting a real 1.0.0 on top would have given one name
to two different trees. External versions the standard merely cites (Conventional Commits
1.0.0, Keep a Changelog 1.1.2) and illustrative examples were left untouched. Alongside
the renumbering: three more fixups folded under exactly the second pass's rule, eight
subjects given the Conventional Commits prefix they lacked (their words kept), and five
commit references in documents re-pointed at the hashes the replay produced - two of
which the second pass had already orphaned. Order, authorship and dates are untouched
everywhere: order may be narrative, timestamps may not lie.
