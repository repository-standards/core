# Materiały i decyzje - źródło do bloga

> Working doc (nie ląduje w `dist/`, nie dla klientów). Surowiec do artykułów:
> decyzje, skąd wyszły, i co przeżyłem po drodze - łącznie z pomyłkami i zwrotami,
> bo to jest najlepszy materiał na blog.
>
> Każdy wpis: **problem -> droga (w tym ślepe uliczki) -> decyzja -> kąt na blog.**

---

## 1. Gdzie co ląduje - ADR vs reguła vs spec vs doc

- **Problem:** przy każdej decyzji metodycznej wracało "to ADR czy nie?". Oscylowaliśmy 4-5 razy na tej samej rzeczy.
- **Droga:** najpierw "to reguła, nie ADR" -> potem "to bardziej blog/opis" -> w końcu "jednak ADR". To, co rozcięło spór: **ADR nie znaczy "istniała alternatywa", tylko "żywy, sporny trade-off wart zamrożenia, który ktoś re-litiguje".** Alternatywa jasno zła (jedno zdanie "dlaczego nie") -> reguła. Trade-off, który wraca -> ADR.
- **Decyzja:** mapa taksonomii - decyzja->ADR/BDR, reguła->doc metodyki, zachowanie->spec, struktura->ARCHITECTURE, wizja->PRODUCT, narracja->blog. Znacząca decyzja daje **oba**: ADR (dlaczego + odrzucone formy) i regułę (co robić teraz).
- **Kąt na blog:** "Kiedy coś jest ADR-em, a kiedy tylko regułą - i dlaczego mylenie tego robi z decision-loga bagno."

## 2. MADR i "Any Decision Record" - pokusa własnych akronimów

- **Problem:** "ADR" mówi *Architecture*, a nasze decyzje są szersze (biblioteka, framework, tooling). Kuszące: przemianować "A" na "Any" i kuć ATDR / AADR.
- **Droga:** research pokazał, że MADR to już "Markdown **Any** Decision Records" (`docs/decisions/`, tooling Log4brains). Odrzuciłem własne akronimy - łamią uniwersalne znaczenie ADR, a repo, które **ustanawia** standardy, a wymyśla własny żargon, jest podwójnie ironiczne.
- **Decyzja:** ADR-001 - MADR jako format; **ADR = szeroko-techniczne, BDR = biznes osobno**; sub-typ idzie w pole `Tags`, nigdy w akronim; "Any" żyje legalnie w nazwie MADR. Dodane pole **Confirmation** (most decyzja -> guard).
- **Kąt:** "Nie wymyślaj własnych akronimów - jak 'Any Decision Record' rozbraja spór ADR-kontra-wszystko-inne."

## 3. Specy per capability, nie per ticket/page - i wyciek "001-core"

- **Problem:** jak dekomponować specy? Spec Kit natywnie robi `specs/NNN-feature/`. Kuszące też: per-page (`pdp/`, `checkout/`).
- **Droga:** per-page pada na pojęciach przekrojowych - *pakiety* są na homepage, PDP i checkout, więc per-page duplikuje jedno pojęcie w trzech miejscach i dryfuje. Twardy dowód, że to się re-litiguje: **mybrand wyprodukował `specs/cms/001-core/`** - numeracja Spec Kita wpełzła z powrotem podczas dostosowania do standardu.
- **Decyzja:** ADR-002 - **by capability/domena**; "gdzie się pojawia w UI" to cross-ref w docs, nie oś specu; guard `spec-structure.mjs` łapie `NNN-`.
- **Kąt:** "Dlaczego specyfikacje po stronach UI to pułapka - historia jednego wycieku (001-core)."

## 4. Spec buildable, nie opisowy

- **Problem:** jak głęboki ma być spec? Sam opis "co robi" nie wystarcza - z takiego speca nie da się zbudować ani zweryfikować, kod staje się prawdziwym źródłem prawdy.
- **Decyzja:** ADR-003 - **buildable** domyślnie: kontrakty (data / interface / algorithms / state machine / config / acceptance), cytowane verbatim; tier **behavioral** tylko dla cienkich capability i **deklarowany**; pieniądze / security / dane / kontrakt zewnętrzny MUSZĄ być buildable.
- **Kąt:** "Spec, z którego da się zbudować I zweryfikować - albo to nie spec."

## 5. "Opisane, ale nie wdrożone" - standard złamał własną zasadę

- **Problem:** `enforcement.md` obiecywał structure-lint, którego kod (`spec-guard.mjs`) nie miał. To jest **spec-vs-code drift w naszym własnym repo** - i dokładnie ta luka przepuściła mybranda.
- **Droga:** własny `/spec-reconcile` (kubełek "specified-not-implemented") by to złapał - ale nie dogfoodowaliśmy.
- **Decyzja:** shipnięcie `spec-structure.mjs` (guard) + jawna granica Spec Kita ("nigdy `/speckit-specify`; capability specs tylko przez `/spec-update`").
- **Kąt:** "Lekarzu, ulecz się sam - anty-driftowy standard, który sam driftował."

## 6. Dwie warstwy - produkt do promowania

- **Problem:** chcę to dawać jako architekt rozwiązań - komuś, kto zaczyna nowy projekt albo ma już swój.
- **Decyzja:** **Warstwa 1** (standard, stack-agnostic: decyzje, specy, konwencje, docs, guardy-jako-szablony) + **Warstwa 2** (setup Node/TS: Next + Fastify + monorepo + Biome + CI/CD). Adoptowalne osobno: sama 1, albo 1+2. Greenfield (scaffold) albo brownfield (align-to-standards).
- **Kąt:** "Standard w dwóch warstwach: metodyka dla każdego + gotowy stack dla Node/TS."

