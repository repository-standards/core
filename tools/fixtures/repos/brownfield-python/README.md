# ledger-import

Reads the nightly bank export and turns it into ledger entries. Runs as a cron job, not
as a service.

```bash
uv sync
python -m app.main --day 2026-08-19
```

Prose lives in `documentation/`. There is no `docs/` directory and nothing here calls a
decision a decision - the reasoning for the parts that surprise people is in
`documentation/notes.md`, written when somebody asked.
