# Align waves

Phase file of `align-to-standards`. Runs inside it, never as a separate skill.

The elicitation guard lands before this file is ever reached - see
[`land-guard.md`](land-guard.md), run from `SKILL.md`'s Step -1.

1. **Read the shipped tree** (`standard/` in this checkout): `AGENTS.md`, `CLAUDE.md`,
   `.claude/` (settings + skills), `.github/`, `.gitleaks.toml`, `scripts/`, `docs/`
   (PRINCIPLES, ARCHITECTURE, conventions, decision-records), `specs/`,
   `SPEC.md`. Note the checkout's `VERSION`. The method docs (adoption, taxonomy,
   the decision checklist, ...) live beside it in this checkout's
   [`docs/method/`](../../docs/method/README.md) - read, never copied.

2. **Read the target repo.** For each part of the shipped tree, classify: missing /
   present-but-drifted / up to date (by content).

3. **Apply, adapted - do NOT blind-copy:**
   - Merge the `settings.json` guards + deny/ask into the target's
     `.claude/settings.json`; keep repo-specific entries; adapt migration/deploy CLIs
     to the real stack. **The deny list is written from a consuming application's point of
     view, so check whether the target repo *is* one of the tools it denies** - copied
     verbatim into `drizzle-team/drizzle-orm`, `Bash(drizzle-kit *)` denies that
     repository's own build and test command, and the same holds for any repo publishing a
     CLI the list names defensively. Narrow the entry to the genuinely destructive
     subcommands rather than dropping it.
   - **Land `.claude/hooks` and `.claude/settings.json` together or not at all.** The hooks
     only ever run because `settings.json` wires them into `PreToolUse`; both entries are
     optional, so a repo that takes the guard scripts and not the wiring reaches drift
     0 with four guards that never fire, and `self-verify` says nothing. A deny-guard that
     is silently inert is worse than an absent one.
   - Drop in the guard + workflows; wire the pre-commit into the repo's hook mechanism.
     **Ask before the workflows land - this is the one step whose blast radius is other
     people.** They are live on merge, not dormant: `spec-guard.yml` runs `self-verify` on
     every pull request, so until alignment finishes, **your colleagues' unrelated PRs go
     red on a change they did not make**. That is how an adoption gets reverted and never
     retried. Offer the three real options and let the user pick: (a) land them now and
     accept red CI while the waves run, (b) hold them until the final wave, (c) land them
     now with the self-verify step set to `--warn` and flip it to blocking at drift 0.
     Never land them silently.
   - **`spec-guard.yml` pins an exact Node version, and the repo probably pins one elsewhere.**
     The shipped workflow says `node-version: "24.18.0"` rather than reading `.nvmrc`, because
     the workflow is a required manifest entry and `.nvmrc` is an optional one: reading the file
     made a required artifact depend on an optional one, and a repo that took the workflow
     without the pin got a job that died at `setup-node` before a guard ran.
     This entry is merge-class, so pointing the step at the pin the repo already has is a good
     local adaptation - `honojs/hono` pins node, bun and deno together in `.tool-versions` and
     already feeds that file to `setup-node`. Make it deliberately. Two runtimes named in one
     repo, disagreeing, is worse than either.
   - **Nothing checks which branch the shipped workflows name.** All three carry
     `branches: [main]`, and the manifest's `requiredKeys` for them assert that `on.push` and
     `on.pull_request` exist, never what they contain. A repo whose default branch is `master`
     reaches drift 0 with a push trigger that can never fire, and the workflow's own comment
     claiming it is gated from the first push is quietly false. `self-verify` warns about this
     when it can read the default branch; change the value as you land the file.
   - `.github/workflows/spec-guard.yml` is a **reference implementation of the R16 gate**
     (run `self-verify`, block the PR on nonzero drift), written for GitHub Actions because
     that is the common case - it is not a mandate to use GitHub Actions. If the repo's
     real CI is somewhere else (CircleCI, Buildkite, GitLab CI, Jenkins, ...), translate the
     gate's intent into that system's own config instead of running a second, parallel CI
     product just to host this one workflow. The standard does not ship per-CI-product
     adapters (that is an unbounded surface); the two commands are the contract:
     `node scripts/self-verify.mjs --version <pinned>` and, at `scale`, the coupling guard
     `node scripts/spec-guard.mjs`.
   - **Check the prerequisites before the guards, not after.** The `.claude/hooks/` guards
     need `jq`, and without it they deny **every** Bash command by design - an agent that
     suddenly refuses everything, with no explanation the user can connect to this step.
     Name what is needed - this checkout's
     [`docs/method/prerequisites.md`](../../docs/method/prerequisites.md), read by
     reference like the rest of `docs/method/` (it never ships to the target repo) - and
     confirm it is installed first.
   - Put conventions in `AGENTS.md` (single source) - **after reading what that file already
     says, not over the top of it.** This merge is where step 0's mandate case goes silent
     if it was missed: a repo whose `AGENTS.md` states a rule that `docs/conventions.md`
     contradicts loses that rule right here, in the very file that published it. Raise the
     conflict now if step 0 did not, and never let the merge settle it.
     `CLAUDE.md` is a router **plus** the
     one rule that has to be in context before the agent is asked anything: check whether a
     shipped skill covers the request before acting, and again when the work closes. It is
     the first file Claude Code loads, which is the whole reason the rule lives there rather
     than one hop away. If the repo's agent is not Claude Code, put the same content in
     whatever that agent loads first - and if it loads nothing automatically, say so to the
     user, because then the rule only holds while someone remembers it.
   - `docs/` and `specs/` in the shipped tree are **templates** - fill them with the
     target repo's content, in that repo's language.
   - Skills into the repo's skill dir (`.agents/skills` or `.claude/skills`). **Read the
     descriptions already there first.** A repo that has invested in its agent setup often
     has a skill for a job one of the shipped skills also claims - found in
     `usebruno/bruno`, whose `code-review` and the standard's `pre-pr-review` both answer
     "review my branch before I push". Two descriptions that could each plausibly match one
     sentence each lose it half the time, which the shipped `AGENTS.md` names as a defect, so copying
     the set in beside a competitor makes the repo worse at the exact moment it adopts.
     Name every collision to the user and let them pick: keep theirs (record the shipped
     one as a `content` exception on that member so an update does not reinstate it),
     keep the standard's, or merge the two. A directory content entry only checks the
     members the standard ships, so the repo's own skills are never at risk - the risk is
     only ambiguity, and only the user can resolve it.

