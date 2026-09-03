# <Product> - product overview

> The single "what is this and where is it going" doc. Plain language, kept
> current. A new developer, PO, or agent should get the whole picture in 5 minutes.

<!-- Drafted by an adoption run under `suggest`, not confirmed by a person yet? Open here,
     right after this intro, with the one marker (standard ADR-057/058):
       > [NEEDS REVIEW] drafted by the adoption run on <date> from the repo and its
       > README. Backlog: <ID>.
     A frame a person wrote themselves carries no marker. -->

## What it is

One paragraph: the product, who it serves, the core value it delivers.

## What people do today instead

The status quo this displaces - a competitor, a spreadsheet, a manual process, or genuinely
nothing. Name it plainly, including "nothing": a product with no alternative being displaced
usually means the problem has not been found yet, and that is worth knowing early rather than
after the build. This is what makes "why would anyone switch" answerable.

## Vision

Where this is going - the 6-18 month direction and the bet behind it.

## Current state (as of YYYY-MM)

What actually works today vs. what is planned. Be honest - this is the doc people
trust for "what exists now".

- **Live:** ...
- **In progress:** ...
- **Not started / planned:** ...

## Users / personas

Who uses it and what they need from it.

## Key capabilities

The main things the product does today (link deeper docs / specs).

## Non-goals

What this deliberately is not, and does not try to do.

## Related

Business decisions ([BDR](decision-records/bdr/README.md)), roadmap, key ADRs.

## Success metrics

The KPI tree capability specs cite in their `Success metric` field: name the
North Star, then the 2-4 metrics that feed it. An event or capability that moves
none of them is out of scope.

- North Star: {{NORTH_STAR}}
- {{KPI_1}}, {{KPI_2}}, ...
