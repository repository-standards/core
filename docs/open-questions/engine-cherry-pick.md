# Engine improvements are cherry-picked by hand (ADR-015)

**Decided:** the five engine prompts (specify, clarify, plan, tasks, implement)
are extracted as the standard's own skills; no byte-diffability with
github/spec-kit; sync means reading upstream's prompt changes at release time.

**Why:** the vendored area cost a third of the repo's markdown, committed twice,
for a surface the loop half-used - a 326-line script nothing invoked, ~600 lines
of hook boilerplate scanning for a file that never shipped, two skill families
competing for the same verbs.

**Options weighed:** status quo vendoring (weight plus a hand-maintained
15-file render per sync); no vendoring at all, clients run upstream's CLI
(re-creates what ADR-013 rejected: unpatched layouts, no gate, a Python
toolchain at adoption, exposure to an upstream that ships ~10 releases per
8 days and has had one breaking change and one near-abandonment scare).

**Doubt:** without a mechanical diff, the five prompts could quietly fall behind
upstream's state of the art.

**A better answer would:** a few release cycles proving the cherry-pick check
stays cheap - or evidence that it does not, which reopens vendoring with better
tooling.
