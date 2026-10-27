# Funkcionalni test: Uporabnik – ogled zgodovine preteklih poskusov

## 1. Informacije o dokumentu [5.2]

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-03, različica 1.1 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | Vpisani rezultati izvedbe | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »View a history of past quiz attempts and scores« (`docs/features.md` §1.2).

**Obseg:** Seznam »Recent attempts« in statistika na nadzorni plošči, njuna lokalizacija in dostop brez prijave. Test samo bere vnaprej pripravljen poskus. Ni zajeto: vrstni red, omejitev na 5 vrstic, prazno stanje (seed vsebuje en poskus), odprte seje, lestvica, stran z rezultatom.

**Reference:** `docs/features.md`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/03-attempt-history.spec.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; TM – testni model; zaključen poskus – poskus z nastavljenim `time_taken`.

## 2. Specifikacija testnega modela [8.2]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TM-03 |
| Cilj | Pokriti prikaz zaključenih poskusov in iz njih izpeljanih vrednosti. |
| Prioriteta | Srednja |
| Izvleček testne strategije | Razredi ekvivalence in preverjanje izpeljanih vrednosti glede na znane podatke seeda. Zaključek: vsak pokrivni element je pokrit z uspešnim testnim primerom. Avtomatizirano (Playwright). |
| Sledljivost | `docs/features.md` §1.2 Personal; `app/dashboard/page.tsx` |

**Testni model.** Seed: en zaključen poskus kviza `FT Seed Quiz`; vprašanje 1 (2 točki) pravilno, vprašanje 2 (3 točke) napačno. Razredi: jezik {angleščina, slovenščina}; seja {prijavljen, neprijavljen}.

| Vrednost | Pravilo | Pričakovano |
| :--- | :--- | :--- |
| Točke v vrstici | doseženo/največ točk | 2/5 |
| Opravljeni kvizi | zaključeni poskusi | 1 |
| Povprečni rezultat | Σ doseženo / Σ največ | 40 % |
| Status | zaključen poskus | Completed |
| Oblika datuma | `en-US` / `sl-SI` | glede na jezik |

## 3. Specifikacija testnih primerov [8.3]

### 3.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-03-01 | Poskus iz seeda je prikazan z naslovom, datumom, statusom in točkami | Visoka | TM-03 |
| CI-03-02 | Statistika ustreza seedu (1 opravljen, 40 %) | Srednja | TM-03 |
| CI-03-03 | Oznake in datumi sledijo slovenski nastavitvi | Srednja | TM-03 |
| CI-03-04 | Zgodovina zahteva sejo | Srednja | TM-03 |

### 3.2 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; `functional_tests@nipravimail.com` je prijavljen; jezik angleščina. Podatki seeda: objavljen `FT Seed Quiz` (največ 5 točk) in en zaključen poskus tega uporabnika, 2/5 točk, 4 min 30 s, začet en dan pred izvedbo seeda.

| ID | Cilj | Prioriteta | Sledljivost | Predpogoji | Vhodi | Pričakovani rezultati |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-03-01 | Prikaz poskusa | Visoka | CI-03-01 | P0 | Odpri `/dashboard`; preberi »Recent attempts« | Ena vrstica: **FT Seed Quiz**, datum poskusa (en dan pred izvedbo seeda), značka **Completed**, točke **2/5**; brez besedila praznega stanja. |
| TC-03-02 | Statistika | Srednja | CI-03-02 | P0 | Odpri `/dashboard`; preberi kartici s statistiko in napredkom | »Completed quizzes« = 1; »Average score« = 40%; »1 completed«. |
| TC-03-03 | Zgodovina v slovenščini | Srednja | CI-03-03 | P0; jezik shranjen kot slovenščina (glej TC-01-03) | Odpri `/dashboard` | Naslov plošče »Nedavni poskusi« in stolpci »Kviz«, »Datum«, »Status«, »Točke« v slovenščini; datum v obliki `sl-SI`; naslov kviza in točke 2/5 nespremenjeni. |
| TC-03-04 | Zahtevana seja | Srednja | CI-03-04 | Brez seje | Odpri `/dashboard`; pošlji `GET /api/proxy/users/me/submissions?limit=100&offset=0` | Preusmeritev na `/login`; API vrne 401 ali 403 in nobenih podatkov o poskusih. |

## 4. Specifikacija testnega postopka [8.4]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TP-03 |
| Cilj | Izvesti testne primere TC-03-01 do TC-03-04. |
| Prioriteta | Srednja |
| Zagon | Zaženi sistem; izvedi `npm run seed`; prijavi testnega uporabnika. |
| Urejeni testni primeri | TC-03-04, 01, 02, 03. |
| Odnos do drugih postopkov | Potrebuje stanje seeda: po TP-01 in TP-02 ga je treba ponovno izvesti; nikoli ne teci vzporedno z njima. |
| Zaključek in čiščenje | Ponovno izvedi seed (povrne jezik na angleščino); zapri konteksta brskalnika; shrani poročilo. |

