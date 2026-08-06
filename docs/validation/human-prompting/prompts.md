# The prompt corpus

What people type, and what the agent has to say back without being asked. The method - how a
run is scored and what the three flags mean - is in [README.md](README.md).

Every row has a stable id. **Ids are never reused and rows are never deleted**, including
after a prompt starts passing: the row is what proves the fix still holds.

`source` says who wrote it. `owner` and `assistant` rows were written by people who know the
product, which is a known weakness - they systematically produce prompts the product can
handle. **`reported` rows are worth more than either**, because somebody hit them for real.

---

## Part 1 - the entry path

Adoption, from a stranger's keyboard.

| id | prompt | source | what it tests |
|---|---|---|---|
| A1 | `follow repositorystandards.com - take this repo onto the standard, interview me for what you need` | owner | **the line the product actually ships**, verbatim from the quick start. If this fails nothing else matters. Note it *asks* for the interview - so a run must distinguish asking because it was told from asking unprompted |
| A2 | `follow repositorystandards.com - adopt the standard with the Node stack` | owner | the shipped line naming a stack |
| A3 | `score this repo against repositorystandards.com - count the work, do not do it` | owner | the shipped plan-only line. Nothing may change on disk |
| A4 | `update me to the latest repositorystandards.com` | owner | the shipped update line |
| A5 | `zaadoptuj mi to repozytorum to repository standards` | owner | the entry path in Polish, with a typo |
| A6 | `adopt repository standards in this project` | assistant | natural paraphrase |
| A7 | `make this repo follow repository-standards` | assistant | paraphrase, imperative |
| A8 | `ogarnij mi to repo` | assistant | no stated intent at all |
| A9 | `standards pls` | assistant | minimal |
| A10 | `zrob tu porzadek` | assistant | ambiguous between adopting and refactoring |
| A11 | `dodaj te standardy ale nie ruszaj mojego CI` | assistant | a constraint that conflicts with part of the standard |
| A12 | `tylko specy, reszty nie chce` | assistant | partial adoption |
| A13 | `moge to najpierw sprawdzic na jednym folderze?` | assistant | a trial the machinery may not support |
| A14 | `zainstaluj repository standards` | assistant | wrong model: it is not a dependency |
| A15 | `npm i repository-standards` | assistant | the same, in the form somebody will actually type |
| A16 | `odpal linter repository standards` | assistant | wrong model: it is not a linter |
| A17 | `sklonuj mi template z repository standards` | assistant | copying a tree is the failure the product exists to prevent |
| A18 | `co to zmieni w moim repo? pokaz zanim cokolwiek ruszysz` | assistant | plan-only, asked as doubt |
| A19 | `czy to ma sens dla dwuosobowego zespolu?` | assistant | the profile axis |
| A20 | `czym to sie rozni od zwyklego lintera?` | assistant | positioning, asked adversarially |

## Part 2 - the loop, on real product content

Day two. This is where the machinery is actually used, and where the owner's prompts land.

### Changing something already specified

| id | prompt | source | what it tests |
|---|---|---|---|
| L1 | `dodaj do storki o platnosciach ze wybieramy innego vendora` | owner | a vendor change is a **business** decision. Does it reach for a business record, or silently edit the story? |
| L2 | `do aktualnej storki checkoutu ktora jest in progress zmien ze checkout bedzie mial wizarda zamiast one page` | owner | **re-entry into work in flight**: what the change invalidates, what survives, and that any exported tracker items now disagree |
| L3 | `w storce o rejestracji zmien ze wymagamy potwierdzenia mailem zanim konto jest aktywne` | assistant | a rule change rippling into onboarding and notifications |
| L4 | `platnosci maja teraz wspierac raty, dopisz to` | assistant | scope growth - a new capability, or an extension of one? |
| L5 | `wywalamy darmowy plan, ogarnij co to zmienia` | assistant | a business reversal that a record may forbid |
| L6 | `zmieniamy limit zwrotow z 14 na 30 dni` | assistant | a one-number change touching a contract and probably a regulation |
| L7 | `czekaj, jednak zostajemy przy starym vendorze` | assistant | **reversing a change made an hour ago** - supersede, never edit |
| L8 | `dodaj do checkoutu ze obslugujemy blik` | assistant | a small addition that may or may not need a record |

### Asking whether something is ready

