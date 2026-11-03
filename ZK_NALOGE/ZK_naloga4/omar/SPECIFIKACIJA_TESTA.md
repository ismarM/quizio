# Specifikacija sistemskega testa OMR-ST-01 – vzdržljivost (soak)

| Polje | Vrednost |
|---|---|
| ID | OMR-ST-01 |
| Izvajalec | Omar Ždralović |
| Tip | Vzdržljivostni test (soak/endurance) |
| Orodje | Autocannon, samostojni Node.js merilni program |
| Prioriteta | Srednje visoka |
| Status | Izvedeno 3. 11. 2026; končni tek PASS |
| Testni objekt | Lokalni Quizio, `GET /api/proxy/categories` |
| Standard dokumentacije | Smiselna uporaba strukturiranega testnega načrta; ne trdi popolne skladnosti z ISO/IEC/IEEE 29119-3:2021 |

## 1. Cilj in vprašanje

Ugotoviti, ali sistem ob **enakomerni obremenitvi v šestminutnem merilnem oknu** ohrani sprejemljive odzivne čase, funkcionalno pravilnost in stabilno porabo virov. Posebej primerjamo začetno in zadnjo tretjino testa. Gre za kratki laboratorijski **soak**, ne za 24-urni preizkus ali dokaz odsotnosti memory leaka.

**Hipoteza:** po predhodno določenih merilih sistem ne kaže pomembnega slabšanja med prvo in zadnjo tretjino obremenitve.

## 2. Sledljivost

- `docs/features.md`: NFR-07 (stateless / skalabilnost), NFR-08 (stabilno obnašanje pod obremenitvijo; naša meritev je le delna).
- `docs/ARCHITECTURE.md`: arhitektura BFF → Go → PostgreSQL in Firebase preverjanje seje.
- `backend/internal/httpapi/quizzes/list_categories.go`: prebiranje kategorij.
- `ZK_NALOGE/ZK_naloga4/patrik/load_test_spec.md`, `../ismar/POROCILO.md`: razmejitev s prejšnjima scenarijema.

## 3. Scenarij in obseg

Navidezni generator pošilja avtorizirane `GET http://localhost:3000/api/proxy/categories` z vnaprej pridobljenim testnim sejnih piškotkom. Pričakovan je **HTTP 200**, veljaven JSON, polje `categories` je neprazno, vsak element pa ima celoštevilski ID in neprazno ime. Endpoint mora biti preverjen glede dejanske sheme ob trenutnem HEAD repozitorija.

Zahteve vstopijo prek Next.js BFF, ki preveri sejo in podpise ter posreduje Go API-ju. Test **ne** izvaja prijav med obremenitvijo, ne meri Firebasove registracije, ne izvaja JavaScript izrisa in ne spreminja podatkov.

## 4. Predpogoji

1. Lokalni Docker Compose Quizio je namenjen samo testiranju; Next.js, Go in PostgreSQL so zagnani, migracije so izvedene. **Ne uporabljaj skupne ali produkcijske baze.**
2. Obstaja veljaven testni Firebase račun s pravilno sejo in v bazi vsaj ena kategorija.
3. `http://localhost:3000` je dosegljiv; preflight preveri 200 in vsebino.
4. Na računalniku sta Node.js in Docker; odvisnost Autocannon je nameščena lokalno v Omarjevi mapi.
5. Ni sočasnega izvajanja skupinskih testov ali dodatnega bremena; navedemo CPU/RAM/OS, git commit in različico orodja.
6. Sejni piškotek preberemo prek **okoljske spremenljivke** `QUIZIO_SESSION`, ne iz kode ali datotek v repozitoriju.

## 5. Profil obremenitve (vnaprej določen)

| Faza | Trajanje | Sočasne povezave | Skupna ciljna hitrost | Namen |
|---|---:|---:|---:|---|
| Preflight | 1 zahteva | – | – | veljavnost okolja |
| Ogrevanje | 15 s | 5 | 10 zahtev/s | izločitev začetnega zagona |
| A (zgodnja) | 120 s | 5 | 10 zahtev/s | začetna referenca |
| B (srednja) | 120 s | 5 | 10 zahtev/s | sredina testa |
| C (pozna) | 120 s | 5 | 10 zahtev/s | odkrivanje poslabšanja |
| Po-testna kontrola | 1 zahteva | – | – | dostopnost po obremenitvi |

