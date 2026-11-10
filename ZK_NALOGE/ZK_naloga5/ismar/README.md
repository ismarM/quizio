# Naloga 5 – Ismar: Playwright

Dejanske rezultate in dokazila imam v [kratkem poročilu](POROCILO.md).

## Kaj uporabljam

Avtomatiziram svoje scenarije [ISM-FT-01, ISM-FT-02 in ISM-FT-03 iz naloge 3](../../ZK_naloga3/ismar/README.md).
Uporabljam obstoječi paket `testing/functional_testing` in njegove knjižnice Playwright,
TypeScript in `pg`. Novih paketov, Docker konfiguracije ali CI workflowa ne dodajam.
Za izpolnjevanje obrazca ponovno uporabim obstoječi `support/quiz-form.ts`; njegovih datotek ne spreminjam.

Playwright izberem, ker lahko v istem testu uporabljam ločeni prijavi, zaprem in ponovno
odprem zavihek ter preverim UI in resnične odzive API-ja. Samodejno čakanje na elemente
mi pomaga pri stabilnosti. Dobim tudi HTML-poročilo, posnetek in sled ob neuspehu.

Moje datoteke so v `testing/functional_testing/ismar/`:

- `playwright.config.ts`: zaženem samo svoje tri teste, brez skupnega setupa in čiščenja.
- `scenarios.spec.ts`: preberem zaporedje korakov za vsak scenarij.
- `support.ts`: preverim okolje, se prijavim, pripravim kviz in počakam na shranjevanje.
- `.env.example`: vidim imena spremenljivk za namenski prijavi. Gesli vpišem samo v lokalni `.env`.

## Moje lokalno okolje

Uporabljam obstoječi vsebnik `quizio-postgres-1`, PostgreSQL 16 in izključno bazo
`quizio_ismar_e2e`. V `appdb` ne izvajam nobenih sprememb. Migracije sem izvedel šele
po preverjanju `current_database() = quizio_ismar_e2e`; dosežena je različica 4 brez
oznake dirty. Po migracijah je bilo v testni bazi 0 uporabnikov in 0 kvizov.

V tem worktreeju imam lokalni `backend/.env` in `next/.env.local`, oba Git-ignorirana
in dostopna samo mojemu uporabniku. Uporabil sem kopiji obstoječih nastavitev, pri čemer
sem backend usmeril na testno bazo in vrata 18081. Frontend zaženem na vratih 3001.
Konfiguracije glavnega checkouta nisem spreminjal.

Uporabljam razvojni Firebase `quizio-4d0c9`; njegovega projekta ne ustvarjam ponovno.
Pred ustvarjanjem računov potrdim uporabo teh dveh namenskih naslovov:

- `ismar.n5.admin@example.com`: administrator samo v testni bazi.
- `ismar.n5.user@example.com`: običajni uporabnik v testni bazi.

Računa pripravim prek Firebase Admin SDK z ločenima naključnima gesloma. Če naslov že
obstaja, se ustavim in obstoječega računa ne spreminjam. Gesli ostaneta samo v lokalnem
`testing/functional_testing/ismar/.env`, ki ga Git ignorira. V Firebase mora biti za
projekt omogočen ponudnik Email/Password. Z vklapljanjem ponudnika ne posegam v
nastavitve brez predhodnega dogovora.

Pred prvo prijavo pripravim pripadajoča zapisa v testni bazi, z vlogama true/false ter
jezikom 0 (angleščina) in temo 0. Nato se prijavim prek obrazca, da aplikacija sama
uskladi Firebase zahtevke in sejni piškotek. Vlog računov drugih članov ne spreminjam.
Priprava računov je enkratna; vsak naslednji zagon testov uporablja ti prijavi.

**Priprava računov, 10. 11. 2026:** po izrecni potrditvi sem prek Admin SDK ustvaril
oba namenska računa. Pred ustvarjanjem sem preveril, da naslova še ne obstajata.
Pripadajoča uporabnika sem vstavil samo v `quizio_ismar_e2e`, z administratorsko in
običajno vlogo. Gesli sta že pripravljeni v lokalnem `ismar/.env` z dovoljenji `600`.
V lokalnem urejevalniku lahko odprem to datoteko, če se želim prijaviti ročno;
gesel ne kopiram v poročilo, klepet ali Git. Obstoječih računov ekipe nisem spreminjal.

