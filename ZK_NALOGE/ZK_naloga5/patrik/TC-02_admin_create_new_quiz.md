# Funkcionalni test: Admin – ustvarjanje novega kviza

## 1. Informacije o dokumentu

| Element | Vsebina |
| :--- | :--- |
| Enolični identifikator | QUIZIO-FT-02, različica 1.2 |
| Izdajatelj | Ekipa Quizio |
| Odobritveni organ | Ekipa Quizio |
| Status | Izvedeno |

| Različica | Datum | Sprememba | Avtor |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-27 | Prva različica | Patrik |
| 1.1 | 2026-10-27 | CI-02-06, TC-02-06 in TC-02-07 (c) usklajeni z delovanjem aplikacije; vpisani rezultati izvedbe | Patrik |
| 1.2 | 2026-11-09 | Odstranjena specifikacija testnega modela in dnevnik izvajanja; združene zahteve za postopek, podatke in okolje; koraki testnih primerov razširjeni do ravni implementacije | Patrik |

**Uvod:** Funkcionalni testi za zahtevo »Create a new quiz with a title, description, and total time limit« (`docs/features.md` §1.1). Obrazec zahteva vsaj eno vprašanje, zato so vprašanja vključena.

**Obseg:** Obrazec za ustvarjanje kviza (`/admin/quizzes/new`), njegova validacija, shranjevanje osnutka in dostop brez prijave. Ni zajeto: vprašanja s slikami, nalaganje slik, generiranje vprašanj z umetno inteligenco, urejanje, objava ter blokiranje uporabnikov brez admin pravic (obstaja le admin račun).

**Testna strategija:** Razredi ekvivalence, analiza mejnih vrednosti (časovna omejitev 0, −1, prazno, 1) in odločitvena tabela pravil obrazca. Gumb »Save draft« je omogočen samo, če veljajo vsa pravila, zato se neveljaven vnos preverja z onemogočenim gumbom in odsotnostjo zahteve. Avtomatizirano s Playwright. Zaključni kriterij: vsak pokrivni element je pokrit z uspešnim testnim primerom.

**Reference:** `docs/features.md`, `next/src/components/admin/AdminQuizForm.tsx`, `testing/functional_testing/seed/seed.sql`, `testing/functional_testing/tests/02-admin-create-quiz.spec.ts`, `testing/functional_testing/support/quiz-form.ts`, ISO/IEC/IEEE 29119-3:2021.

**Slovar:** CI – testni pokrivni element; TC – testni primer; TP – testni postopek; osnutek (draft) – neobjavljen kviz (`publish_date IS NULL`); kartica vprašanja – element `<article>` v obrazcu, ki vsebuje eno vprašanje z odgovori.

## 2. Specifikacija testnih primerov

### 2.1 Testni pokrivni elementi

| ID | Opis | Prioriteta | Sledljivost |
| :--- | :--- | :--- | :--- |
| CI-02-01 | Obrazec se odpre v praznem stanju osnutka | Srednja | `features.md` §1.1 |
| CI-02-02 | Minimalen veljaven kviz je ustvarjen | Visoka | `features.md` §1.1 |
| CI-02-03 | Poln veljaven kviz je ustvarjen s točnimi vrednostmi | Visoka | `features.md` §1.1 |
| CI-02-04 | Prazen naslov onemogoči oddajo | Visoka | `features.md` §1.1 |
| CI-02-05 | Meje časovne omejitve (0, −1, prazno, 1) | Visoka | `features.md` §1.1 |
| CI-02-06 | Zadnjega vprašanja ni mogoče odstraniti (kviz ima vedno vsaj eno vprašanje) | Visoka | `features.md` §1.1 |
| CI-02-07 | Pravila za vprašanja so uveljavljena | Visoka | `features.md` §1.1 |
| CI-02-08 | Nov kviz je osnutek in ni na javnem seznamu | Visoka | `features.md` §1.1 |
| CI-02-09 | Napaka strežnika ohrani vneseno | Srednja | `features.md` §1.1 |
| CI-02-10 | Dostop brez prijave je blokiran | Visoka | `features.md` §1.1 |
| CI-02-11 | Preklic ne ustvari ničesar | Nizka | `features.md` §1.1 |

### 2.2 Elementi strani

Oznake polj v obrazcu niso povezane z vnosnimi polji (`<label for>`), zato se polja iščejo po besedilu označbe mesta (`placeholder`), vlogi ali strukturi. Iskalniki, označeni z »v kartici«, se iščejo znotraj kartice vprašanja z indeksom *i* (0 = prvo vprašanje).

