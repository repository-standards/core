# Cycle: &lt;slug&gt;

| | |
| --- | --- |
| **Team** | &lt;team - the directory this file sits in&gt; |
| **Goal** | &lt;one sentence: the outcome, not the item list&gt; |
| **Opened** | YYYY-MM-DD |
| **Target** | YYYY-MM-DD &lt;agreed, movable - not a deadline&gt; |
| **Status** | open |

## Intents

Rows move here from `docs/backlog.md` unchanged, and leave the pool when they do - an
intent is in one place or the other, never both. Same columns as the backlog.

| id | title | cap | persona | owner | why | DoD | status |
|----|-------|-----|---------|-------|-----|-----|--------|
| | | | | | | | |

&lt;!-- A filled example - delete this block. It sits in a comment so the guard does not
     read these ids as real rows in two places at once:

| PAY-2 | Retry the capture on a provider timeout | payments | Owner-operator Olga | dev | carts die on a timeout nobody sees | a timed-out capture retries once and the outcome is logged | doing |
| PAY-3 | Surface the decline reason to the guest | payments | Guest Gabor | dev | "payment failed" sends people to support | the guest sees the issuer's reason, mapped to plain language | todo |
--&gt;

## Outcome

&lt;!-- Written once, by /cycle-close. Left empty while the cycle is open.

Planned N, finished M, returned to the pool K. Commits in the window: C. Days elapsed: D.

This is the only history the repo keeps about execution, and it is kept because it cannot
be recomputed later: git can count commits between two dates, but not that *these* intents
were what the team believed it would finish (ADR-028). --&gt;