## Kako zaženem teste

Potrebujem Node.js 24, Go po `backend/go.mod`, Docker s PostgreSQL in dostop do
razvojnega Firebase. Go in Next.js zaženem iz tega worktreeja, ne iz glavnega checkouta.
V nadaljevanju ukaze izvajam v ločenih terminalih; poti so relativne na koren repozitorija.

Najprej zaženem samo obstoječi PostgreSQL:

```sh
docker start quizio-postgres-1
docker exec quizio-postgres-1 psql -X -U postgres -d quizio_ismar_e2e -c 'SELECT current_database();'
```

Izpis mora biti `quizio_ismar_e2e`. Migracije so za to lokalno okolje že izvedene in jih
ob vsakem testu ne ponavljam. Celotnega `docker compose up` ne uporabljam, ker bi lahko
zagnal druge storitve s konfiguracijo za `appdb`.

V drugem terminalu zaženem backend; pred zagonom preverim lokalni cilj:

```sh
cd backend
rg '^(DB_HOST|DB_PORT|DB_NAME|SERVER_PORT)=' .env
go run ./cmd/server
```

Pričakujem `localhost`, `5432`, `quizio_ismar_e2e` in `18081`. Spremenljivke iz lupine
imajo lahko prednost pred `.env`, zato jih za DB nastavitve ne smem imeti nastavljenih
na drugo okolje. Ta sveži worktree nima certifikatov; Go uporablja HTTP.

V tretjem terminalu zaženem frontend:

```sh
cd next
npm ci --no-audit --no-fund
npm run dev -- --port 3001
```

Odprem `http://localhost:3001/login`. Datoteka `next/.env.local` mora imeti
`GO_BACKEND_URL=http://localhost:18081` in isti HMAC ključ kot lokalni backend.

Oba računa in lokalna gesla so v tem worktreeju že pripravljeni. V četrtem terminalu
zaženem samo svoje teste:

```sh
cd testing/functional_testing
npm ci --no-audit --no-fund
npx playwright install chromium
npx playwright test --config ismar/playwright.config.ts
```

Po prvi namestitvi lahko prva dva namestitvena ukaza izpustim. Za vidni brskalnik
zadnjemu ukazu dodam `--headed`. Za en test dodam npr. `--grep ISM-FT-02`.
Samo seznam testov preverim z `--list`; to ne izvaja prijav ali sprememb podatkov.

Ne uporabljam ukaza `npm run functional_tests` iz korena ali privzetega `npx playwright test`
brez svoje konfiguracije, saj obstoječa zbirka uporablja destruktivni `TRUNCATE`.

## Kaj preverim v posameznem testu

Vsak test začne z novo sejo. Administrator in navadni uporabnik imata ločena
brskalniška konteksta. Pred prijavo preverim testno bazo, lokalni konfiguraciji,
pripravljena uporabnika in njuni vlogi. S podpisano bralno zahtevo preverim tudi,
ali lokalni Go API najde ista namenska uporabnika kot testna baza.

Administrator prek aplikacije pripravi nov kviz z enoličnim naslovom `N3-Ismar-…`,
kategorijo General, omejitvijo 5 minut in dvema vprašanjema iz naloge 3. Vsak test
ima svoj kviz, zato ni odvisen od uspeha prejšnjega ali predhodnih ročnih podatkov.

1. **ISM-FT-01:** kot običajni uporabnik preverim odsotnost osnutka. Kot administrator
   preverim Draft in Not scheduled ter kliknem Publish in Publish now. Kot uporabnik
   ponovno poiščem kviz, odprem podrobnosti in preverim naslov, objavo, 2 vprašanji,
   5 minut ter možnost Start quiz. Kviza ne začnem.
2. **ISM-FT-02:** začnem objavljeni kviz, izberem 4 in Maribor ter počakam na uspešna
   odziva shranjevanja. Pred iztekom kliknem Submit. Preverim zaključek, 2/5 točk,
   40 %, 1/2 pravilnih ter izbrana/pravilna odgovora in 2 oziroma 0 točk v pregledu.
