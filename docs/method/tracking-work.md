# Tracking the work - backlog, cycles, timeline

Three files answer the three questions people actually ask: what do we still owe, what are we
doing right now, and when does it land. They are files rather than a board, so they are in
the same place as the code, they diff, and an agent can read and update them without a token.

You do not maintain them by hand. Each has a skill that owns it, and this page is what to
say and what to expect back.

## What is where

Three files, all under `docs/`:

- **`backlog.md`** - *what do we still owe ourselves*. Every repository has this one, however
  small.
- **`cycles/<team>/<cycle>.md`** - *what did we commit to, and by when*. Teams only.
- **`cycles/TIMELINE.md`** - *when does it land*. Teams only.

**Why "teams only".** The standard ships in two sizes, and a repository picks one when it
adopts. **Core** is everything a repository needs whatever it is - one person, one weekend
project, a company. **Scale** adds what only makes sense once several people work in the same
repository, and cycles are the clearest example: a single maintainer already knows what they
are doing this week, so a file recording it would be ceremony with no reader.

Nothing stops a solo repository turning cycles on. It just does not arrive by default, and
you are not out of compliance for not having them.

## The backlog is the pool

Everything the repository knows it owes itself: features, plus the specification, decision
and documentation debt that adoption surfaced. Each row names the person it serves and what
"done" would mean, because an item without a done condition never leaves.

**Adding to it is the most common thing you will do**, and the point is that it costs you
nothing mid-task:

```
> the export dies when it times out, there is no retry - not fixing it in this change,
> write it down so we do not lose it
```

It lands with its source, the role that has to act, and what done looks like. You keep going.

**What the pool looks like** - ordered, top is next:

```figure
<div class="win">
  <div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-ask">&gt; what is in the pool right now?</span></div>
  <div class="win-body">
<svg viewBox="0 0 700 214" role="img" aria-label="The backlog pool, ordered - top is next">
  <text class="bd-lane" x="6" y="14">the pool &#183; ordered by risk x leverage, top is next</text>
  <rect class="bd-card" x="6" y="30" width="688" height="38" rx="8"/>
  <rect x="6" y="30" width="3.5" height="38" rx="2" fill="#ff7a2f"/>
  <text class="bd-id" x="20" y="54" fill="#ff7a2f">INV-3</text>
  <text class="bd-title" x="106" y="54">Credit note for a job invoiced in error</text>
  <text class="bd-tag" x="470" y="54">invoicing</text>
  <text class="bd-tag" x="596" y="54">dev</text>
  <text class="bd-size" x="676" y="54">M</text>
  <rect class="bd-card" x="6" y="75" width="688" height="38" rx="8"/>
  <rect x="6" y="75" width="3.5" height="38" rx="2" fill="#a884ff"/>
  <text class="bd-id" x="20" y="99" fill="#a884ff">NOTIF-6</text>
  <text class="bd-title" x="106" y="99">Decide what happens when a customer opts out</text>
  <text class="bd-tag" x="470" y="99">notifications</text>
  <text class="bd-tag" x="596" y="99">product</text>
  <text class="bd-size" x="676" y="99">S</text>
  <rect class="bd-card" x="6" y="120" width="688" height="38" rx="8"/>
  <rect x="6" y="120" width="3.5" height="38" rx="2" fill="#ff7a2f"/>
  <text class="bd-id" x="20" y="144" fill="#ff7a2f">INV-4</text>
  <text class="bd-title" x="106" y="144">Invoice PDF carries the business's VAT number</text>
  <text class="bd-tag" x="470" y="144">invoicing</text>
  <text class="bd-tag" x="596" y="144">product</text>
  <text class="bd-size" x="676" y="144">S</text>
  <rect class="bd-card" x="6" y="165" width="688" height="38" rx="8"/>
  <rect x="6" y="165" width="3.5" height="38" rx="2" fill="#34d399"/>
  <text class="bd-id" x="20" y="189" fill="#34d399">SCH-9</text>
  <text class="bd-title" x="106" y="189">Recurring jobs survive a bank holiday</text>
  <text class="bd-tag" x="470" y="189">scheduling</text>
  <text class="bd-tag" x="596" y="189">dev</text>
  <text class="bd-size" x="676" y="189">L</text>
</svg>
  </div>
</div>
```

