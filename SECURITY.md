# Security policy

This repo ships documentation, templates and dependency-free guard scripts - no
service, no server, no telemetry. The realistic security surface is the guard
scripts an adopter runs (`standard/scripts/`, `tools/`) and the CI templates the
tree ships.

## Reporting

**Use [a private security advisory](https://github.com/repository-standards/core/security/advisories/new)** -
it reaches the maintainer without disclosing anything, and it works today. Please do not
open a public issue for anything exploitable before it is fixed.


Found something - a guard that can be tricked into passing, a template that
lands an unsafe default, a secret-scanning gap? Email
**bodurkalukasz@gmail.com** with the details (file, scenario, impact). You will
get an answer within **7 days**. Please do not open a public issue for anything
exploitable before it is fixed.

## Not secrets

No credentials, tokens or tenant ids live in this repo, by rule (the shipped
`gitleaks` config and the standard's own R19 enforce it). If you find one
anyway, that is a security report - see above.

(The `standard/SECURITY.md` file is the *template* adopting repos fill in - this
file is this repo's own policy.)
