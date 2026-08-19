# Quick start

One line to your agent. There is nothing to install and nothing to build.

```
> adopt this repo to repositorystandards.com
```

That is the whole thing, and it is the whole line - there is no clause you have to remember.
The agent reads the standard, works out whether your repo is new or has ten years of history,
and asks you what it cannot work out for itself, because a hook refuses to write an artifact
nobody was asked about.

## The other three lines you will ever need

**You want the number before committing to the work.** Nothing is changed:

```
> score this repo against repositorystandards.com - count the work, do not do it
```

**Later, when the standard has moved.** It is a delta, not a re-scaffold, and your recorded
deviations survive it:

```
> update me to the latest repositorystandards.com
```

**You are on a registered stack.** Both layers, one number:

```
> adopt this repo to repositorystandards.com with the Node stack
```

## What you get back

A tree in your repository: specs by capability, decision records, a persona roster, a
backlog that feeds itself, and `scripts/` - so from then on the claim is checkable by
anyone, including your CI:

```
node scripts/self-verify.mjs
```

It exits non-zero on any failure and prints drift as a number. That number is the contract:
not "we follow a standard", but "we are this far from it, and here is the list".

## If your agent cannot browse

Fetch the standard once and point at the checkout instead. It is a cache you read, not a
dependency you vendor, so add it to `.gitignore`:

```
npx degit repository-standards/core .repository-standards
```

```
> adopt this repo to the standard in .repository-standards/
```

You need Node and `jq` on the machine for the shipped guards to work. Without `jq` the
pre-execution guards deny every command rather than pass it unchecked.

## If your agent is not Claude Code

The skills ship in Claude Code's format. Port them to your agent's own mechanism - strictly,
not approximately, because a skill that paraphrases the loop is a loop that quietly does
something else.

## Now find yourself

The loop looks different depending on which hand you are. Read the one that is yours, not
all three.

| | go here |
|---|---|
| You decide what the product should do | **[Product Owner](method/product-work.md)** - the four answers you are allowed to give, and what you must never be asked to do |
| You build it | **[Developer](method/dev-work.md)** - raising a spec to buildable, the guard, and reading a refused plan as your to-do list |
| You are rolling this out across a team or a client | **[Consultant](method/lead-work.md)** - the order to do it in, the three objections, and the two ways it goes wrong |
| Any of the above, mid-task | **[Anyone](method/working-with-specs.md)** - find your situation, say the line |

Want the whole picture first? [Start here](method/ways-of-working.md) walks the loop once,
end to end. Wondering what the agent handles without being told?
[What it does by itself](method/agent-work.md).
