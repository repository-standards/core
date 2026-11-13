# ADR-065: A decision log in another language declares its required headings

| | |
| --- | --- |
| **Status** | Accepted (2026-11-13) |
| **Date** | 2026-11-13 |
| **Author** | Łukasz Bodurka |
| **Tags** | decision-records, guards, working-language |

## Context

`decision-records-check.mjs` reads two sections by their English headings: `## Revisit when`
on every record still standing (ADR-050) and `## Confirmation` on every Accepted one (ADR-063).
The working-language rule lets a repo write its decision records in its own language, one
language per artifact type, and the shipped conventions call every string a guard reads
syntax that is never translated.

Adopting 1.0.23 into a repository whose 38 records are Polish, headings included, gave 48
findings. 29 of them were sections the records have, under `## Kiedy zrewidować`,
`## Potwierdzenie` and, in its BDR template, `## Skąd będziemy wiedzieć, że to był błąd`. The
other 19 are records that really lack the section. A report that is 60% noise gets suppressed,
and the 19 go with it.

The syntax rule exists because a translated marker or clarify-gate heading switches the check
off and reports PASS. Here it runs the other way: a translated required heading fails, loudly,
on every record. The cost is noise, not a silent pass, so the reason for the rule does not
carry over.

## Options considered

- **A - Keep the headings as syntax and rename them to English in every record.** Rejected:
  every Accepted record in such a log gets an edit, each one becomes two languages in one
  document against the one-language-per-type rule, and the next record written from the repo's
  own template fails again.
- **B - A repo-owned key in the manifest copy, or an `exceptions` entry.** Rejected: an
  exception records a deliberate deviation and self-verify reports it as excepted, but here the
  section is present, not waived. A new manifest key is a second place to keep in step with the
  template, read by a guard that otherwise never opens the manifest, and one more repo-owned
  field `update-to-latest` has to carry.
- **C - The stream's own template declares it, on the heading line.** Chosen. The templates are
  the repo's own (`docs/decision-records` is filled from the repo), the template is where the
  heading was translated in the first place, and it is what the next record is written from.

## Decision

A stream's template - `_template.md`, or `_template-<stream>.md` in a flat log carrying both
streams - may mark one of its headings as the local name of a required section:
`## Kiedy zrewidować <!-- standard: Revisit when -->`, `## Potwierdzenie <!-- standard: Confirmation -->`.
`decision-records-check` then reads every record in that folder under the declared heading as
well as the English one, under the same rules for shape (missing, empty, placeholder), and
counts the first line of the template's own text under that heading as the prompt left in
place.

- Only these two sections, and only decision records. The spec syntax the conventions list
  (`## Clarifications`, `## Open questions`, `**Serves:**`, the open markers) stays as written:
  there a translation passes silently.
- An undeclared translation is still a missing section, and the failure says how to declare it.
- A section may have more than one declared heading; a record satisfies it with any of them.
- A declaration applies to its own stream only.

## Consequences

- Positive: a log in the repo's own language is held to both rules with no translation task
  and no edits to accepted records, and the declaration sits where the next record is copied
  from, so it cannot drift away from the heading in use.
- Positive: a localized template's prompt left unfilled is caught, which a list of English
  prompts could never do.
- Negative / cost we accept: the declaration is a comment, and an edit to the template can drop
  it. The check then fails every record, which is the safe direction to fail in.
- Negative / cost we accept: a repo may declare a heading that answers a neighbouring question -
  a BDR's "how we would know we were wrong" as its `Revisit when`. The check reads shape, never
  meaning (ADR-048); ADR-050 made the same call when it renamed five such sections in this log.
- Follow-up: `discovery-digest` step 4 greps the declared heading as well.

## Confirmation

`tools/decision-records-check-test.mjs` covers a declared heading passing; the same headings
undeclared failing, with the way to declare them; a declared section missing, empty, holding a
placeholder or the template's own prompt; a declaration carried onto a record's heading line; a
heading with pattern characters matched literally; a declaration that does not reach the other
stream; and a flat log's `_template-<stream>.md`.

## Revisit when

Another class of guarded syntax - spec headings, the open markers - is asked to be localized the
same way, which would turn this narrow carve-out into a general rule that needs its own record;
or adopters routinely declare headings that answer a different question than the section asks.

## Related

- [ADR-050](ADR-050-a-decision-record-must-name-what-would-reopen-it.md) and
  [ADR-063](ADR-063-an-accepted-record-must-say-how-it-is-kept.md) - the two sections this lets
  a log name in its own language.
- [ADR-048](ADR-048-gate-artifacts-are-read-for-shape-not-presence.md) - read for shape, which
  is all a declared heading changes the name of.
