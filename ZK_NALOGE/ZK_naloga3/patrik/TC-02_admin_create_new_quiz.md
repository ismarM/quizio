# Funkcionalni test: Admin – ustvarjanje novega kviza

## 1. Informacije o dokumentu [5.2]

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-02, različica 1.1 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | CI-02-06, TC-02-06 in TC-02-07 (c) usklajeni z delovanjem aplikacije; vpisani rezultati izvedbe | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »Create a new quiz with a title, description, and total time limit« (`docs/features.md` §1.1). Obrazec zahteva vsaj eno vprašanje, zato so vprašanja vključena.

**Obseg:** Obrazec za ustvarjanje kviza, njegova validacija, shranjevanje osnutka in dostop brez prijave. Ni zajeto: vprašanja s slikami, nalaganje slik, generiranje vprašanj z umetno inteligenco, urejanje, objava ter blokiranje uporabnikov brez admin pravic (obstaja le admin račun).

**Reference:** `docs/features.md`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/02-admin-create-quiz.spec.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; TM – testni model; osnutek (draft) – neobjavljen kviz.

## 2. Specifikacija testnega modela [8.2]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TM-02 |
| Cilj | Pokriti ustvarjanje kviza: veljaven vnos, vsa pravila validacije, napake in dostop. |
| Prioriteta | Visoka |
| Izvleček testne strategije | Razredi ekvivalence, analiza mejnih vrednosti in odločitvena tabela. Zaključek: vsak pokrivni element je pokrit z uspešnim testnim primerom. Avtomatizirano (Playwright). |
| Sledljivost | `docs/features.md` §1.1; `AdminQuizForm.tsx`, `getValidationErrors` |

**Testni model.** Gumb »Save draft« je omogočen samo, če veljajo vsa pravila (sporočila o napakah v obrazcu se zato ne prikažejo):

| Pravilo | Veljavno | Neveljavno | Odziv obrazca |
| :--- | :--- | :--- | :--- |
| Naslov | ni prazen | prazen, presledki | Save draft onemogočen |
| Časovna omejitev | ≥ 1 | 0, −1, prazno | Save draft onemogočen |
| Vprašanja | ≥ 1 | nobenega | ni mogoče: Remove je onemogočen pri zadnjem vprašanju |
| Besedilo vprašanja | ni prazno | prazno | Save draft onemogočen |
| Točke | > 0 | 0 | Save draft onemogočen |
| Odgovori | ≥ 2 | 1 | ni mogoče: Remove je onemogočen pri dveh odgovorih |
| Pravilen odgovor | natanko 1 | nobenega | ni mogoče: vedno je izbran en odgovor |
| Besedilo odgovora | ni prazno | prazno | Save draft onemogočen |

Veljavna oddaja: `POST /quizzes`, preusmeritev na `/admin`, kviz je osnutek. Neveljaven vnos: brez zahteve.

## 3. Specifikacija testnih primerov [8.3]

### 3.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-02-01 | Obrazec se odpre v praznem stanju osnutka | Srednja | TM-02 |
| CI-02-02 | Minimalen veljaven kviz je ustvarjen | Visoka | TM-02 |
| CI-02-03 | Poln veljaven kviz je ustvarjen s točnimi vrednostmi | Visoka | TM-02 |
| CI-02-04 | Prazen naslov onemogoči oddajo | Visoka | TM-02 |
| CI-02-05 | Meje časovne omejitve (0, −1, prazno, 1) | Visoka | TM-02 |
| CI-02-06 | Zadnjega vprašanja ni mogoče odstraniti (kviz ima vedno vsaj eno vprašanje) | Visoka | TM-02 |
| CI-02-07 | Pravila za vprašanja so uveljavljena | Visoka | TM-02 |
| CI-02-08 | Nov kviz je osnutek in ni na javnem seznamu | Visoka | TM-02 |
| CI-02-09 | Napaka strežnika ohrani vneseno | Srednja | TM-02 |
| CI-02-10 | Dostop brez prijave je blokiran | Visoka | TM-02 |
| CI-02-11 | Preklic ne ustvari ničesar | Nizka | TM-02 |

### 3.2 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; `functional_tests@nipravimail.com` (admin) je prijavljen na `/admin/quizzes/new`; privzete kategorije obstajajo.