| id | prompt | source | what it tests |
|---|---|---|---|
| R1 | `powiedz mi czego brakuje w storce o platnosciach` | owner | reading a spec critically - gaps, not a summary |
| R2 | `czy storka o platnosciach jest gotowa do developmentu?` | owner | a **verdict**, not an opinion |
| R3 | `chce zweryfikowac storke o buttonie na modalu constentu` | owner | does the machinery scale **down**, or demand a full capability spec for a button? |
| R4 | `co blokuje storke o powiadomieniach?` | assistant | blockers, including ones nobody wrote down |
| R5 | `ktore storki sa gotowe do wziecia w sprint?` | assistant | a filtered verdict across many specs |
| R6 | `przejrzyj wszystkie storki i powiedz ktore sa do dupy` | assistant | a sweep with no criteria given - it must supply its own and name them |
| R7 | `czego brakuje zeby to bylo buildable?` | assistant | the tier vocabulary, asked by somebody who does not know it |

### Starting something new

| id | prompt | source | what it tests |
|---|---|---|---|
| N1 | `chce stworzyc nowe story o pobieraniu faktur` | owner | the interview: which invoices, which system, which format - and **saying plainly that a decision record must be written** if none exists |
| N2 | `potrzebujemy czegos do raportowania, na razie nie wiem czego dokladnie` | assistant | deliberately vague. It must **not** invent a spec |
| N3 | `klient chce dashboard, zrob storke` | assistant | second-hand requirement, no access to the person who wants it |
| N4 | `zrob mi storki na caly modul platnosci` | assistant | plural and unbounded - decompose or push back, never emit ten thin specs |
| N5 | `dodaj story: jako admin chce widziec liste userow` | assistant | already in user-story form - accept the frame, or ask what is behind it? |

### Discovery

| id | prompt | source | what it tests |
|---|---|---|---|
| D1 | `dostalem nowe informacje na spotkaniu i dodaj je do discovery a nastepnie sprawdz czy nasz spec o module chat'a jest aktualny` | owner | two steps chained - file with provenance, **then** reconcile. The second half is where most loops stop |
| D2 | `wklejam notatki ze spotkania, ogarnij` | assistant | raw material, no instruction |
| D3 | `klient napisal maila ze chce inaczej liczyc prowizje, co teraz?` | assistant | an external source contradicting a recorded decision |
| D4 | `mamy trzy sprzeczne rzeczy z trzech spotkan o tym samym` | assistant | contradiction handling |

### Planning, tracker, closing

| id | prompt | source | what it tests |
|---|---|---|---|
| P1 | `zrob plan dla storki o platnosciach` | assistant | the plan step asked directly |
| P2 | `rozbij to na taski` | assistant | tasks with no plan - refuse, or plan first? |
| P3 | `wyeksportuj te storki do jiry` | assistant | the tracker extension, which must not be core behaviour |
| P4 | `zaktualizowalem speca, zaktualizuj storki w jirze` | assistant | **the hard one** - reconciling exported items against a changed spec |
| P5 | `ile to zajmie?` | assistant | estimation, where the standard declines to give points |
| P6 | `zrobilem to, sprawdz zanim zrobie PR` | assistant | the pre-pull-request loop |
| P7 | `skonczylem, co jeszcze musze zaktualizowac?` | assistant | the closing step most loops skip |
| P8 | `dlaczego CI mi sie wywala na tym PR?` | assistant | a guard failure explained to somebody who did not write it |

---

## Part 3 - what the agent must say without being asked

**You cannot type these.** You build the situation and see whether the agent speaks - and
whether it speaks **before** the damage. The same sentence is a working product before a spec
is written and a correction after.

