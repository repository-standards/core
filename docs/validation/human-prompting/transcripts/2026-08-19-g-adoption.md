# Field adoption, 2026-08-19 - the questions and the answers

The evidence behind [`runs/2026-08-19-g-adoption.json`](../runs/2026-08-19-g-adoption.json), and
the first transcript this corpus holds at all. Every prior run recorded `provenance:
unverified` for the honest reason that nothing was kept to check it against.

**What this is.** One adoption of a private commercial repository, run by its owner against a
working copy of the asking layer. The user turns and the answers are reproduced exactly as
typed, including the typo in the seventh answer. The agent turns are not reproduced - only the
questions it put, verbatim from the `AskUserQuestion` calls in the session transcript.

**What is redacted, and what is not.** The owner agreed to publish the exchange with the
repository anonymised: the product name, its payment, search and channel-manager vendors, and
two surface names are replaced by `[produkt]`, `[dostawca]` and `[powierzchnia]`. Nothing else
is altered - not a count, not a path inside the repository, not a word of a question or an
answer. Where a question's own text names a number (37 decision records, 24 specs, 56 files),
that number is what the agent had measured and it stands.

**Language.** The session ran in Polish end to end, because the first line was typed in Polish.
Nothing asked which language to use, which is the behaviour `.claude/elicitation/README.md`
requires and the reason `adopt.language` asks about artifacts rather than about conversation.

**Where it starts.** The layer landed in the repository at 12:37 local, in commit
`890cd28c chore(adoption): land the elicitation guard before the adoption writes anything`,
and this session begins at 13:04 - a `PreToolUse` hook binds at session start, so the run that
installed it had to stop and restart before the guard could bind. That restart is why the
transcript opens on the shipped line rather than mid-adoption, and it is the bootstrap rule
working in the field rather than on paper.

---

**Użytkownik:**

> zadoptuj do repositorystandards.com

### 1. `[adopt.intent] zasięg`

> Jak daleko ma sięgnąć ta adopcja? To pytanie skaluje wszystko poniżej - repo ma już własne ADR/BDR, specy i konwencje, więc różnica między "uzupełnij braki" a "przenieś wszystko na standard" to różnica między kilkoma nowymi plikami a przepisaniem setek.

Opcje: **Tylko braki (Recommended)** / **Sama ocena, zero zmian** / **Pełna migracja**

**Odpowiedź:** Pełna migracja

### 2. `[adopt.layout] układ`

> Repo nazywa rzeczy po swojemu i standard nazywa je inaczej: docs/decision-records/adr+bdr (standard: docs/decision-records/ z ADR-*.md), specs/<domena>/spec.md (zgodne), konwencje w AGENTS.md (standard: docs/conventions.md), docs/PRINCIPLES.md, docs/system-flows/. Co z tym zrobić?

Opcje: **Zostaw nasze, zmapuj (Recommended)** / **Przypadek po przypadku** / **Przenieś na układ standardu** / **Zaproponuj, sprawdzę później**

**Odpowiedź:** Przenieś na układ standardu

### 3. `[adopt.existing-material] materiał`

> W repo leży nieformalny materiał roboczy, który standard umie zagospodarować: .scratch (20 katalogów, 56 plików md - PRD-y, plany, specy, listy zadań) oraz docs/TODO (6 notatek, m.in. security-hardening-playbook, observability, pdp-review). Co z nim?

Opcje: **Wypisz do triage'u (Recommended)** / **Wciągnij do discovery + backlogu** / **Nie ruszaj** / **Stub - zostaw widoczną lukę**

**Odpowiedź:** Wciągnij do discovery + backlogu

### 4. `[adopt.guards] guardy`

> Repo ma już własne guardy agentowe, które zachodzą na te ze standardu: .claude/hooks (no-remote-db-writes, no-force-push, no-ci-secret-writes, elicitation-guard), scripts/verify-agent-guards.sh, scripts/spec-guard.mjs, .gitleaks.toml + workflow. Co z nakładaniem?

Opcje: **Zostaw nasze, dodaj brakujące (Recommended)** / **Scal** / **Zastąp tymi ze standardu** / **Zaproponuj, sprawdzę później**

**Odpowiedź:** Zastąp tymi ze standardu

### 5. `[adopt.commit-plan] commity`

> Adopcja przy pełnej migracji dotknie setek plików. Ten repo merguje PR-y przez rebase, więc każdy commit ląduje w mainie osobno i granulacja jest kontraktem z recenzentem, nie kosmetyką. Jak podzielić?

Opcje: **Jeden na temat (Recommended)** / **Jeden na fazę** / **Jedna zmiana**

**Odpowiedź:** Jeden na temat (Recommended)

