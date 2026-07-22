# Runbook: {{SERVICE}}

Serves: the on-call human and the agent acting for them. If a step cannot be
followed at 3 a.m. without asking anyone, it is not done.

## Diagnose

- Health: {{HEALTH_URL_OR_COMMAND}}
- Logs: {{WHERE_AND_HOW}} (link the query, never screenshot the dashboard)
- The three most likely causes, most likely first: ...

## Start / stop / restart

```
{{COMMANDS}}
```

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| ... | ... | ... |

## Rollback

Triggers were decided before the first deploy (release-strategy fork): {{TRIGGERS}}.
The undo path, step by step: ...