| ID | Cilj | Prioriteta | Sledljivost | Predpogoji | Vhodi | Pričakovani rezultati |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-02-01 | Odprtje obrazca | Srednja | CI-02-01 | P0 | Odpri obrazec z admin strani | Naslov »Create quiz«; naslov in opis prazna; časovna omejitev `15`; prva kategorija izbrana; eno prazno vprašanje; značka »Draft«; »Save draft« viden in onemogočen. |
| TC-02-02 | Ustvarjanje minimalnega kviza | Visoka | CI-02-02 | P0 | Naslov `FT Minimal Quiz`; časovna omejitev `1`; vprašanje `2+2?`, točke `1`, odgovora `3` in `4` (`4` pravilen); Save draft | `POST /quizzes` vrne 2xx; preusmeritev na admin seznam; kviz je na seznamu kot Draft z 1 minuto; seznam je daljši za ena. |
| TC-02-03 | Ustvarjanje polnega kviza | Visoka | CI-02-03 | P0 | Naslov `FT Full Quiz <časovni žig>`; opis; druga kategorija; časovna omejitev `15`; 3 vprašanja s 4 odgovori, točke `1`, `5`, `10`, pravilni A, C, D; Save draft; odpri kviz | Osnutek ustvarjen; podrobnosti kažejo enake vrednosti, vrstni red in pravilne odgovore. |
| TC-02-04 | Naslov je obvezen | Visoka | CI-02-04 | P0 | Veljaven kviz; naslov izprazni, nato samo presledki | »Save draft« onemogočen; brez zahteve; brez kviza. |
| TC-02-05 | Meje časovne omejitve | Visoka | CI-02-05 | P0 | Veljaven kviz s časovno omejitvijo `0`, `-1`, prazno, nato `1`; Save draft | Pri prvih treh »Save draft« onemogočen, brez kviza. Pri `1`: kviz ustvarjen s 60 s. |
| TC-02-06 | Zadnjega vprašanja ni mogoče odstraniti | Visoka | CI-02-06 | P0 | Veljaven kviz z enim vprašanjem; dodaj drugo vprašanje; odstrani prvo | Pri enem vprašanju je »Remove« onemogočen, pri dveh omogočen; po odstranitvi ostane eno vprašanje in »Remove« je spet onemogočen; brez zahteve; brez kviza. |
| TC-02-07 | Pravila za vprašanja | Visoka | CI-02-07 | P0 | Veljaven kviz; (a) izprazni besedilo vprašanja; (b) točke `0`; (c) poskusi odstraniti odgovor pri dveh odgovorih; (d) dodaj tretji odgovor, izberi ga kot pravilnega in ga odstrani; (e) izprazni besedilo odgovora | (a), (b), (e): »Save draft« onemogočen; (c) trije onemogočeni »Remove« (edino vprašanje in oba odgovora); (d) vedno natanko en izbran pravilen odgovor. |
| TC-02-08 | Osnutek ni javen | Visoka | CI-02-08 | TC-02-02 izveden | Odpri `/quizzes` in poišči naslov; odpri admin seznam | Ni na `/quizzes`; na admin seznamu je Draft. |
| TC-02-09 | Napaka strežnika | Srednja | CI-02-09 | P0; `POST /quizzes` prisilno vrne HTTP 500 | Izpolni veljaven obrazec; Save draft | Sporočilo o napaki; uporabnik ostane na obrazcu; vrednosti ohranjene; gumb omogočen; brez kviza. |
| TC-02-10 | Dostop brez prijave | Visoka | CI-02-10 | Brez seje | (a) Odpri `/admin/quizzes/new`; (b) pošlji `POST /api/proxy/quizzes` z veljavnim telesom | (a) Preusmeritev na `/login`; (b) 401 ali 403; brez kviza. |
| TC-02-11 | Preklic | Nizka | CI-02-11 | P0 | Vnesi naslov in vprašanje; klikni Cancel | Vrnitev na admin seznam; brez novega kviza. |

## 4. Specifikacija testnega postopka [8.4]

