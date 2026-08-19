# GET /quote

Generated from the route handler. Do not edit by hand - `npm run docs` overwrites it.

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `base` | number | yes | nightly rate before seasonality |
| `season` | `low` \| `shoulder` \| `high` | yes | 400 on anything else |
| `occupancy` | number | no | defaults to 2 |

Returns `{"price": <number>}`.
