# Specifikacija obremenitvenega testa – seznam kvizov (`/quizzes`)

Orodje: **k6** · Skripta: `system_testing/load/quiz-listing.js` · Podatki: `system_testing/seed/seed.sql`

## 1. Scenarij testa

Test simulira večje število prijavljenih uporabnikov, ki hkrati odpirajo stran s seznamom objavljenih kvizov (`GET /quizzes`). To je najpogostejša vstopna točka v aplikacijo, ob tem pa stran združuje vse plasti sistema:

1. brskalnik (virtualni uporabnik) pošlje zahtevo na Next.js (BFF) s piškotkom `session`,
2. BFF preveri piškotek pri Firebase (`verifySessionCookie`, vključno s preverjanjem preklica),
3. BFF pošlje dve HMAC-podpisani zahtevi na Go API (`/api/quizzes?limit=100&offset=0` in `/api/users/me/open-sessions`),
4. Go API izvede poizvedbi v PostgreSQL,
5. BFF vrne strežniško izrisan HTML.

**Priprava (`setup()`, izvede se enkrat):**

1. prijava testnega uporabnika `functional_tests@nipravimail.com` (navaden uporabnik, ne administrator) v Firebase prek REST API-ja (`accounts:signInWithPassword`), s čimer pridobimo `idToken`,
2. `POST /api/session` z `idToken`, s čimer BFF ustvari piškotek `session`,
3. piškotek se posreduje vsem virtualnim uporabnikom (VU). Vsi VU torej uporabljajo isto sejo, Firebase prijava pa se med obremenitvijo ne ponavlja.

**Obnašanje enega VU (ena iteracija):**

1. `GET /quizzes` s piškotkom `session` (brez sledenja preusmeritvam),
2. preverjanje odgovora (status 200, vsebina vsebuje naložene kvize),
3. premor 1 s (`sleep(1)`), ki posnema branje strani.

**Testni podatki:** seed ustvari 10 objavljenih kvizov (`LT Quiz 01` … `LT Quiz 10`, vsak s 3 vprašanji in 4 odgovori) ter uporabnika z vlogo navadnega uporabnika. Kvize v bazi ustvari ločen administratorski uporabnik `system_tests_owner@nipravimail.com`, ki nima Firebase računa.

## 2. Pogoji izvajanja

| Parameter | Vrednost |
| :--- | :--- |
| Vrsta testa | Obremenitveni test (load test) pri pričakovani obremenitvi |
| Okolje | Lokalni `docker compose` (PostgreSQL 16, Go API, Next.js) – ne produkcijsko okolje v Azure |
| Profil obremenitve | Naraščanje 0 → 50 VU v 30 s, konstantnih 50 VU 2 min, upadanje 50 → 0 VU v 15 s |
| Skupno trajanje | približno 2 min 45 s |
| Pričakovana prepustnost | ≈ 40–50 zahtev/s v stabilni fazi (50 VU, ~1 s premor + čas odziva) |
| Vrsta napada/izpada | Brez namernega izpada komponent; obremenitev je običajna (ne stresna) |
| Uporabniški račun | En račun `functional_tests@nipravimail.com`; geslo (`TEST_PASSWORD`) je v lokalni datoteki `system_testing/.env`, ki ni v repozitoriju |
| Spremenljivke okolja | `BASE_URL`, `FIREBASE_API_KEY`, `TEST_PASSWORD`, po želji `TEST_EMAIL` |
| Pred izvajanjem | `npm run test:load` najprej samodejno izvede `npm run seed`, ki izprazni vse podatkovne tabele (razen šifranta `Category`) in nato naloži testne podatke; Firebase račun mora obstajati |
| Zagon | `npm run test:load` (v mapi `system_testing`; spremenljivke se preberejo iz `.env`) |

Omejitev: ker vsi VU uporabljajo isto sejo in isti Firebase račun, test ne meri obremenitve zaradi prijav in ne odraža porazdelitve različnih uporabnikov. Preverjanje preklica seje (`checkRevoked`) lahko ob velikem številu zahtev povzroči klice proti Firebase, kar je lahko ozko grlo in je zato eden izmed ugotovitev testa.

