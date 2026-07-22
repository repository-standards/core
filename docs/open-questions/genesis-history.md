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
