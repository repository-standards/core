The standard as executable procedures. One directory per skill, each holding a `SKILL.md`
that an agent runs: describing a feature, breaking it down, building it, closing it,
reviewing your own branch, ingesting meeting notes, moving to a newer standard.

These ship with the tree and **stay**. They are not scaffolding you delete after adoption.
They are the ways of working, in the only form that cannot be approximated.

## What it is for

A methodology written as prose gets read once, remembered partially, and applied
differently by everyone. A methodology written as a procedure gets executed. That is the
entire bet this folder represents.

## The rule that decides whether a new skill earns its place

Not the count. Whether its `description` names a situation, **in words a user would
actually type**, that no other skill's description names.

This matters more than it sounds. **The description is the only text a request is matched
against.** Two skills whose descriptions could both plausibly match one sentence will each
lose that sentence about half the time, and the user experiences that as the tooling being
unreliable rather than as an authoring mistake.

So write the description about *when to reach for this*, never about what artefact it
produces:

```yaml
# good - names the moment
description: Use when the user describes a feature, story or behaviour change and
             the repo needs a capability spec written or updated.

# bad - names the output
description: Writes a capability spec file.
```

## What is in here

The procedures themselves, whose names are terse on purpose. [What each skill is
for](../skill-map.md) lists every one, grouped by the moment it fires - generated from the
skills' own frontmatter, so it cannot describe a procedure the tree no longer has, nor miss
one it gained.

## What goes in here

A procedure a person or an agent runs repeatedly, whose steps matter enough that getting
them in the wrong order costs something.

## What does not go in here

**A one-off migration.** That is a script.

**Anything specific to your product's domain** rather than to the way the repo is run. A
skill that knows your billing rules has become part of your product and stops being
updatable with the standard.

**Anything that duplicates a skill already here.** See the rule above: the duplicate does
not add a capability, it degrades an existing one.

## If your agent is not Claude Code

These are the reference form. Port them to your agent's own mechanism - strictly and
completely, before claiming compliance. `self-verify` accepts the ported location. A
partial port is drift rather than a variant, because a skill that paraphrases the loop is a
loop that quietly does something else.

## Decisions behind it

- **[ADR-019](../decision-records/ADR-019-lifecycle-procedures-are-agent-portable.md) -
  procedures ship executable, and a partial port is drift.** Shipping the lifecycle as a
  document and letting each repo wire it up is what every methodology does, and it is why
  they decay: prose cannot be executed, so it gets approximated, and approximations diverge
  without anyone noticing.
- **Skills stay after adoption.** Treating them as scaffolding to remove was considered and
  it inverts the point - the loop is the product, not the setup.
- **Descriptions are the interface.** Naming skills well and expecting users to remember
  the names was the alternative. It hands the user a manual, which is the opposite of the
  goal.
