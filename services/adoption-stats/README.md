# adoption-stats

Ingest endpoint for the anonymous adoption ping ([ADR-047](../../docs/decision-records/ADR-047-adoption-ping-is-informed-not-asked-and-minimal.md)).
`align-to-standards` posts one row per completed run; nothing here identifies which repo sent it.

Cloudflare Worker + D1, deployed by the maintainer - not part of this repo's own CI
(`checks.yml` does not touch it, `tools/` does not run it).

## What this is for

`backlog.md`'s `EXHIBIT-1` names the gap: nothing in this repo answers "how many repos
actually run this standard." This is the fix - a day-granularity, unidentifiable row per
completed `align-to-standards` run (stack, standard version, final drift, nothing else),
so `COUNT(*)` becomes a real number instead of a claim. The point is a **live counter** -
"Live adoptions: N" - fed by `GET /` on the landing page, not a corpus to read or learn
from. See ADR-047 for exactly what is and is not collected and why.

**Not to be confused with `record-run`** (a transition skill run from this repo's own
checkout, never shipped to adopters,
[ADR-045](../../docs/decision-records/ADR-045-record-run-feeds-the-existing-corpus-consent-gated.md)).
That is a different mechanism for a different purpose: consent-gated, carries far more
detail (up to the session's own turns and agent responses at level 2), and feeds the
`docs/validation/human-prompting/` corpus to improve the product and validate that the
standard actually works. This service never touches that corpus and `record-run` never
touches this database - one counts, the other teaches.

## API

Everything lives at the bare root - no `/adoption`, no sub-paths.

- `GET /` - returns `{"count": N}`, the total number of completed-run rows. Public,
  read-only, CORS-open (`Access-Control-Allow-Origin: *`) so the landing page can fetch it
  client-side on every load.
- `POST /` - ingest one ping. Body must match ADR-047's schema exactly; anything else is
  rejected with 400.

## Deploy (first time)

```
cd services/adoption-stats
wrangler login
wrangler d1 create rs-adoption-stats        # copy the database_id into wrangler.toml
wrangler d1 execute rs-adoption-stats --remote --file=db/schema.sql
wrangler deploy                             # prints the live *.workers.dev URL
```

## Redeploy (schema unchanged)

```
wrangler deploy
```
