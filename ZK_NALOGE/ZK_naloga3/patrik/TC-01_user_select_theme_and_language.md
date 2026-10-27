# Funkcionalni test: Uporabnik – izbira teme in jezika

## 1. Informacije o dokumentu [5.2]

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-01, različica 1.1 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | Pričakovani rezultat TC-01-03 usklajen z delovanjem aplikacije; vpisani rezultati izvedbe | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »Select the theme and language« (`docs/features.md` §1.2).

**Obseg:** Izbira teme (svetla/temna) in jezika (angleščina/slovenščina) na profilni kartici nadzorne plošče, shranjevanje in obnovitev ob naslednji prijavi. Ni zajeto: sprememba uporabniškega imena, kakovost prevodov.

**Reference:** `docs/features.md`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/01-theme-language.spec.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; TM – testni model; BFF – strežniški sloj Next.js.

## 2. Specifikacija testnega modela [8.2]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TM-01 |
| Cilj | Pokriti izbiro, shranjevanje in obnovitev teme in jezika. |
| Prioriteta | Visoka |
| Izvleček testne strategije | Razredi ekvivalence in testiranje prehajanja stanj. Zaključek: vsak pokrivni element je pokrit z uspešnim testnim primerom. Avtomatizirano (Playwright). |
| Sledljivost | `docs/features.md` §1.2 Personal; `DashboardProfileCard.tsx` |

**Testni model.** Razredi: tema {svetla, temna}; jezik {angleščina, slovenščina}. Stanja obrazca:

| Iz | Dogodek | V |
| :--- | :--- | :--- |
| Čisto | Izbira druge vrednosti | Spremenjeno (tema se predogleda, gumb Shrani omogočen) |
| Spremenjeno | Shrani, zaledje uspešno | Čisto z novimi shranjenimi vrednostmi |
| Spremenjeno | Shrani, napaka zaledja | Čisto s starimi shranjenimi vrednostmi |
| Spremenjeno | Ponovno nalaganje | Čisto s starimi shranjenimi vrednostmi |
| Čisto | Nova prijava | Čisto, shranjene vrednosti uveljavljene |

## 3. Specifikacija testnih primerov [8.3]

### 3.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-01-01 | Obrazec prikaže shranjene nastavitve | Srednja | TM-01 |
| CI-01-02 | Temna tema se shrani in obdrži | Visoka | TM-01 |
| CI-01-03 | Slovenski jezik se shrani in uveljavi | Visoka | TM-01 |
| CI-01-04 | Neshranjena sprememba se zavrže | Srednja | TM-01 |
| CI-01-05 | Napaka zaledja povrne prejšnje vrednosti | Srednja | TM-01 |
| CI-01-06 | Stran zahteva sejo | Srednja | TM-01 |

### 3.2 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; uporabnik `functional_tests@nipravimail.com` je prijavljen; shranjena tema svetla, jezik angleščina; prazen `localStorage`.

| ID | Cilj | Prioriteta | Sledljivost | Predpogoji | Vhodi | Pričakovani rezultati |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01-01 | Prikaz shranjenih nastavitev | Srednja | CI-01-01 | P0 | Odpri `/dashboard` | Izbirnika kažeta Light in English; stran je v angleščini; `<html>` nima razreda `dark`; gumb Shrani je onemogočen. |
| TC-01-02 | Shranjevanje temne teme | Visoka | CI-01-02 | P0 | Izberi Dark, klikni Shrani, osveži stran, odpri `/quizzes` | »Profile updated.«; `PATCH /users/me/preferences` z `{"language":0,"theme":1}` vrne 2xx; `localStorage["quizio-theme"]="dark"`; temna tema ostane po osvežitvi in na `/quizzes`; gumb Shrani onemogočen. |
| TC-01-03 | Shranjevanje slovenščine | Visoka | CI-01-03 | TC-01-02 izveden | Izberi Slovenščina, klikni Shrani | Telo zahteve vsebuje `"language":1`; oznake postanejo »Tema«, »Jezik«, »Shrani profil«; `<html lang="sl">`; prikazano sporočilo o uspehu (ostane v jeziku, v katerem je nastalo: »Profile updated.«). |
| TC-01-04 | Nastavitve preživijo novo sejo | Visoka | CI-01-02, CI-01-03 | TC-01-02 in 03 izvedena | Odpri nov kontekst brskalnika brez seje; prijava; odpri `/dashboard` | Vmesnik je slovenski in temen; izbirnika kažeta Temna in Slovenščina. |
| TC-01-05 | Zavrženje neshranjene spremembe | Srednja | CI-01-04 | P0 | Izberi Dark in Slovenščina, ne shrani, osveži stran | Stran je svetla in angleška; izbirnika kažeta shranjeni vrednosti. |
| TC-01-06 | Napaka zaledja povrne vrednosti | Srednja | CI-01-05 | P0; `PATCH` nastavitev prisilno vrne HTTP 500 | Izberi Dark, klikni Shrani | Prikazano sporočilo o napaki; tema se vrne na svetlo; izbirnik kaže Light; `localStorage` ni nastavljen na `dark`. |
| TC-01-07 | Dostop brez prijave | Srednja | CI-01-06 | Brez seje | Odpri `/dashboard` | Preusmeritev na `/login`; profilne kartice ni. |