| Ime | Iskalnik |
| :--- | :--- |
| Naslov strani | element z vlogo `heading` in imenom »Create quiz« |
| Značka osnutka | besedilo »Draft« (natančno ujemanje) |
| Naslov kviza | `<input>` s `placeholder="Example: Science Fundamentals"` |
| Opis | `<textarea>` s `placeholder="Shortly explain what this quiz is about…"` |
| Kategorija | prvi `<select>` na strani |
| Časovna omejitev (minute) | `<input>` s `placeholder="15"` (natančno ujemanje) |
| Kartice vprašanj | vsi elementi `form article`; kartica *i* = `form article` z indeksom *i* |
| Besedilo vprašanja | v kartici: `placeholder="Example: Which planet is known as the Red Planet?"` |
| Točke | v kartici: `input[type="number"]` |
| Odgovori | v kartici: polja s `placeholder`, ki ustreza `/^Answer \d+ text or image URL$/` (npr. »Answer 1 text or image URL«) |
| Pravilen odgovor | v kartici: elementi z vlogo `radio` (en na odgovor, v istem vrstnem redu) |
| Gumbi Remove | v kartici: gumbi z vlogo `button` in imenom »Remove«. Prvi (indeks 0) odstrani vprašanje, naslednji (indeks 1, 2, …) odstranijo odgovore 1, 2, … |
| Add answer | v kartici: gumb »Add answer« |
| Add question | prvi gumb »Add question« na strani (orodna vrstica nad vprašanji) |
| Save draft | gumb z vlogo `button` in imenom »Save draft« |
| Cancel | povezava z vlogo `link` in imenom »Cancel« |
| Vrstica kviza na admin seznamu | `article[role="link"]`, ki vsebuje naslov kviza |
| Zahteva za ustvarjanje | `POST /api/proxy/quizzes` |

**Pomožni postopki:**

- **Odpri obrazec:** odpri `/admin/quizzes/new` in počakaj, da je viden naslov strani »Create quiz«.
- **Izpolni vprašanje *i*** (besedilo, točke, odgovori, indeks pravilnega): vpiši besedilo vprašanja in točke; dokler je odgovorov manj kot zahtevanih, klikni »Add answer« v kartici; vpiši odgovore po vrsti; označi radio z indeksom pravilnega odgovora.
- **Minimalen veljaven vnos:** naslov *N*; časovna omejitev `1`; vprašanje 0: besedilo `2+2?`, točke `1`, odgovora `3` in `4` (obrazec ima privzeto dva odgovora), pravilen je drugi (`4`).
- **Shrani in počakaj:** začni čakati na odziv `POST /api/proxy/quizzes`, nato klikni »Save draft«; vrni odziv.
- **Beleži zahteve:** pred odprtjem obrazca poslušaj dogodek `request` strani in shrani vsako zahtevo `POST /api/proxy/quizzes` v seznam (za preverjanje, da zahteva ni bila poslana).
- **Kvizi v bazi z naslovom *N*:** `SELECT id_quiz, title, description, tk_category, EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds, publish_date IS NOT NULL AS published FROM quizio."Quiz" WHERE title = N`.
- **Število kvizov:** `SELECT COUNT(*) FROM quizio."Quiz"`.
- **Vprašanja kviza:** vprašanja iz `quizio."Question"` (urejena po `id_question`) z odgovori iz `quizio."Answer"` (urejeni po `id_answer`) in zastavico `is_correct`.

### 2.3 Testni primeri

**P0 (skupni predpogoj):** seed je izveden; brskalnik ima shranjeno sejo uporabnika `functional_tests@nipravimail.com` (admin); privzete kategorije obstajajo. Vsi kvizi, ki jih ustvarijo testi, imajo naslov s predpono `FT `, da jih naslednji seed odstrani.

#### TC-02-01 Odprtje obrazca

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Obrazec se odpre s privzetimi vrednostmi osnutka / Srednja / CI-02-01 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri obrazec. | Viden naslov »Create quiz« in značka »Draft«. |
| 2 | Preberi naslov kviza, opis in časovno omejitev. | `""`, `""`, `"15"`. |
| 3 | Preberi vrednost prve možnosti (`option`) v izbirniku kategorije in trenutno vrednost izbirnika. | Vrednosti sta enaki (izbrana je prva kategorija). |
| 4 | Preštej kartice vprašanj; preberi besedilo vprašanja 0. | 1 kartica; besedilo `""`. |
| 5 | Preveri gumb »Save draft«. | Viden in onemogočen. |

