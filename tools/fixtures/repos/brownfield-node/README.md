# rate-service

Quotes nightly rates for a room, given a season and an occupancy. Two consumers: the
booking flow and the nightly export.

## Running it

```bash
npm install
npm start        # listens on 4000
npm test
```

## Conventions we already have

- `docs/` is API documentation, generated from the route handlers. Prose about how the
  service works lives in this README, and decisions live in the pull request that made
  them.
- Commits are `<area>: <what changed>`, no ticket ids - we do not run a tracker.
- One branch per change, squash on merge.
