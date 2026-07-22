# Capability specs - this repo's own

The repo's own capability specs, dogfooding the shipped method (the method doc is
[`standard/specs/README.md`](../standard/specs/README.md)): by capability, buildable, coupled to code.

- [tree-guard](tree-guard/spec.md) - the shipped tree stays complete, leak-free, self-verifying; every relative link resolves.
- [verify-engine](verify-engine/spec.md) - the shipped self-verify: manifest-driven compliance, drift as a number.
- [web-surface](web-surface/spec.md) - landing + generated docs site, and the gate keeping both shippable.
- [spec-engine](spec-engine/spec.md) - the extracted spec loop: scripts, clarify gate, templates, provenance.

Coupling: [`capability-map.json`](capability-map.json) binds each capability to its code globs - spec and code change in the same PR.
