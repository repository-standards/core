# Security

<!-- Template: fill the placeholders at adoption. -->

**Reporting a vulnerability.** Email `{{SECURITY_CONTACT}}` - do not open a public
issue for anything exploitable. Expect an acknowledgment within
`{{RESPONSE_WINDOW}}` (e.g. 3 business days).

**Scope.** This repo and the services it deploys; third-party dependencies go to
their own maintainers (link the advisory here if it affects us).

**No secrets in this repo.** Enforced by the gitleaks gate
(`.github/workflows/`, `.gitleaks.toml`) - a leaked secret is rotated, not deleted
from history and forgotten.
