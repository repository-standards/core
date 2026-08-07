# tools/ - this repo's own gate tooling (zone 1, never shipped)

Maintainer machinery for the standard repo itself; a consuming repo gets `scripts/`
(self-verify + guards + changelog assembler) inside the shipped tree instead.

## Contents

| Tool | What it does |
|---|---|
| [tree-check.mjs](tree-check.mjs) | guards the single shipped tree (`standard/`): no repo-own leaks, every manifest promise present, and the tree passes its own `self-verify --skeleton` |
| [link-check.mjs](link-check.mjs) | every relative markdown link in the repo resolves; template placeholder lines are skipped |
| [prose-check.mjs](prose-check.mjs) | markdown that renders as something other than what it says, or breaks a writing rule this project publishes. Two rules: a hyphen wrapping to the start of a line and becoming an orphan bullet, which had already shipped on two pages before the check existed; and the em/en dash the shipped conventions forbid, which was enforced only on the generated site HTML while six of them sat in two shipped skills, going out with every adoption. A dash inside a code span passes, because that is how the rule names the character it bans |
| [provenance-check.mjs](provenance-check.mjs) | every file in the vendored spec engine names where it came from - an upstream line or a `PATCHED` marker. Five had drifted carrying neither, and the spec's own acceptance criterion had nothing enforcing it |
| [docsite.mjs](docsite.mjs) | renders the docs site (`site/docs/`, gitignored) from the repo's own md - one source, two surfaces |
| [site-check.mjs](site-check.mjs) | the e2e gate for our own surfaces: landing tags balanced + quotes the positioning one-liner verbatim + GitHub-only hosts + every version string on the page is the one in `VERSION`; generated docs pages complete, internal links resolve, no md leaks |
| [site-check-test.mjs](site-check-test.mjs) | drives the landing gate over fixture sites - a page carrying a second, stale version fails, and SVG path data still does not count as one |
| [site-behaviour.mjs](site-behaviour.mjs) | the site rules about how a page **behaves** rather than whether it parses - a shelf that never closed, two `<h1>`s on one page, a nav row that never marks itself active. Every one of them shipped past a green site-check and was found by a person |
| [spec-guard-test.mjs](spec-guard-test.mjs) | drives the coupling guard through cases that must fail - a guard nobody tests is a guard that quietly stops firing |
| [schema-pair-test.mjs](schema-pair-test.mjs) | the same for the DDL/typed-twin pair check |
| [facts-check-test.mjs](facts-check-test.mjs) | the same for the derived-facts check, including a surface reworded past its own declaration |
| [sprint-guard-test.mjs](sprint-guard-test.mjs) | the same for the work-sprint guard - including that the shipped template's example rows never count as real ones |
| [clarify-gate-test.mjs](clarify-gate-test.mjs) | the same for the clarify gate, whose false PASS costs the most: everything downstream believes the spec is settled. It has failed open three times, so the cases lean on that direction - while keeping ordinary markdown from reading as an open marker, which is how a gate gets routed around |
| [decision-records-check-test.mjs](decision-records-check-test.mjs) | the same for the record-index guard, reproducing both defects that passed at drift 0 - a duplicate id, and an Accepted record on disk that its index never listed - and pinning that the same number in the two streams is not a collision |
| [skill-map.mjs](skill-map.mjs) | renders `docs/skill-map.md` - what each shipped procedure is for, grouped by the moment it fires - **from the skills' own frontmatter**, and refuses to render at all if a skill belongs to no group, so the catalogue cannot quietly stop covering the tree the way a hand-written one does |
| [file-map.mjs](file-map.mjs) | renders `docs/file-map.md` - what every shipped file is, why, and the rule it enforces - **from the manifest**, so the map cannot disagree with what self-verify checks; `--check` fails CI on a stale copy |
| [manifest-hashes.mjs](manifest-hashes.mjs) | writes the `sha256` for every copy-class manifest entry, so the hash travels inside the manifest an adopted repo already carries - which is what lets a byte comparison work offline, with no shipped tree to compare against |
| [validation.mjs](validation.mjs) | renders the published validation pages from `docs/validation/ai-prompting/`'s own data, so no number on them can drift from the rows behind it; `--check` fails CI on a stale render or an unwaived open failure |
| [human-prompting.mjs](human-prompting.mjs) | the same for the other suite, which had nothing: the three fractions its README calls its headline are counted from the run files rather than asserted in prose, prompt ids are unique and contiguous, every observation cites a row that exists, and a run whose own prose states a fraction must agree with its own turns. Three branches minted colliding ids in one week and one run published a headline its rows did not support |
| [human-prompting-test.mjs](human-prompting-test.mjs) | that each of those refusals actually fires - a duplicate id, a hole in a series, a citation to a row that was renumbered away, a stated fraction that drifted, and a clean corpus that must still pass |
| [validation-test.mjs](validation-test.mjs) | that the headline numbers conserve what the rows say - a finding recorded as fixed stays in the failures-found total whether or not a pull request is cited, so nothing leaves the ledger from both sides at once |
| [self-verify-fill-test.mjs](self-verify-fill-test.mjs) | that the placeholder warning is **clearable** by a properly filled repo and still fires on a real marker (it used to match generic notation, so the file it exists for could never satisfy it), and that removing a required skill or a required `AGENTS.md` section is reported as drift, not silently absorbed by a bare-directory or whole-file check |
| [self-verify-drift-test.mjs](self-verify-drift-test.mjs) | that the drift number reacts to what it claims to measure. Every case is a tree that reported `drift 0 - 100% adopted, compliant with the standard` while not being the standard - 19 of 20 skills, a policy block deleted, and widest of all, recorded exceptions carrying a gutted repo to "100% adopted" as the percentage rose while the standard was discarded |

## Why this shape, and how to use it

Dependency-free (Node built-ins only), zone 1 only. These run in this repo's own CI
(`.github/workflows/checks.yml`).

**The pre-PR command list lives in [`AGENTS.md`](../AGENTS.md) and only there.** It is
longer than this folder - it also runs the shipped guards (`spec-structure`, both
`spec-guard` invocations, `facts-check`) against this repo. A second copy here would be a
second thing to keep in step with `checks.yml`, and this file has already been out of step
with it once: it listed four tools while seven existed, and gave a three-command block that
skipped every shipped guard, so anyone trusting it got a red pull request.

The table above then drifted a second time, to ten rows against eighteen files - the eight
newest tools, several of them written to close defects that had shipped, were the ones a
reader could not see. Nothing checks it, which is the honest state of it: an entry here is
prose about a file's purpose, and the file map's trick of generating the table from a
manifest has no equivalent when there is no manifest. So it is a habit instead - a new tool
lands with its row, or this table is lying again by the next one.

There is no build step and nothing to sync: the standard is authored directly in
`standard/` (ADR-014), so the old reflect machinery is gone - tree-check only
proves nothing leaked and nothing promised is missing.
