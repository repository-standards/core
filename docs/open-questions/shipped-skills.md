# How many lifecycle skills ship into every adopted repo

**Decided:** one family - the five engine steps plus impact/update/reconcile,
backlog capture, discovery digest, pre-pr-review and update-to-version. They
ship into every adopted repo, currently 15, and each skill's name and
description ride in the agent's context every turn.

**The count moved again on 2026-08-02**, from 12 to 15, when the work cycles landed
(`cycle-open`, `cycle-close`; ADR-028). That was a decided addition rather than a drift -
but it is the third time this number has grown, and the third growth is the one that
should decide whether the ceiling is real or whether this family simply has a different
one. [`authoring-skills`](authoring-skills.md) proposes a fourth growth and is deliberately
blocked on this question.

**Doubt:** respected skill collections treat eight to ten committed skills as
the ceiling (Anthropic's flagship collection ships 17 for every domain
combined, as a plugin, not per-repo), and the five engine steps might collapse
into fewer without losing the loop. The family has grown twice since that
ceiling was noted, which sharpens the question rather than answering it - and
the growth arrived one useful skill at a time, which is exactly how a ceiling
gets passed without anyone deciding to pass it.

**A better answer would:** field evidence on trigger reliability and context
cost from real adopted repos - or a merge that keeps every verb reachable with
fewer slots.
