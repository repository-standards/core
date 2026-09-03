# Reporting an adoption that went wrong

You typed something, the standard did not do the right thing, and you want that to stop
happening to the next person. This page says exactly what to send.

**If an agent just ran `align-to-standards` for you, it already offered to do this** - the
`record-run` skill assembles the session and acts on whichever of the three you already
picked at intake: sends it outright, shows you the whole batch once for a final yes/no, or
does not fire at all. Read what it shows you, if anything, and answer that instead of doing
the extraction below by hand. This page is for everything else: a session `record-run` never
got to close, or a report you would rather write yourself.

**Every report earns a permanent row** in [`prompts.md`](prompts.md), and it keeps that row
after the fix - which is what turns it from an anecdote into a regression test.

## The short version

If you send nothing else, send this:

1. **What you typed**, verbatim, including typos and language.
2. **What you expected.**
3. **What happened instead** - and if the run was several turns, where it went wrong, not just
   the end.

That is a usable report. Everything below makes it a better one.

## What actually helps

The failures worth fixing are almost never in the first message. They are three turns in, so
what we need is the **shape of the conversation**, not the last answer.

| | Why it matters |
|---|---|
| Every line **you** typed, in order | the corpus is prompts, and yours is one we do not have |
| What the agent **asked you**, and in what order | a question a real person cannot answer is a defect, and so is a question asked too late |
| What you **could not answer**, or had to guess | an interview that only works on people who know the product has failed |
| Where you **would have given up** if this were not a test | the single most useful field, and nothing else captures it |
| What the repository looked like **at the end** | "it adopted the standard" is not an outcome; "three specs, drift 6, and I still do not know what happens on my next pull request" is |
| Your repo's shape | language, rough size, whether it uses pull requests at all, whether it has any policy about agents |

You do **not** need to reproduce it, tidy it up, or work out why. A messy honest report beats a
clean reconstructed one - reconstruction is where the interesting detail dies.

## Extracting the conversation automatically

If you ran it in Claude Code, the session is already on your disk as JSONL, one file per
session:

```
~/.claude/projects/<your-project-path-slugified>/<session-id>.jsonl
```

**Do not send that file.** It contains everything the session touched - file contents, command
output, paths, and anything a tool read. Send the conversation only.

This pulls out just the human lines and the assistant's replies, dropping every tool call,
tool result and attachment:

```bash
python3 - <<'PY' > adoption-transcript.md
import json, glob, os, sys
# newest session in the current project
slug = os.getcwd().replace("/", "-")
files = sorted(glob.glob(os.path.expanduser(f"~/.claude/projects/{slug}/*.jsonl")),
               key=os.path.getmtime)
if not files:
    sys.exit("no session found for this directory")
for line in open(files[-1]):
    try:
        d = json.loads(line)
    except ValueError:
        continue
    if d.get("type") not in ("user", "assistant"):
        continue
    if d.get("isSidechain"):
        continue                      # background agents, not your conversation
    content = (d.get("message") or {}).get("content")
    parts = content if isinstance(content, list) else [{"type": "text", "text": content}]
    said = " ".join(p.get("text", "") for p in parts
                    if isinstance(p, dict) and p.get("type") == "text").strip()
    if not said:
        continue                      # tool calls and tool results have no text part
    print(f"### {d['type']}\n\n{said}\n")
PY
```

Then **read `adoption-transcript.md` before you send it.** It is your conversation, so it can
still contain whatever you typed - a customer name, an internal system, a path that says more
than you want. Delete those lines. Nothing in the report needs them.

If you did not use Claude Code, the same three headings written by hand are just as good.

## Where to send it

Open an issue or a pull request on
[repository-standards/core](https://github.com/repository-standards/core). A pull request
adding your prompt to [`prompts.md`](prompts.md) with `source: reported` is the most direct
route, but an issue with the transcript is entirely enough - the row can be written from it.

If you open a pull request, title it
`feat(real-adoption): <your repo or a code for it>, <stack> - what the run showed`, the same
shape the `record-run` skill uses when it assembles one for you. Put the repository's name in
it only if you are willing for it to be public: a title in a merged history is the one part of
a contribution that cannot be edited away afterwards. A code you pick yourself is fine, and it
costs the report nothing.

**Reports outrank anything we invented.** The rows in the corpus written by people who know
this product are marked as the weaker half on purpose: they systematically produce prompts the
product can already handle. Yours does not have that problem.