Every row carries two more columns than the view above shows, and they are the two that
matter: **why** it is worth doing, so a row six months old can still justify itself, and
**done when**, so it can actually leave. The assignee stays empty in the pool: an
item nobody picked up is nobody's, and pretending otherwise is how a backlog becomes a list
of quiet obligations.

**Reading it back:**

```
> what is in the backlog for payments?
> what did we write down during the adoption that nobody has picked up?
```

This is a direct read, not a skill's output - the file already answers it, which is the
point of it being a file. "Nobody has picked up" is answered trivially, since the pool's
`assignee` is empty by definition. "During the adoption" is answered by the `source` column:
every row names where it came from - `onboarding`, `spec-delta`, `drift`, `decision` or
`asked` - so the answer survives the row being re-ordered or re-grouped, which pinning it to
whichever epic the onboarding phase filed it under did not. That column exists because the
claim "every item has a source" was made in three places while the row schema had nowhere to
put one, and provenance folded into `why` is a convention rather than a field.

### You do not have to use any of this

The in-repo backlog is **optional**. If your team already lives in a tracker, keep it: the
standard's default posture is a tracker holding execution history while the repository holds
the intents, joined by a one-way bridge (ADR-010).

- **GitHub Issues** - the default. Free, unlimited, already where the code is.
- **Jira** - use `jira-bridge`. Jira Cloud is free up to ten users, so a small team pays
  nothing for the board either.
- **Linear** - the same shape, with a free cap that can bite mid-project.

One honest limit: the convention has been proven against **Jira only**. Linear follows the
same shape and has not been field-tested, which is one of the project's
[open questions](../open-questions/default-tracker.md).

What is offered here is the in-house alternative for teams who would rather not run a tracker
at all. That is a preference, not a requirement, and nothing in the standard breaks if you
keep your board.

### How the Jira bridge actually works

It is real and running against a real board, not a plan. Worth reading in full even if you
use a different tracker, because the shape is the part that transfers.

**It only ever writes forward.** The generator reads the repository and creates issues. It
never reads Jira back into a spec, a backlog row or a cycle file. There is exactly one write
in the other direction - a newly created issue key, persisted into front matter - and that
exists so the next run can tell "already there" from "not yet", which is what makes it safe
to run repeatedly.

**It never edits an issue it did not just create.** Not the summary, not the description, not
the status, not the assignee. Somebody moved a card, renamed it, or assigned it to a person
who is actually free - that is the board doing its job, and a generator that overwrote it
would be a generator nobody is allowed to run twice.

**It is dry-run by default.** You see the plan, then you pass `--apply`.

#### What becomes what

| In the repository | In Jira | How it is keyed |
|---|---|---|
| a capability | an **epic**, named in front matter | referenced, never created - the bridge does not invent structure above itself |
| a **backlog intent** - a row with a why and a done-when | a **Story** under that epic, one per intent | the key in front matter; created once when absent, written back, reused ever after |
| a **task** the cycle broke that intent into | a **Sub-task** under that intent's Story | the task id in the summary, `[T003] ...`, plus a label - created only if no sub-task with that id exists |
| a **decision the intent is waiting on** | its own Story, `Author ADR: <about>`, blocking the intent's | its own front-matter key |

The unit choice is the whole design and it is the thing people get wrong. **A Story is one
backlog intent** - something with a why, a done-when, and a size that fits inside a cycle.
Not the capability (that is an epic, and one giant Story per module is a Story nobody can
close), and not a task (a task is a one-line title, so a Story per task gives you a board of
empty stories with no acceptance criteria between them).

