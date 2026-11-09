# Funkcionalni test: Uporabnik – izbira teme in jezika

## 1. Informacije o dokumentu

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-01, različica 1.2 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | Vpisani rezultati izvedbe | Patrik |
| 1.2 | 2026-11-09 | Odstranjena specifikacija testnega modela in dnevnik izvajanja; združene zahteve za postopek, podatke in okolje; koraki testnih primerov razširjeni do ravni implementacije | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »Select the theme and language« (`docs/features.md` §1.2).

**Obseg:** Izbira teme (svetla/temna) in jezika (angleščina/slovenščina) na profilni kartici nadzorne plošče (`/dashboard`), shranjevanje in obnovitev ob naslednji prijavi. Ni zajeto: sprememba uporabniškega imena, kakovost prevodov.

**Testna strategija:** Razredi ekvivalence (tema {svetla, temna}, jezik {angleščina, slovenščina}) in prehodi stanj obrazca (čisto → spremenjeno → shranjeno / zavrženo / napaka). Avtomatizirano s Playwright. Zaključni kriterij: vsak pokrivni element je pokrit z uspešnim testnim primerom.

**Reference:** `docs/features.md`, `next/src/components/dashboard/DashboardProfileCard.tsx`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/01-theme-language.spec.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; BFF – strežniški sloj Next.js (`/api/proxy/...`); seed – skripta, ki napolni bazo s testnimi podatki.

## 2. Specifikacija testnih primerov

### 2.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-01-01 | Obrazec prikaže shranjene nastavitve | Srednja | `features.md` §1.2 |
| CI-01-02 | Temna tema se shrani in obdrži | Visoka | `features.md` §1.2 |
| CI-01-03 | Slovenski jezik se shrani in uveljavi | Visoka | `features.md` §1.2 |
| CI-01-04 | Neshranjena sprememba se zavrže | Srednja | `features.md` §1.2 |
| CI-01-05 | Napaka zaledja povrne prejšnje vrednosti | Srednja | `features.md` §1.2 |
| CI-01-06 | Stran zahteva sejo | Srednja | `features.md` §1.2 |

### 2.2 Elementi strani

Vsi koraki uporabljajo spodnje iskalnike. Vrednosti izbirnikov so številke: tema `0` = Light, `1` = Dark; jezik `0` = English, `1` = Slovenščina.

| Ime | Iskalnik |
| :--- | :--- |
| Izbirnik teme | `<select id="dashboard-theme">` (CSS `#dashboard-theme`) |
| Izbirnik jezika | `<select id="dashboard-language">` (CSS `#dashboard-language`) |
| Gumb Shrani | `<button type="submit">` znotraj `<form>`, ki vsebuje `#dashboard-theme`. Besedilo gumba je odvisno od jezika (»Save profile« / »Shrani profil«), zato se poišče po strukturi, ne po besedilu. |
| Korenski element | `<html>`: razred `dark` pomeni temno temo, atribut `lang` (`en` / `sl`) jezik |
| Zahteva za shranjevanje | `PATCH /api/proxy/users/me/preferences` (pot URL-ja se primerja natančno) |
| Lokalna tema | `window.localStorage.getItem("quizio-theme")` (`"dark"` / `"light"`) |
| Nastavitve v bazi | `SELECT theme, language FROM quizio."User" WHERE email = 'functional_tests@nipravimail.com'` |

### 2.3 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; brskalnik ima shranjeno sejo uporabnika `functional_tests@nipravimail.com` (glej razdelek 3, »Prijava«); v bazi sta tema `0` in jezik `0` (pred vsakim neodvisnim primerom se nastavita z `UPDATE quizio."User" SET theme = 0, language = 0 WHERE email = ...`).

