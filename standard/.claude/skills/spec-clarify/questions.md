# Questions the clarify loop must ask

Sibling file of `spec-clarify`. Load it at the point where you would otherwise settle an open question yourself.

## Questions this phase must ask

Declared in `standard/elicitation/points.json`; the shape and the provenance states are in
`standard/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

### `[spec.scope]` What is in and what is out

Fires **before the spec's Requirements section is written or changed**.

Call `AskUserQuestion` with the header `[spec.scope]` and the question:

> What is in scope for this specification, and what is explicitly out?

Options, in order: **tell me now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

This skill's own description promises it asks one question at a time. Until this call existed, it had no way to ask anything.

Records to `the spec's Requirements section` as `point_id: spec.scope` with the provenance state the answer implies.

### `[spec.acceptance]` What done means

Fires **before the spec's Acceptance criteria are written**.

Call `AskUserQuestion` with the header `[spec.acceptance]` and the question:

> What must be true for this to count as done?

Options, in order: **tell me now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

Acceptance criteria written by the party that will satisfy them are not criteria.

Records to `the spec's Acceptance criteria` as `point_id: spec.acceptance` with the provenance state the answer implies.

### `[spec.unknowns]` Points still undetermined

Fires **whenever you are about to resolve an open question yourself rather than leave it open**.

Call `AskUserQuestion` with the header `[spec.unknowns]` and the question:

> These points are undetermined. Decide them now, mark them provisional, or leave them open?

Options, in order: **decide now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave open** (`absent`)

Silently resolving an unknown is the failure mode. Naming it as unresolved is the job.

Records to `the spec's open questions` as `point_id: spec.unknowns` with the provenance state the answer implies.
