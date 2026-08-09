---
status: Accepted
date: 2026-08-10
---

# ADR-047: the adoption ping is informed, not asked, and carries the minimum that still means something

## Context

Nothing in this repo answers "how many repos actually run this standard" - the honest
answer today is "unknown." `PRODUCT.md` claims real-world mechanics and the README claims
field-run adoption, but a skeptic evaluating the project has no count to check either claim
against, only the fixtures this repo wrote about itself (see `EXHIBIT-1` in `backlog.md`).

A passive, zero-code option was considered first: `align-to-standards` already leaves a
`.standards-version` marker in every aligned repo, so a GitHub code search for that filename
would return a real count without any new code. It was rejected as the *primary* source
because most adopting repos are private - code search only sees public ones, so the number
would be a floor, not a count, and would silently under-report by an unknown margin.

A consent-gated ping (ask "can we send this?", wait for yes/no) was also considered and
rejected. The owner had already watched a related idea - asking adopters for feedback/opinion
at the end of a run - talked out of existence in the same conversation on the grounds that
almost nobody answers a voluntary prompt. A yes/no gate on the ping has the identical failure
mode: it adds a decision point that costs the adopter nothing to skip, so it would skip. The
same reasoning kills a self-registration list (an `ADOPTERS.md` an adopter PRs themselves,
the pattern Kubernetes/Envoy use) - it is the same voluntary action in a different shape.

What survives that filter is a ping that fires automatically and is disclosed, not requested -
the model Homebrew, Next.js and the .NET CLI use for their own telemetry: on by default,
named plainly in the output, switched off by one environment variable for whoever wants that.
That model only stays honest if the payload genuinely could not identify who sent it - a
disclosure covers a fact, not a permission slip, so the fact it discloses has to already be
harmless.

## Decision

**`align-to-standards` sends one ping when a run reaches a completed state** (drift 0, or an
explicit terminal outcome for a run that did not fully align), and it *tells* the adopter this
is happening rather than asking:

> Sending an anonymous signal about this adoption (stack, standard version, final drift) -
> no repo name, no code content. Turn it off with `REPOSTDS_NO_TELEMETRY=1`.

(English, like every other artifact in this repo (`AGENTS.md`'s working-language rule) -
`align-to-standards` runs against any adopter's repo, not only the maintainer's own.)

**The payload is exactly this, nothing more:**

```json
{
  "event": "adoption_completed",
  "stack": "node",
  "standards_version": "1.4.0",
  "drift": 0,
  "fully_aligned": true,
  "date": "2026-08-10"
}
```

No repo name, no org, no URL, no free-text field - a free-text field would eventually carry
whatever an adopter typed, which reopens the exact identifiability question this record
exists to close. `date` is day-granularity, not a timestamp - an exact time is one more axis
an adopter's own activity log could be correlated against. No field persists across pings
(no client-generated UUID, no repeat-visit token), because a stable identifier that is not a
name is still a way to notice "this is the same repo again," which is a form of tracking the
minimal-payload decision is meant to rule out.

**`REPOSTDS_NO_TELEMETRY=1`** (checked before the request is built) skips the ping entirely.
This is what makes "inform, don't ask" defensible rather than sneaky: the disclosure names the
exact fields sent, and anyone who wants zero participation gets a single, documented switch.

**Endpoint, v1: the account's free `*.workers.dev` address**, not a subdomain of
`repositorystandards.com`. That was the original plan - NS-delegate just `stats.` so the rest
of the domain's DNS in home.pl stays untouched - but Cloudflare's self-serve "connect a
domain" flow refused a bare subdomain outright ("provide the root domain, not a subdomain"),
live-tested rather than assumed. Getting a custom subdomain would mean either an Enterprise
plan or moving `repositorystandards.com`'s whole zone to Cloudflare, both bigger and riskier
than this record's scope. The workers.dev address costs nothing, touches no existing DNS, and
is reachable the moment it's deployed; a nicer hostname is deferred, not abandoned. Live at
`https://stats.repositorystandards.workers.dev` - the account's workers.dev subdomain was
renamed from its default (account-name-derived) value to `repositorystandards` first, since
this account's only other tenant (`stayget.com`) uses it for DNS, not Workers, so nothing else
shared the old name. `GET /` returns `{"count": N}`; `POST /` accepts the payload below - no
`/adoption` path, the worker name alone (`stats`) already says what it is.

**Storage: Cloudflare D1**, one append-only table. A plain KV counter was considered and
rejected once the payload grew past a single number - `drift` and `fully_aligned` are worth
querying later ("what's the drift distribution across real adoptions"), which a bare counter
throws away.

## Consequences

- A new small service exists outside this repo's own CI: a Worker + a D1 database, deployed
  by the maintainer via `wrangler`, not built by `checks.yml` or `pages.yml`.
- `align-to-standards`'s completion step gains the notice text and the `curl` call, gated by
  the env var check. This is **repo-own (zone 1)**: it changes what the maintainer's own copy
  of the skill does at the end of a run, not what the shipped standard requires of an adopter.
  An adopter who forks or vendors the skill without this repo's Worker URL simply has a call
  that fails silently or is stripped - nothing in R1-R25 depends on it.
- No dashboard reads this data yet. Turning the raw D1 rows into a number `EXHIBIT-1` or the
  site can point at is separate follow-up work, not scoped by this record.
- The custom-domain question (`stats.repositorystandards.com`, or migrating the whole zone to
  Cloudflare) stays open for later, once the free address has proven the mechanism works.

## Compliance

`align-to-standards`'s completion step prints the disclosure text and issues the POST unless
`REPOSTDS_NO_TELEMETRY` is set; the POST body matches the schema above field-for-field, with
no additional keys; the Worker persists only those fields, no request metadata (IP, headers)
alongside them.

## Related

- [ADR-045](ADR-045-record-run-feeds-the-existing-corpus-consent-gated.md) - a different
  mechanism for a different purpose. `record-run` is consent-gated, carries far more detail,
  and feeds the human-prompting corpus to improve the product. This ping is automatic-and-
  disclosed (not consent-gated), carries the minimum, and only feeds a count. Neither
  touches the other's storage.