Omejitev je **hitrost zahtev**, ne 10 uporabnikov in ne 10 dejanskih različnih računov. Vsi zahtevki uporabljajo **eno testno sejo**. Pri uporabljeni različici Autocannon 8.0.0 `overallRate=10` pomeni skupno ciljno hitrost vseh povezav; `connectionRate` ni nastavljen, zato ga ne preglasi. Uporabljeni so `connections=5`, `pipelining=1` in brez workerjev. Faze A, B, C merimo ločeno, brez namernega premora. Če orodje ne dosega ciljne hitrosti, se to zabeleži kot odstopanje in **ne** prikazuje kot doseženo obremenitev.

**Varnostne meje:** samo `localhost:3000`, nikoli javni Azure URL ali druga zunanja domena; ena predpisana stopnja 10 zahtev/s; brez agresivnega avtomatskega povečevanja, brez napadov in brez destruktivnih dejanj. Prekinitev, če je okolje nestabilno ali obstaja nevarnost izgube podatkov.

## 6. Metrike in zajem

- Za vsako fazo A/B/C: `requests.total`, doseženi req/s, avg/median/p95/p99 latence (ms), timeout/connection errors, porazdelitev statusnih kod, število/približek validiranih odzivov.
- Začetna in končna meritev zdravja (status/JSON).
- `docker stats --no-stream` vsakih **15 s** za tri kontejnerje (CPU %, poraba pomnilnika). Zabeleži čas in imena kontejnerjev; podatkov ne ponarejaj.
- Po potrebi `docker compose logs` za diagnozo; ne shrani žetonov ali občutljivih podatkov.

Pri rezultatih Autocannon razlikuj HTTP 4xx/5xx od omrežnih napak: omrežne napake niso edini pogoj neuspeha. Če uporabljena različica ne vrne pričakovanih polj, uporabi `response` dogodke ali pojasni omejitev; **ne izmišljaj** manjkajočih metrik.

## 7. Vnaprej določeni kriteriji uspešnosti

| Kriterij | Prag | Ocena |
|---|---|---|
| Veljavnost preflight in končne kontrole | Obe HTTP 200 + veljavna vsebina | Sicer BLOCKED/FAIL glede na vzrok |
| Napake v vsaki fazi | Skupno HTTP !=200 + omrežne napake + timeouti **< 1 %** zahtev | FAIL, če ni dosežen |
| p95 latence v vsaki fazi | **< 1500 ms** | FAIL, če ni dosežen |
| Dejansko dosežena hitrost v vsaki fazi | **≥ 9 zahtev/s** | FAIL/INCONCLUSIVE pri omejitvi generatorja, ki je jasno opisana |
| Sprememba pozne faze C glede na zgodnjo A | **p95(C) ≤ 1,5 × p95(A)** | FAIL, če je prekoračeno |
| Izguba dostopnosti | Brez popolnega izpada in brez neveljavnega JSON v kontrolnih vzorcih | FAIL |

**Sekundarna diagnostična metrika (ni avtomatični PASS/FAIL):** rast pomnilnika backend/next med A in C. Če je končna poraba občutno višja od začetne (npr. >25 %) brez vrnitve, označi opozorilo, ne pa dokazan memory leak; potrebne so daljše ponovitve, GC in več vzorcev. Za statistike po fazah izpiši število podatkov in omejitve meritev. Pragovi so **študijski, ne produkcijski SLA** in se po meritvah ne spreminjajo za dosego PASS.

**Skupni PASS:** vsi obvezni pogoji v vseh treh fazah in kontrolah. **FAIL:** vsaj en obvezen pogoj ni dosežen ob veljavni izvedbi. **BLOCKED:** ni mogoče veljavno izvesti meritev (npr. manjkajoča seja ali nedosegljivo okolje). **INCONCLUSIVE:** meritev je nepopolna/nezanesljiva; razlog mora biti zapisan.

## 8. Omejitve in tveganja

- Šest minut je kratek vzdržljivostni test; ne potrjuje dolgoročne stabilnosti.
- Ena seja ni ekvivalent velikemu številu različnih uporabnikov.
- Zunanji Firebase in skupni lokalni CPU lahko vplivata na rezultat.
- Autocannon je proces Node.js, tudi generator porablja CPU; beleži in interpretiraj vpliv.
- Ločene faze lahko povzročijo kratke prehode med merjenjem; izmeri dejanske prehode in jih navedi.
- Ne zamenjuj izračunane stopnje zahtev s številom hkratnih uporabnikov.
