---
name: show-backlog
description: Use when someone asks what the work state IS rather than asking to change it - "show me the backlog", "what is in the pool", "what are we working on", "where do things stand", "what is left" - in whatever language they ask it. Builds the repository's dashboard and hands back the page and the headline numbers, instead of retyping the backlog file into chat. Filing new work is not this - `add-to-backlog` owns that.
---

# show-backlog

Someone wants to see the work state. The repository already renders it: `generate-dashboard`
projects the pool, the sprints, the timeline, the records and the changelog into one page from
the committed files. Reading `backlog.md` aloud into chat is a second, worse rendering of a
thing that renders itself - slower, lossy, and stale the moment it is written.

So: build the page, hand over the link, and say the two or three numbers that answer the
question actually asked. Do not paste the backlog.

## Steps

1. **Find the generator.** It is an optional entry, so a repo may not have it. Look for
   `scripts/generate-dashboard/index.mjs` (the manifest path; `self-verify` knows whether this
   repo took the entry). If it is not there, go to "No dashboard in this repo" below.

2. **Find how this repo runs it.** Do not assume a package manager or a script name. Read
   `package.json` (or the equivalent task file) and look for a script whose command mentions
   `generate-dashboard`; if one exists, run it with the package manager this repo's lockfile
   implies. If none exists, run the generator directly - Node is already a prerequisite of the
   shipped guards, so this always works:

   ```
   node scripts/generate-dashboard/index.mjs --serve
   ```

   `--serve` builds the page and serves it on `http://localhost:9675`, rebuilding when a source
   file changes. Without `--serve` it writes `site/dashboard/index.html` and exits, which is the
   right call when the user wants a file rather than a session.

3. **Say what you started.** A long-running server the user did not ask for is a surprise:
   name the URL, say it keeps rebuilding, and say how to stop it. If the port is taken the
   generator says so and suggests another - pass that one rather than killing whatever holds it.

4. **Answer the question in one or two lines.** The generator prints its own summary (pool
   items, sprints, changelog entries, decisions, specs), and the page's counters carry the
   rest. Give the numbers the question asked for - what is in flight, what is blocked, what is
   left - and let the page carry the detail. If the user asked something the page does not
   answer, read the source file for that one thing; do not summarise the whole file.

## No dashboard in this repo

The entry is optional and a repo is allowed to skip it. Do not fail, and do not install it
uninvited. Read the backlog ledger (`backlog.md` or `docs/backlog.md`, per the manifest),
answer the question from it directly, and say once that the repo can render this instead -
the entry is `scripts/generate-dashboard` in `standard.manifest.json`, and taking it is a
copy of that directory plus a `self-verify` run. Offer, then drop it; a repo that declined an
optional entry declined it.

## What this is not

- **Not a way to change anything.** The page is a projection of the committed files and never
  a second place work is tracked. New work goes through `add-to-backlog`, a sprint through
  `sprint-open` / `sprint-close`, a projection through `timeline-update`. If the user wanted to
  move an item, this skill was the wrong match - say so and hand over.
- **Not a substitute for reading a specific row.** "What is the status of STD-4" is one lookup,
  not a dashboard. Answer it from the file.
- **Not a publishing step.** Building locally is not deploying. The page carries whatever the
  repository carries, so a private repo's page is private data; `--lock` and the shipped
  workflow are what handle that, and neither is this skill's decision to make.