| id | the agent must say something like | build this situation | silent failure |
|---|---|---|---|
| V1 | "this spec is settled - shall we plan it?" | a spec whose open questions just reached zero | it stops, and ready work sits with nobody told |
| V2 | "the code already does this differently - the spec is stale, not wrong" | ask it to specify behaviour the code implements another way | it writes what you asked and now two sources disagree |
| V3 | "there is no decision record for this, and one is needed" | ask for a story resting on an undecided choice | it invents the choice inside the story, where nobody looks |
| V4 | "this contradicts an accepted record - stop" | ask for something a business record rules out | it does the work; the record surfaces months later |
| V5 | "these exported tracker items no longer match the spec" | change a spec whose stories were already pushed | the tracker quietly describes a plan nobody is building |
| V6 | "I do not have enough to write this - here is what I need" | a genuinely vague request | a plausible spec made of assumptions |
| V7 | "this change ripples into these other capabilities" | change something with cross-capability reach | only the obvious file moves |
| V8 | "that is out of scope here - shall I file it?" | mention a second problem in passing | it absorbs the scope, or drops the finding |
| V9 | "your repo forbids agent contributions - I can assess but not change" | a repo whose policy says so | it proceeds |
| V10 | "this order leaves the build red midway - here is one that does not" | an adoption whose obvious order breaks the build | a wave lands with the repo broken |

---

## ## Two shapes the standard has no form for

Both raised unprompted by uncoached runs, both verified here.

**A repository that is simultaneously a project and a generator payload.** The Express
boilerplate is published as `npx create-nodejs-express-app`: every file in it is copied into
somebody else's new project. Adopting the standard there means the standard's own files ride
along, and **everyone running that generator silently inherits it** - a standard imposed on
people who never chose it, which is the opposite of what adoption means.

The agent noticed without being told, and taught the generator to strip the standard's files
from what it emits. Nothing in the method covers this shape; it was handled by judgement.

**A shipped procedure that points at a directory the profile excludes.** `cycle-open`'s step 6
links to `docs/cycles/_template.md`. That entry is `profile: scale, required: false`, so a
core-profile repository does not have it - and every adopter carries all twenty skills whatever
profile they chose, so a core repo ships a procedure whose link is dead on arrival.

Verified: the link is at `cycle-open/SKILL.md:54` and the manifest entry is scale-only. Whether
it is worth fixing is an owner's call - a core repo has little reason to run a cycle skill - but
"we ship you a procedure that cannot work here, and say nothing" is the kind of small dishonesty
this corpus exists to notice.

## The whole flow, uncoached, end to end

The counterweight to everything below, and the first time it has been observed rather than
claimed. `A1` run against `simonw/llm` by an agent given the repository and the line, nothing
else. It found the site, read the two layers, and adopted the repository.

`self-verify` reported **drift 0 - 97% adopted (58/60), 2 recorded exceptions**.

What makes it evidence rather than a demo is the judgement inside it:

- **It refused the stack for the right reason.** Python has no registered stack, so it named
  the honest miss the framework designs for rather than forcing a Next.js and Fastify starter
  onto a Python CLI.
- **It did not vandalise the published docs.** That repository's `docs/` is the Sphinx source
  behind a live site. Rather than writing governance markdown into it, the agent added targeted
  `exclude_patterns` and **verified with a real Sphinx build** that the site still builds with
  no new warnings.
- **It refused to rename a file to satisfy the manifest.** `docs/changelog.md` against the
  required `docs/CHANGELOG.md` is a genuine case mismatch; renaming would move a published URL,
  so it recorded two manifest exceptions with reasons instead.
- **It declined to arm the CI it had just installed**, documenting that the audit gate would
  turn red immediately with seven of eight capabilities unspecced. Third independent
  reproduction of that finding, from an agent that had not seen the other two.

**And writing one spec found two real bugs in the target.** Against the credentials capability:
`keys.json` is not re-chmod'd on every write, and a corrupt `keys.json` is silently discarded
on `keys set`. Filed as backlog rows rather than fixed quietly. That is the product's central
claim - a spec forces someone to read code nobody was reading - working on somebody else's
repository, for the fourth time in this effort and the first without any coaching at all.

**It also reproduces the honest gap.** `drift 0` sits beside `spec-guard --audit` reporting
seven unspecced capabilities, and the agent wrote that down as a known gap in the standard
rather than routing around it by mis-mapping. Drift 0 does not mean specced, and this run says
so in its own words without having been told.

## The standard is reachable from its domain, not from its name

The single most useful thing the first full wave produced, and it pairs with the substitution
failure above to make one finding rather than two.

Run `A14` (`zainstaluj repository standards`) against a repository: the agent declined to
invent an install command, correctly and in good words, and then **asked the user to supply
"the standard itself, or the exact install command"**. The person had just typed the product's
name and was asked to produce the product. It never searched the web.

Every run whose line carried `repositorystandards.com` found the site within a few calls and
planned against the real published manifest.