| Element | Vsebina |
| :--- | :--- |
| Identifikator | TP-02 |
| Cilj | Izvesti testne primere TC-02-01 do TC-02-11. |
| Prioriteta | Visoka |
| Zagon | Zaženi sistem; izvedi `npm run seed`; prijavi testnega uporabnika; zabeleži število kvizov na admin seznamu. |
| Urejeni testni primeri | TC-02-10, 01, 04, 05, 06, 07, 09, 11, nato 02, 03, 08 (08 potrebuje 02). |
| Odnos do drugih postopkov | Deli admin seznam kvizov; nikoli ne teci vzporedno s TP-01 ali TP-03. |
| Zaključek in čiščenje | Ponovno izvedi seed (odstrani kvize z naslovom, ki se začne z `FT `); zapri konteksta brskalnika; shrani poročilo. |

## 5. Zahteve za testne podatke [8.5]

| ID | Opis | Odgovornost | Potrebno obdobje | Potreba po ponastavitvi | Arhiviranje ali odstranitev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TD-02-01 | Uporabnik `functional_tests@nipravimail.com` z `is_admin = true` v PostgreSQL in Firebase | Avtor testov | Celoten tek | Ne | Ohrani |
| TD-02-02 | Privzete kategorije (migracija `000003`) | Avtor testov | Celoten tek | Ne | Ohrani |
| TD-02-03 | Naslovi kvizov s predpono `FT ` in časovnim žigom | Avtor testov | TC-02-02, 03, 08 | Novi ob vsakem teku | Odstrani naslednji seed |
| TD-02-04 | Geslo v `TEST_PASSWORD` (datoteka `testing/.env`) | Avtor testov | Celoten tek | Ne | Nikoli v datotekah |

## 6. Zahteve za testno okolje [8.6]

| ID | Element | Opis | Odgovornost | Potrebno obdobje |
| :--- | :--- | :--- | :--- | :--- |
| TE-02-01 | Aplikacija | Next.js (`localhost:3000`), Go API, PostgreSQL z migracijami in seedom | Avtor testov | Celoten tek |
| TE-02-02 | Avtentikacija | Projekt Firebase z testnim uporabnikom | Avtor testov | Celoten tek |
| TE-02-03 | Brskalnik in orodje | Chromium prek Playwright, 1280×720, prestrezanje zahtev za TC-02-09 | Avtor testov | Celoten tek |

## 7. Poročili o pripravljenosti [8.7, 8.8]

| ID | Opis stanja |
| :--- | :--- |
| TD-02-01 | Pripravljeno. Seed izveden pred TP-02; uporabnik ima `is_admin = true`; prijava uspešna, admin strani dostopne. |
| TD-02-02 | Pripravljeno. Šest privzetih kategorij (General, Science, History, Geography, Pop Culture, Sports). |
| TD-02-03 | Pripravljeno. Seed pred TP-02 je odstranil stare kvize s predpono `FT `; naslovi niso trčili. |
| TD-02-04 | Pripravljeno. Geslo podano z `TEST_PASSWORD` v okolju lupine; ni shranjeno v datotekah. |
| TE-02-01 | Pripravljeno. Lokalni `docker compose` (postgres:16, backend, next), koda commit `eb87c8f`; `/login` vrne 200. Odstopanje od produkcije: lokalna baza z le testnimi podatki. |
| TE-02-02 | Pripravljeno. Projekt Firebase dosegljiv, prijava testnega uporabnika uspešna. |
| TE-02-03 | Pripravljeno. Playwright 1.64.1, Chromium 156.0.8078.4 (headless), 1280×720, Linux (Fedora 44); prestrezanje zahtev s `page.route`. |

## 8. Dejanski rezultati in rezultat testa [8.9]

Končni tek: 27. 10. 2026, 11:49:10–11:50:09.

