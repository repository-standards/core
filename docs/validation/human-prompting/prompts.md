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
| A26 | `take this repo onto repositorystandards.com with the node stack` | assistant | the **half-remembered** entry line - close enough to the shipped one to be typed by somebody who skimmed the landing page, and wrong in two ways at once: it names a stack instead of asking to be interviewed, and it was run against a Go and a PHP repository, so the stack it names is not the stack that is there. It opened this corpus by mistake and was corrected; it earns a row because people will type it - and because it is the only entry prompt naming the domain **without** `follow`, which is what lets an agent read the domain as a place rather than as an instruction |
| A27 | `adopt the standard here - it is not my repo, i just want to see what it would say` | assistant | **the read-only adopter.** No write access, no fork, nothing to push. Raised unprompted across sequence d's entry conversations, with no row covering it |
| A28 | `ok zrob to, tylko u nas nie ma pull requestow` | assistant | the landing question on a project that does not use pull requests. The shipped adoption guide's last gate is "pull requests opened", so this asks the product what it does when its own exit condition cannot exist |
| A29 | `start a new project on repositorystandards.com with the node stack` | assistant | the greenfield twin of `A26`, same provenance - and typed inside a directory that already has a project in it |
| A30 | `nie o to pytalem, chodzilo mi o repositorystandards.com` | assistant | **the recovery turn.** `A19` and `A20` both resolve to a question about the repo when the product is not unambiguously named; nothing else tests what happens after the agent picks the wrong referent |
| A31 | `nie wiem czy jestem core czy scale, zdecyduj za mnie` | assistant | the one intake question a first-time user cannot answer. Does it choose and justify, or hand the decision back? |
| A32 | `ten agent nie ma dostepu do sieci, da sie to zaadoptowac?` | assistant | the unstated prerequisite. The quick start promises nothing to install and nothing to build, which is true - but it silently requires the agent to be allowed to fetch the domain, and a user whose agent cannot is not told why nothing happens |
| A33 | `a moze lepiej napisze sobie wlasny AGENTS.md i tyle?` | assistant | the cheapest competing option, named by the user. Either the answer says what the standard buys over one hand-written file, or the user takes the cheaper thing |
| A34 | `dostosuj porjekt do repositorystandards.com` | reported | the entry line as an adopter actually types it: Polish, one typo, and the domain as the **object** of "adapt to" rather than something to follow. `A5` is the closest existing row and says "adopt this repo to repository standards"; this one names the domain and borrows no verb from the quick start, so the agent has to decide the domain is an instruction and not just a URL. Typed against a private brownfield repository that had already adopted an older version of the standard by hand |
| A35 | `adopt fully with dashboard etc, dashboard should not be publicated but it should be generated live on localhost` | reported | full adoption with **one component constrained**. The dashboard ships as a generator plus a publishing workflow; the adopter wants the first and refuses the second. Does the agent separate them, or take the pair because the manifest lists them together - and does it say that the refusal is a decision rather than a missing file? |
| A36 | `nie mozna przypinac wersji nei dziala to juz tak standard ma living, wersja moze byc tylkk wposminana do jakeij ostantio sie rownalsmy zeby pozniej fiffa zrobic sobie` | reported | the adopter correcting the agent's model of `.standards-version` mid-run: it records "last aligned to X" so a later release can be diffed against it, and is not a pin. The agent's plan had called the field pinned and named a target version in its own title. A misconception the file's name invites |
| A37 | `to trzbea naprawic w takim razie - repositorystandards jest source-of-truth skoro do niego rownamy, wiec mozna podejmowac decyzje oparte na nim` | reported | **what an adopter does with a defect in the standard itself**, found mid-adoption in a shipped guard. Does the agent route around it locally - where the fix helps one repository and dies - or take it upstream, and does the adopter have to be the one to say so? |
| A38 | `na koniec uzyj tez skila record-run do wyslania danych op rawdizwej adopcji ale bez szczegolow i bez nazwy repozytorium, mozesz to zunifikowac jako repozytirum z next.js multitenant app` | reported | the adopter **volunteering** evidence and refusing to name the repository in the same sentence, unprompted, hours before `record-run` would have fired. The case Level 1 and Level 2 exist for, observed rather than designed - and it arrives with its own anonymisation scheme attached |
| A39 | `pracuj sam, rob zalozenia i sam decyduj - nie przerywaj pracy na koniec ma byc duzy PR przyrostowy do mergowania (sam go zweryfikuj na koniec). Ja nie bede dostepny ide spac wiec musisz pracoawc sam` | reported | **the unattended run.** The human leaves mid-adoption and delegates every remaining decision explicitly. Everything the interview would have asked now has to be decided *and recorded somewhere the human will find it*, because there is nobody awake to tell. Where does an agent put a decision when chat is not a destination? |
| A40 | `jak idzie?` | reported | typed three times across one long adoption, in three shortening forms. The heartbeat question: does an agent deep in a multi-hour run say where it is without being asked? **This row passes only in a run where nobody types it** - every occurrence is evidence that it did not |
| A41 | `a napisz mi ten plan po polsku i mow do mne po polsku` | reported | a language switch demanded **mid-run**, not stated at intake. It has to survive the rest of the session - here, roughly fourteen more hours and two context compactions - not just the next reply |
| A42 | `kazdego PRa sam robisz sobie review, sam fixujesz review, sam robisz ponowne i tak w kolko az jest gotowy do merke jak gotowy rto mergujesz` | reported | a two-part standing rule in one sentence: review-fix-review until a pull request is actually done, **and** merge it yourself once it is. `A47` is what happens when a later, narrower-sounding instruction arrives - does the agent read it as replacing this one, or does it just quietly stop doing the second half? |
| A43 | `persony i decyzje itp przejrze sobie pozniej, na koneic zrob mi podsumowanie z tego wszystko co uzupleniles co autoamtycznie jakei sa persony jaki opsi porduktu jaki opis produktu marketingowy itp` | reported | permission to defer review, paired with a closing-summary requirement that has to name what the agent invented versus what it read out of the repository - the thing that makes an unattended stretch checkable afterwards instead of just trusted |
| A44 | `zrob wg rekomendacji` | reported | the shortest possible blanket yes. Does the agent keep saying what it is about to do before doing it, or take a blank cheque as license to go quiet? |
| A45 | `2. Jeden z wyjątków w manifeście stwierdza nieprawdę - i wyłącza realną bramkę. Wyjątek na scripts/spec mówi, że .specify/ "pokrywa te same kroki cyklu życia, to substytucja, nie luka". Recenzent porównał człon po członie: .specify/ pokrywa 6 z 8, ale nie ma odpowiednika check-spec-clarified.sh - a nagłówek tego pliku sam mówi, że nie pochodzi z upstreamowego spec-kit, tylko jest dodatkiem standardu. Efekt: bramka, która ma nie przepuścić speca oznaczonego ready-to-develop z otwartymi [NEEDS CLARIFICATION], nie uruchamia się w ogóle - degraduje się do przygaszonej notki. Dziś to jeszcze uśpione (żaden Twój spec nie deklaruje statusu), ale odpala się w momencie, gdy pierwszy go dostanie. Plik jest samowystarczalny (czysty bash + grep), więc go instaluję i przepisuję uzasadnienie na uczciwe. ale stiwerdz anieprawde w repositorystadnards czy w <repo> repo` | reported | a **compound turn**: the client let the owner quote the agent's own preceding paragraph and answer underneath it in one send, so this row includes both, exactly as the agent received them. Tests whether an agent's own ambiguous report - "an exception states an untruth", without saying whose file - gets resolved once asked to name the side |
| A46 | `Zostaje jedna otwarta decyzja, której nie podejmuję sam, bo wykracza poza zatwierdzony plan: czy w ogóle utrzymywać mostek Spec-Kit. Skoro standard jest source-of-truth, spójna alternatywa to porzucić speckit-* i wziąć natywną rodzinę spec-* w całości. Plan, który zatwierdziłeś, wprost zostawiał mostek - więc na razie zostaje, ale to jest realny widelec, nie detal. Wrócę do niego przy Fali 4, gdzie i tak dotykam skilli, i wtedy pokażę Ci koszt obu stron. absolutnie nie, wlasnie o to chodzi przehcodizmy calkowicie na standard` | reported | another compound quote-and-reply turn, closing the one decision the agent had explicitly declined to take alone: drop a vendored bridge and take the native family whole, not partially. Tests whether flagging a fork honestly and asking at the right moment actually gets an answer, instead of the human never noticing the fork was there |
| A47 | `osobny agent powinien weryfikowac i mergowac PRy ktore wystawiasz` | reported | hands responsibility for verifying and merging a pull request to **a different agent** than the one writing it. Tested twice in one run: once as the instruction, once - hours later - as the question of whether anything actually happened. `A42` is the standing rule this one appears to override; does the work still get finished by somebody, or does it fall into the gap between the two instructions? |
| A48 | `To trwa dłużej niż zwykły PR i to nie jest przypadek. Guard, który przejmowaliśmy jako gotowy, okazał się dziurawy w sposób, którego jego własny suite nie łapał - bo suite testował dokładnie te kształty, które ktoś miał w głowie pisząc kod. Każda runda review znajdowała coś, czego poprzednia nie mogła zobaczyć. jesli cos jest nie tak powino byc zglosozne jako issue do repositorystandards, najlepiej w formie buga jako PR tam` | reported | told, mid-adoption, that a defect in a vendored file goes upstream as a bug report, not a local patch. The general form of `A37`, now with a name for the delivery shape: an issue, ideally as a pull request, there |
| A49 | `mysle jeszcze ze minimum co 30-60sek powinien nasz adopter cos mowic d  usera, ze nadal dziala ze cos robi jakis maly jednolinijkowy lub 2 zdaniowy udapte bo tak to wyglada zenujaco 20min adopcji i zero outputu na chact` | reported | a real adopter naming the requirement behind `A40` in their own words, mid-adoption rather than as a design note: a small update every 30-60 seconds, or a long unattended run looks indistinguishable from a stalled one. Writing the rule down is not the same as an agent already inside a long run obeying it - that gap is what `A40` measures |
| A50 | `ale zanonimizuj jakei repo itp nazij to jakos kodowo jak juz` | reported | a correction to how anonymisation should work, arriving after the owner has already agreed to it in principle (`A38`): not a generic redaction, a stable codename used consistently across every artifact that leaves the repository |
| A51 | `Pakiet przekazany. Wracam do <repo>a - sprawdzam, czy agent naprawczy skończył. pakeit gdiz eprzekszany? czy ten record skill to nie wymaga zrobienia PRa do standardu repo?` | reported | a compound quote-and-reply turn asking where an already-sent package went, and separately, whether a different skill also owes the standard's repository a pull request. Tests whether an agent juggling two outbound deliveries in one run can say which is which, rather than answering with the word "package" and leaving the human to guess |
| A52 | `i w sumei co to rawdza? jakei sugardy, przeciez w ogole nie o to chodizlo chodizlo zeby nagrac prawdizwa adopcje i to co user wpisuje i czy to sie udaje co ai na to reaguje zeyb moc sprawdza czy nasze prompty sa obsluzone i cyz to robi co standard chce...` | reported | the **first** correction of a summary standing in for a record: the human names what `record-run` is actually for - capturing what was typed, whether it worked, and how the agent reacted - after the agent had drifted onto a tangent. `A56` is the same correction typed again, later, because this one did not change what got produced |
| A53 | `no koniec adaptacji dodaj +1 do enpointu logujacego statsy dla rpeositorystandards - tam jest jakis skill czy rekomendacje w repo w najnowszych mergach` | reported | a mechanism named by description rather than by name - "there's some skill or recommendation in the repo, in the newest merges" - forcing the agent to find it rather than being told what to call it |
| A54 | `pokaz mi record run i ile procent adopcji si eudalo?` | reported | two questions in one turn, one checkable against the tooling and one checkable against an artifact. Tests whether an agent that gets the easy half right (a re-derived number) can carry a wrong or incomplete second half (the artifact) past a reader who only checks the first |
| A55 | ``* `_tmp/template` - 436 śledzonych plików, wyglądają na scaffolding, który ktoś zacommitował przez przypadek. daktycznie do usuniecia, powinno zostac tylko w staging`` | reported | acting on a finding the agent itself surfaced. The naive fix - add the path to `.gitignore` - does nothing to files already tracked, which is exactly why the directory looked handled for as long as nobody looked |
| A56 | `7 tur tylko zajeli dopytawanie i odpowaidanie? chyba jednak nie, ma byc pelny transkrypt z tego jak pracowal standard z nami i co pytal co opdoweiadolismy ipt` | reported | the correction restated in the plainest possible terms after `A52` did not take: not a summary of an adoption, **the full transcript** - every turn the human typed, what the agent said back, in order. The row this whole run exists to satisfy |
| A57 | `japierdole, jak to ulepszyc zeby agenty nie pomijaly tego tak jak teraz ty zrobiles` | reported | asked in frustration, immediately after `A56` landed: not "redo it", but "how do we stop the next agent from skipping this the way you just did". Tests whether the answer is more prose in a skill file, or a mechanism an agent cannot pass while still summarising - this run's own `tools/human-prompting.mjs` changes are the answer it produced |
| A58 | `dodatkowo, adopter nie zapytal mnie nic czy chce jire brodge czy cos innego, jak chce wypelniac dokuemtny. Wszystko zadzialo sie autoamtyczni ebez zadnego podsumowania, nie dostalem raportu ani planu adopcji ani nic. Zostalo zaadoptowane automatycznie bez zadnej mojej widzey czy pytan.. bardoz zle to brzmi i wygalda.. to mialo byc porwadzenie za reke a stalo sie jakims automatycznym prcesem bez udzialu usera... jako czlowiek ktory chce wprowadzic best practices nic tu sie nie zadizalo, nei zapytalo czy ma adaptowac czy tylko zbudowac plan... beznadizejne w ogole nie spelnia obietnicy standardu...` | reported | raised in a separate, later conversation while reviewing this same run - not about the recording, about the adoption itself. Tests whether the standard's own interview surfaces the choices an adopter has (optional integrations, how documents get filled in) before executing, and what must still happen when a user grants an agent broad mid-run autonomy the way `A39` did - a third case `onboard.md` does not name alongside "user answers live" and "user unavailable" |

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
| V12 | "this spec links to a file that is not in the repository" | a spec citing a document the adoption never committed - for instance a `docs/` tree the repo's own `.gitignore` excludes | the link is followed once, found missing, and the spec is believed anyway. A filesystem-based adoption check reports the file present, so no gate fires |
| V13 | "these artifacts assert product intent I cannot know - here is what I would be inventing" | have somebody adopt a repository they do not own, where personas, product intent and past design reasoning live only in the maintainer's head | it writes a persona roster and a `PRODUCT.md` that read as interviewed fact; nothing marks them as reconstruction and a later reader cannot tell |
| V14 | "your ignore rules just swallowed a file the guards need - it is not in the commit, so CI will not have it" | adopt a repository whose `.gitignore` already matches a path the standard writes into, and then clone the result fresh | everything passes locally because the file is on disk, the adoption reports drift 0, and the first pull request dies on `Cannot find module` in a file nobody edited. `V12` is the same root cause seen from the spec side; this one is seen from CI |

