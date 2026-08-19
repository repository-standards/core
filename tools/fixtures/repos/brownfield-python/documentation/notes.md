# Notes

Whatever somebody had to explain twice ends up here.

## Amounts are Decimal, everywhere

The first version used floats and drifted by a few cents a month against the ledger.
Every amount that crosses this package is a `Decimal` in minor units until it is written.

## The importer is idempotent

Re-running a day is safe and is the normal fix when the export arrives late or wrong.
Entries are keyed by the bank reference, so a second run updates rather than duplicates.

## No retries against the bank API

It rate-limits per day, not per request, so a retry loop burns the day's budget on the
one call that was going to fail anyway. A failed import waits for the next run.