#### TC-01-01 Prikaz shranjenih nastavitev

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Obrazec prikaže shranjene vrednosti / Srednja / CI-01-01 |
| Predpogoji | P0; v bazi tema 0, jezik 0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | Viden je naslov z vlogo `heading` in besedilom »Welcome back.«. |
| 2 | Preberi vrednost `#dashboard-theme` in `#dashboard-language`. | Obe vrednosti sta `"0"` (Light, English). |
| 3 | Preberi atributa elementa `<html>`. | `lang="en"`; razred ne vsebuje `dark`. |
| 4 | Preveri gumb Shrani. | Gumb je onemogočen (`disabled`), ker obrazec ni spremenjen. |

#### TC-01-02 Shranjevanje temne teme

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Temna tema se shrani na strežnik in v brskalnik ter ostane po osvežitvi / Visoka / CI-01-02 |
| Predpogoji | P0; prvi primer zaporedja TC-01-02 → 03 → 04 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | Stran je naložena, tema svetla. |
| 2 | V `#dashboard-theme` izberi možnost z vrednostjo `1` (Dark). | Gumb Shrani postane omogočen. |
| 3 | Začni čakati na zahtevo in odziv `PATCH /api/proxy/users/me/preferences`, nato klikni gumb Shrani. | Telo zahteve (JSON) je natanko `{"language":0,"theme":1}`; odziv ima status 2xx. |
| 4 | Poišči besedilo »Profile updated.«. | Sporočilo je vidno. |
| 5 | Preveri gumb Shrani. | Gumb je znova onemogočen. |
| 6 | Preberi `localStorage["quizio-theme"]`. | Vrednost je `"dark"`. |
| 7 | Osveži stran (`reload`). | `<html>` ima razred `dark`; `#dashboard-theme` ima vrednost `"1"`. |
| 8 | Odpri `/quizzes`. | `<html>` ima razred `dark` (tema velja na vseh straneh). |

#### TC-01-03 Shranjevanje slovenščine

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Slovenski jezik se shrani in uveljavi v vmesniku / Visoka / CI-01-03 |
| Predpogoji | TC-01-02 izveden (v bazi tema 1, jezik 0) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | Stran je temna in angleška. |
| 2 | V `#dashboard-language` izberi vrednost `1` (Slovenščina). | Gumb Shrani postane omogočen. |
| 3 | Začni čakati na `PATCH /api/proxy/users/me/preferences`, nato klikni gumb Shrani. | Telo zahteve je natanko `{"language":1,"theme":1}`. |
| 4 | Preberi atribut `lang` elementa `<html>`. | `lang="sl"`. |
| 5 | Poišči besedilo »Profil posodobljen.«. | Sporočilo o uspehu je vidno v slovenščini, tako kot preostali vmesnik. |
| 6 | Poišči besedili »Tema« in »Jezik« (natančno ujemanje) ter gumb z vlogo `button` in imenom »Shrani profil«. | Vsi trije elementi so vidni. |

#### TC-01-04 Nastavitve preživijo novo sejo

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Shranjeni nastavitvi se uveljavita po novi prijavi / Visoka / CI-01-02, CI-01-03 |
| Predpogoji | TC-01-02 in TC-01-03 izvedena (v bazi tema 1, jezik 1) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Ustvari nov kontekst brskalnika **brez** shranjene seje (prazni piškotki in `localStorage`: `storageState = { cookies: [], origins: [] }`). | Kontekst nima seje (sicer bi podedoval shranjeno sejo, INC-01-02). |
| 2 | V novem kontekstu se prijavi po postopku »Prijava« (razdelek 3). | Preusmeritev s `/login`. |
| 3 | Odpri `/dashboard`. | `<html>` ima `lang="sl"` in razred `dark`. |
| 4 | Preberi `#dashboard-theme` in `#dashboard-language`. | Obe vrednosti sta `"1"` (Temna, Slovenščina). |
| 5 | Zapri kontekst (tudi ob neuspehu). | – |

#### TC-01-05 Zavrženje neshranjene spremembe

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Sprememba brez shranjevanja se po osvežitvi zavrže / Srednja / CI-01-04 |
| Predpogoji | P0; v bazi tema 0, jezik 0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | Stran je svetla in angleška. |
| 2 | V `#dashboard-theme` izberi `1`, v `#dashboard-language` izberi `1`. Gumba Shrani ne klikni. | `<html>` dobi razred `dark` (predogled teme). |
| 3 | Osveži stran. | `<html>` nima razreda `dark` in ima `lang="en"`. |
| 4 | Preberi `#dashboard-theme` in `#dashboard-language`. | Obe vrednosti sta `"0"`. |
| 5 | Preberi nastavitve v bazi. | `theme = 0`, `language = 0`. |

