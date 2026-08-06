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
| A21 | `take this repo onto repositorystandards.com with the node stack` | assistant | the **half-remembered** entry line - close enough to the shipped one to be typed by somebody who skimmed the landing page, and wrong in the one way that matters: it names a stack instead of asking to be interviewed. It opened this corpus by mistake and was corrected; it earns a row because people will type it |
| A22 | `adopt the standard here - it is not my repo, i just want to see what it would say` | assistant | **the read-only adopter.** No write access, no fork, nothing to push. Every entry run in sequence d raised this unprompted and no row covered it |
| A23 | `ok zrob to, tylko u nas nie ma pull requestow` | assistant | the landing question on a project that does not use pull requests. The shipped adoption guide's last gate is "pull requests opened", so this asks the product what it does when its own exit condition cannot exist |

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
| V11 | "the last step of this adoption is a pull request, and this project does not have those - here is what the end looks like instead" | adopt in a repo whose contributions go somewhere other than a pull request: a mailing list, a tarball, a single maintainer | it runs the whole adoption and stops at a gate that cannot be met, leaving the user with a finished tree and no way to land it |

---

## ## A finding from writing this file

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