The last row is the one that surprises people and the one that pays. A missing decision is
**not** a sub-task - it is somebody else's work, usually somebody who does not read the
repository, and it blocks the Story rather than sitting inside it. That is exactly the item
that used to go missing between "the spec is blocked" and anyone outside the team finding out.

#### What a run looks like

```figure
<div class="win">
  <div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-ask">&gt; push the invoicing cycle to jira</span></div>
  <div class="win-body">
<svg viewBox="0 0 700 258" role="img" aria-label="Dry-run plan: epic referenced, one story reused, one story created, three sub-tasks, one decision story">
  <text class="bd-lane" x="6" y="13">dry run &#183; nothing written yet &#183; 4 to create, 2 already there</text>

  <rect class="bd-card" x="6" y="24" width="688" height="32" rx="8"/>
  <text class="bd-id" x="18" y="44" fill="#8a8595">AT-97</text>
  <text class="bd-tag" x="82" y="44">epic</text>
  <text class="bd-title" x="130" y="44">Invoicing</text>
  <text class="bd-tag" x="596" y="44">referenced</text>

  <rect class="bd-card" x="28" y="64" width="666" height="32" rx="8"/>
  <text class="bd-id" x="40" y="84" fill="#34d399">AT-181</text>
  <text class="bd-tag" x="104" y="84">story</text>
  <text class="bd-title" x="152" y="84">Credit note for a job invoiced in error</text>
  <text class="bd-tag" x="596" y="84" fill="#34d399">exists &#183; reused</text>

  <rect class="bd-card" x="52" y="104" width="642" height="28" rx="7"/>
  <text class="bd-id" x="64" y="122" fill="#34d399">[T001]</text>
  <text class="bd-title" x="176" y="122">Credit-note record and its numbering</text>
  <text class="bd-tag" x="596" y="122" fill="#34d399">exists</text>

  <rect class="bd-card" x="52" y="140" width="642" height="28" rx="7"/>
  <text class="bd-id" x="64" y="158" fill="#ff7a2f">[T002]</text>
  <text class="bd-title" x="176" y="158">Issue a credit note against a paid invoice</text>
  <text class="bd-tag" x="596" y="158" fill="#ff7a2f">create sub-task</text>

  <rect class="bd-card" x="28" y="176" width="666" height="32" rx="8"/>
  <text class="bd-id" x="40" y="196" fill="#ff7a2f">&#8212;</text>
  <text class="bd-tag" x="104" y="196">story</text>
  <text class="bd-title" x="152" y="196">Invoice PDF carries the business's VAT number</text>
  <text class="bd-tag" x="596" y="196" fill="#ff7a2f">create &#183; key written back</text>

  <rect class="bd-card" x="28" y="216" width="666" height="32" rx="8"/>
  <text class="bd-id" x="40" y="236" fill="#a884ff">&#8212;</text>
  <text class="bd-tag" x="104" y="236">story</text>
  <text class="bd-title" x="152" y="236">Author BDR: what a customer opting out actually stops</text>
  <text class="bd-tag" x="596" y="236" fill="#a884ff">blocks INV-4</text>
</svg>
  </div>
</div>
```

Run it again five minutes later and every line reads `exists`. That is the property worth
testing before you trust it with a board other people are looking at, and it is why the keys
are written back rather than guessed from titles - a title gets edited, and a bridge that
matches on titles duplicates the issue the first time somebody fixes a typo.

#### Where to get it

Take it from the `console` repository, where it runs as a skill against a live board. It is a
short skill file plus the tracker's own API - deliberately small, because a bridge you intend
to retire should not be an integration you have to maintain.

One thing to know before you read it: the running implementation was built against a
repository using Spec Kit's vocabulary, so in the file the unit is called a user story and it
is read out of the spec rather than out of a backlog row. The table above is the same mapping
in this standard's words. What transfers unchanged is the shape - the epic is referenced, the
sprint-sized thing is the Story, its breakdown is sub-tasks, blockers are their own Stories -
and that is the part worth copying.