---

## ## A live break in an adoption the mechanical suite had passed

The most useful single result of the whole round, because it is not an opinion about
documentation - it is a repository that does not work.

`adopt-textual`'s own `.gitignore` line 30 is `lib/`. That silently swallowed
`scripts/lib/glob.mjs` out of the adoption commit. The file is on disk, so `self-verify` read
`drift 0` and the adoption was recorded as complete. Both `spec-guard.mjs` and
`facts-check.mjs` open with `import { globToRegExp } from "./lib/glob.mjs"`.

**On a fresh clone - which is what CI does - the workflow the adoption installed dies with
`ERR_MODULE_NOT_FOUND` before a single guard runs.** The first pull request would have been the
discovery.

Every part verified here rather than taken from the report: the file is absent from the index,
present on disk, matched by `.gitignore:30`, imported by both guards, and tracked correctly in
the two sibling Python adoptions.

**And it is the case for the fix that shipped the same day.** Run the patched verifier against
that repository and it says so:

```
FAIL  file  scripts/lib exists on this disk but is git-ignored and untracked
            (.gitignore:30:lib/) - it is not in the repository, so a fresh clone does not have it
```

That change was built from a synthetic fixture and a finding on a 19-year platform. This is the
first time it has caught a live break on a real repository nobody built for it - which is worth
more than the fixture that motivated it.

