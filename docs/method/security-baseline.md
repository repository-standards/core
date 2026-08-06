# Security baseline - the axes every repo decides once

> The floor below which nothing ships. This page is the **menu** for one of the eight
> foundation decisions (R7): it lists what has to be decided, not what to decide. The
> answers live in your security ADR, and technology-specific depth - which header, which
> library, which OWASP control - lives in your stack repo, not here.

## You have this case - say this

**Adopting the standard, no security decision recorded yet.** The common one:

```
> record our security baseline as an ADR - walk me through docs/security-baseline.md
> axis by axis and use what you find in the code as the starting answer
```

The agent reads the repo first (what auth exists, what validates input, what CI can
reach) and proposes an answer per axis, so the decision starts from reality rather
than from a blank page.

**A capability touches money, auth or personal data.** Its spec gets the trust-boundaries
section filled - who can call it, with what proof, what is validated where:

```
> this capability moves money - fill its trust boundaries and abuse cases
```

**Your real security control is a harness, not a process.** A codec or parser library's
defence is usually a fuzzer running continuously against the boundary where untrusted
bytes arrive. FFmpeg is the case in this standard's own validation set: six in-tree fuzz
targets and no `SECURITY.md` at all. Record the harness as the adversarial-testing answer;
it is a decision, not the absence of one:

```
> our security story is the fuzz targets, not a disclosure inbox - record that as the
> adversarial-testing answer, with who triages a crash and where the corpus lives
```

**An axis genuinely does not apply.** Say so, and say why. A CLI with no network has no
CORS story, and writing "not applicable: no network surface" is a decision. A blank is not:

```
> we have no multi-tenancy - record that as decided, not as missing
```

## The axes

Each row is a question the ADR must answer. "Not applicable, because X" is a valid answer;
silence is not.

| Axis | The question | Where the depth lives |
|---|---|---|
| **Secrets** | Where do they live, who can read them, how are they rotated, what happens when one leaks? | R19 is the rule; the shipped `gitleaks` config is the floor |
| **Authentication** | One mechanism, or several? Where are sessions or tokens issued, how long do they live, how are they revoked? | stack repo |
| **Authorization** | One model - roles, scopes or policies - decided up front. Where is it enforced: at the edge, in the service, in the database? | stack repo |
| **Input validation** | What validates untrusted input, and where is the boundary? A repo with a typed schema twin already has the answer for anything crossing the database (R24) | stack repo |
| **Output and injection** | How is untrusted data rendered, queried and logged? Parameterized queries, escaping, no string-built SQL or shell | stack repo |
| **Transport and headers** | TLS everywhere? Which security headers, and who sets them - the app, the proxy, the platform? | stack repo |
| **Rate limiting and abuse** | What stops a caller hammering the expensive path or enumerating identifiers? | stack repo |
| **Logging and privacy** | What must never reach a log - credentials, tokens, personal data - and what is retained, for how long? | stack repo |
| **Dependencies** | Exact pins and a committed lockfile (R21), plus: who audits advisories, how fast does a critical fix land, what may bypass the cooldown? | R21 is the rule; mechanics per stack |
| **CI permissions** | Least privilege for the workflow token, actions pinned by digest, no secret reachable from a fork's pull request | R21; the shipped workflow templates |
| **Agent boundaries** | What may the coding agent do unattended? The shipped settings baseline write-blocks remote databases, force-push and CI-secret edits - keep it, extend it, or record why not | `.claude/settings.json` + `.claude/hooks/` |
| **Data at rest** | What is encrypted, what is backed up, who can restore it, and has a restore ever been tested? | stack repo |
| **Adversarial testing** | What actively tries to break this, as opposed to confirming it works - fuzzing, property-based tests, a kept crash corpus, a red-team pass? Where does it run, who triages a finding, and does a crash become a regression test? For a repo that parses untrusted input this is often the control that finds the bugs, not the disclosure process | stack repo (harness, runner, corpus storage); the ADR names which boundary warrants it |
| **Threat model** | One paragraph: who would attack this, what would they want, what would it cost you. Not a document - a paragraph that makes the rows above concrete | the ADR |
| **Embargoed work** | Where does the fix for an unfixed vulnerability get developed - its spec, its backlog intent, its record - before disclosure, who lifts the embargo, and what does the mainline carry meanwhile? A public repo has to answer this before an incident, not during one; a private repo answers "not a case here" (R3's embargo clause, ADR-034) | the ADR |
| **Negative scope** | What is deliberately *not* treated as a vulnerability here, and why - a repo that never says this re-litigates the same report every time it arrives. curl's own exclusion list (self-XSS, missing best-practice headers with no exploit, etc.) is the paved-road example: one dated list, referenced instead of re-argued | the ADR |

## What this page deliberately is not

It is not a control catalogue and does not try to be one. Where a repo needs that depth -
the OWASP ASVS levels, the SLSA build levels, a specific header set - the reference belongs
in the security ADR and the mechanics in the stack repo, so the same standard can serve a
CLI, a data pipeline and a payment service without pretending they share a checklist.

It is also not a gate. Nothing here is machine-checked: whether the baseline is *good* is
review's call, and `self-verify` only ever knew whether a decision record exists. What the
rule adds is that the record cannot quietly omit an axis - an unanswered axis and an
answered one look the same in a year, which is the whole reason the decision is written down.
