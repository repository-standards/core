# Questions the clarify loop must ask

Sibling file of `spec-clarify`. Load it at the point where you would otherwise settle an open question yourself.

## How every call is shaped

The loop's own rules are in `SKILL.md`; this is the shape each call takes, and it is the same
whether the question is one of the three declared below or one this skill invented for the spec
in front of it.

- The `question` field carries a full interrogative plus one plain sentence on why it matters -
  what changes depending on the answer. Everyday wording; introduce a term only if the same
  sentence defines it.
- The `header` is the chip the user reads first: two or three words, and where the question is a
  declared point, it carries the id - `[spec.scope] zakres`.
- **The recommended option goes first and is the only one labelled.** Pick it on best practice
  for this project type, common patterns, risk (security, performance, maintainability), and the
  spec's own goals and constraints; put it at the top of `options` with `(recommended)` ending
  its label, and give the reason in one sentence. Order and label are the same claim, so no other
  option may carry it. Where the axis is consent rather than correctness, recommend nothing.
- Each option's `description` says what happens if it is chosen - the trade-off, not a
  restatement of the label. Two to five options; the tool always lets the user type their own, so
  a free-form alternative needs no option of its own.
- Ask in the language the user is writing in. The option strings below are the authored English
  the static check reads; what reaches the user is that same order, in their language.

## Questions this phase must ask

Declared in `standard/.claude/elicitation/points.json`; the shape and the provenance states are in
`standard/.claude/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

### `[spec.scope]` What is in and what is out

Fires **before the spec's Requirements section is written or changed**.

Call `AskUserQuestion` for point `[spec.scope]` - header **Scope**, `metadata.source` `spec.scope` - and the question:

> What is in scope for this specification, and what is explicitly out?

Options, in order: **tell me now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

This skill's own description promises it asks one question at a time. Until this call existed, it had no way to ask anything.

Records to `docs/adoption-provenance.md`: the `spec.scope` row takes the state, who answered, the date, and `the spec's Requirements section` as where the answer landed.

### `[spec.acceptance]` What done means

Fires **before the spec's Acceptance criteria are written**.

Call `AskUserQuestion` for point `[spec.acceptance]` - header **Acceptance**, `metadata.source` `spec.acceptance` - and the question:

> What must be true for this to count as done?

Options, in order: **tell me now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

Acceptance criteria written by the party that will satisfy them are not criteria.

Records to `docs/adoption-provenance.md`: the `spec.acceptance` row takes the state, who answered, the date, and `the spec's Acceptance criteria` as where the answer landed.

### `[spec.unknowns]` Points still undetermined

Fires **whenever you are about to resolve an open question yourself rather than leave it open**.

Call `AskUserQuestion` for point `[spec.unknowns]` - header **Unknowns**, `metadata.source` `spec.unknowns` - and the question:

> These points are undetermined. Decide them now, mark them provisional, or leave them open?

Options, in order: **decide now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave open** (`absent`)

Silently resolving an unknown is the failure mode. Naming it as unresolved is the job.

Records to `docs/adoption-provenance.md`: the `spec.unknowns` row takes the state, who answered, the date, and `the spec's open questions` as where the answer landed.
