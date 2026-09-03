# Field adoption, 2026-09-03 - the questions, the answers, and what the owner saw

The evidence behind
[`runs/2026-09-03-h-monorepo-adoption.json`](../runs/2026-09-03-h-monorepo-adoption.json),
and the first transcript in this corpus where the Layer 2 offer was made cold, accepted
and applied - the accept path
[`stack-offer-on-adoption.md`](../../../open-questions/stack-offer-on-adoption.md) said no
run had walked.

**What this is.** One adoption of a private company monorepo, run by its owner from the
shipped line `A1` in a single Claude Code session, from the entry line at 09:51 to the pull
request the same afternoon. The user turns and the answers are reproduced exactly as
typed, including the typos. The agent turns are not reproduced - only the questions it
put, verbatim from the `AskUserQuestion` calls in the session log, and one-line accounts
of what it did between them. **Every time in this file is UTC**, as the session log
records it; the repository's commit times are two hours ahead and have been converted.

**What is redacted, and what is not.** The product, the company, the GitHub organisation,
the tracker project key and every person are replaced: the key reads `[KEY]`, a
knowledge-base link reads `[knowledge-base URL]`. Technology names stay, because the
run's central finding is about a technology layer, and the questions are quoted as
asked, so the facts the router detected about the repository stay inside them.

**Why this transcript was kept.** The run's twelfth question asked whether the session
could be kept and an anonymised excerpt sent upstream; the owner chose "keep + send
anonymised" and, at the end of the working day, asked for exactly that - with one
instruction that is itself the evidence:

> i na koniec wrzuc do repository-standard ten flow caly ktory tu poszedl do testow
> zanonimizowany i zauwaz tam ze nie bylo automatycznej adopcji node repozytorium i nie
> psytal o to nawet, wazna to kwestia i trzeba naprawic

Read against the 09:55 round below, that sentence is wrong about the log and right about
the adoption. Both are recorded.

---

**Użytkownik** (09:51)**:**

> adopt this repo to repositorystandards.com

The agent read the standard (1.0.2 at the time), measured the repository against it and
asked three rounds of four questions, at 09:55, 09:57 and 09:59.

## 09:55 - round one

### 1. `[adopt.intent] intent`

> How far does this adoption go: migrate everything to the standard, adopt selected parts,
> or assess only and change nothing yet?

Opcje: **migrate (Recommended)** / **selected parts** / **assess only** / **suggest it, I
will check later**

**Odpowiedź:** migrate (Recommended)

### 2. `[technology / Layer 2]` - no point id; no point declares this question

> Detected: TypeScript monorepo on pnpm, Next.js + Fastify, Vitest/Playwright/Detox. The
> standard's optional Node stack layer (repository-standards/node) additionally prescribes
> Biome instead of ESLint+Prettier, Better Auth instead of Cognito, CSS Modules + tokens,
> and a stack.manifest.json with its own drift entries. Adopt Layer 1 (core) only now, or
> Layer 1 + the Node stack layer?

Opcje: **Layer 1 only now (Recommended)** / **Layer 1 + Node stack**

The two options as the card described them, because the recommendation is part of the
evidence:

- **Layer 1 only now (Recommended)** - "Core standard only. Node stack picks that conflict
  with Cognito/ESLint/NativeWind would need superseding ADRs or migrations; defer that to
  a later wave with its own decision."
- **Layer 1 + Node stack** - "Also merge stack.manifest.json; conflicting picks recorded as
  exceptions or superseding ADRs in this run. Larger PR, touches build tooling."

**Odpowiedź:** Layer 1 + Node stack - the option the router recommended against.

### 3. `[adopt.profile] profile`

> Detected: 7 CODEOWNERS, Jira sprints, hand-offs between PO/dev/QA, so the detection is
> `scale`. Confirm the profile? (`scale` adds blocking spec-guard coupling checks on PRs
> and optional sprint/journey/analytics docs; `core` skips those and covers
> knowledge-keeping only.)

Opcje: **scale (Recommended)** / **core**

**Odpowiedź** (free text)**:** adjust fully to standard, we dont need codeowners here as
monorepo is handled by everyone

### 4. `[appetite] appetite`

> One focused PR now, or a programme of waves (Wave 1: intake + assessment + personas +
> decisions + first specs + backlog + guards; later waves finish the remaining specs)?

Opcje: **waves (Recommended)** / **single PR**

**Odpowiedź:** single PR

## 09:57 - round two

### 5. `[adopt.language] language`

> Which language do the written artifacts use? (Code, commits and current docs are
> English; the team chats in Polish.)

Opcje: **all English (Recommended)** / **code English, docs Polish** / **all Polish**

**Odpowiedź:** all English (Recommended)

### 6. `[adopt.layout] layout`

> The repo already arranges things its own way: docs/adr/ (15 ADRs),
> specs/001-notifications-phase1/ (Spec Kit, per-ticket), docs/features/[KEY]-xxxx.md,
> .specify/. The standard wants docs/decision-records/, specs/<capability>/,
> docs/discovery/. Move what you have into the standard's layout, keep yours and map the
> standard onto it, or decide case by case?

Opcje: **move into standard layout (Recommended)** / **keep ours, map onto it** / **case
by case**

**Odpowiedź:** move into standard layout (Recommended)

### 7. `[adopt.records] records`

> The 15 existing ADRs use a table-header format (Status/Date/Story), not MADR. Take them
> as they stand, rewrite them into the standard's MADR shape, or leave them and only add
> new ones? And for the new foundational records (topology, datastore, auth, testing,
> security, release): write now, stubs, or draft for you to check?

Opcje: **rewrite + write new now (Recommended)** / **keep as-is + write new now** / **keep
as-is + stubs**