#### TC-01-06 Napaka zaledja povrne vrednosti

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Ob neuspešnem shranjevanju se tema vrne na prejšnjo vrednost / Srednja / CI-01-05 |
| Predpogoji | P0; v bazi tema 0, jezik 0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Pred odprtjem strani prestrezi zahteve na pot `/api/proxy/users/me/preferences` (`page.route`): zahtevo `PATCH` odgovori sam s statusom `500`, `Content-Type: application/json` in telesom `{"error":"Simulated failure"}`; ostale metode spusti naprej. | Prestrezanje je aktivno; zahteva ne pride do zaledja. |
| 2 | Odpri `/dashboard`. | Stran je svetla. |
| 3 | V `#dashboard-theme` izberi `1`. | Predogled temne teme. |
| 4 | Klikni gumb Shrani. | Prikazano je besedilo »Simulated failure«. |
| 5 | Preveri `<html>` in `#dashboard-theme`. | `<html>` nima razreda `dark`; izbirnik ima vrednost `"0"`. |
| 6 | Preberi `localStorage["quizio-theme"]` in nastavitve v bazi. | `localStorage` ni `"dark"`; v bazi `theme = 0`. |

#### TC-01-07 Dostop brez prijave

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Neprijavljen uporabnik ne vidi profilne kartice / Srednja / CI-01-06 |
| Predpogoji | Kontekst brskalnika brez seje (`storageState = { cookies: [], origins: [] }`) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | URL se preusmeri na pot, ki vsebuje `/login`. |
| 2 | Preštej elemente `#dashboard-theme`. | Število je 0 (profilne kartice ni). |

## 3. Testni postopek, testni podatki in testno okolje

**Testni postopek TP-01** (prioriteta visoka; izvede TC-01-01 do TC-01-07; datoteka `tests/01-theme-language.spec.ts`).

| Faza | Opis |
| :--- | :--- |
| Zagon sistema | V korenu projekta `docker compose up` (PostgreSQL 16, Go API, Next.js na `localhost:3000`); migracije izvedene. |
| Priprava (enkrat za vse postopke, `tests/auth.setup.ts`) | 1. Izprazni bazo (`testing/purge.sql`: `TRUNCATE` vseh tabel razen `Category`). 2. Izvedi `seed/seed.sql`. 3. **Prijava:** odpri `/login`, v `#email` vpiši e-pošto, v `#password` geslo iz `TEST_PASSWORD`, klikni gumb z vlogo `button` in natančnim imenom »Sign in with email«, počakaj, da pot URL-ja ne začne več z `/login`. 4. Shrani stanje brskalnika (piškotki, `localStorage`) v `.auth/user.json`; vsi primeri s sejo ga naložijo. |
| Priprava postopka | Pred TP-01 ponovno izvedi seed. |
| Vrstni red | TC-01-07 (brez seje); neodvisni TC-01-01, 05, 06 (pred vsakim ponastavi nastavitve na 0/0); nato zaporedno TC-01-02 → 03 → 04 (vsak gradi na stanju prejšnjega; ob neuspehu se naslednji preskočijo). |
| Odnos do drugih postopkov | Spreminja nastavitve testnega uporabnika; teče pred TP-02 in TP-03, nikoli vzporedno (en delavec). |
| Zaključek | Ponastavi nastavitve na 0/0; po vseh postopkih izprazni bazo (`tests/purge.teardown.ts`, teče tudi ob neuspehu); shrani poročilo Playwright (`playwright-report/`). |

**Testni podatki in okolje**

