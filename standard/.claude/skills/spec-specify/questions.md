Sibling file of `spec-specify`. Load it at step 5.3, where the flow would otherwise guess.

# Questions this skill must ask

<!-- PATCHED(repository-standards): upstream writes the whole specification from the feature
     description and its own informed guesses, and asks nothing at all. That is defensible for a
     scaffolding tool and indefensible here, where the promise is that the standard walks somebody
     through writing a specification. Measured on the shipped tree, this skill made zero
     AskUserQuestion calls while the boundary, the acceptance criteria and every unknown were
     decided by the agent and written as though somebody had agreed. The three blocks below are
     the calls, and the elicitation guard refuses the write to `specs/**/spec.md` until they
     fire - these questions are asked for every specification, because the scope of this one is
     not answered by what somebody said about a different one. -->

Declared in `.claude/elicitation/points.json`; the shape and the provenance states are in
`.claude/elicitation/README.md`. Each block is a real `AskUserQuestion` call, in the language the
user is writing in, with the point id in the header.

### `[spec.scope]` What is in and what is out

Fires **before step 5.4 fills Purpose, Scope and Out of scope** - before the boundary exists,
not after.

Ask: *What is in scope for this capability, and what is explicitly out?* Where the description
already implies a boundary, put it in the option and ask them to confirm or cut it, rather than
asking an open question they have already answered.

Options, in order: **tell me now** (`human`) / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`, a `[NEEDS CLARIFICATION: ...]` marker in the section)

The boundary is the one thing nothing else in the repository can supply. Everything downstream -
requirements, contracts, the impact analysis, the coupling guard - is scoped by it, so an agent
that picks the boundary itself has decided the whole specification before writing a line of it.

Records to `docs/adoption-provenance.md`: the `spec.scope` row takes the state, who answered, the
date, and this spec's path as where the answer landed.

### `[spec.acceptance]` What done means

Fires **before step 5.7 writes the Acceptance criteria**.

Ask: *What must be true for this to count as done?* Offer the criteria you would write, as
options, so the answer is a judgement rather than an essay.

Options, in order: **tell me now** (`human`) / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

Acceptance criteria written by the party that will satisfy them are not criteria. This skill is
that party.

Records to `docs/adoption-provenance.md`: the `spec.acceptance` row takes the state, who answered,
the date, and this spec's path as where the answer landed.

### `[spec.unknowns]` Points still undetermined

Fires **at step 5.3, in place of the informed guess** - whenever you are about to settle
something the description does not settle.

Ask: *These points are undetermined. Decide them now, mark them provisional, or leave them open?*
Name them in the options; a question about unknowns that does not say which unknowns is not
answerable.

Options, in order: **decide now** (`human`) / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave open** (`absent`, one marker per unknown)

A reasonable default taken silently and a decision somebody made look identical once they are in
the file, and that is the failure this whole layer exists to stop. Taking the default is fine.
Taking it without saying so is not.

Records to `docs/adoption-provenance.md`: the `spec.unknowns` row takes the state, who answered,
the date, and this spec's path as where the answer landed.