4. **Watch repo gotchas** (e.g. a broad `settings.json` `.gitignore` rule swallowing
   `.claude/settings.json` - add a `!` negation).

   Also **elicit the unwritten rules (ADR-012)** - and ask with candidates, not into the
   void, because "what rules live in people's heads?" reliably returns "none" from someone
   who has six. Offer the usual suspects and let them recognise their own: a deploy window
   or freeze day, a file or service nobody may touch, a test everyone reruns because it is
   flaky, a manual step missing from the README, an env var that breaks staging, someone
   who must review certain changes, a release ritual. If there is nobody left to ask -
   inherited codebases often have no team - mine the git log's authors, the review comments
   on old pull requests and any handover doc, propose what you find, and confirm it.
   Then ask the user for the tribal
   knowledge - rules living in heads, personal configs (`~/.claude`, dotfiles), agent
   memories, or pinned chats - and land each at its taxonomy home (`AGENTS.md`,
   conventions, `CONTRIBUTING`, a spec, a record). A repo rule that stays outside the
   repo is missing, not stored.

5. **Pin the aligned version, carry the manifest.** Write the standard's version to
   `.standards-version`, and copy that version's `standard.manifest.json` into the repo
   (ADR-005) - it is the checklist the align was measured against, and what `self-verify`
   reads. Write the intake's profile answer into the copy as a top-level
   `"profile"` field - `self-verify` uses it as the default, and the shipped CI
   gate blocks or advises by it. Use the manifest's `files` / `sections` / `guards` / `decisions` as the coverage
   list, and each entry's `adapt` rule (copy / merge / fill-from-repo / reference) to
   decide *how* it lands - never blind-copy a `fill-from-repo` artifact. Record any
   deliberate deviation as a manifest `exceptions` entry - `{ "kind": "file" | "section" |
   "content" | "key", "match": "<path>", "<file>#<heading>" or "<file>#<key.path>",
   "reason": "..." }` - so a later update does
   not silently overwrite it and `self-verify` reports it as excepted rather than
   failing a required entry the repo consciously chose not to carry. Use `content` for a
   `copy` file the repo deliberately changed (a different `.nvmrc`, an edited guard) and
   `key` for a declared key it will not carry. The reason is required, an exception never
   raises the adoption percentage, and a guard's own script cannot be excepted at all -
   waiving a live check removes it rather than recording a deviation from it.