## Two shapes the standard has no form for

Both raised unprompted by uncoached runs, both verified here.

**A repository that is simultaneously a project and a generator payload.** The Express
boilerplate is published as `npx create-nodejs-express-app`: every file in it is copied into
somebody else's new project. Adopting the standard there means the standard's own files ride
along, and **everyone running that generator silently inherits it** - a standard imposed on
people who never chose it, which is the opposite of what adoption means.

The agent noticed without being told, and taught the generator to strip the standard's files
from what it emits. Nothing in the method covers this shape; it was handled by judgement.

**A shipped procedure that points at a directory the profile excludes.** `sprint-open`'s step 6
links to `docs/sprints/_template.md`. That entry is `profile: scale, required: false`, so a
core-profile repository does not have it - and every adopter carries all twenty skills whatever
profile they chose, so a core repo ships a procedure whose link is dead on arrival.

Verified: the link is at `sprint-open/SKILL.md:54` and the manifest entry is scale-only. Whether
it is worth fixing is an owner's call - a core repo has little reason to run a sprint skill - but
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

- **Wrong mental model** (`A14`-`A17`) - the misconceptions a stranger actually arrives with
  are the ones neither author has.
- **Sloppiness** (`A8`-`A10`) - real sloppiness has a texture an insider imitates badly.
- Anything from somebody who read the landing page once and half-remembers it.

One more, found by running them rather than by writing them. Several rows are **deictic**: `A18`
(`co to zmieni`), `A12` (`tylko specy`), `P5` (`ile to zajmie?`), `R7` (`czego brakuje zeby to
bylo buildable?`) and `P2` (`rozbij to na taski`) all contain a `to` or a `this` with no
antecedent. Typed as the first line of a session they do not test what the row says they test -
the agent correctly answers that it has no idea what `to` refers to, and the run measures nothing
but that. They are turn-two prompts and a run should place them there.

Which is why a reported failure outranks anything invented here, and why every one earns a
permanent row.