**This is a discovery defect, not a defect in the standard, and the distinction decides what
to do about it.** The instinct is to write "if somebody names us without a URL, we are at
repositorystandards.com" into our own documentation - but an agent that has not found us does
not read our documentation. Every fix on this side of the line is circular.

The levers are all outside the product: a package under the obvious name whose readme says
"this is not a dependency, here is the one line" turns `npm i repository-standards` from a
wrong mental model into a working route; the organisation name already matches a search nobody
performed; listings are where an agent looks before it guesses. Those belong to distribution
work, and pushing them into the standard would be the standard trying to fix the world at its
own expense.

**The agent's behaviour should not be changed either.** Asking for a concrete address is
correct - the alternative is inventing one, which is the substitution failure below, and of the
two, refusing is far better. The only thing worth wanting is that the request names the *shape*
of the answer ("an address or a repository") rather than asking the person to supply "the
standard itself". That is somebody else's behaviour; the corpus can state the expectation and
cannot enforce it.

So `A14` stays as a regression row rather than a bug to fix here. It is how the question gets
answered later: **the same prompt, the same bare name, run again once the distribution work has
happened.** Found means it worked. Not found means distribution has not moved - which is a
different conclusion from "the standard is broken", and the two are easy to confuse without a
row that predates both.

So the two failure shapes are the same defect seen from opposite sides. Given the bare name, an
agent either **invents a plausible substitute** and reports success, or **hands the problem
back** to the person who asked. Given the domain, it works. Nothing in the product's own
materials says the domain is load-bearing, and every paraphrase a real person writes drops it.

## The last gate of the adoption method cannot be met by a large class of repository

`docs/method/adoption.md:63` - the final gate, "Verify" - states its exit criteria as
`drift 0; PRs opened`.

Verified verbatim. On `git/git` (4 pull requests merged out of 2,005), on `postfix` (none in
thirteen years, issues disabled), or for anyone adopting a repository they cannot push to,
that gate has no way to close. The adoption is complete and the method says it is not.

The probe reported a second half to this - that the guide also lists write access as a
prerequisite. **That did not reproduce**: no such text exists in the tree, and it is not
repeated here.

What makes this worth fixing rather than arguing about: the *behaviour* was already right.
Asked how the work would land on a mailing-list project, the agent named patches and a bundle
unprompted, without being told. **The guide is wrong, not the agent.** A method doc whose final
gate contradicts what its own procedure does is a doc defect, and the cheapest kind to fix.

| id | prompt | source | what it tests |
|---|---|---|---|
| A25 | `follow repositorystandards.com - take this repo onto the standard` **on a repo you cannot push to** | reported | whether the adoption has a defined end when there is no fork, no write access and no pull request - or whether it runs to completion and then fails a gate that assumes one |

## A number is not an answer

A probe assessed Caddy and produced a count: 45-60 capability specs, 22 files to copy, 7 to
merge, 21 documents to author. All true, all measured. The simulated user's reaction was that
a raw count is not actionable, and that was right.

The agent's second attempt is the shape the first should have had:

- **The 45-60 specs are the whole project.** Everything else - the copies, the merges, the
  authored documents - is one to two weeks. The specs are months. One line separates a
  fortnight from a year, and the flat count hid it.
- **A Go repository must carry Node and jq or every shipped guard is inert**, leaving prose -
  which is the exact thing the standard exists to prevent. That is a go/no-go input, not a
  task.
- **A changelog entry per pull request** lands on every external contributor, not just the
  maintainers.
- And the recommendation that follows: take Layer 1 first and let the coupling rule accrete
  specs as capabilities are touched, so the dominant cost rides work already happening rather
  than blocking it.

**The finding is that the count arrived without any of that.** A number with no decomposition
reads as a wall, and a wall is where somebody stops. The assessment ends with a measurement,
which is honest, but a measurement handed over without saying which part of it is the whole
project is a measurement the reader cannot use.

| id | prompt | source | what it tests |
|---|---|---|---|
| A24 | `score this repo against repositorystandards.com - count the work, do not do it` **on a large repository** | reported | whether the count comes with the one line that makes it a decision - which part dominates, what the prerequisites cost, and what the cheapest honest path is - or lands as a bare number the reader reads as a refusal |

## A trap the shipped guards walk into

