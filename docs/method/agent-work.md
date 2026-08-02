# Agent work - what happens without being asked

The standard is AI-led. That is a design decision, and this page is what it means in
practice: what the agent starts on its own, what it will refuse, and what it will never
decide for you.

Read it if you are wondering "do I have to tell it to do that?" The answer is almost always
no.

## What starts on its own

| You do this | It does this, unprompted |
|---|---|
| describe a feature or a behaviour change | starts the specification loop and asks its questions |
| change code | works out which capabilities that touches, and updates their specs in the same change |
| paste meeting notes | extracts them with provenance and flags contradictions with earlier notes |
| make a decision out loud | writes the record while it is fresh |
| mention something out of scope | files it in the backlog with its source and what done means |
| finish a branch | reviews its own diff before you push it |
| say the repo has no personas, or no product doc | offers to build them from what is already there |

You should never have to say "remember to use the process". If you do, the tool's
description of itself is wrong, and fixing that is the bug - not reminding you to carry it.

## What it will refuse

**Planning against an open question.** It names what is open and who owns it instead. See
[dev work](dev-work.md) for why that is not obstruction.

**Editing an accepted decision into a different one.** It offers to supersede instead. The
history of what you believed is the point of having records.

**Writing to a remote database.** It prepares reviewed SQL and hands it to you. This is a
guard, not a preference - it fires before the command runs.

**Force-pushing a branch somebody else may have pulled.** Same category.

**Merging when the spec and the code disagree.** It will tell you which, and offer to fix
whichever is actually wrong.

## What it will never decide for you

A trade-off between two people the product serves. Anything with money, legal or safety
consequences. What the product is for. Whether an idea is worth building.

For each of these it drafts, proposes, and stops. You will see options and a
recommendation - never a decision presented as already made.

## How it asks

Questions arrive in a batch, with what it already worked out, so you are answering rather
than being interviewed:

> Drafted the spec from the code and the kickoff notes. Three things I could not settle:
>
> 1. Repricing on a date change - pay the difference, or hold the original price?
> 2. A cut-off before check-in, or none?
> 3. Partial failure - dates freed, payment declined - who holds the booking, and for how long?
>
> Everything else came from the existing cancellation rules.

The **everything else** line matters. It tells you what it assumed, so you can catch a wrong
assumption rather than only answering what it thought to ask.

## What it does when you are not there

Nothing irreversible. It drafts, it files, it flags. Anything that publishes, deletes,
spends or writes to something shared stops and asks - even mid-task, even if that is
annoying.

If it hits a genuine gap in the standard itself - an instruction that is unclear, a case
nobody thought about - it records it rather than guessing quietly, and it can offer to
report it upstream. With your consent, never without.

## The part people find strangest

**It will tell you when it made a mistake, including one from earlier in the same session.**
A wrong claim it made, a check it thought was passing, an assumption that turned out false.
This is deliberate: a tool that quietly corrects itself is a tool whose earlier statements
you cannot trust, and this whole project is an argument for writing down what is actually
true.

The same applies to what it cannot do. "I could not verify that" is a real answer here, and
it is worth more than a confident guess.
