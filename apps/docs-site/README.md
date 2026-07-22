# apps/docs-site - generated docs site (DISCO-4)

This folder is **generated**. Every file in it is produced by
[`tools/docsite.mjs`](../../tools/docsite.mjs) from the repo's own Markdown - never
hand-edit the HTML here; it will be overwritten the next time the script runs.

## Contents

| File | What it is |
|---|---|
| `index.html`, `why.html`, `adopt.html`, ... | one page per source Markdown file, per the PAGE MAP in `tools/docsite.mjs` |

## Why this shape, and how to use it

One source, two surfaces: this site renders the exact same Markdown an AI agent reads
from the repo, so there is nothing here to author twice and nothing that can drift from
the docs on its own. To change a page's content, edit its source `.md` file; to change
which files are published, the nav, or the layout, edit `tools/docsite.mjs`. Either way,
regenerate with:

```
node tools/docsite.mjs
```

Dependency-free (Node built-ins only), like the rest of `tools/`.
