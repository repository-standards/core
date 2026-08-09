-- ADR-047: one append-only row per completed align-to-standards run.
-- Applied by hand: wrangler d1 execute rs-adoption-stats --remote --file=db/schema.sql

CREATE TABLE IF NOT EXISTS adoptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  stack TEXT NOT NULL,
  standards_version TEXT NOT NULL,
  drift INTEGER NOT NULL,
  fully_aligned INTEGER NOT NULL CHECK (fully_aligned IN (0, 1)),
  date TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
