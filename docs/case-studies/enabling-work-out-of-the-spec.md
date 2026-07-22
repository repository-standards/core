# Enabling work, out of the spec (pattern)

**Situation.** An enterprise SSO slice in an internal console: before anything could be
built, IT had to register the identity-provider application - a ticket to another team,
with lead time, blocking the first user story.

**What happened (the good version).** The dependency was **not** written into the spec
prose - a spec describes the capability's behavior, and "ask IT for an app registration"
is not behavior; once satisfied it would be a fossil nobody should read. Instead it was
encoded as a front-matter key (`needs_decision_records`-style) on the slice, and the
git -> tracker bridge emitted it as a **Story that blocks the affected user story**.
Someone picked it up in the tracker; when satisfied, the key was cleaned; the spec never
knew.

**The pattern.** *Enabling work is tracker-shaped, not spec-shaped.* Tokens, access
requests, agreements, data hand-offs: they gate development but are not part of the
capability's truth. Front-matter -> tracker (blocking) -> cleanup keeps three honest
places: the spec (behavior), the tracker (work state), git (history).

**What the standard does about it.** ADR-010 makes this the rule: enabling/
organizational tasks go front-matter -> tracker as blocking Stories; spec prose never
mentions them; the close/cleanup step removes satisfied keys.

**Where it lives now.** ADR-010 (phase 3), the capability spec template's Status note,
ways-of-working "Status & close".
