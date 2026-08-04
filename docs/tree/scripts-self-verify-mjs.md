The compliance run. It reads `standard.manifest.json`, checks your repository against every
entry, and prints **drift**: how many required entries are unmet.

```
node scripts/self-verify.mjs
```

Zero and exit 0 means compliant with the manifest. Anything else exits 1 and comes with the
list, so the number is never the whole answer - it is the headline over one.

## What it checks, in order

The recorded state, then files - their names, and for the ones the standard ships verbatim
their **content** - then the keys a merged file has to keep, then required headings, then the
guards. Each result is printed whether it passed or failed. It **never stops at the first
failure**: a run that told you about one problem at a time would take as many runs as you have
problems.

`copy` entries are hashed against the `sha256` the manifest records, so a file that is present
but is not the standard's is drift, and the message says *differs* rather than *missing*. If
you changed one on purpose, record it as a `content` exception - the mechanism exists for
exactly that, and it keeps the difference visible instead of silent.

| flag | what it changes |
|---|---|
| `--warn` | exit 0 regardless; the drift number is unchanged |
| `--profile core\|scale` | check one profile's entries only |
| `--skeleton` | the pristine shipped tree - no recorded state, no guards, no placeholder scan |

`--warn` changes the exit code and nothing else, deliberately. A flag that lowered the drift
number would make the number negotiable.

## What it does not certify

The **mechanical** tier only: is the file there, is its content the standard's where the
standard owns it, is the heading there, does the guard pass. Whether your decision records
record real decisions, or a spec that names a persona actually serves them, is judgment and
stays at review. A `fill-from-repo` file is your content by definition, so nothing here can
say whether you filled it well - only whether it is there and whether it still carries
template markers.

Drift 0 with empty shells is a hollow win. The placeholder scan warns about unfilled
`<markers>` and deliberately never counts them as drift, because converting judgment into an
integer is how a metric starts being gamed.

## The convention that makes the placeholder scan work

**Angle brackets in prose mean replace me; angle brackets in `code formatting` are
notation.** Fenced blocks and inline code are stripped before the scan.

Without that strip the warning could never be cleared: generic notation like
`specs/<capability>` is exactly what a correctly filled repository keeps, and the shipped
`AGENTS.md` carries it in its own altitude ladder - so the one file the check exists for
could never satisfy it. The accepted cost is that a real marker hidden inside backticks goes
unseen, which is why the templates keep fill markers in prose.

## Decisions behind it

- **Manifest-driven, so the engine has no opinions.** A new requirement is a manifest entry,
  not a release of this script.
- **Everything is reported before exiting.** The alternative saves a few lines and costs a
  round trip per problem.
- **Warnings never add to drift.** Making the placeholder scan drift-bearing turns "not
  filled in yet" into a build failure, and the fix people reach for is deleting the file.