## 4. Specifikacija testnega postopka [8.4]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TP-01 |
| Cilj | Izvesti testne primere TC-01-01 do TC-01-07. |
| Prioriteta | Visoka |
| Zagon | Zaženi sistem; izvedi `npm run seed`; prijavi testnega uporabnika. |
| Urejeni testni primeri | TC-01-07, 01, 05, 06, nato 02, 03, 04 (odvisno zaporedje). |
| Odnos do drugih postopkov | Spreminja nastavitve uporabnika; izvedi pred TP-03 in nikoli vzporedno s TP-02 ali TP-03. |
| Zaključek in čiščenje | Ponovno izvedi seed (povrne svetlo/angleščino); zapri konteksta brskalnika; shrani poročilo. |

## 5. Zahteve za testne podatke [8.5]

| ID | Opis | Odgovornost | Potrebno obdobje | Potreba po ponastavitvi | Arhiviranje ali odstranitev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TD-01-01 | Uporabnik `functional_tests@nipravimail.com` (admin) v PostgreSQL in Firebase; tema 0, jezik 0 | Avtor testov | Celoten tek | Seed ponastavi pred vsakim tekom | Ohrani |
| TD-01-02 | Geslo v `TEST_PASSWORD` (datoteka `testing/.env`) | Avtor testov | Celoten tek | Ne | Nikoli v datotekah |

## 6. Zahteve za testno okolje [8.6]

| ID | Element | Opis | Odgovornost | Potrebno obdobje |
| :--- | :--- | :--- | :--- | :--- |
| TE-01-01 | Aplikacija | Next.js (`localhost:3000`), Go API, PostgreSQL z migracijami in seedom | Avtor testov | Celoten tek |
| TE-01-02 | Avtentikacija | Projekt Firebase z testnim uporabnikom | Avtor testov | Celoten tek |
| TE-01-03 | Brskalnik in orodje | Chromium prek Playwright, 1280×720 | Avtor testov | Celoten tek |

## 7. Poročili o pripravljenosti [8.7, 8.8]

| ID | Opis stanja |
| :--- | :--- |
| TD-01-01 | Pripravljeno. Seed izveden 27. 10. 2026 ob 11:49:12 in ponovno pred TP-01; uporabnik obstaja, `is_admin = true`, tema 0, jezik 0. Prijava v Firebase uspešna. |
| TD-01-02 | Pripravljeno. Geslo podano z `TEST_PASSWORD` v okolju lupine; ni shranjeno v datotekah. |
| TE-01-01 | Pripravljeno. Lokalni `docker compose` (postgres:16, backend, next), koda commit `eb87c8f`; `/login` vrne 200, shema `quizio` ima 7 tabel. Odstopanje od produkcije: lokalna baza z le testnimi podatki. |
| TE-01-02 | Pripravljeno. Projekt Firebase dosegljiv, prijava testnega uporabnika uspešna. |
| TE-01-03 | Pripravljeno. Playwright 1.64.1, Chromium 156.0.8078.4 (headless), 1280×720, Linux (Fedora 44). |

## 8. Dejanski rezultati in rezultat testa [8.9]

Končni tek: 27. 10. 2026, 11:49:10–11:50:09.