## 7. Evidence-based stack - własne repo biją research

- **Problem:** jakie DI dla Fastify? Research (blogi/docs) sugerował `@fastify/awilix`.
- **Droga:** ale stayget / roomlink / console **nie używają żadnego kontenera DI** - natywne pluginy Fastify. **Wasze repo obaliły moją rekomendację z researchu.** Też wyszło: Biome do wszystkiego, Prettier **tylko** do `.scss`; pnpm + Turbo + Biome zbieżne w trzech repo; supply-chain cooldown (`minimumReleaseAge`) z `pnpm-workspace` stayget - już siedzi w naszym `PRINCIPLES`.
- **Decyzja:** best-practices destylowane z realnych repo (stayget prymarny), nie z blogów; provenance per wpis.
- **Kąt:** "Best practices wyciągane z własnych produkcyjnych repo - i jak to obaliło jedną rekomendację z researchu."

## 8. Wersjonowanie - i awantura

- **Pomyłka:** bumpowałem wersje autonomicznie (0.6 -> 0.8) za drobiazgi (guard, ADR). Blowup ze strony maintainera.
- **Droga:** najpierw "bumpuj konserwatywnie", potem twarda zasada.
- **Decyzja:** **maintainer cinie każdy release; agent nie rusza `VERSION` ani nagłówków wersji**. PR-y dokładają **fragmenty changeloga** (changesets - jeden plik na PR, koniec konfliktów w CHANGELOG.md), **dwa changelogi**: techniczny + biznesowy (audience flag; `fix: css` nie wchodzi do biznesowego).
- **Kąt:** "Kto decyduje o wersji - i jak changesets + 'release cuts the human' kończą tę wojnę." Plus szczery pod-wątek: "AI za szybko formalizuje - o right-sizingu artefaktu."

## 9. Force-push kontra własna polityka

- **Problem:** guard blokował force-push (reguła z **własnego** `settings.baseline` standardu). Żeby zaktualizować PR bez force, wmergowałem main do gałęzi (merge-commit) - co z kolei zablokowało przycisk "Rebase and merge" GitHuba.
- **Droga:** linearyzacja przez `reset --soft` + oddanie polecenia force-push człowiekowi (bo agent zablokowany).
- **Kąt:** "Kiedy twój własny guard blokuje ci legalny rebase feature-brancha - napięcie deny-vs-ask w standardzie."

## 10. Jak decyzje standardu docierają do klienta - link, nie kopia (ADR-004)

- **Problem:** ADR-y standardu (by-capability, buildable) - kopiować do repo klienta, osobny katalog, czy overlay?
- **Realny trade-off (tu było najciekawsze):** *link* = trudniej odstąpić (klient pisze supersede'ujący ADR), ale trywialny update. *Kopia* = łatwo odstąpić (edytuje mój ADR), ale boli przy update (drift sforkowanego configu), szum, kolizje numeracji.
- **Dlaczego link i tak wygrywa - trzy poziomy:**
  1. **Częstotliwość:** odstępstwo rzadkie, update częsty - optymalizuj częsty przypadek.
  2. **Własność (sedno):** klient nie jest właścicielem mojego ADR-a, on go *adoptuje*; odstępstwo to JEGO nowa decyzja, nie edycja mojej. Kopia zamazuje, czyja to decyzja.
  3. **Widoczność:** supersede'ujący ADR czyni odstępstwo widocznym rekordem; edycja kopii je ukrywa.
- **Decyzja (ADR-004):** link, nie kopia. Reguła jedzie do `dist`; ADR zostaje w standardzie (publiczny rationale, materiał promocyjny); odstępstwo = kliencki ADR supersede. Zero szumu.
- **Kąt na blog:** "Jak dystrybuować decyzje architektoniczne bez zaśmiecania repo klienta - i dlaczego 'kopia, żeby łatwo edytować' to pułapka na update." Pod-wątek: **własność decyzji - adoptujesz, nie posiadasz.**

## 11. Dogfood i meta-ironia

- **Obserwacja:** standard, który ma chronić przed driftem i "ewaporacją wiedzy w czacie", **sam** gubił wnioski w rozmowie i akumulował drift (martwe linki, TDR w połowie usunięty, phantomy, niezaimplementowany lint). Wnioski o standardzie ginęły - aż zaczęliśmy je spisywać do repo (`PRODUCT.md`, ten dokument).
- **Kąt:** "Buduję standard i łapię się na łamaniu go w trakcie - dogfooding na żywo, ze wstydliwymi momentami."

## 12. Research jako fundament

- **Co potwierdził deep research (2025/26):** MADR + Log4brains; Diataxis (układaj docsy wg rodzaju); Spec Kit (constitution.md, żywe-vs-disposable spory); AGENTS.md czytany natywnie przez ~23-28 narzędzi; **Backlog.md** (markdown-native, agent-first, MCP - nie wynajdujemy koła na backlog); **Copier** `update` = read-diff-apply, czyli dokładnie model `align-to-standards`.
- **Kąt:** "Co mówi stan wiedzy 2025/26 o agents-first repo standards - i czego NIE trzeba budować od zera."

---

## Wątki otwarte (przyszłe wpisy, jak dojrzeją)

- Backlog spec-driven (storki z delty speca i z driftu kod<->spec).
- Manifest + align-engine (data-driven reconcile, wersjonowane migracje).
- Dwa changelogi w praktyce (changesets + audience flag).
