# Stack adaptation phase

Runs when the user takes a registered stack (greenfield after scaffolding, or
brownfield after the core waves). Same machine as everything else: the stack's
manifest is the work list, the starter is the reference, the repo's own build
is the verifier. Technology knowledge does NOT live here - it lives in the
stack repo (DECISIONS for the why, ADAPTING.md for the how-to-merge); this
phase is the procedure that consumes it.

## Mechanics

1. **Read the stack checkout:** `stack.manifest.json` (the work list),
   `DECISIONS.md` (the why - quote it when the user pushes back), `starter/`
   (the reference copy of every merge-class entry), and `ADAPTING.md` if
   present - per-entry migration notes that override generic merging.
2. **Classify** the target against every manifest entry: missing / drifted /
   ok. For `merge`-class entries, drifted means "differs from the reference in
   ways the purpose cares about" - diff against the starter's copy and judge;
   never flag cosmetic differences.
3. **Propose waves, ordered by payoff and blast radius:**
   - first what protects (supply-chain policy, version pins),
   - then what shapes code (lint/format, type strictness - expect the largest
     diff noise; land it as its own PR),
   - then what proves (test tiers, the docker test stack),
   - last what automates (CI templates - scale profile).
4. **Adapt, never blind-copy:** each entry lands per its `adapt` class; where
   the repo already has a competing tool or layout, follow ADAPTING.md's note
   for that entry; where none exists, propose the migration and record the
   user's call. A deliberate deviation becomes a manifest `exceptions` entry,
   same as in core alignment.
5. **Verify after every wave** with the repo's own commands (install, build,
   tests) - a wave that breaks the build does not close. Close the phase by
   copying `stack.manifest.json` into the repo: from then on `self-verify`
   counts one drift across both layers.
6. **A stack guard reported `SKIP` is not drift and not a pass.** A Layer 2 guard
   usually shells out to the stack's own toolchain, so it can only answer where
   that toolchain is installed. `self-verify` refuses to run it otherwise and
   says which prerequisite is missing, rather than scoring the machine as the
   repo. Two consequences for this phase: install what the line names before you
   report a drift number to anyone, and if the stack's manifest declares more
   than a binary (`{ "kind": "path", "match": "node_modules" }`), leave it
   declared - it is what stops a compliance check installing a dependency tree
   off the network as a side effect of being asked a question.

## Not this

- Not a re-scaffold beside the code - the starter is a reference, never a
  second app.
- Not a tool war: if the user keeps their tool (say, ESLint over the stack's
  pick), that is a recorded exception with the trade-off named, not a fight.


## Questions this phase must ask

Declared in `standard/.claude/elicitation/points.json`; the shape and the provenance states are in
`standard/.claude/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

### `[green.stack]` Technology and profile

Fires **after detecting the technology from the repo's own evidence, before writing the manifest**.

Call `AskUserQuestion` for point `[green.stack]` - header **Stack**, `metadata.source` `green.stack` - and the question:

> Which stack, and which profile - core or scale?

Options, in order: **confirm the detection** / **a different stack** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point)

Detection is evidence and evidence is `inferred`; the confirmation is what makes it `human`. Name what the registry actually has, so the answer is informed rather than a guess that gets downgraded three steps later.

Records to `docs/adoption-provenance.md`: the `green.stack` row takes the state, who answered, the date, and `stack.manifest.json` as where the answer landed.