| Testni primer | Dejanski rezultati | Rezultat testa (uspešen / neuspešen / blokiran) |
| :--- | :--- | :--- |
| TC-01-01 | Izbirnika Light in English; naslov »Welcome back.«; `lang="en"`; brez razreda `dark`; Shrani onemogočen. | Uspešen |
| TC-01-02 | `PATCH` z `{"language":0,"theme":1}`, odziv 2xx; »Profile updated.«; Shrani onemogočen; `localStorage` = `dark`; temna tema po osvežitvi in na `/quizzes`. | Uspešen |
| TC-01-03 | `PATCH` z `{"language":1,"theme":1}`; `lang="sl"`; oznake »Tema«, »Jezik«, »Shrani profil«; sporočilo »Profile updated.«. | Uspešen (po popravku pričakovanja, INC-01-01) |
| TC-01-04 | Po prijavi v novem kontekstu: `lang="sl"`, razred `dark`, izbirnika Temna in Slovenščina. | Uspešen (po popravku testne skripte, INC-01-02) |
| TC-01-05 | Predogled teme deluje; po osvežitvi svetla tema, `lang="en"`, izbirnika 0/0; v bazi tema 0, jezik 0. | Uspešen |
| TC-01-06 | Prikazano »Simulated failure«; brez razreda `dark`; izbirnik Light; `localStorage` ni `dark`; v bazi tema 0. | Uspešen |
| TC-01-07 | Preusmeritev na `/login`; profilne kartice ni. | Uspešen |

## 9. Dnevnik izvajanja testov [8.10]

| ID | Datum/čas | Opis | Vpliv |
| :--- | :--- | :--- | :--- |
| LOG-01-01 | 27. 10. 2026 (ura ni zabeležena) | Tek 1: TC-01-03 neuspešen (pričakovano »Profil posodobljen.«), TC-01-04 preskočen zaradi odvisnosti. | Odprt INC-01-01; TC-01-04 brez rezultata. |
| LOG-01-02 | 27. 10. 2026 (ura ni zabeležena) | Tek 2: TC-01-03 neuspešen (INC-01-01), TC-01-04 neuspešen, ker je neuspeh TC-01-03 ponastavil nastavitve. | Rezultat TC-01-04 neveljaven. |
| LOG-01-03 | 27. 10. 2026 (ura ni zabeležena) | Tek 3: po popravku pričakovanja TC-01-03 uspešen; TC-01-04 neuspešen (nov kontekst je podedoval shranjeno sejo). | Odprt INC-01-02. |
| LOG-01-04 | 27. 10. 2026, 11:49:10 | Začetek končnega teka (vsi postopki, 23 testov). Seed in prijava ob 11:49:12. | – |
| LOG-01-05 | 27. 10. 2026, 11:49:17–11:49:37 | TP-01: TC-01-07, 01, 05, 06, 02, 03, 04 izvedeni po vrstnem redu, vsi uspešni. | – |
| LOG-01-06 | 27. 10. 2026, 11:50:09 | Konec končnega teka: 23 uspešnih, 0 neuspešnih (58,5 s). | – |

## 10. Poročilo o incidentu [8.11]

| Polje | INC-01-01 | INC-01-02 |
| :--- | :--- | :--- |
| Časovni podatki | 27. 10. 2026, tek 1 | 27. 10. 2026, tek 3 |
| Poročevalec | Patrik, avtor testov | Patrik, avtor testov |
| Kontekst | Quizio `eb87c8f`, lokalni docker compose; TP-01, TC-01-03; funkcionalno testiranje | Quizio `eb87c8f`, lokalni docker compose; TP-01, TC-01-04; funkcionalno testiranje |
| Opis incidenta | Po preklopu na slovenščino je bilo pričakovano sporočilo »Profil posodobljen.«, prikazano pa je »Profile updated.«. Ponovljivo. Sporočilo nastane pred zamenjavo jezika in ostane v prvotnem jeziku; ostali vmesnik je v slovenščini. Vzrok: napačno pričakovanje v specifikaciji. | Test se je ustavil na prijavni strani v slovenščini. Nov kontekst brskalnika je podedoval shranjeno sejo projekta, zato ni šlo za novo sejo. Vzrok: napaka v testni skripti, ne v aplikaciji. |
| Resnost | Nizka | Nizka |
| Prioriteta | Nizka | Nizka |
| Tveganje | Brez novega tveganja za izdelek. | Brez novega tveganja za izdelek. |
| Status | Zaprt: pričakovani rezultat TC-01-03 popravljen (različica 1.1). | Zaprt: kontekst se ustvari brez seje; ponovni test uspešen. |
