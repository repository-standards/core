# Postmortem: {{DATE}} - {{WHAT_BROKE}}

Blameless. Names appear as roles, never as culprits: the question is what let a
reasonable person's action break production, not who moved.

**Impact**: who was affected, how many, for how long, and what they could not do.
**Detected by**: {{ALERT | CUSTOMER | SOMEBODY_LOOKING}} - and how long after it started.

## Facts

A timeline, times in UTC, no interpretation yet. What was observed, what was
tried, what happened next. Link the queries and the graphs; a screenshot is not
evidence anyone can re-run.

| Time | What happened | How we knew |
|---|---|---|
| ... | ... | ... |

## Causes

Not "the cause". Write the chain: the trigger, what made the system fragile
enough for that trigger to matter, and why nothing stopped it earlier. Stop when
the next "why" leaves the system you control.

- **Trigger**: ...
- **What made it possible**: ...
- **Why detection took {{HOW_LONG}}**: ...

## What we are changing

Every line here becomes a backlog item **in this same PR**, with an owner and a
definition of done. A postmortem whose actions land nowhere is where the next
identical incident comes from.

| Action | Why it prevents a repeat | Backlog item |
|---|---|---|
| ... | ... | ... |

Rejected actions belong here too, with the reason: "we will not add a retry
here, it would double-charge" is a decision worth finding in six months.

## What we are not changing, and why

The honest section. Some incidents are cheaper to accept than to prevent; say so
out loud, with what would change that judgement, rather than filing an action
nobody intends to do.