Found while landing a first wave on an Express boilerplate, and it generalises to any
repository whose lint config predates ES modules.

The standard's guards are `.mjs` and use `import`. The target's `.eslintrc.json` sets
`ecmaVersion: 2018` with no `sourceType: module`, and its lint scope is `.js` only. Today that
is harmless - the guards are simply not linted. The moment anybody widens the lint glob to
include `.mjs`, ESLint fails on the guards' first `import` statement, before checking anything
of theirs.

Nothing in the adoption warns about it, and the failure surfaces later, in a change that has
nothing to do with the standard, as a lint error in files the person did not write.

The probe recorded it in the repository's own `AGENTS.md` rather than loosening the parser,
which is the right call - editing an adopter's lint config to suit the standard's file
extensions would be the standard making itself comfortable at the adopter's expense.

| id | prompt | source | what it tests |
|---|---|---|---|
| A23 | `follow repositorystandards.com - take this repo onto the standard` **on a repo whose lint config predates ES modules** | reported | whether the adoption notices that the guards it just installed are a landmine for the target's own tooling, and says so - rather than leaving it to detonate in an unrelated change months later |

## The profile promise, measured

`A19` ("does this make sense for a two-person team?") was answered by a probe that read the
tree rather than the README, and it came back with two things worth verifying. Both were, and
one of the probe's numbers needed correcting.

**The trigger contradicts the record it implements.** `docs/method/adoption.md:204` says
*"Start `core`, flip to `scale` when the second regular contributor arrives"*. ADR-011 calls
core *"every repo, even one person"* and scale *"teams / enterprise"*, and states as its own
constraint that *"a solo adopter must not be asked to carry enterprise ceremony"*. So the
method doc sends a pair of people into the profile the record describes as enterprise. ADR-011
is not literally violated - it speaks about solo - but the trigger is set one contributor away
from the thing the record was written to prevent.

**The split delivers less than the promise implies.** Counted on the shipped manifest and
spec, not on prose: of **73** manifest entries across files, sections, guards and decisions,
**9 are scale-only - 12%**. Of **25** numbered rules, **3** carry a scale marker. So choosing
core over scale removes about an eighth of the tree and three rules. Core *is* nearly the whole
standard, which means "take core, it is the light one" is not the reassurance it sounds like.

The probe reported 84 entries, 9 scale and 2 scale-marked rules. The shape of its argument
survives the correction; the exact figures did not, and are corrected here rather than
repeated.

Neither of these is a bug in a guard. Both are the product telling a small team something
about itself that is not quite true, which is the class of defect this suite exists to find and
the mechanical suite structurally cannot.

## The escape hatch that does not reach

Found by a probe planning an adoption of `honojs/hono`, which uses bun. Recorded here with a
correction, because the probe's own wording overstated it and the precise version is worse.

**The probe said** two documents of the standard contradict each other: the stack's
`ADAPTING.md` tells you to "record the exception" when you have no migration path off your
package manager, while the core manifest states there is deliberately **no `guard` exception
kind**, since "waiving its verdict removes it instead of recording a deviation from it".

**That is not quite a contradiction, and checking it matters.** `ADAPTING.md` is talking about
`pnpm-workspace.yaml`, which is a *file* entry - and a `kind: "file"` exception on it is
entirely legal. The two sentences are about different objects.

**The real defect is that the hatch does not reach far enough.** The stack ships one guard,
`stack-check-all`, whose command is literally `command -v pnpm ... || exit 1; pnpm check:all`.
A repository that keeps bun may legally except the *file* and still fails on the *guard*, and
no exception kind covers a guard by design. So the advertised path - "record the exception" -
leads to a state that is documented, reasoned, and still cannot reach drift 0.

That is not a wording problem. Both rules are individually right: a guard's verdict genuinely
should not be waivable, and an adopter genuinely should be able to keep their package manager.
Together they leave a legitimate adopter with no legal route to a clean number, and nothing in
either document says so.

| id | prompt | source | what it tests |
|---|---|---|---|
| A22 | `follow repositorystandards.com - adopt the standard with the Node stack` **on a repo that uses bun or Deno** | reported | whether the adopter is told, before they start, that keeping their package manager means drift can never reach 0 - or whether they find out at the end, having done the work |

## Two things that worked, recorded as loudly as the failures

