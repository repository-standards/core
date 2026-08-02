# tools/ - this repo's own gate tooling (zone 1, never shipped)

Maintainer machinery for the standard repo itself; a consuming repo gets `scripts/`
(self-verify + guards + changelog assembler) inside the shipped tree instead.

## Contents

| Tool | What it does |
|---|---|
| [tree-check.mjs](tree-check.mjs) | guards the single shipped tree (`standard/`): no repo-own leaks, every manifest promise present, and the tree passes its own `self-verify --skeleton` |
| [link-check.mjs](link-check.mjs) | every relative markdown link in the repo resolves; template placeholder lines are skipped |
| [docsite.mjs](docsite.mjs) | renders the docs site (`site/docs/`, gitignored) from the repo's own md - one source, two surfaces |
| [site-check.mjs](site-check.mjs) | the e2e gate for our own surfaces: landing tags balanced + quotes the positioning one-liner verbatim + GitHub-only hosts; generated docs pages complete, internal links resolve, no md leaks |
| [spec-guard-test.mjs](spec-guard-test.mjs) | drives the coupling guard through cases that must fail - a guard nobody tests is a guard that quietly stops firing |
| [schema-pair-test.mjs](schema-pair-test.mjs) | the same for the DDL/typed-twin pair check |
| [facts-check-test.mjs](facts-check-test.mjs) | the same for the derived-facts check, including a surface reworded past its own declaration |
| [cycle-guard-test.mjs](cycle-guard-test.mjs) | the same for the work-cycle guard - including that the shipped template's example rows never count as real ones |
| [file-map.mjs](file-map.mjs) | renders `docs/file-map.md` - what every shipped file is, why, and the rule it enforces - **from the manifest**, so the map cannot disagree with what self-verify checks; `--check` fails CI on a stale copy |
| [self-verify-fill-test.mjs](self-verify-fill-test.mjs) | that the placeholder warning is **clearable** by a properly filled repo and still fires on a real marker - it used to match generic notation, so the file it exists for could never satisfy it |

## Why this shape, and how to use it

Dependency-free (Node built-ins only), zone 1 only. These run in this repo's own CI
(`.github/workflows/checks.yml`).

**The pre-PR command list lives in [`AGENTS.md`](../AGENTS.md) and only there.** It is
longer than this folder - it also runs the shipped guards (`spec-structure`, both
`spec-guard` invocations, `facts-check`) against this repo. A second copy here would be a
second thing to keep in step with `checks.yml`, and this file has already been out of step
with it once: it listed four tools while seven existed, and gave a three-command block that
skipped every shipped guard, so anyone trusting it got a red pull request.

There is no build step and nothing to sync: the standard is authored directly in
`standard/` (ADR-014), so the old reflect machinery is gone - tree-check only
proves nothing leaked and nothing promised is missing.
