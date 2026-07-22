# One authored tree (ADR-014)

**Decided:** a single authored `standard/` tree, shipped as-is at the paths a
real repo uses - no source/dist split, no build step, no reflect machinery.

**Why:** measured, not felt. The old pair held 47 committed byte-duplicates and
27 hand-synced "divergent" pairs that the drift tool never content-compared;
four live drifts shipped that way in one day, including a skeleton that failed
its own self-verify. Every change paid twice (48 dist path-touches vs 93 source
in the last 20 commits before the collapse).

## Options weighed

| Option | Why not |
|---|---|
| Keep the pair | the duplication and the unverifiable class were the finding, not a style choice |
| Author in dist for the copy class only | kills the cheap half, keeps the 27 hand-synced pairs where every real drift lived |
| Build dist at release, commit nothing | kills the degit one-liner; demands mechanizing 27 hand transforms first |
| **One committed tree (chosen)** | zero duplication by construction; drift between copies becomes impossible rather than detected |

Worth remembering: the owner had resolved "dist/ stays" earlier the same day, on
the reasoning that dist reads as generated output. The measurement overturned it -
reflect never actually built the divergent 35%, so the "output" framing did not
hold. A resolution reversed within a day, by evidence, is this file's genre
working as intended.

**Doubt:** template shells and hand-authored docs now mix in one tree,
distinguished only by the manifest's `adapt` field; a reader browsing cannot
tell "fill this in" from "read as-is" without it.

**A better answer would:** evidence from the first real adoption that the mix
confuses nobody - or a marker convention cheaper than a second tree.