**Why one-way and not sync.** Two-way means conflict resolution - who wins when the repository
and the board disagree - plus webhooks and state reconciliation. That is real, permanent cost
for a mechanism whose entire purpose is to be removable. If you later want status flowing
*out* of the repository, the cheap version is a read-only reflector (branch and pull-request
state to the board), not a sync.

## A cycle is what somebody actually picked up

A bounded stretch of work with an owner, a goal, and an end date everybody agreed to. One
file per cycle, one directory per team.

**Opening one** moves chosen intents out of the pool:

```
> let's start a cycle for dispatch - reassignment and the courier notification, two weeks
```

**What you get back** - the commitment in a header, and the work as a board:

```figure
<div class="win">
  <div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-ask">&gt; how is the dispatch cycle going?</span></div>
  <div class="win-body">
<svg viewBox="0 0 700 300" role="img" aria-label="Cycle board: two items done, three in progress of which one is blocked on NOTIF-6, one not started">
  <text class="bd-lane" x="5" y="14" fill="#34d399">done &#183; 2</text>
  <line class="bd-rule" x1="5" y1="22" x2="223" y2="22" stroke="#34d399"/>
  <rect class="bd-card" x="5" y="34" width="218" height="78" rx="9"/>
  <text class="bd-id" x="17" y="55" fill="#34d399">OVR-1</text>
  <text class="bd-title" x="17" y="74">Expected duration per job</text>
  <text class="bd-title" x="17" y="88">type</text>
  <text class="bd-who" x="17" y="103">Ada</text>
  <rect class="bd-card" x="5" y="126" width="218" height="78" rx="9"/>
  <text class="bd-id" x="17" y="147" fill="#34d399">OVR-2</text>
  <text class="bd-title" x="17" y="166">A job is overrunning past</text>
  <text class="bd-title" x="17" y="180">its end</text>
  <text class="bd-who" x="17" y="195">Ada</text>
  <text class="bd-lane" x="238" y="14" fill="#ff7a2f">doing &#183; 3</text>
  <line class="bd-rule" x1="238" y1="22" x2="456" y2="22" stroke="#ff7a2f"/>
  <rect class="bd-card" x="238" y="34" width="218" height="78" rx="9"/>
  <text class="bd-id" x="250" y="55" fill="#ff7a2f">OVR-3</text>
  <text class="bd-title" x="250" y="74">The day view shows what is</text>
  <text class="bd-title" x="250" y="88">slipping</text>
  <text class="bd-who" x="250" y="103">Mira</text>
  <rect class="bd-card" x="238" y="126" width="218" height="78" rx="9"/>
  <text class="bd-id" x="250" y="147" fill="#ff7a2f">OVR-4</text>
  <text class="bd-title" x="250" y="166">Downstream impact: jobs</text>
  <text class="bd-title" x="250" y="180">now at risk</text>
  <text class="bd-who" x="250" y="195">Ravi</text>
  <rect class="bd-card" x="238" y="218" width="218" height="78" rx="9"/>
  <rect x="238" y="218" width="3.5" height="78" rx="2" fill="#e0685f"/>
  <text class="bd-id" x="250" y="239" fill="#e0685f">OVR-5</text>
  <text class="bd-tag" x="310" y="239">blocked</text>
  <text class="bd-title" x="250" y="258">`delayed` notification fires</text>
  <text class="bd-blocked" x="250" y="273">waiting on NOTIF-6</text>
  <text class="bd-who" x="250" y="288">Mira</text>
  <text class="bd-lane" x="471" y="14" fill="#8a8595">todo &#183; 1</text>
  <line class="bd-rule" x1="471" y1="22" x2="689" y2="22" stroke="#8a8595"/>
  <rect class="bd-card" x="471" y="34" width="218" height="78" rx="9"/>
  <text class="bd-id" x="483" y="55" fill="#8a8595">OVR-6</text>
  <text class="bd-title" x="483" y="74">Dana can silence a known</text>
  <text class="bd-title" x="483" y="88">overrun</text>
  <text class="bd-who" x="483" y="103">nobody yet</text>
</svg>
  </div>
</div>
```