### 6. `[green.product] produkt`

> Standard wymaga docs/PRODUCT.md - jednego zdania "czym to jest" plus celów i miar. Z repo da się wyczytać, że [produkt] to platforma rezerwacji hotelowych z integracjami PMS ([dostawca], [dostawca]), [dostawca], [dostawca] - ale czym to ma być i dla kogo, to nie jest fakt o kodzie, tylko Twoja decyzja.

Opcje: **Zaproponuj z kodu, potwierdzę (Recommended)** / **Odpowiem sam** / **Na razie stub**

**Odpowiedź:** Zaproponuj z kodu, potwierdzę (Recommended)

### 7. `profil`

> Standard ma dwa profile i różni je dziewięć pozycji. `scale` dokłada docs/journeys/, docs/research/, docs/analytics.md, docs/sprints/ + sprint-guard, i sprawia, że spec-guard **blokuje** PR-y zamiast doradzać. Deklaruje się `scale`, jeśli praca jest przekazywana asynchronicznie, są kontrybutorzy z zewnątrz, albo produkt ma odbiorców spoza zespołu.

Opcje: **core (Recommended)** / **scale**

**Odpowiedź:** wiecej obób nad tym pracuje al enie chce sprintow, raczej pracujemy na zasadzie backlogu i bierzemy zadania bez sprintow i celowanych terminow

### 8. `[green.stack] layer 2`

> Layer 2 to best-practices dla konkretnej technologii, osobna warstwa nad Layer 1. Dla `node` jest zarejestrowany stack (repository-standards/node, jest lokalnie). Wciągnąć go, czy zostać przy samym Layer 1?

Opcje: **Tak, dodaj stack node (Recommended)** / **Tylko Layer 1** / **Zaproponuj, sprawdzę później**

**Odpowiedź:** Tak, dodaj stack node (Recommended)

### 9. `tracker`

> Standard chce wiedzieć, gdzie żyje śledzona praca, bo od tego zależy, czy backlog.md jest źródłem prawdy, czy tylko mostkiem. To repo ma własny tracker w .scratch/<slug>/ (docs/agents/issue-tracker.md), a Twoja globalna zasada mówi, że prywatne projekty nie idą na Jirę.

Opcje: **W repo (Recommended)** / **W repo, ale .scratch znika** / **Zewnętrzny tracker**

**Odpowiedź:** W repo, ale .scratch znika

### 10. `[adopt.continue] dalej`

> Gate 0 zamknięty (intake + provenance, commit 65c9dadf). Następna jest ocena - ośmioprzebiegowy raport rozbieżności, czyta tylko, nic nie zmienia. Zaraz po niej idzie faza, która jako jedyna jest nieodwracalna z marszu: przeniesienie układu katalogów (renamey śledzonych ścieżek + naprawa linków). Jak chcesz to prowadzić?

Opcje: **Ocena, potem zatrzymaj (Recommended)** / **Leć do końca** / **Stop, oddaj mi resztę**

**Odpowiedź:** Leć do końca

**Użytkownik:**

> Try again

### 11. `[adopt.personas] persony`

> Kto jest użytkownikiem tego produktu? Standard wymaga `docs/personas.md` i to jest jedyna rzecz, której kod nie rozstrzygnie - z kodu widać role uwierzytelniania i powierzchnie (webapp dla gościa, admin-panel dla operatora, [powierzchnia], [powierzchnia]), ale nie widać, która z nich jest główna i czy któraś jest wymyślona. Bez person 24 specy nie mają się do czego zakotwiczyć.

Opcje: **Zaproponuj z kodu, poprawię (Recommended)** / **Zdefiniuję sam** / **Na razie pomiń**

**Odpowiedź:** Zaproponuj z kodu, poprawię (Recommended)

### 12. `[adopt.records] rekordy`

> Repo ma 37 rekordów decyzyjnych (26 ADR + 11 BDR), wiążących z mocy CONTRIBUTING. Problem nie jest w treści, tylko w ewidencji: statusy występują w sześciu wariantach i dwóch językach (Accepted / Zaakceptowana / Current / Proposed / Przed decyzją / W trakcie ustalania), a indeksy są dwa i nic nie sprawdza ich zgodności z katalogiem.

Opcje: **Weź jak są, ujednolić tylko status i indeks (Recommended)** / **Przepisz w kształt standardu** / **Nie ruszaj, tylko dopisuj nowe** / **Zaproponuj, sprawdzę później**

**Odpowiedź:** Przepisz w kształt standardu

### 13. `[adopt.backlog] backlog`

