One file per study: what you learned from talking to actual users, written so that it can
still be read years later, by someone who was not there.

This folder is the anti-silo. Interviews and usability studies normally live in a research
tool that the people writing specs do not open, so the insight and the thing it should have
changed sit in different systems and never meet. Here the study lives next to the personas
it corrects and the specs it should move.

## What it is for

**So a persona claim can be traced to evidence.** When someone says in review "hosts check
their payouts daily", there are only two possible answers: here is the study, or that is an
assumption wearing a fact's clothes. Both are fine. Not knowing which is not.

## What goes in here

One file per study, from the template beside it, and **anonymized hard**.

Describe the *kind* of person: "an operations lead at a mid-size logistics firm". Never the
person, never the company, and never a quote whose details identify either. If a finding
cannot be written without identifying someone, **it does not get written**. Research earns
its place here by being reusable years later, and a study nobody can share is not.

Every study says what it **moves**: which persona claim it confirms or breaks, which idea it
spawns or parks, which spec it touches. A study with an empty links section is not
finished; it is a note about a conversation.

## What does not go in here

**Transcripts and recordings.** They stay out of the repo. What lands is the distilled,
anonymized insight and its links.

**Anything identifying.** Not the person, not the employer, not the quote that gives them
away, not the screenshot with the name still in it.

**Findings with nowhere to go.** If a study changes nothing - no persona, no idea, no spec -
say so explicitly in the file. That is a real result. Silence is not.

## How you actually use it

```
> I interviewed five hosts about payouts - write the study, and say what it changes
```

The agent writes the anonymized study and, in the same pass, names what moves.

When a claim gets challenged:

```
> where does "hosts check payouts daily" come from?
  link the evidence or mark it an assumption
```

And when the evidence and the system disagree, that gets said rather than filed:

```
> the payout study contradicts the notifications spec - open the delta
```

## Decisions behind it

- **Research lives with the specs it should change.** The alternative is the research tool
  everyone already has, and it is where insight goes to be archived. Insight that does not
  reach a spec did not happen.
- **Anonymize at write time, not at share time.** Writing the identifying version first and
  cleaning it later means the identifying version exists in git forever.
- **Every study names what it moves.** Without that rule the folder fills with interesting
  reading that changes nothing, and then gets ignored for being exactly that.
