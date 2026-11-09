# Funkcionalni test: Uporabnik – ogled zgodovine preteklih poskusov

## 1. Informacije o dokumentu

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-03, različica 1.2 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | Vpisani rezultati izvedbe | Patrik |
| 1.2 | 2026-11-09 | Odstranjena specifikacija testnega modela in dnevnik izvajanja; združene zahteve za postopek, podatke in okolje; koraki testnih primerov razširjeni do ravni implementacije; predpogoj TC-03-03 ne potrebuje več TC-01-03 (jezik se nastavi v bazi) | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »View a history of past quiz attempts and scores« (`docs/features.md` §1.2).

**Obseg:** Seznam »Recent attempts« in statistika na nadzorni plošči (`/dashboard`), njuna lokalizacija in dostop brez prijave. Test samo bere vnaprej pripravljen poskus iz seeda. Ni zajeto: vrstni red, omejitev na 5 vrstic, prazno stanje (seed vsebuje en poskus), odprte seje, lestvica, stran z rezultatom.

**Testna strategija:** Razredi ekvivalence (jezik {angleščina, slovenščina}; seja {prijavljen, neprijavljen}) in preverjanje izpeljanih vrednosti glede na znane podatke seeda. Seed vsebuje en zaključen poskus kviza `FT Seed Quiz`: vprašanje 1 (2 točki) pravilno, vprašanje 2 (3 točke) napačno, zato so pričakovane vrednosti točke 2/5, 1 opravljen kviz in povprečje 2/5 = 40 %. Avtomatizirano s Playwright. Zaključni kriterij: vsak pokrivni element je pokrit z uspešnim testnim primerom.

**Reference:** `docs/features.md`, `next/src/app/dashboard/page.tsx`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/03-attempt-history.spec.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; zaključen poskus – poskus z nastavljenim `time_taken`.

## 2. Specifikacija testnih primerov

### 2.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-03-01 | Poskus iz seeda je prikazan z naslovom, datumom, statusom in točkami | Visoka | `features.md` §1.2 |
| CI-03-02 | Statistika ustreza seedu (1 opravljen, 40 %) | Srednja | `features.md` §1.2 |
| CI-03-03 | Oznake in datumi sledijo slovenski nastavitvi | Srednja | `features.md` §1.2 |
| CI-03-04 | Zgodovina zahteva sejo | Srednja | `features.md` §1.2 |

### 2.2 Elementi strani

| Ime | Iskalnik |
| :--- | :--- |
| Vrstica poskusa | element `<article>`, ki vsebuje besedilo `FT Seed Quiz` |
| Prazno stanje | besedilo »No recent attempts yet.« |
| Kartica opravljenih kvizov | `<article>`, ki vsebuje »Completed quizzes« |
| Kartica povprečja | `<article>`, ki vsebuje »Average score« |
| Plošča poskusov (sl) | zadnji element `<section>`, ki vsebuje »Nedavni poskusi« |
| Korenski element | `<html>`, atribut `lang` |
| API zgodovine | `GET /api/proxy/users/me/submissions?limit=100&offset=0` |
| Nastavitev jezika v bazi | `UPDATE quizio."User" SET theme = 0, language = 1 WHERE email = 'functional_tests@nipravimail.com'` |

### 2.3 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; brskalnik ima shranjeno sejo uporabnika `functional_tests@nipravimail.com`; v bazi jezik angleščina (`language = 0`), tema svetla. Podatki seeda: objavljen `FT Seed Quiz` (največ 5 točk) in en zaključen poskus tega uporabnika, 2/5 točk, 4 min 30 s, začet en dan pred izvedbo seeda (`NOW() - INTERVAL '1 day'`). Po vsakem primeru se nastavitve ponastavijo na `theme = 0`, `language = 0`.

#### TC-03-01 Prikaz poskusa

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Poskus iz seeda je prikazan z vsemi podatki / Visoka / CI-03-01 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | – |
| 2 | Preštej vrstice poskusa (`article` z `FT Seed Quiz`). | Natanko 1. |
| 3 | Preberi besedilo vrstice. | Vsebuje »Completed« in »2/5«. |
| 4 | Preštej elemente z besedilom praznega stanja. | 0. |
| 5 | Iz besedila vrstice (zaporedni presledki združeni v enega) izlušči datum z regularnim izrazom `/[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/` (oblika `en-US`, npr. »Oct 26, 2026, 10:50 AM«). | Datum je najden. |
| 6 | Izračunaj starost datuma v urah glede na trenutni čas. | Med 6 in 60 ur. Strežnik izpiše datum v svojem časovnem pasu, zato se preveri širok razpon okoli pričakovanih 24 ur. |

#### TC-03-02 Statistika

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Statistika je pravilno izračunana iz zgodovine / Srednja / CI-03-02 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | – |
| 2 | Preberi besedilo kartice opravljenih kvizov. | Ustreza `/Completed quizzes\s*1\b/` (vrednost 1). |
| 3 | Preberi besedilo kartice povprečja. | Ustreza `/Average score\s*40%/`. |
| 4 | Poišči besedili »1 completed« in »Next milestone: 10 quizzes« (kartica napredka). | Obe sta vidni. |