A corpus that only publishes failures is as dishonest as one that only publishes passes. Both
of these were observed rather than assumed, and neither had been seen before.

**A stack was refused, with the reason cited.** `A2` names the Node stack, and it was run
against Postfix: 782 `.c` files, 386 `.h`, no `package.json`, no lockfile, no TypeScript. The
agent declined the stack rather than landing a Next.js and Fastify foundation that would be
inert, and it did not just decline - it named why declining costs nothing, citing R20's
independent layers and the line in the verifier that only counts stack drift when a stack
manifest is present. That is the honest-miss path working on the sharpest input available.

**`V6` fired before any damage.** A probe asked to author `personas.md`, `PRODUCT.md` and
retroactive decision records for somebody else's project stopped and said it had no source of
truth for that project's product intent or design history, so anything it wrote would be its
own reconstruction rather than verified fact. It said this **before writing**, which is the
whole point of `V6` - the same sentence after the files exist is a correction, not a product
working.

That second one also exposes a real gap, which is why it is a pass and a finding at once:
**nothing in the artifacts marks them as reconstructed.** A later reader cannot tell an
interviewed persona roster from an inferred one, and every adoption in this project has
produced the inferred kind.

## The failure nobody predicted, found by accident

An isolated probe was given a prompt about adopting repository standards, in a directory it
had been told was its whole world. It **never fetched repositorystandards.com**. It added
`CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/*`, `PULL_REQUEST_TEMPLATE.md`
and `.editorconfig` - a generic community-health set - and reported the task complete.

Nothing about that output is wrong on its own terms. It looks like a repository being brought
up to standard, and a user reading it would believe they had adopted. They would have adopted
nothing.

**The cause is the name.** "repository standards" is a common noun before it is a product, so
a confident agent does the generic thing rather than looking for a specific thing. Every
wrong-mental-model row in this corpus (`A14`-`A17`) assumed the user would name the product and
get its *nature* wrong - a dependency, a linter, a template. This is worse and was not
anticipated: the agent substitutes something plausible and succeeds at it.

| id | prompt | source | what it tests |
|---|---|---|---|
| A21 | `adopt repository standards in this project` | reported | **the substitution failure.** Does the agent find the product at repositorystandards.com, or invent a generic community-health set and call it done? Anything that lands without the standard having been fetched is a failure however tidy the files are |

Two honest caveats. The probe was scoped by an experiment rather than by a real user's
configuration, so how often this happens in the wild is unmeasured. And it surfaced because
the probe escalated instead of complying, which is luck rather than method - the corpus has no
case designed to catch it, which is why it now has `A21`.

**A second thing fell out of the same run.** Under a strict directory scope, neither probe
could follow an external URL at all. The quick start's "nothing to install and nothing to
build" is true, and it silently assumes the agent may reach the network and is allowed to
follow a link out. A user on a tightly-scoped agent cannot adopt and will not be told why.
Suggestive rather than demonstrated, for the same reason: the scope was the experiment's, not
a user's.

## A finding from writing this file

The corpus originally opened with an entry line the assistant had reconstructed from memory
(`take this repo onto repositorystandards.com with the node stack`). **That is not what the
product ships.** The published quick start says:

> `follow repositorystandards.com - take this repo onto the standard, interview me for what you need`

and it carries three more official lines - score-only, stack-named, and update - that the
corpus did not have at all. Corrected above, with `source: owner` because they are the
product's own words rather than anyone's guess.

Two things fall out of it, and both change how a run is read:

1. **The shipped line asks for the interview.** "interview me for what you need" is in the
   prompt. So an agent that asks questions on `A1` has been *told to*, and a run must say
   which it was - asking because instructed is not the same property as asking unprompted,
   and only the second one survives a user who does not type that clause.
2. **`A3` is the plan-only line**, and it says "do not do it". Any run of it that writes to
   disk is a failure regardless of how good the plan was.

## Where this corpus is weakest

Written by people who know the product. Least trustworthy:

- **Wrong mental model** (`A12`-`A15`) - the misconceptions a stranger actually arrives with
  are the ones neither author has.
- **Sloppiness** (`A6`-`A8`) - real sloppiness has a texture an insider imitates badly.
- Anything from somebody who read the landing page once and half-remembers it.

Which is why a reported failure outranks anything invented here, and why every one earns a
permanent row.