| ID | Vrsta | Opis | Ponastavitev |
| :--- | :--- | :--- | :--- |
| TD-01-01 | Podatki | Uporabnik `functional_tests@nipravimail.com` (admin) v PostgreSQL (seed) in Firebase (ročno ustvarjen); tema 0, jezik 0 | Seed pred vsakim postopkom |
| TD-01-02 | Podatki | Geslo v spremenljivki `TEST_PASSWORD` (datoteka `testing/.env`, ni v repozitoriju) | Ne |
| TE-01-01 | Okolje | Next.js (`BASE_URL`, privzeto `http://localhost:3000`), Go API, PostgreSQL (`DATABASE_URL`, privzeto `postgres://postgres:postgres@localhost:5432/appdb`) | – |
| TE-01-02 | Okolje | Projekt Firebase s testnim uporabnikom | – |
| TE-01-03 | Okolje | Playwright, Chromium (headless), 1280×720, en delavec; prestrezanje zahtev s `page.route` (TC-01-06) | – |

## 4. Dejanski rezultati in rezultat testa

TC-01-01, 02 in 05 do 07: tek 27. 10. 2026, 11:49:10–11:50:09. TC-01-03 in TC-01-04: ponovni tek TP-01 po spremembi pričakovanega rezultata TC-01-03 (različica 1.2).

| Testni primer | Dejanski rezultati | Rezultat testa |
| :--- | :--- | :--- |
| TC-01-01 | Izbirnika Light in English; naslov »Welcome back.«; `lang="en"`; brez razreda `dark`; Shrani onemogočen. | Uspešen |
| TC-01-02 | `PATCH` z `{"language":0,"theme":1}`, odziv 2xx; »Profile updated.«; Shrani onemogočen; `localStorage` = `dark`; temna tema po osvežitvi in na `/quizzes`. | Uspešen |
| TC-01-03 | `PATCH` z `{"language":1,"theme":1}`; `lang="sl"`; oznake »Tema«, »Jezik«, »Shrani profil«. Besedilo »Profil posodobljen.« ni najdeno; prikazano je »Profile updated.«. | Neuspešen (INC-01-01) |
| TC-01-04 | Ni izveden, ker je TC-01-03 neuspešen. | Blokiran |
| TC-01-05 | Predogled teme deluje; po osvežitvi svetla tema, `lang="en"`, izbirnika 0/0; v bazi tema 0, jezik 0. | Uspešen |
| TC-01-06 | Prikazano »Simulated failure«; brez razreda `dark`; izbirnik Light; `localStorage` ni `dark`; v bazi tema 0. | Uspešen |
| TC-01-07 | Preusmeritev na `/login`; profilne kartice ni. | Uspešen |

## 5. Poročilo o incidentu

| Polje | INC-01-01 | INC-01-02 |
| :--- | :--- | :--- |
| Časovni podatki | Ponovni tek TP-01 po različici 1.2 | 27. 10. 2026 |
| Poročevalec | Patrik, avtor testov | Patrik, avtor testov |
| Kontekst | Quizio `347745b`, lokalni docker compose; TP-01, TC-01-03 | Quizio `eb87c8f`, lokalni docker compose; TP-01, TC-01-04 |
| Opis incidenta | Po preklopu jezika na slovenščino in shranjevanju je pričakovano sporočilo »Profil posodobljen.«, prikazano pa je »Profile updated.«. Preostali vmesnik je v slovenščini. Ponovljivo. Sporočilo nastane pred zamenjavo jezika in ostane v prvotnem jeziku. Posledica: TC-01-04 ni bil izveden. | Test se je ustavil na prijavni strani v slovenščini. Nov kontekst brskalnika je podedoval shranjeno sejo projekta, zato ni šlo za novo sejo. Vzrok: napaka v testni skripti, ne v aplikaciji. |
| Resnost / prioriteta | Nizka / nizka | Nizka / nizka |
| Tveganje | Uporabnik vidi mešan jezik vmesnika takoj po zamenjavi jezika. | Brez novega tveganja za izdelek. |
| Status | Odprt: čaka na popravek prevoda sporočila v aplikaciji. | Zaprt: kontekst se ustvari brez seje; ponovni test uspešen. |