| Testni primer | Dejanski rezultati | Rezultat testa (uspešen / neuspešen / blokiran) |
| :--- | :--- | :--- |
| TC-02-01 | Naslov »Create quiz«; naslov in opis prazna; časovna omejitev 15; prva kategorija izbrana; eno prazno vprašanje; značka »Draft«; »Save draft« onemogočen. | Uspešen |
| TC-02-02 | `POST /quizzes` 2xx; preusmeritev na `/admin`; vrstica `FT Minimal Quiz` z značko »Draft«; v bazi 60 s, neobjavljen; število kvizov +1. | Uspešen |
| TC-02-03 | Osnutek ustvarjen; v bazi opis, druga kategorija, 900 s, vprašanja s točkami 1/5/10 v vnesenem vrstnem redu, pravilni odgovori A1, C2, D3; urejevalnik prikaže vse vnesene vrednosti. | Uspešen |
| TC-02-04 | Ob praznem naslovu in naslovu iz presledkov »Save draft« onemogočen; nobene zahteve; kviza ni v bazi. | Uspešen |
| TC-02-05 | Pri `0`, `-1` in praznem »Save draft« onemogočen; pri `1` kviz ustvarjen s 60 s. | Uspešen |
| TC-02-06 | Pri enem vprašanju »Remove« onemogočen; po dodajanju drugega omogočen; po odstranitvi ostane eno vprašanje, »Remove« spet onemogočen; brez zahteve in kviza. | Uspešen (po popravku specifikacije, INC-02-01) |
| TC-02-07 | (a), (b), (e) »Save draft« onemogočen; (c) trije onemogočeni »Remove«; (d) po dodajanju, izbiri in odstranitvi tretjega odgovora ostaneta dva odgovora z enim pravilnim. | Uspešen (po popravku specifikacije, INC-02-02) |
| TC-02-08 | Iskanje na `/quizzes` ne najde `FT Minimal Quiz`; na `/admin` je kviz z značko »Draft«. | Uspešen |
| TC-02-09 | Prikazano »Simulated failure«; uporabnik ostane na `/admin/quizzes/new`; vrednosti ohranjene; gumb omogočen; kviza ni v bazi. | Uspešen |
| TC-02-10 | (a) preusmeritev na `/login`; (b) odziv 401; kviza ni v bazi. | Uspešen |
| TC-02-11 | Po kliku Cancel preusmeritev na `/admin/quizzes`; število kvizov nespremenjeno. | Uspešen |

## 9. Dnevnik izvajanja testov [8.10]

| ID | Datum/čas | Opis | Vpliv |
| :--- | :--- | :--- | :--- |
| LOG-02-01 | 27. 10. 2026 (ura ni zabeležena) | Tek 1: TC-02-06 prekoračil čas (30 s) pri kliku na onemogočen »Remove«; TC-02-07 neuspešen (pričakovana 2 onemogočena »Remove«, dejansko 3). Ostali uspešni. | Odprta INC-02-01 in INC-02-02. |
| LOG-02-02 | 27. 10. 2026 (ura ni zabeležena) | Tek 2: po popravku specifikacije TC-02-06 in TC-02-07 uspešna; vsi primeri TP-02 uspešni. | Incidenta zaprta. |
| LOG-02-03 | 27. 10. 2026, 11:49:37–11:50:03 | Končni tek, TP-02: TC-02-10, 01, 04, 05, 06, 07, 09, 11, 02, 03, 08 izvedeni po vrstnem redu, vsi uspešni. | – |

## 10. Poročilo o incidentu [8.11]

| Polje | INC-02-01 | INC-02-02 |
| :--- | :--- | :--- |
| Časovni podatki | 27. 10. 2026, tek 1 | 27. 10. 2026, tek 1 |
| Poročevalec | Patrik, avtor testov | Patrik, avtor testov |
| Kontekst | Quizio `eb87c8f`, lokalni docker compose; TP-02, TC-02-06; funkcionalno testiranje | Quizio `eb87c8f`, lokalni docker compose; TP-02, TC-02-07 (c); funkcionalno testiranje |
| Opis incidenta | Specifikacija je zahtevala odstranitev edinega vprašanja, gumb »Remove« pa je pri enem vprašanju onemogočen. Ponovljivo. Stanje brez vprašanj v vmesniku ni dosegljivo. Vzrok: napačna predpostavka v specifikaciji. | Pričakovana sta bila 2 onemogočena »Remove«, dejansko so 3, ker je onemogočen tudi »Remove« edinega vprašanja. Ponovljivo. Vzrok: napačno pričakovanje v specifikaciji. |
| Resnost | Nizka | Nizka |
| Prioriteta | Nizka | Nizka |
| Tveganje | Brez novega tveganja za izdelek. | Brez novega tveganja za izdelek. |
| Status | Zaprt: CI-02-06 in TC-02-06 popravljena (različica 1.1); ponovni test uspešen. | Zaprt: pričakovani rezultat TC-02-07 (c) popravljen; ponovni test uspešen. |