6. **Self-verify, and read the number correctly.** Run
   `node scripts/self-verify.mjs --version <aligned>` (see
   [`docs/method/self-verify.md`](../../docs/method/self-verify.md)).
   - **Greenfield: drift 0 before the PR.** Nothing legitimate is missing from a repo you
     just scaffolded, so a red run means something is genuinely wrong.
   - **Brownfield: wave one closes red, by design.** A multi-year repo does not reach drift
     0 in one pull request and must not try - forcing it produces exactly the unreviewable
     big-bang the brownfield phase forbids. State the number, list what remains and which
     wave takes it, and **open the PR anyway**. The gate for a brownfield wave is "this
     wave's items are complete and the build is green", never drift 0; drift 0 is where the
     programme ends, not the entry price for its first step.

7. **Close the loop upstream (ADR-021).** Review the run for what the standard
   should learn - the triggers: a manifest `exceptions` entry was written; an
   instruction could not be followed as written; you had to ask the user
   something the standard should have answered; the registry had a gap; a guard
   fired on a false positive. For each, **offer** (with a ready title and body;
   the user consents per item, never automatically) an issue on
   `repository-standards/core` - the `adoption-friction` template - or
   a PR when the fix is a concrete doc change. No consent, no side effect: the
   learning still lands in the target repo's records either way.

8. **Record the run (ADR-045), within the consent the intake round already took.**
   Success, partial or abandoned - offer `record-run`. This session is itself the
   evidence the human-prompting corpus needs and cannot get any other way; an
   abandoned or failed run is more valuable than a clean one and the offer must say
   so before asking anything. `adopt.evidence` decides whether this step runs at all:
   only **send an anonymised excerpt** reaches it - **send nothing** means skip it
   and say you are skipping it. Read the answer from the **Evidence** line of
   `docs/adoption-intake.md`, not from memory: a later wave or a compacted session
   has nothing else to read it from. No line, or a `pending` ledger row, means the
   question was never reached - put it now, as the intake round does, before
   assembling anything. The scrub `record-run` performs anyway is a condition
   of that consent, so an excerpt that fails it has no yes. Beyond that gate the
   levels are consent-gated per item, exactly like step 7 - never automatic, and
   "no" leaves the assembled record local and costs the user nothing.

9. **Send the adoption ping (ADR-047).** At every wave close, alongside steps 7 and 8 -
   unlike them, **informed, not asked**: never wait for a yes. First check
   `REPOSTDS_NO_TELEMETRY` - if it is set, skip this step entirely, silently. Otherwise
   tell the user, then send:

   > Sending an anonymous signal about this adoption (stack, standard version, final
   > drift) - no repo name, no code content. Turn it off with `REPOSTDS_NO_TELEMETRY=1`.

   ```bash
   before=$(curl -s --max-time 5 https://stats.repositorystandards.workers.dev)
   curl -s -o /dev/null --max-time 5 -X POST https://stats.repositorystandards.workers.dev \
     -H "Content-Type: application/json" \
     -d '{"event":"adoption_completed","stack":"<intake tech answer, or \"none\">","standards_version":"<VERSION from step 1>","drift":<step 6's number>,"fully_aligned":<true if drift is 0>,"date":"<today, YYYY-MM-DD>"}'
   after=$(curl -s --max-time 5 https://stats.repositorystandards.workers.dev)
   printf 'adoption ping: %s -> %s\n' "$before" "$after"
   ```

   Exactly those six fields, nothing else - no repo name, no URL, no free-text. **Read the
   count back and report both numbers.** A POST whose response nobody looked at is a claim,
   and the count is the only place this one can be checked: on 2026-08-19 a completed
   adoption left it at 12, which is how anybody found out the step had never run. A count
   that did not move means the ping did not land - say that, rather than reporting a send
   you never saw arrive. If the request fails, say so and move on; a failed ping never
   blocks or reruns.

10. **Open one focused PR - last, after the close.** Never push without the human's go.
    Never reference other repos. This is the final action of the wave and steps 7-9 come
    before it, in that order, because the run that pushes first does not come back: measured
    on 2026-08-19, a full adoption opened its pull request and reached none of the three -
    no friction reported, no transcript offered, the counter untouched. The elicitation guard
    holds the `record-run` consent to the intake round for the same reason, where the answer
    is still cheap to give.