#### TC-03-03 Zgodovina v slovenščini

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Oznake in datum sledijo slovenski nastavitvi, podatki ostanejo enaki / Srednja / CI-03-03 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | V bazi nastavi `theme = 0`, `language = 1` (neposredno, brez vmesnika, da primer ni odvisen od TP-01). | – |
| 2 | Odpri `/dashboard`. | `<html lang="sl">`. |
| 3 | Poišči ploščo poskusov (zadnji `section` z »Nedavni poskusi«). | Plošča je vidna. |
| 4 | V plošči poišči besedila »Kviz«, »Datum«, »Status«, »Točke« (natančno ujemanje). | Vsa štiri so vidna. |
| 5 | V plošči poišči vrstico poskusa in preberi njeno besedilo. | Vsebuje `2/5` in datum v obliki `sl-SI`, ki ustreza `/\d{1,2}\. \S+ \d{4}/` (npr. »26. okt. 2026«). |
| 6 | Ponastavi nastavitve na `theme = 0`, `language = 0`. | – |

#### TC-03-04 Zahtevana seja

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Brez seje ni dostopa do zgodovine prek strani ali API-ja / Srednja / CI-03-04 |
| Predpogoji | Kontekst brskalnika brez seje (`storageState = { cookies: [], origins: [] }`) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/dashboard`. | URL vsebuje `/login`. |
| 2 | Brez seje pošlji `GET /api/proxy/users/me/submissions?limit=100&offset=0` (Playwright `request.get`). | Status 401 ali 403. |
| 3 | Preberi telo odziva kot besedilo. | Ne vsebuje `FT Seed Quiz`. |

## 3. Testni postopek, testni podatki in testno okolje

**Testni postopek TP-03** (prioriteta srednja; izvede TC-03-01 do TC-03-04; datoteka `tests/03-attempt-history.spec.ts`).

| Faza | Opis |
| :--- | :--- |
| Zagon sistema | V korenu projekta `docker compose up` (PostgreSQL 16, Go API, Next.js na `localhost:3000`); migracije izvedene. |
| Priprava (enkrat za vse postopke) | Izprazni bazo, izvedi seed, prijavi se in shrani sejo (postopek »Prijava« v QUIZIO-FT-01, razdelek 3). |
| Priprava postopka | Pred TP-03 ponovno izvedi seed (povrne stanje po TP-01 in TP-02). |
| Vrstni red | TC-03-04 (brez seje), nato TC-03-01, 02, 03. Primeri so med seboj neodvisni. |
| Odnos do drugih postopkov | Potrebuje stanje seeda; teče za TP-01 in TP-02, nikoli vzporedno (en delavec). |
| Zaključek | Po vsakem primeru ponastavi nastavitve na 0/0; po vseh postopkih izprazni bazo (teče tudi ob neuspehu); shrani poročilo Playwright. |

**Testni podatki in okolje**

| ID | Vrsta | Opis | Ponastavitev |
| :--- | :--- | :--- | :--- |
| TD-03-01 | Podatki | Uporabnik `functional_tests@nipravimail.com` (admin) v PostgreSQL (seed) in Firebase | Seed |
| TD-03-02 | Podatki | Objavljen `FT Seed Quiz` (kategorija General, 10 min): 2 vprašanji (2 in 3 točke), po 4 odgovori, en pravilen | Seed ga ponovno ustvari |
| TD-03-03 | Podatki | Zaključen poskus: V1 pravilno, V2 napačno, 2/5, `time_taken = 00:04:30`, `start_time = NOW() - 1 dan` | Seed ga ponovno ustvari |
| TD-03-04 | Podatki | Geslo v `TEST_PASSWORD` (`testing/.env`, ni v repozitoriju) | Ne |
| TE-03-01 | Okolje | Next.js (`BASE_URL`), Go API, PostgreSQL (`DATABASE_URL`) za seed in nastavitev jezika | – |
| TE-03-02 | Okolje | Projekt Firebase s testnim uporabnikom | – |
| TE-03-03 | Okolje | Playwright, Chromium (headless), 1280×720, en delavec | – |

## 4. Dejanski rezultati in rezultat testa

Končni tek: 27. 10. 2026, 11:49:10–11:50:09 (vsi postopki, 23 testov, vsi uspešni).

| Testni primer | Dejanski rezultati | Rezultat testa |
| :--- | :--- | :--- |
| TC-03-01 | Ena vrstica: »FT Seed Quiz · Oct 26, 2026, 10:50 AM · COMPLETED · 2/5«; brez besedila praznega stanja. | Uspešen |
| TC-03-02 | »Completed quizzes« 1; »Average score« 40%; »1 completed«; »Next milestone: 10 quizzes«. | Uspešen |
| TC-03-03 | `lang="sl"`; plošča »Nedavni poskusi«, stolpci »Kviz«, »Datum«, »Status«, »Točke«; vrstica »FT Seed Quiz · 26. okt. 2026, 10:50 · OPRAVLJENO · 2/5«. | Uspešen |
| TC-03-04 | Preusmeritev na `/login`; API vrne 401 brez podatkov o poskusih. | Uspešen |

## 5. Poročilo o incidentu

Med izvajanjem TP-03 ni bil zabeležen noben incident.