The file's header carries the commitment in three lines - goal, owner, target date - and the
board is the rest of it.

Every intent names its **current holder** - not who will eventually do it, not who suggested
it. An intent with an empty assignee is a gap you can see rather than one you find out about
at the end.

**A blocked item stays in `doing` and says what it is waiting on.** `blocked` is the fourth
status the schema declares and it gets no lane of its own, because "blocked" is not a place
work sits - it is a thing that is true about work somebody is holding. What matters is the
reference, and OVR-5 above carries it: waiting on `NOTIF-6`, which is a decision still in the
pool. A board that dropped the reference, or crammed the row into `todo` without it, would
lose the one fact worth looking at. `cycle-guard` checks the same reference from the other
side - a block naming work that is finished, split or deleted is a row that looks
legitimately stuck and is not.

**Closing one** is the step people skip and the one that pays:

```
> the cycle is over - close it
```

Each intent is checked against its definition of done, whatever did not finish returns to the
pool, and the one measurement nobody can reconstruct afterwards - what actually finished
inside the window - is recorded. Skipping the close does not save time; it destroys the only
data the next forecast has.

**The rule underneath:** an intent is in the pool **or** in exactly one cycle. Never both,
never two. A guard fails the build when that stops being true, because "what are we doing
right now" stops being answerable the moment there are two answers.

## The timeline says when, and says how much to trust it

```
> when does billing ship? are we on track?
```

What comes back depends on what the repository can honestly support:

**With three or more closed cycles** it projects from measured throughput - what your team
actually finished, not what anyone estimated.

**Below three** there is no measured throughput, and it will not invent one. If items carry a
size it describes the **shape** of what is left instead - heavier or lighter than the last
cycle's mix - and says plainly that this is a ranking, not a date: a size letter is never
converted into a duration, cold start included. If items carry no size either, it reports
what is in flight and gives no date. Either way, the cold start gets **no date** - the only
question is whether it also gets a shape.

Three is not a magic number. It is the point below which one unusual cycle dominates the
average, and the file says so rather than hiding it.

That refusal is the whole design. A projection presented without its confidence is what
teaches people to distrust plans, and once they do they stop reading the timeline and start
asking in meetings - which is the state this replaced.

**A real one**, from a repository with three closed cycles behind it:

```figure
<div class="win">
  <div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-ask">&gt; when does overrun-detection land? are we on track?</span></div>
  <div class="win-body">
<svg viewBox="0 0 700 210" role="img" aria-label="Cycle overrun-detection: opened 20 July, target 14 August, measured projection 13 to 17 August, current pace projects 28 August">
  <text class="tl-title" x="46" y="18">dispatch / overrun-detection</text>
  <text class="tl-meta" x="46" y="34">2 of 6 done &#183; 13 days elapsed</text>

  <line class="tl-axis" x1="46" y1="150" x2="646" y2="150"/>
  <g class="tl-tick">
    <line x1="46" y1="146" x2="46" y2="154"/><text x="46" y="170">20 Jul</text>
    <line x1="232" y1="146" x2="232" y2="154"/><text x="232" y="170">2 Aug</text>
    <line x1="403" y1="146" x2="403" y2="154"/><text x="403" y="170">14 Aug</text>
    <line x1="603" y1="146" x2="603" y2="154"/><text x="603" y="170">28 Aug</text>
  </g>

  <rect class="tl-bar" x="46" y="62" width="357" height="20" rx="5"/>
  <rect class="tl-done" x="46" y="62" width="119" height="20" rx="5"/>
  <text class="tl-label" x="54" y="77">2 of 6 done</text>

  <rect class="tl-proj" x="389" y="96" width="57" height="14" rx="4"/>
  <text class="tl-proj-label" x="456" y="107">13-17 Aug &#183; measured, from three closed cycles</text>

  <g class="tl-now">
    <line x1="232" y1="50" x2="232" y2="150"/>
    <text x="232" y="46" text-anchor="middle">today</text>
  </g>
  <g class="tl-target">
    <line x1="403" y1="56" x2="403" y2="150"/>
    <circle cx="403" cy="56" r="4"/>
    <text x="403" y="46" text-anchor="middle">target</text>
  </g>
  <g class="tl-risk">
    <line x1="603" y1="120" x2="603" y2="150" stroke-dasharray="3 3"/>
    <circle cx="603" cy="120" r="4"/>
    <text x="603" y="136" text-anchor="end">28 Aug if today's pace holds</text>
  </g>
</svg>
  </div>
</div>
```