#### TC-02-02 Ustvarjanje minimalnega kviza

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Najmanjši veljaven kviz se shrani kot osnutek / Visoka / CI-02-02 |
| Predpogoji | P0; teče po neodvisnih primerih (zaporedje TC-02-02 → 03 → 08) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Zabeleži število kvizov v bazi (*n*). | – |
| 2 | Odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT Minimal Quiz`. | »Save draft« je omogočen. |
| 3 | Shrani in počakaj. | Odziv ima status 2xx. |
| 4 | Preveri URL. | Pot se konča z `/admin`. |
| 5 | Poišči vrstico kviza `FT Minimal Quiz` na admin seznamu. | Vrstica je vidna in vsebuje »Draft«. |
| 6 | Preberi kvize v bazi z naslovom `FT Minimal Quiz` in število kvizov. | Natanko en kviz; `time_limit_seconds = 60`; `published = false`; število kvizov je *n* + 1. |

#### TC-02-03 Ustvarjanje polnega kviza

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Vse vnesene vrednosti se shranijo točno in v vnesenem vrstnem redu / Visoka / CI-02-03 |
| Predpogoji | P0; TC-02-02 izveden |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri obrazec. | – |
| 2 | Vpiši naslov `FT Full Quiz <Date.now()>` in opis `Created by functional test`. | – |
| 3 | V izbirniku kategorije izberi možnost z indeksom 1 (druga kategorija); zabeleži njeno vrednost (ID kategorije). | – |
| 4 | Vpiši časovno omejitev `15`. | – |
| 5 | Izpolni vprašanje 0: `Question one?`, točke `1`, odgovori `A1`, `B1`, `C1`, `D1`, pravilen indeks 0. | Kartica ima 4 odgovore. |
| 6 | Klikni »Add question«; izpolni vprašanje 1: `Question two?`, točke `5`, odgovori `A2`–`D2`, pravilen indeks 2. | 2 kartici. |
| 7 | Klikni »Add question«; izpolni vprašanje 2: `Question three?`, točke `10`, odgovori `A3`–`D3`, pravilen indeks 3. | 3 kartice. |
| 8 | Shrani in počakaj. | Odziv 2xx; pot se konča z `/admin`. |
| 9 | Preberi kviz iz baze po naslovu. | `description` = vnesen opis; `tk_category` = zabeležen ID; `time_limit_seconds = 900`; `published = false`. |
| 10 | Preberi vprašanja kviza iz baze. | Natanko 3 vprašanja v vnesenem vrstnem redu z besedili, točkami 1/5/10, odgovori v vnesenem vrstnem redu in pravilnimi `A1`, `C2`, `D3`. |
| 11 | Odpri `/admin/quizzes/<id>`; preberi vrednosti vseh `input` in `textarea`. | Vidna značka »Draft«; vrednosti vsebujejo naslov, opis, `15`, vsa tri besedila vprašanj in vseh 12 odgovorov. |

#### TC-02-04 Naslov je obvezen

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Prazen naslov ali naslov iz presledkov onemogoči oddajo / Visoka / CI-02-04 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Začni beležiti zahteve; odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT Title Required Quiz`. | »Save draft« omogočen. |
| 2 | Izprazni naslov kviza (`fill("")`). | »Save draft« onemogočen. |
| 3 | V naslov vpiši tri presledke (`"   "`). | »Save draft« onemogočen. |
| 4 | Preveri seznam beleženih zahtev in bazo. | Seznam je prazen; v bazi ni kviza `FT Title Required Quiz`. |

#### TC-02-05 Meje časovne omejitve

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Časovna omejitev mora biti vsaj 1 minuta / Visoka / CI-02-05 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT Time Limit Quiz`. | – |
| 2 | Za vsako vrednost `0`, `-1`, `""` (prazno): vpiši jo v časovno omejitev. | Po vsaki vrednosti je »Save draft« onemogočen. |
| 3 | Preberi kvize v bazi z naslovom `FT Time Limit Quiz`. | Ni nobenega. |
| 4 | V časovno omejitev vpiši `1`. | »Save draft« omogočen. |
| 5 | Shrani in počakaj. | Odziv 2xx. |
| 6 | Preberi kviz iz baze. | `time_limit_seconds = 60`. |

#### TC-02-06 Zadnjega vprašanja ni mogoče odstraniti

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Kviz ima v obrazcu vedno vsaj eno vprašanje / Visoka / CI-02-06 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Začni beležiti zahteve; odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT No Questions Quiz`. | – |
| 2 | Poišči prvi gumb »Remove« v kartici 0 (odstrani vprašanje). | Gumb je onemogočen. |
| 3 | Klikni »Add question«. | 2 kartici; prvi »Remove« v kartici 0 je omogočen. |
| 4 | Klikni prvi »Remove« v kartici 0. | Ostane 1 kartica; prvi »Remove« v kartici 0 je spet onemogočen. |
| 5 | Preveri seznam beleženih zahtev in bazo. | Seznam je prazen; v bazi ni kviza `FT No Questions Quiz`. |

