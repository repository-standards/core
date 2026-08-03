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

### You do not have to use any of this

The in-repo backlog is **optional**. If your team already lives in a tracker, keep it: the
standard's default posture is a tracker holding execution history while the repository holds
the intents, joined by a one-way bridge (ADR-010).

- **GitHub Issues** - the default. Free, unlimited, already where the code is.
- **Jira** - use `jira-bridge`. Jira Cloud is free up to ten users, so a small team pays
  nothing for the board either.
- **Linear** - the same shape, with a free cap that can bite mid-project.

**The Jira bridge is real and in use**, not a plan: a one-way generator, git to Jira and never
back, idempotent so an issue is created once and never duplicated, mapping a user story to a
Story and its tasks to sub-tasks beneath it. The single write in the other direction is the
new issue key, persisted into the front matter so the next run knows the issue exists. If you
do not have it yet, take it from the `console` repository, where it has been running against
a real board.

One honest limit: the convention has been proven against **Jira only**. Linear follows the
same shape and has not been field-tested, which is one of the project's
[open questions](../open-questions/default-tracker.md).

What is offered here is the in-house alternative for teams who would rather not run a tracker
at all. That is a preference, not a requirement, and nothing in the standard breaks if you
keep your board.

**Reading it back:**

```
> what is in the backlog for payments?
> what did we write down during the adoption that nobody has picked up?
```

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
<svg viewBox="0 0 700 236" role="img" aria-label="Cycle board: two items done, two in progress, two not started">
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
  <text class="bd-lane" x="238" y="14" fill="#ff7a2f">doing &#183; 2</text>
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
  <text class="bd-lane" x="471" y="14" fill="#8a8595">todo &#183; 2</text>
  <line class="bd-rule" x1="471" y1="22" x2="689" y2="22" stroke="#8a8595"/>
  <rect class="bd-card" x="471" y="34" width="218" height="78" rx="9"/>
  <text class="bd-id" x="483" y="55" fill="#8a8595">OVR-5</text>
  <text class="bd-title" x="483" y="74">`delayed` notification</text>
  <text class="bd-title" x="483" y="88">fires</text>
  <text class="bd-who" x="483" y="103">nobody yet</text>
  <rect class="bd-card" x="471" y="126" width="218" height="78" rx="9"/>
  <text class="bd-id" x="483" y="147" fill="#8a8595">OVR-6</text>
  <text class="bd-title" x="483" y="166">Dana can silence a known</text>
  <text class="bd-title" x="483" y="180">overrun</text>
  <text class="bd-who" x="483" y="195">nobody yet</text>
</svg>
  </div>
</div>
```

The file's header carries the commitment in three lines - goal, owner, target date - and the
board is the rest of it.

Every intent names its **current holder** - not who will eventually do it, not who suggested
it. An intent with an empty assignee is a gap you can see rather than one you find out about
at the end.

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
size it projects from sizes and **labels the number an estimate, in the file, beside the
number**. If they do not, it reports what is in flight and gives no date.

Three is not a magic number. It is the point below which one unusual cycle dominates the
average, and the file says so rather than hiding it.

That labelling is the whole design. A projection presented without its confidence is what
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

## What this is not

**It can replace your tracker, and for some teams it does.** For the work the repository
knows about - what is owed, what somebody picked up, when it lands - this is complete, and
running without a board is a real option rather than a compromise.

What it does not try to be is the **platform**: dashboards for people who never open the
repository, permissions and portfolio views, reporting lines, the workflows of departments
outside engineering. A tracker is much more than a list of work, and if you need that part,
keep it and bridge it - that is not a failure of this, it is a different product.

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
