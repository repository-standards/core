The map from each capability to the code that implements it. Small file, and the single
most load-bearing one in the tree: it is what lets a guard say "this code moved and its
spec did not".

Without it the coupling guard exits zero and quietly checks nothing. Your specs still look
maintained, the build is still green, and the drift happens anyway.

## What it is for

**So that a spec cannot rot silently.** Specs decay in one specific way: someone changes
behaviour, ships it, and the document describing that behaviour stays as it was. Nobody
lies; the spec simply stops being asked. This file is what makes the pull request ask.

## What goes in here

One key per capability, matching the folder name under `specs/`, and the globs its code
lives behind:

```json
{
  "payments": [
    "**/payment/**",
    "**/payu/**",
    "shared/**/payment*"
  ],
  "bookings": [
    "**/booking/**",
    "**/api/booking/**",
    { "glob": "config/booking-rules.json", "couples": "shape" }
  ]
}
```

`**` matches any path, `*` matches within a segment. A qualified entry narrows what counts:
`"couples": "shape"` fires only when the file's **key structure** changes, so editing a
value in a config file is not a behaviour change while adding a field is.

Tests co-located with the code are already covered - `**/booking/**` matches
`src/booking/booking.test.ts` like anything else under it.

## What does not go in here

**A capability with no spec.** The key names a folder under `specs/`; if that folder does
not exist, the entry maps code to nothing.

**Globs so broad they match everything.** `src/**` for one capability makes every pull
request demand that spec's update, and a guard that fires on everything gets bypassed on
everything.

**Globs so narrow they match nothing.** The opposite failure and the quieter one: it looks
like coverage and provides none.

## The failure that has no symptom

A capability spec **with no entry here** is not caught by anything. The guard iterates the
map, so an unmapped capability is simply never considered. That is why `spec-guard --audit`
exists and runs on every pull request rather than as a periodic sweep: it checks that every
capability is mapped, which is the one thing the per-diff run cannot notice.

## How you actually use it

You author it at adoption, from the example beside it, and extend it whenever a capability
appears:

```
> add the notifications capability to the map - the code is under src/notify and shared/mail
```

## Decisions behind it

- **[ADR-011](../decision-records/ADR-011-one-standard-two-profiles.md) - the map is core,
  the enforcement scales.** The tool ships to every repo; how hard the gate bites is a
  profile decision.
- **Globs, not a build-tool integration.** Reading the real dependency graph would be more
  accurate and would tie the guard to one ecosystem. Layer 1 is stack-agnostic by rule, so
  the guard uses the one thing every repository has: paths.
- **Qualified entries instead of excluding config files.** Excluding them was the first
  answer and it loses the case that matters: a config file whose *shape* changes is a
  contract change wearing a data file's clothes.
