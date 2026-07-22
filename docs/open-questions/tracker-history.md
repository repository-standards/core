# Work history lives in the tracker + git, not in repo files

**Decided:** ADR-010 - the repo holds intents and living truth; the tracker
holds execution state and history; plan/tasks are deleted at close.

**Why:** dead scaffolding is noise agents keep reading; git already is a ledger.

**Doubt (the owner went back and forth):** this kills who-did-what-when
visibility inside the repo; regulated shops may need in-repo history.

**A better answer would:** a cheap archive overlay that preserves auditability
without teaching agents to read debris - if it can stay optional and out of
context windows.