## 3. Kaj test preverja

- **Zmogljivost** strani s seznamom kvizov pri 50 sočasnih prijavljenih uporabnikih (odzivni čas in prepustnost celotne verige: Next.js BFF → Firebase → Go API → PostgreSQL).
- **Zanesljivost**: pri konstantni obremenitvi ne smejo nastopati napake (5xx, časovne omejitve, zavrnjene povezave).
- **Pravilnost pod obremenitvijo**: seja ostane veljavna (ni preusmeritve na `/login`) in stran vrne naložene kvize.
- **Ozka grla**: ali omejitev povzroča Next.js, Firebase (preverjanje seje), Go API ali PostgreSQL (povezovalni bazen).
- **Stabilnost zaradi NFR-07 (skalabilnost, brez stanja)**: vsi VU uporabljajo isto sejo, kar potrjuje, da je stanje seje shranjeno zunaj procesa strežnika.

## 4. Merjene metrike

| Metrika (k6) | Opis |
| :--- | :--- |
| `http_req_duration` (avg, p(90), p(95), p(99), max) | Skupni odzivni čas zahteve |
| `http_req_waiting` | Čas do prvega bajta (TTFB), ki ga prispevata strežnik in zaledni sistem |
| `http_req_failed` | Delež neuspelih zahtev |
| `http_reqs` | Skupno število zahtev in prepustnost (zahtev/s) |
| `checks` | Delež uspešnih preverjanj (status 200, vsebina vsebuje kvize) |
| `vus`, `vus_max` | Število aktivnih virtualnih uporabnikov |
| `iteration_duration` | Trajanje ene iteracije (odziv + premor) |
| `data_received` | Količina prenesenih podatkov |
| Poraba virov (`docker stats`) | CPU in pomnilnik kontejnerjev `next`, `backend`, `postgres` med testom |

## 5. Kriteriji za uspešnost

Test je uspešen, če so izpolnjeni vsi spodnji pragovi (definirani kot `thresholds` v skripti, k6 ob neizpolnitvi vrne neničelno izhodno kodo):

| Kriterij | Prag |
| :--- | :--- |
| Odzivni čas | `http_req_duration` p(95) < 500 ms |
| Delež napak | `http_req_failed` < 1 % |
| Preverjanja | `checks` > 99 % |

Dodatni (ročno ocenjeni) kriteriji:

- brez zahtev, ki bi bile preusmerjene na `/login` (seja ostane veljavna ves čas testa),
- odzivni čas se v stabilni fazi ne povečuje stalno (ni znakov puščanja virov ali nasičenja),
- po koncu testa se sistem vrne v običajno stanje (odzivni čas ene zahteve primerljiv s časom pred testom),
- v dnevnikih Go API-ja in Next.js ni napak zaradi izčrpanega povezovalnega bazena ali omejitve Firebase.

Če kateri koli prag ni dosežen, se ugotovitev zabeleži kot ozko grlo (z navedbo komponente, ki ga povzroča), test pa se šteje za neuspešnega.

## 6. Rezultati izvedbe

Test je bil izveden 27. 10. 2026 ob 11:52 na lokalno zagnanem `docker compose` okolju (z `npm run test:load`, ki je pred testom izpraznil bazo in naložil testne podatke).

**Skupni rezultat: test NI USPEŠEN** – kriterija za napake in preverjanja sta izpolnjena, kriterij za odzivni čas pa ne.

| Kriterij | Prag | Rezultat | Izpolnjen |
| :--- | :--- | :--- | :---: |
| `http_req_duration` p(95) | < 500 ms | **961,26 ms** | ✗ |
| `http_req_failed` | < 1 % | 0,00 % (0 / 4048) | ✓ |
| `checks` | > 99 % | 100,00 % (8092 / 8092) | ✓ |

**Podrobne metrike:**