> **This cycle is running at less than half its own history and nobody has said so.**
>
> Thirteen days in, two of six items are done - 0.15 items per day against a historical 0.28
> to 0.38. The bar above uses the historical rate, which is the honest default for four
> remaining items. The dashed marker is what today's pace implies. Both are shown because
> the reader's question is not "what is the date" but "which number is this".


Note what it does there. It gives the honest projection **and** names the reading that
contradicts it, with the arithmetic for both. That is the difference between a status report
and a number somebody has to decide whether to believe.

## One page, for the people who never open the repository

Markdown in a repository is the right home for this and the wrong reading surface for a
sponsor, a client, or somebody who joined on Monday. `scripts/work-dashboard.mjs` renders the
three files - plus the decision records, the specs and the changelog - into one static page:
what is in flight now, the cycles against a calendar, the pool, a handful of reports, the
history, and every record with a search across it.

It is a projection, never a second place the work is tracked. It writes nothing back, and two
people running it on the same commit get the same bytes.

```
node scripts/work-dashboard.mjs            # once, into site/work/index.html
node scripts/work-dashboard.mjs --serve     # rebuilds on change; the open page refreshes itself
```

`--serve` listens on **localhost:9675** - loopback only, and a port nothing else wants, so it
never takes the one your application is trying to use. Pass your own after the flag if it
clashes anyway.

**It keeps itself current.** The page carries a fingerprint of the content it was built from
and checks a small `state.json` beside it. When the work moves, the page reloads and keeps
your place - unless you have a record open or a search half-typed, in which case it says so
and lets you choose the moment. Nothing pulls, nothing rebases: a stale page is a display
problem, and fixing it by moving somebody's branch would be a much worse one.

**Where it may go depends on who may read the repository**, because the page contains
nothing the repository does not already contain.

- **Public repository: publish it.** GitHub Pages is enough, and being able to send someone a
  link instead of a status email is most of the point. This standard publishes its own.
- **Private repository: not on GitHub Pages.** Pages on a private repository is served
  **publicly** unless the organisation is on Enterprise Cloud with access control, so the
  default outcome is a private backlog on the open internet. GitHub Pages has no password of
  its own to put in front of it, and a password prompt written in the page's own JavaScript
  is theatre: the content has already reached the browser by the time it is asked.

**What to do instead, in the order worth trying.** The build is **one self-contained HTML
file** - stylesheet and code inlined, no fonts, no CDN, not a single external request - which
is what makes every option below cheap.

1. **Lock it with one password and publish it anywhere, Pages included.** `--lock` encrypts
   the page at build time and ships the ciphertext; the reader types the password and their
   browser decrypts it. Nothing on the host is readable without it, so a host with no
   authentication of its own is no longer the problem. The shipped workflow does this for you:
   set a repository secret called `WORK_DASHBOARD_PASSWORD` and the publish step opens up even
   for a private repository, because what sits on the URL gives nothing away.

   ```
   WORK_DASHBOARD_PASSWORD='…' node scripts/work-dashboard.mjs --lock
   ```

   AES-256-GCM, the key stretched from your passphrase with 600,000 rounds of PBKDF2. Be
   clear-eyed about what that buys: **one shared secret**, not per-person access. Changing who
   may read means changing the password and rebuilding, and anyone can take the ciphertext away
   and try passwords against it at their own pace - so use a passphrase worth attacking. The
   locked page also names nothing until it opens: the title says "Work" and the repository is
   not mentioned.