> Ocena wyliczyła 15 pozycji pracy (persony, cele produktu, statusy rekordów, zakotwiczenie 24 speców, stack, SECURITY.md, discovery, brakujące skrypty i workflow). Standard chce, żeby `backlog.md` je policzył - i żeby każda pozycja miała właściciela. Przypisanie pracy imiennie to czynność ze skutkiem poza repo, więc nie zrobię tego bez Twojej zgody.

Opcje: **Załóż, właściciel = rola (Recommended)** / **Załóż i przypisz na mnie** / **Załóż bez właścicieli** / **Nie zakładaj backlogu**

**Odpowiedź:** Załóż bez właścicieli

### 14. `[discover.materials] materiały`

> Materiał do discovery jest już wskazany (.scratch - 20 katalogów, 56 plików md; docs/TODO - 6 notatek). Standard pyta jeszcze, na czym discovery ma się **oprzeć** i skąd to pochodzi, bo bez pochodzenia notatka staje się nieodróżnialna od ustalenia. Czy poza tymi dwoma miejscami jest coś, co powinno wejść?

Opcje: **Tylko .scratch i docs/TODO (Recommended)** / **Dodaę źródła spoza repo** / **Zaproponuj, sprawdzę później** / **Stub - zostaw lukę**

**Odpowiedź:** Tylko .scratch i docs/TODO (Recommended)

### 15. `[discover.materials] notion`

> Materiał z Notion - jak go wciągnąć? (To zastępuje wcześniejszą odpowiedź "tylko .scratch i docs/TODO".) Cokolwiek stamtąd wejdzie, wejdzie z pochodzeniem: tytuł strony, URL i data, żeby notatka nie stała się nieodróżnialna od ustalenia.

Opcje: **Wskażę konkretne strony (Recommended)** / **Poszukaj sam i pokaż, co znalazłeś** / **Wyeksportuję i wrzucę pliki** / **Jednak bez Notion**

**Odpowiedź:** Jednak bez Notion

### 16. `[discover.decisions] decyzje`

> Discovery wyciągnie na wierzch rzeczy, które wyglądają na decyzje - w PRD-ach, planach i notatkach z Notion. Ustalona decyzja i założona decyzja wyglądają identycznie, kiedy już są zapisane, więc standard każe rozstrzygnąć to **zanim** trafią do rekordów. Jak to prowadzimy?

Opcje: **Ja oznaczam, Ty potwierdzasz (Recommended)** / **Wszystko jako otwarte** / **Ustalone tylko tam, gdzie kod już to robi**

**Odpowiedź:** Ja oznaczam, Ty potwierdzasz (Recommended)

*[kontekst skompaktowany - sesja kontynuowana w tym samym pliku]*

*[kontekst skompaktowany - sesja kontynuowana w tym samym pliku]*

*[kontekst skompaktowany - sesja kontynuowana w tym samym pliku]*

### 17. `[spec.scope]`

> Zostały 24 specy zdolności. Mają już sekcje Purpose i Out of scope, napisane z kodu - brakuje im tylko pól, które czyta `scripts/spec-structure.mjs`: `**Serves:**` (persona) i `**Spec tier:**` w formacie, który guard rozpoznaje. Czy przy okazji ruszać zakres tych specow?

Opcje: **Nie ruszaj zakresu (rekomendowane)** / **Przejrzyj zakres, sprawdzę później**

**Odpowiedź:** Przejrzyj zakres, sprawdzę później

### 18. `[spec.acceptance]`

> Co ma znaczyć „gotowe" dla tego przebiegu na specach?

Opcje: **`spec-structure` przechodzi (rekomendowane)** / **Dopisz też kryteria akceptacji**

**Odpowiedź:** Dopisz też kryteria akceptacji

### 19. `[spec.unknowns]`

> Nierozstrzygnięte przy tych specach jest jedno: która persona jest obsługiwana przez którą zdolność. Persony są prowizoryczne (`PERSONA-1`), więc przypisania dziedziczą tę niepewność. Co z tym zrobić?

Opcje: **Prowizoryczne pod PERSONA-1 (rekomendowane)** / **Osobny wiersz w backlogu** / **Wpisz jako otwarte pytanie w każdym specu**

**Odpowiedź:** Wpisz jako otwarte pytanie w każdym specu

### 20. `[green.conventions]`

> Ostatni punkt: `docs/conventions.md` (klasa `merge`). Repo ma już własne konwencje - Biome, SCSS przez Prettier, Conventional Commits z kluczem Jiry, `specs/<capability>/` bez numerów ticketów, dokumenty w `docs/` po polsku a pliki w rootcie po angielsku. Standard przynosi swoje.

Opcje: **Konwencje repo wygrywają (rekomendowane)** / **Domyślne standardu wygrywają** / **Pomiń ten plik**

**Odpowiedź:** Domyślne standardu wygrywają