| Metrika | Vrednost |
| :--- | :--- |
| `http_req_duration` | avg 775,54 ms · min 252,89 ms · med 744,49 ms · p(90) 844,65 ms · p(95) 961,26 ms · max 4,62 s |
| `http_reqs` | 4048 zahtev (≈ 23,9 zahtev/s) |
| `iterations` | 4046 končanih, 0 prekinjenih |
| `iteration_duration` | avg 1,77 s · med 1,74 s · p(95) 1,96 s · max 5,63 s |
| `vus_max` | 50 |
| `data_received` / `data_sent` | 389 MB (2,3 MB/s, ≈ 96 KB na stran) / 4,2 MB |
| Trajanje | 2 min 49,5 s |

**Ugotovitve:**

- **Zanesljivost in pravilnost sta ustrezni:** vse zahteve so vrnile status 200, nobena ni bila preusmerjena na `/login` (seja je bila ves čas veljavna), vse strani so vsebovale naložene kvize. Sistem pri 50 sočasnih uporabnikih ni vrnil nobene napake.
- **Odzivni čas ne ustreza zahtevi:** že najhitrejša zahteva (≈ 253 ms) porabi polovico dovoljenega časa, pod obremenitvijo pa se mediana dvigne na ≈ 744 ms. Odzivni čas je bil v stabilni fazi enakomeren (p(90) 845 ms), kar kaže na nasičenje zmogljivosti in ne na postopno slabšanje (npr. puščanje virov). Posamezni odstopajoči odzivi (max 4,62 s) so redki.
- **Prepustnost je nižja od pričakovane:** namesto ocenjenih 40–50 zahtev/s je bilo doseženih ≈ 24 zahtev/s, ker je vsaka iteracija poleg 1 s premora trajala še ≈ 0,8 s odziva.
- **Možni vzroki (niso potrjeni):** preverjanje seje pri Firebase ob vsaki zahtevi (`verifySessionCookie` s `checkRevoked`), dve zaporedni zahtevi BFF → Go API na stran, strežniško izrisovanje strani v Next.js in dejstvo, da k6 in vse komponente tečejo na istem prenosniku (glej razdelek 7). Poraba virov kontejnerjev (`docker stats`) med testom ni bila zajeta, zato ozkega grla ni bilo mogoče natančno določiti.
- **Priporočila:** ponovitev testa z zajemom `docker stats`, merjenje odzivnega časa Go API-ja ločeno od BFF, preizkus brez `checkRevoked` ali s predpomnjenjem preverjene seje ter izvedba k6 na ločenem računalniku.

## 7. Strojna oprema in programsko okolje

Vse komponente (PostgreSQL, Go API, Next.js v Docker kontejnerjih) in generator obremenitve k6 so tekli **na istem računalniku**, zato si delijo procesor, pomnilnik in disk. Rezultati so zato pesimistična ocena in niso neposredno primerljivi s produkcijskim okoljem v Azure.

| Komponenta | Podrobnosti |
| :--- | :--- |
| Računalnik | HP Pavilion Gaming Laptop 15-cx0xxx (prenosnik) |
| Procesor | Intel Core i5-8300H, 4 jedra / 8 niti, 2,3 GHz (turbo do 4,0 GHz) |
| Pomnilnik | 7,6 GiB RAM (+ 7,6 GiB zram swap); ob merjenju ≈ 2 GiB prostega pri zagnanih kontejnerjih |
| Disk | NVMe SSD Samsung MZVLB256HAHQ, 256 GB |
| Operacijski sistem | Fedora Linux 44 Workstation, jedro 7.2.11-200.fc44.x86_64 |
| Docker | Docker Engine 29.9.2, Docker Compose v5.6.1 (brez omejitev virov na kontejnerjih) |
| Generator obremenitve | k6 v2.3.0 (go1.26.8, linux/amd64) |
| Node.js (seed skripta) | v22.23.1 |
| Omrežje | Zahteve na `localhost:3000`; preverjanje seje in prijava v `setup()` gresta prek interneta na Firebase |
