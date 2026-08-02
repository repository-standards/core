The coupling guard. It fails a pull request in which a capability's **code** changed and its
**spec** did not.

```
node scripts/spec-guard.mjs --base origin/main --block
node scripts/spec-guard.mjs --audit --block
```

Two modes, and both run on every pull request. The diff mode catches the change in front of
you. The audit catches the thing the diff mode structurally cannot: a capability with no
entry in `capability-map.json` is never considered by the diff run, so an unmapped
capability is unguarded and silent.

## How it decides

It reads `specs/capability-map.json`, turns each glob into a regular expression (`**`
becomes any path, `*` stays within a segment), and matches the changed files. A capability
whose code matched and whose `specs/<capability>/` did not is a failure.

A qualified entry narrows it: `{"glob": "config/rules.json", "couples": "shape"}` fires on a
change to the file's **key structure** rather than to its values, so editing a number is not
a behaviour change while adding a field is.

## What it cannot catch

**A spec edited to say nothing.** Touching the file satisfies the guard. That is the known
limit of any coupling check, and it is why review still reads the spec diff.

**An unmapped capability**, in diff mode - hence the audit.

**Changes outside the map.** Code no capability claims is unguarded by construction, which
is a signal about the map rather than about the guard.

## The one that surprises people

The guard compares **commits**, not the working tree. An uncommitted spec fix shows as a
failure until it is committed, which reads as a false red the first time and is not one: the
pull request is what is being judged.

## Decisions behind it

- **Per-PR, with no bypass.** A spec update riding in a separate pull request makes the
  guard block the fix, which is the intended pressure: "update the spec before implementing"
  is the principle, "in the same PR" is what makes it real.
- **Globs rather than a build-tool dependency graph.** More accurate, and it would tie the
  guard to one ecosystem. Layer 1 is stack-agnostic by rule.