## 5. Zahteve za testne podatke [8.5]

| ID | Opis | Odgovornost | Potrebno obdobje | Potreba po ponastavitvi | Arhiviranje ali odstranitev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TD-03-01 | Uporabnik `functional_tests@nipravimail.com` (admin) v PostgreSQL in Firebase | Avtor testov | Celoten tek | Ne | Ohrani |
| TD-03-02 | Objavljen `FT Seed Quiz`: 2 vprašanji (2 in 3 točke), po 4 odgovori, en pravilen | Avtor testov | Celoten tek | Seed ga ponovno ustvari | Zamenja ga naslednji seed |
| TD-03-03 | Zaključen poskus: V1 pravilno, V2 napačno, 2/5, 00:04:30, začet en dan pred seedom | Avtor testov | Celoten tek | Seed ga ponovno ustvari | Zamenja ga naslednji seed |
| TD-03-04 | Geslo v `TEST_PASSWORD` (datoteka `testing/.env`) | Avtor testov | Celoten tek | Ne | Nikoli v datotekah |

## 6. Zahteve za testno okolje [8.6]

| ID | Element | Opis | Odgovornost | Potrebno obdobje |
| :--- | :--- | :--- | :--- | :--- |
| TE-03-01 | Aplikacija | Next.js (`localhost:3000`), Go API, PostgreSQL z migracijami in seedom | Avtor testov | Celoten tek |
| TE-03-02 | Avtentikacija | Projekt Firebase z testnim uporabnikom | Avtor testov | Celoten tek |
| TE-03-03 | Brskalnik in orodje | Chromium prek Playwright, 1280×720 | Avtor testov | Celoten tek |

## 7. Poročili o pripravljenosti [8.7, 8.8]

| ID | Opis stanja |
| :--- | :--- |
| TD-03-01 | Pripravljeno. Seed izveden pred TP-03; prijava uspešna; jezik angleščina. |
| TD-03-02 | Pripravljeno. `FT Seed Quiz` objavljen, 2 vprašanji (2 in 3 točke), po 4 odgovori. |
| TD-03-03 | Pripravljeno. Poskus začet 26. 10. 2026 ob 10:50 (lokalni čas), `time_taken` 00:04:30, 2/5 točk. |
| TD-03-04 | Pripravljeno. Geslo podano z `TEST_PASSWORD` v okolju lupine; ni shranjeno v datotekah. |
| TE-03-01 | Pripravljeno. Lokalni `docker compose` (postgres:16, backend, next), koda commit `eb87c8f`; `/login` vrne 200. Odstopanje od produkcije: lokalna baza z le testnimi podatki. |
| TE-03-02 | Pripravljeno. Projekt Firebase dosegljiv, prijava testnega uporabnika uspešna. |
| TE-03-03 | Pripravljeno. Playwright 1.64.1, Chromium 156.0.8078.4 (headless), 1280×720, Linux (Fedora 44). |

## 8. Dejanski rezultati in rezultat testa [8.9]

Končni tek: 27. 10. 2026, 11:49:10–11:50:09.

| Testni primer | Dejanski rezultati | Rezultat testa (uspešen / neuspešen / blokiran) |
| :--- | :--- | :--- |
| TC-03-01 | Ena vrstica: »FT Seed Quiz · Oct 26, 2026, 10:50 AM · COMPLETED · 2/5«; brez besedila praznega stanja. | Uspešen |
| TC-03-02 | »Completed quizzes« 1; »Average score« 40%; »1 completed«; »Next milestone: 10 quizzes«. | Uspešen |
| TC-03-03 | `lang="sl"`; plošča »Nedavni poskusi«, stolpci »Kviz«, »Datum«, »Status«, »Točke«; vrstica »FT Seed Quiz · 26. okt. 2026, 10:50 · OPRAVLJENO · 2/5«. | Uspešen |
| TC-03-04 | Preusmeritev na `/login`; API vrne 401 brez podatkov o poskusih. | Uspešen |

## 9. Dnevnik izvajanja testov [8.10]

| ID | Datum/čas | Opis | Vpliv |
| :--- | :--- | :--- | :--- |
| LOG-03-01 | 27. 10. 2026 (ura ni zabeležena) | Teki 1 do 4: vsi primeri TP-03 uspešni. | – |
| LOG-03-02 | 27. 10. 2026, 11:50:03 | Končni tek, TP-03: seed ponovno izveden pred postopkom (odstranil kvize `FT ` iz TP-02). | – |
| LOG-03-03 | 27. 10. 2026, 11:50:03–11:50:09 | TC-03-04, 01, 02, 03 izvedeni po vrstnem redu, vsi uspešni. | – |

## 10. Poročilo o incidentu [8.11]

Med izvajanjem TP-03 ni bil zabeležen noben incident.