#### TC-02-07 Pravila za vprašanja

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Neveljavna vprašanja in odgovori onemogočijo oddajo ali niso dosegljivi / Visoka / CI-02-07 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT Question Rules Quiz`. | »Save draft« omogočen. |
| 2 | (a) Izprazni besedilo vprašanja 0; nato vpiši `2+2?`. | Prazno: »Save draft« onemogočen; po vpisu omogočen. |
| 3 | (b) V točke vprašanja 0 vpiši `0`; nato `1`. | Pri `0` onemogočen; pri `1` omogočen. |
| 4 | (c) V kartici 0 preštej onemogočene gumbe (`button:disabled`) z besedilom »Remove«. | Natanko 3: »Remove« edinega vprašanja in oba »Remove« odgovorov (pri dveh odgovorih odgovora ni mogoče odstraniti). |
| 5 | (d) V kartici 0 preštej označene radie (`input[type="radio"]:checked`). | Natanko 1. |
| 6 | V kartici 0 klikni »Add answer«; v tretji odgovor (indeks 2) vpiši `5`; označi radio z indeksom 2; klikni gumb »Remove« z indeksom 3 v kartici (odstrani tretji odgovor). | Kartica ima 2 odgovora; označen je natanko 1 radio; »Save draft« omogočen. |
| 7 | (e) Izprazni drugi odgovor (indeks 1). | »Save draft« onemogočen. |

#### TC-02-08 Osnutek ni javen

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Neobjavljen kviz ni na javnem seznamu, je pa na admin seznamu / Visoka / CI-02-08 |
| Predpogoji | TC-02-02 izveden (obstaja `FT Minimal Quiz`) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Odpri `/quizzes?query=FT%20Minimal%20Quiz` in počakaj na stanje `networkidle` (vse zahteve končane). | – |
| 2 | Preštej elemente z besedilom `FT Minimal Quiz`. | 0. |
| 3 | Odpri `/admin`; poišči vrstico kviza `FT Minimal Quiz`. | Vrstica vsebuje »Draft«. |

#### TC-02-09 Napaka strežnika

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Ob napaki strežnika vnos ostane in kviz ni ustvarjen / Srednja / CI-02-09 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Pred odprtjem obrazca prestrezi zahteve na pot `/api/proxy/quizzes` (`page.route`): zahtevo `POST` odgovori sam s statusom `500`, `Content-Type: application/json` in telesom `{"error":"Simulated failure"}`; ostale metode spusti naprej. | Prestrezanje je aktivno. |
| 2 | Odpri obrazec; izpolni minimalen veljaven vnos z naslovom `FT Server Error Quiz`. | – |
| 3 | Klikni »Save draft«. | Vidno besedilo »Simulated failure«. |
| 4 | Preveri URL in vrednosti. | Pot vsebuje `/admin/quizzes/new`; naslov je `FT Server Error Quiz`; besedilo vprašanja 0 je `2+2?`; »Save draft« omogočen. |
| 5 | Preberi kvize v bazi z naslovom `FT Server Error Quiz`. | Ni nobenega. |

#### TC-02-10 Dostop brez prijave

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Neprijavljen uporabnik ne more odpreti obrazca ali ustvariti kviza / Visoka / CI-02-10 |
| Predpogoji | Kontekst brskalnika brez seje (`storageState = { cookies: [], origins: [] }`) |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | (a) Odpri `/admin/quizzes/new`. | URL vsebuje `/login`. |
| 2 | (b) Brez seje pošlji `POST /api/proxy/quizzes` s telesom `{"title":"FT Anonymous Quiz","time_limit":60,"questions":[]}` (Playwright `request.post`). | Status odziva je 401 ali 403. |
| 3 | Preberi kvize v bazi z naslovom `FT Anonymous Quiz`. | Ni nobenega. |

#### TC-02-11 Preklic

| Element | Vsebina |
| :--- | :--- |
| Cilj / prioriteta / sledljivost | Preklic zapusti obrazec brez ustvarjanja kviza / Nizka / CI-02-11 |
| Predpogoji | P0 |

| # | Korak | Pričakovani rezultat |
| :--- | :--- | :--- |
| 1 | Zabeleži število kvizov v bazi (*n*). | – |
| 2 | Odpri obrazec; vpiši naslov `FT Cancelled Quiz` in besedilo vprašanja 0 `Will be discarded`. | – |
| 3 | Klikni povezavo »Cancel«. | Pot se konča z `/admin/quizzes`. |
| 4 | Preberi bazo. | Ni kviza `FT Cancelled Quiz`; število kvizov je *n*. |

## 3. Testni postopek, testni podatki in testno okolje

**Testni postopek TP-02** (prioriteta visoka; izvede TC-02-01 do TC-02-11; datoteka `tests/02-admin-create-quiz.spec.ts`, pomožni razred `support/quiz-form.ts`).

| Faza | Opis |
| :--- | :--- |
| Zagon sistema | V korenu projekta `docker compose up` (PostgreSQL 16, Go API, Next.js na `localhost:3000`); migracije izvedene. |
| Priprava (enkrat za vse postopke) | Izprazni bazo, izvedi seed, prijavi se in shrani sejo (postopek »Prijava« v QUIZIO-FT-01, razdelek 3). |
| Priprava postopka | Pred TP-02 ponovno izvedi seed (odstrani kvize s predpono `FT ` iz prejšnjih tekov). |
| Vrstni red | TC-02-10 (brez seje); neodvisni TC-02-01, 04, 05, 06, 07, 09, 11; nato zaporedno TC-02-02 → 03 → 08 (08 potrebuje kviz iz 02; ob neuspehu se naslednji preskočijo). |
| Odnos do drugih postopkov | Deli admin seznam kvizov in bazo; teče po TP-01 in pred TP-03, nikoli vzporedno (en delavec). |
| Zaključek | Seed naslednjega postopka odstrani kvize s predpono `FT `; po vseh postopkih se baza izprazni (teče tudi ob neuspehu); shrani poročilo Playwright. |

**Testni podatki in okolje**

| ID | Vrsta | Opis | Ponastavitev |
| :--- | :--- | :--- | :--- |
| TD-02-01 | Podatki | Uporabnik `functional_tests@nipravimail.com` z `is_admin = true` v PostgreSQL (seed) in Firebase | Seed |
| TD-02-02 | Podatki | Privzete kategorije (migracija `000003`): General, Science, History, Geography, Pop Culture, Sports | Ne (izpraznitev jih ohrani) |
| TD-02-03 | Podatki | Naslovi kvizov s predpono `FT ` (TC-02-03 s časovnim žigom) | Seed odstrani |
| TD-02-04 | Podatki | Geslo v `TEST_PASSWORD` (`testing/.env`, ni v repozitoriju) | Ne |
| TE-02-01 | Okolje | Next.js (`BASE_URL`), Go API, PostgreSQL (`DATABASE_URL`) za preverjanje zapisov | – |
| TE-02-02 | Okolje | Projekt Firebase s testnim uporabnikom | – |
| TE-02-03 | Okolje | Playwright, Chromium (headless), 1280×720, en delavec; prestrezanje zahtev s `page.route` (TC-02-09) | – |

## 4. Dejanski rezultati in rezultat testa

Končni tek: 27. 10. 2026, 11:49:10–11:50:09 (vsi postopki, 23 testov, vsi uspešni).

| Testni primer | Dejanski rezultati | Rezultat testa |
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

## 5. Poročilo o incidentu

| Polje | INC-02-01 | INC-02-02 |
| :--- | :--- | :--- |
| Časovni podatki | 27. 10. 2026, tek 1 | 27. 10. 2026, tek 1 |
| Poročevalec | Patrik, avtor testov | Patrik, avtor testov |
| Kontekst | Quizio `eb87c8f`, lokalni docker compose; TP-02, TC-02-06 | Quizio `eb87c8f`, lokalni docker compose; TP-02, TC-02-07 (c) |
| Opis incidenta | Specifikacija je zahtevala odstranitev edinega vprašanja, gumb »Remove« pa je pri enem vprašanju onemogočen (test je prekoračil čas 30 s pri kliku). Ponovljivo. Stanje brez vprašanj v vmesniku ni dosegljivo. Vzrok: napačna predpostavka v specifikaciji. | Pričakovana sta bila 2 onemogočena »Remove«, dejansko so 3, ker je onemogočen tudi »Remove« edinega vprašanja. Ponovljivo. Vzrok: napačno pričakovanje v specifikaciji. |
| Resnost / prioriteta | Nizka / nizka | Nizka / nizka |
| Tveganje | Brez novega tveganja za izdelek. | Brez novega tveganja za izdelek. |
| Status | Zaprt: CI-02-06 in TC-02-06 popravljena (različica 1.1); ponovni test uspešen. | Zaprt: pričakovani rezultat TC-02-07 (c) popravljen; ponovni test uspešen. |