**Odpowiedź:** rewrite + write new now (Recommended)

### 8. `[adopt.personas] personas`

> Who are the users of this product? Define them yourself now, have them suggested from
> the code (roles, Cognito user types, landlord vs agent vs admin, web vs mobile) for you
> to correct, or skip personas for now?

Opcje: **suggest from code (Recommended)** / **I will define them** / **skip for now**

**Odpowiedź** (free text)**:** You have notion connector and there are the personas. Also,
in this notion tehere are additional informations like ADRs etc. But i DONT want you to
copy them 1:1, you can build stubs and make links to proper notion pages for them but
migrating from notion to github must be manually by decloper/architect:
[knowledge-base URL]

## 09:59 - round three

### 9. `[adopt.tracker] tracker`

> The standard's backlog.md is the source of truth for tracked work, and this repo tracks
> sprint work in Jira (project [KEY]). Fold Jira into the backlog, keep both with the
> backlog as the source, or keep Jira and let the backlog bridge to it?

Opcje: **keep Jira, backlog bridges (Recommended)** / **both, backlog is source** / **fold
Jira into backlog**

**Odpowiedź:** keep Jira, backlog bridges (Recommended)

### 10. `[adopt.guards] guards`

> The repo already has agent hooks that overlap the standard's (.claude/hooks: context
> trimming, handoff; plus your user-level force-push and remote-DB guards). The standard
> ships elicitation-guard, no-force-push, no-remote-db-writes, no-ci-secret-writes.
> Replace, merge, or keep both?

Opcje: **merge (Recommended)** / **replace** / **keep both**

**Odpowiedź** (free text)**:** merge but with sense. wave 1.- add stnadard rules only then
check if existing make sense, if yes add/merge if not, remove do not overcomplicate it

### 11. `[adopt.commit-plan] commits`

> This adoption touches many files and the repo rebase-merges (every commit lands on main
> alone). Split into commits how?

Opcje: **per concern (Recommended)** / **per phase** / **one commit**

**Odpowiedź:** per concern (Recommended)

### 12. `[adopt.evidence] evidence`

> May this session be kept as evidence for the standard (the questions asked, answers,
> what it produced), and may an anonymised excerpt be sent upstream to
> repository-standards after you have read it? Also: the standard's close step sends an
> anonymous adoption ping (stack, version, drift; no repo name) unless
> REPOSTDS_NO_TELEMETRY is set.

Opcje: **keep local only** / **keep + send anonymised** / **do not keep**

**Odpowiedź:** keep + send anonymised

## 10:00 - 12:14 - the work, and what the owner said while it ran

The agent worked the answers into the tree. `stack.manifest.json` existed in the working
tree by 10:21. At 11:04-11:05 nine per-concern commits were authored at once - eight for
Layer 1 and one, `add the Node stack layer 0.3.1`, holding the stack manifest, `.nvmrc`,
two `pnpm-workspace.yaml` keys and two stack exceptions (`biome.json`,
`vitest.config.ts`). Then the owner's turns, verbatim:

**Użytkownik** (11:18)**:**

> zobacz na agentow z repository standards i nowe PRy ktore oznaczaja decyzje i aretekakty
> ktore nie zostlay zdecydowane przez czlowieka jako needs review czy jakos tak

The marker pass landed as a tenth commit at 11:30.

**Użytkownik** (12:06)**:**

> dodatkowo, record-run skill nie powinien byc shippowany do repozytirum klienta. To jest
> jednorazowy skill z adopcji przeciez i tyle - ewentualnie pozniej prz re-adopcji ale to
> znowu nie powinno byc u klienta w repo

**Użytkownik** (12:08)**:**

> dashboard build dodane do ci/cd przeciez to porjekt korporacyjny wiec dahboard nigdize
> nie bediz edeployowany chyba ze zazyczy sobie tego developer ale to ich spara,
> autatycznie nie powinno sie ot dziac

**Użytkownik** (12:10)**:**

> dodaktowo, jesli ktos nie uzywa sprints naszych (a tak jest wp rzypadku tego repo) to
> katalog sprints nie powinien sie tworzyc

**Użytkownik** (12:14)**:**

> i jeszcz eopdoweidz w jaki sposob wziales tu pod uwage repository-standards/node bo nie
> widze

Seventy minutes after the Node stack commit was authored, the owner could not see the
Node stack. The session's usage limit expired on the same second and the reply was a
limit notice; the owner typed "Try again" at 13:39 and the session resumed at 13:46 from
a compaction summary.

## 13:46 - 15:00 - the answers, the update, the pull request

At 13:54-13:55 the agent committed the answers to the three critiques - a content
exception for the one-time `record-run` skill, a key exception for the dashboard
workflow's push trigger, content exceptions for the two sprint skills and the removal of
`docs/sprints/` - and one `update-to-latest` run that took the repository from 1.0.2 to
1.0.6 without touching the excepted files. At 13:58 it answered the 12:14 question: the
Node stack had a documented path in `docs/adoption-intake.md`, and there was a stack
commit. Three self-review rounds (14:07-14:51) preceded and followed the pull request;
`self-verify` closed at drift 0, 93% adopted.

## About 15:00 - what the owner remembered

The instruction quoted at the top of this file. Five hours after accepting the offer and
four after its commit was authored, the person who accepted it reported that the layer
had not been adopted and that nobody had asked - and asked for the standard to be fixed.
The run's own record says the question was put at 09:55, second in a card of four,
recommending the other answer, and that its result was a manifest and a version file
inside a nine-commit batch. Nothing between 09:55 and 15:00 - no summary line, no section
in the PR body, no message when the layer landed - ever said "the Node stack is in".
