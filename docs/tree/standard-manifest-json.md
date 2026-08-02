The machine-readable projection of the spec. Every rule that can be checked mechanically
becomes an entry here, and `self-verify` reads nothing else to decide whether your
repository complies.

This is the file that turns a standard into a number.

## What it is for

**So that adding to the standard is data, not a release.** A new required file, a new
optional home, a new guard: each arrives as a manifest entry. The verifier does not change,
does not need a version bump, and cannot develop its own opinion about what the standard
requires.

Only a change to how an entry is *interpreted* is a change to the engine. Everything else
is content.

## What goes in here

Five arrays, each answering a different kind of question.

```json
{
  "version": "1.0.0",
  "files": [
    {
      "path": "docs/personas.md",
      "purpose": "the persona roster the R10 gate checks specs against",
      "adapt": "fill-from-repo",
      "required": true,
      "profile": "core",
      "since": "0.1.0",
      "rule": "R10"
    }
  ],
  "sections": [ { "file": "AGENTS.md", "heading": "Altitude", "required": true } ],
  "guards":   [ { "id": "self-verify", "run": "node scripts/self-verify.mjs" } ],
  "decisions": [],
  "references": []
}
```

**`files`** - what must exist. **`sections`** - a heading that must be present inside one of
them. **`guards`** - a command that must exit zero. **`decisions`** - noted, never checked,
because whether a record actually records a decision is judgment. **`references`** - method
documents adopted by reference, noted and never existence-checked, because they live in the
standard rather than in your repository.

Each `files` entry carries the **rule it enforces**, which is what lets any file in your
repo be traced back to a line of the spec.

## The fields that decide behaviour

**`adapt`** says how an entry lands: `copy` arrives verbatim, `merge` is reconciled with
what you already have, `fill-from-repo` is a shell you author because the standard never
invents your content.

**`profile`** is `core` or `scale`. An entry with no profile counts as core, so a manifest
written before profiles existed still checks in full under either.

**`required`** decides whether a miss is drift or a note. Optional entries produce notes and
never affect the number.

## What does not go in here

**Anything requiring judgment.** If a check cannot be decided by a script, it belongs in
review. Encoding it here converts an opinion into a build failure, and the fix people reach
for is deleting the file.

**Prose.** `purpose` is one line, aimed at a person reading a generated map. The
explanation of what a path is for lives in its documentation page.

**Your repo's own additions.** A stack adds `stack.manifest.json` beside this one and the
two are concatenated into a single drift number. Editing the core manifest to add your own
entries makes the next update a merge conflict in the one file that must stay true.

## Decisions behind it

- **[ADR-005](../decision-records/ADR-005-align-engine-is-a-manifest.md) - the manifest is
  the contract.** The alternative was a verifier with the checks written into it, which
  means every addition to the standard is a code change, a release, and an upgrade for
  every adopter before they can be measured against it.
- **`decisions` and `references` are noted, never checked.** Both were candidates for real
  checks. A decision check would have to judge content; a reference check would demand files
  that deliberately do not exist in your repository.