3. **ISM-FT-03:** shranim odgovor 4, URL, ID poskusa, začetni čas in odčitek časovnika.
   Zaprem zavihek, počakam 20 sekund in odprem novega v istem kontekstu. Prek Continue
   quiz preverim isti poskus, začetni čas, ohranjen odgovor in zmanjšanje časovnika
   glede na dejansko pretekli čas s toleranco 5 sekund. Nato shranim Ljubljano na
   drugem vprašanju. Ne zahtevam istega trenutno odprtega vprašanja in kviza ne oddam.

Pot `/attempts/{id}` vsebuje ID kviza; pravi ID poskusa primerjam iz API-ja.
Pri tretjem testu v poročilo priložim tudi izmerjene čase v `nadaljevanje.json`.
Podatkov po testih ne brišem; v testni bazi ostanejo označeni kvizi in poskusi.

## Poročila in headless CI

Teste privzeto izvajam brez grafičnega vmesnika, z enim delavcem in brez samodejnih
ponovitev celotnih testov. Samo ob izrecni napaki Firebase `auth/network-request-failed`
prijavo ponovim še enkrat; napačnega gesla ali funkcionalnega odstopanja tako ne prikrijem.
Rezultat vidim v terminalu in v HTML-poročilu:

```sh
cd testing/functional_testing
npx playwright show-report ismar/playwright-report
```

Ob neuspehu dobim posnetek in sled v `ismar/test-results/`. Sled lahko vsebuje podatke
prijave in sejne piškotke, zato je ne objavljam brez pregleda. Ustvarjena poročila Git ignorira.
Posnetek zaključnega stanja dobim tudi za vsak uspešen scenarij.

V GitHub Actions bi potreboval Node.js, Go, svežo testno bazo PostgreSQL, testni Firebase
in obe namenski prijavi iz Secrets. Namestil bi obstoječe odvisnosti z `npm ci` in
Chromium s sistemskimi knjižnicami z `npx playwright install --with-deps chromium`.
Pred testi bi pripravil migracije in namenska uporabnika v testni bazi ter zagnal obe
aplikaciji z lokalnima naslovoma. Počakal bi na pripravljenost in zagnal isti ukaz s
`--config ismar/playwright.config.ts`. HTML-poročilo, posnetke, sledi in dnevnike bi
shranil kot artefakt tudi ob neuspehu. Novega workflowa za to nalogo ne dodajam.

## Namerna napaka in zapis rezultatov

Za demonstracijo sem začasno spremenil
`next/src/components/attempts/AttemptResult.tsx`: v `buildResultSummary` sem zamenjal
`totalScore += question.value` z `totalScore += 1`. Pri odgovorih 4 in Maribor sem
namesto 2/5 in 40 % dobil 1/5 in 20 %. ISM-FT-02 je padel pri preverjanju 2/5.

Najprej sem uspešno izvedel tri teste na pravilni kodi. Po FAIL pri mutaciji sem
izvorno datoteko obnovil v bloku `finally` ter ponovno uspešno izvedel vse tri teste.
Preveril sem, da je datoteka bajtno enaka izvorni različici in različici v Git.
Pri vsakem teku so nastali novi kvizi. Celotna lokalna poročila sem ohranil v
`testing/functional_testing/ismar/runs/01-pass`, `02-fail` in `03-pass`; te mape Git
ignorira, saj lahko sledi vsebujejo prijavne podatke. Za oddajo sem izbral izpise,
posnetke in meritve v [dokazila](dokazila/).

**Zapis priprave, 10. 11. 2026:** lokalna konfiguracija, preverjanje baze, migracije,
namestitev obstoječih paketov in Chromiuma so izvedeni. Playwright prepozna tri teste.
Preverjanje TypeScript je uspešno. Chromium sem zagnal headless in odprl `/login`
na vratih 3001: odziv je bil HTTP 200, polji email in geslo sta prisotni. To je
preverjanje zagona okolja, ne izvedba mojih treh funkcionalnih scenarijev.
**Zapis izvedbe:** 3 PASS pred mutacijo; 1 FAIL pri namensko izvedenem ISM-FT-02 z
mutacijo; 3 PASS po obnovi. Podrobnosti in omejitve sem zapisal v [poročilo](POROCILO.md).

Viri: [Playwright – prijava in ločene seje](https://playwright.dev/docs/auth),
[CI](https://playwright.dev/docs/ci), [poročila](https://playwright.dev/docs/test-reporters).
