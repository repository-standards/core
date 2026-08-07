# Working language - one repo, and the language each part of it speaks

> Language is a **configuration**, not a constraint. The normative rule and the per-artifact
> table live in [`standard/docs/conventions.md`](../../standard/docs/conventions.md); this page
> is the reasoning behind it and the guidance for teams that do not work in English.

## What changed

Writing a repository in anything but English used to carry a permanent tax. Your
dependencies documented themselves in English, your stack traces arrived in English, the
answer to the problem you were stuck on was on an English page, and the next person you
hired might not read your language at all. So teams wrote English they were not comfortable
in, and the docs got shorter, blunter and less honest with every sentence, because saying
something precise in a second language is expensive and saying something vague is free.

That tax is smaller now, and in one direction it is gone. An agent reads and writes any
language equally well. It will take a Polish story and produce an English spec. It will
read an English decision record and explain it in German, with examples, on demand
(EXPLAIN-1 in [ways of working](ways-of-working.md)). The language a document is *stored*
in and the language a person *reads it in* have come apart, and that is the change that
makes this question worth reopening.

## Why the paved road is still English

Not because your team must think in it, but because these four things do not care what your
team prefers:

- **Your identifiers already are English.** Function names, types, table columns, HTTP
  paths, error codes. Prose in another language wrapped around English identifiers makes
  every second sentence a code-switch, and it reads worse than either language alone.
- **Your ecosystem is English.** Library docs, RFCs, the errors your CI prints, the answers
  you will search for at midnight. Documentation that sits next to that material in a
  different language is one more seam.
- **A repository outlives the team that wrote it.** An auditor, an acquirer, a contractor,
  an open-source contributor, the developer you hire in three years. English is the language
  that costs none of them anything.
- **This standard is written in English**, and so are the specs, records and guards it ships.
  A repo that adopts it in another language is translating a moving target forever.

## When your own language wins anyway

Precision beats protocol. These are real cases, not exceptions to apologise for:

- **The people who must read it are not English-speaking.** A business decision record that
  the owner has to gate, a product vision the founder has to recognise as their own, a spec
  the domain expert has to correct. A rule stated exactly in Polish is worth more than the
  same rule stated approximately in English.
- **The domain has no clean English.** Regulatory terms, tax categories, legal instruments,
  local processes. Translating them is not neutral: it invents a vocabulary nobody uses and
  loses the one the business actually says out loud.
- **The team is stable and local.** If the honest answer is that this repository will be
  read by the six people in the room for the next five years, optimising it for a
  hypothetical stranger is a cost you pay every day for a benefit you may never collect.

Write in the language in which you will be **exact and complete**. That is the whole test.

## Mixing is fine. Undeclared mixing is not.

The failure mode was never "two languages". It is **two languages and no rule about which
goes where** - a spec half in one and half in the other, an ADR whose title is English and
whose consequences are not, a backlog nobody can grep. That repository is harder to read
than either monolingual version, for humans and for agents alike.

So draw the boundary by **artifact type**, and write it down where the agent looks first:

| Part of the repo | Language | Why it is not negotiable |
|---|---|---|
| Code, identifiers, file and folder names | English | addressed by tools and by strangers |
| Commit messages, PR titles and bodies | English | read on platforms, in blame, by bots |
| CI output, guard messages, scripts | English | machine surfaces, quoted in issues |
| Specs, decision records, product docs, backlog | the repo's choice, **one language per type** | read by the people who own them |
| User-facing copy | the audience's language | driven by the reader, never by the team |

Two rules make the split survivable:

1. **One language per artifact type, never per document and never per paragraph.** All
   ADRs in one language or all in the other. A single mixed document is the thing that
   breaks search, review and translation at once.
2. **Record it in `AGENTS.md`.** Not in someone's head, not in the team chat. The agent
   reads that file before it is asked anything, and so does the next person. An undeclared
   convention is not a convention, it is a habit that the newest contributor will break by
   accident within a week.

## Part of a repository is syntax, and syntax is never translated

Not all of the text in a repository is prose. A few strings are **read by a script**, and
a script does not translate - it looks for the bytes it was written to find. Translate one
and the check does not object: it stops seeing anything at all, reports PASS, and whatever
it was holding closed walks straight through.

This is not hypothetical. A capability spec written in Chinese, with its open markers
translated along with the rest of the sentence, passed the clarify gate carrying four
unresolved items - one of them a missing decision. And the trap is an asymmetry rather
than bad luck: the *missing* `## Clarifications` error names the exact English string, so a
team that hits that error reads translating the heading as the fix.

So these stay exactly as written, in a spec in any language:

| Stays as written | What reads it |
|---|---|
| `[NEEDS CLARIFICATION: ...]`, `[NEEDS DECISION: ...]`, `[NEEDS INPUT: ...]`, `[NEEDS ASSET: ...]` | the clarify gate - the marker family is the spec's gap list |
| `## Clarifications`, `## Open questions` | the clarify gate, which refuses a spec that has neither |
| `**Status:**`, `**Serves:**`, `**Spec tier:**` | the spec-structure guard, and the status check against the gate |
| intent ids (`PAY-2`), `blocked:<id>` | the sprint guard, proving one intent lives in one place |

**The text inside is prose, and it belongs in your language.**
`[NEEDS DECISION: model cenowy dla kont zespolowych; owner: biznes]` is exactly right: the
marker is syntax, the question is Polish, and the gate holds the spec closed until it is
answered.

The gate enforces this rather than trusting it. A bracketed token shaped like a marker but
not one of the four forms - a translated family name, an invented type - fails the gate by
name, non-ASCII ones included. A check that cannot find what it was written to read has to
fail, not pass.

## What this buys the reader

Because the split is declared and the agent can translate on demand, nobody is locked out
of anything:

- the PO writes the story in their own language and gets an English spec back;
- the developer reads the English spec, because that is where the contracts are;
- the owner asks for the BDR in plain Polish and gets it, without the file changing;
- the auditor gets the repository in the language it is stored in, and can ask for the rest.

The repository stops being a document in a language. It becomes a record with a declared
shape, which every reader can meet in their own.
