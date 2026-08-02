# Quick start

One prompt does the work. The rest of this page is what to expect from it.

You need Node and `jq` on the machine, a git repository, and a coding agent. Nothing is
installed into your project and nothing is built.

## 1. Fetch the standard

```
npx degit repository-standards/core .repository-standards
```

Add `.repository-standards/` to your `.gitignore`. It is a checkout you read, not a
dependency you vendor - the method is always read at latest, and the only thing that
lands in your repo is the tree the standard puts there.

## 2. Say what you want

Point your agent at the entry skill and describe the situation in one sentence. Every
route starts with the same short intake - what is this repo, what technology, how much
do you want done - before anything is touched.

**A repo with nothing in it yet.** The agent interviews you instead of scaffolding blind:

```
follow .repository-standards/skills/align-to-standards/SKILL.md - take this new repo onto the standard, interview me for what you need
```

**A repo with years of history.** Same path, opposite direction - it reads the code and
reconstructs what you already chose before it proposes anything:

```
follow .repository-standards/skills/align-to-standards/SKILL.md - bring this repo onto the standard, read what is here first and show me the plan before you change anything
```

**You want the number before you commit to the work.** Nothing is changed; you get a fit
report and a counted backlog:

```
follow .repository-standards/skills/align-to-standards/SKILL.md - how far is this repo from drift 0? count the work, do not do it
```

**You are a Node team.** The stack layer comes with it, and both are measured as one
number:

```
follow .repository-standards/skills/align-to-standards/SKILL.md - adopt the standard with the Node stack
```

## 3. Prove it

Alignment copies `scripts/` into your repo. From then on the claim is checkable by anyone,
including your CI:

```
node scripts/self-verify.mjs --version 0.8.0
```

It exits non-zero on any failure and reports drift as a number. That number is the whole
contract: not "we follow a standard", but "we are this far from it, and here is the list".

## 4. Later, when the standard moves

An update is a delta, not a re-scaffold - the same shape as bumping a dependency:

```
update me to repository-standards@next
```

Your recorded deviations survive it. A gate that does not fit your repo is a legitimate,
recorded decision rather than a silent failure, and updates preserve those.

## If your agent is not Claude Code

The skills ship in Claude Code's format. Port them to your agent's own mechanism - the
standard requires a strict port rather than an approximation, because a skill that
paraphrases the loop is a loop that drifts.

## What next

- [Adopt](method/adoption.md) - the gates in order, what each one produces, and how a
  deviation gets recorded.
- [Verifying compliance](method/self-verify.md) - what the drift number covers, and what
  stays a human judgment.
- [Working with specs](method/working-with-specs.md) - the day-to-day loop once you are in.
