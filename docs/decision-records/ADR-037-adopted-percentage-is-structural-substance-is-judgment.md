# ADR-037: The adopted percentage measures structure; substance stays the judgment tier

| | |
| --- | --- |
| **Status** | Accepted (2026-08-06) |
| **Date** | 2026-08-06 |
| **Author** | Łukasz Bodurka |
| **Tags** | verification, metrics, honesty |

## Context

`self-verify` reports a drift number and an adopted percentage. Three classes of manifest
entry are scored differently, and one of them is scored on almost nothing:

- a `copy` entry carries a `sha256` and is compared against it (added in `c10cbf2`),
- a `merge` entry cannot be hashed - it is adapted on purpose - so it may declare
  `requiredKeys` naming what must survive the merge,
- a **`fill-from-repo`** entry has neither, and by construction cannot have either: the
  adopter writes the content, so there is no reference to compare it against.

The consequence was measured, not argued. On a sparse repository carrying the manifest and
little else, six files reading `# Title` and `TODO.` moved the reading from
`drift 19 - 21% adopted (5/24)` to `drift 19 - 37% adopted (11/30)`. Real substance
identical, drift identical, **sixteen percentage points** bought by creating six files that
say nothing. `CONTRIBUTING.md`, `SECURITY.md`, `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`
each scored `PASS` on three lines.

A placeholder warning already existed and is explicitly "a warning, never drift: substance
stays the judgment tier's call." It had two holes: it only recognised **surviving template
placeholders**, so a stub the adopter typed themselves was invisible to it, and it walked a
**hardcoded list of eight files** that `CONTRIBUTING.md` was never on - a second source of
truth beside the manifest, quietly not covering what the manifest added.

## Options considered

- **A - Required sections per `fill-from-repo` entry.** `self-verify` already has a
  `sections` mechanism, so each entry could declare headings its file must contain. Rejected:
  it converts substance into ceremony. An adopter adds the heading and writes `TODO` under it,
  and the number goes green on strictly less information than before, because now the repo
  looks structured too. It also imposes a document shape on files whose whole classification
  is that the adopter writes them their way, and it would move these entries into **drift**,
  changing what the number means for every repo already adopted.
- **B - A minimum-substance signal: word count, or a threshold of prose.** Rejected: it is
  measuring prose by the yard. A genuine two-sentence `SECURITY.md` naming an address and a
  response time is complete; a padded one is not better. Any threshold that fails the first
  while passing the second teaches adopters to pad, and the threshold itself would have no
  defensible value - a number nobody can justify is a number nobody should gate on.
- **C - Say what the number is, detect only what is unambiguous, and leave the rest to
  review (chosen).**

## Decision

Option **C**, in three parts.

1. **The adopted percentage is a structural measure and says so where it is printed.** It
   counts entries present, and content only where the content is the standard's own. When any
   authored file reads as unfilled, the verdict line states that the percentage counts
   entries present, not substance written. No numbered rule changes; what changes is that the
   number stops being readable as a claim it was never making.

2. **The warning detects "visibly nothing written", never "not enough written".** Two shapes
   only, both unambiguous and both cleared by writing one real sentence: a body with no
   content beyond its headings, and a body whose entire content is a marker meaning nobody has
   written this yet (`TODO`, `TBD`, `WIP`, `coming soon` and their spellings). Still a
   warning, never drift.

3. **The file list is derived from the manifest**, not written in the script. The hardcoded
   list was the reason `CONTRIBUTING.md` was checked by nothing; any `fill-from-repo` entry
   added later would have inherited the same gap.

**Whether what IS written is any good remains the judgment tier** - reviewed at PR, as
`self-verify.md` describes. That is not a gap being tolerated; it is the only honest place for
it. No mechanical check can tell a real architecture page from a plausible one, and a check
that pretends to is worse than none, because it converts a reviewer's question into a green
tick.

## Consequences

- Positive: the number can no longer be inflated silently. Padding a repo with empty files
  now produces a named warning per file and a verdict line that says what the percentage
  counts. The manifest becomes the single source of truth for which files are authored.
- Positive: no existing adopter's drift number changes. The addition is warnings and wording,
  so nobody's CI turns red on a release that only clarified what the number meant.
- Negative: a determined adopter can still clear the warning by writing one real but empty
  sentence. That is accepted deliberately - the alternative is option B, and the cost of
  option B is teaching everyone to pad.
- Negative: the adopted percentage still rises when files are added, including the standard's
  own copied files. That is a separate and wider observation about the metric, recorded in the
  validation suite rather than resolved here.

## Confirmation

`tools/self-verify-fill-test.mjs` carries the boundary in both directions: a self-written
`TODO` stub warns, a heading-only file warns, each spelling of the nothing-yet marker warns,
and a terse-but-real `SECURITY.md` and `CONTRIBUTING.md` do not. Neutralising the check turns
exactly the three positive cases red and leaves the two negative ones green, so a fix that
warned about everything would fail this record as surely as one that warned about nothing.

`docs/method/self-verify.md` states the split under "Which rules the number covers" and in the
judgment-tier section.

## Revisit when

A `fill-from-repo` entry acquires a genuinely machine-checkable property that is not a proxy
for prose quality - a `SECURITY.md` that must contain a reachable contact, say, where
reachability is testable. At that point the entry has something real to check and belongs in
drift, and this record should be narrowed rather than worked around.