2. **Put it where your authentication already is.** An internal wiki page, a shared drive, the
   static directory of an app that already sits behind your SSO. No new vendor, no new account,
   no new set of permissions to get wrong. Dropped somewhere with no `state.json` beside it the
   page stops self-refreshing and becomes a snapshot - the masthead still names the commit it
   was built from, so nobody mistakes it for live.
3. **Leave it as the build artifact.** The workflow uploads it on every push to `main`, and
   only people who can read the repository can download it. Not a link you can send, which is
   the whole cost, but it is zero setup and it is already running.
4. **Reach for a hosted identity gate when one password is genuinely not enough** - when you
   need to remove one person's access without telling everyone else a new password, or to know
   who read what. Two are free at the size a private project actually is (checked August 2026;
   hosting terms move, so check again rather than trusting this paragraph):
   - **Azure Static Web Apps, Free plan.** Authentication is built in - GitHub or Microsoft
     accounts - and one route rule closes the site: `{ "route": "/*", "allowedRoles":
     ["reader"] }` in `staticwebapp.config.json`, with readers named through the invitation
     system (25 per app on Free). Azure writes the deployment workflow into your repository.
   - **Cloudflare Pages behind Cloudflare Access.** Free up to 50 users, policies by email
     address, email domain or your identity provider, and it protects the `*.pages.dev` URL,
     so you need no domain of your own to start.

   Vercel and Netlify are the two people reach for first and both charge for this: Vercel's
   password protection is Enterprise or a paid add-on, and its free authentication admits only
   people signed into your Vercel team - seats for the very readers you built this for.
   Netlify moved site passwords to its paid tier for accounts created after September 2025.

Whichever you pick, weigh how it **removes** access, not how it grants it. Somebody leaves the
project long after the interesting part of this decision is over.

The shipped workflow encodes exactly that: it builds on every push to `main`, uploads the
page as an artifact, and reaches the publish step **only when the repository is public**, so
turning Pages on cannot leak a private board by accident. Add `--anonymise` when the page
should carry no colleague's name: assignees and the owner a cycle names are dropped at build
time rather than hidden in the page. It is not redaction - prose you wrote by hand is
reproduced as you wrote it, so a build that must carry no names needs the sources read too.

The output belongs in `.gitignore`. Committing it costs a large diff in every pull request
and a conflict on every parallel branch, and buys nothing: the page is a function of the
commit, so anybody can rebuild it byte for byte.

## What this is not

**It can replace your tracker, and for some teams it does.** For the work the repository
knows about - what is owed, what somebody picked up, when it lands - this is complete, and
running without a board is a real option rather than a compromise.

What it does not try to be is the **platform**: permissions and portfolio views, reporting
lines, the workflows of departments outside engineering. The page above covers the reading
half of what a board is for; none of the rest is here. A tracker is much more than a list of
work, and if you need that part, keep it and bridge it - that is not a failure of this, it is
a different product.

And be honest with yourself that it is a **change of mind, not a swap**. The work lives where
the code lives; you read it in a diff and argue about it in a pull request rather than
dragging a card. Teams who take to it say it removed a standing meeting. Teams who do not,
miss the board - and that is a legitimate reason to keep one.

**Not estimation ceremony.** Sizes are a cold-start fallback and a splitting trigger,
nothing else. Once measured cycles exist, size stops being an input to any projection, and
an item that does not finish inside its cycle is **split rather than re-sized**.

**Not a history.** A cycle file is state. What happened and why it mattered goes in the
closing note, or in a decision record if it changed how you work.

## Whose job this is

Mostly the product owner's, and the [Product Owner page](product-work.md) is where the rest
of that job lives. But adding to the backlog belongs to whoever noticed the thing, which is
usually a developer mid-change - and that is the point of it costing one sentence.
