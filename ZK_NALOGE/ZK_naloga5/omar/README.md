# Naloga 5 – avtomatizirano funkcionalno testiranje

Za avtomatizacijo mojih treh funkcionalnih testov iz Naloge 3 sem izbral **Playwright 1.64.1 s TypeScriptom in Chromiumom**. Testna koda je v `testing/functional_testing/omar/`, rezultati pa so povzeti v [poročilu](POROCILO.md).

## Zakaj sem izbral Playwright

Projekt uporablja Next.js in TypeScript, zato lahko teste pišem v istem jeziku. Playwright preizkusi celotno pot prek pravega brskalnika, Next.js BFF, Go API-ja, PostgreSQL in Firebase prijave. V enem testu lahko uporabljam več ločenih brskalniških kontekstov, kar potrebujem za administratorja, navadnega uporabnika in SSE lestvico.

Za cevovod je primeren, ker privzeto deluje brez grafičnega vmesnika. Ne potrebuje ročne namestitve gonilnika za Chrome. Rezultat vrne z izhodno kodo, terminalnim izpisom, HTML-poročilom, posnetki in sledjo ob napaki.

## Moje datoteke

- `testing/functional_testing/omar/playwright.config.ts` – Chromium headless, en delavec, brez samodejnih ponovitev;
- `testing/functional_testing/omar/scenarios.spec.ts` – moji trije avtomatizirani scenariji;
- `testing/functional_testing/omar/support.ts` – prijava, testni kvizi in skupni koraki;
- `testing/functional_testing/omar/prepare-accounts.mjs` – enkratna varna priprava namenskih računov;
- `testing/functional_testing/omar/.env.example` – samo imena lokalnih nastavitev, brez gesel.

Ponovno uporabljam obstoječi `testing/functional_testing/support/quiz-form.ts`. Ne dodajam novega testnega paketa in ne uporabljam skupnega `purge`, ki bi brisal podatke drugih članov. Vsak moj test ustvari kviz s predpono `N5-Omar` in ga na koncu arhivira.

## Kaj preverjajo moji testi

1. **OMR-FT-01 – RBAC:** navadni uporabnik je preusmerjen z `/admin`, objava prek BFF vrne 403 in ne spremeni osnutka, administrator pa isti kviz uspešno objavi.
2. **OMR-FT-02 – iztek časa:** po resničnih 60 sekundah se poskus samodejno zaključi z 2/5, pozni odgovor pa vrne 409 `attempt_finished`.
3. **OMR-FT-03 – SSE lestvica:** prvi uporabnik opazuje odprto lestvico, drugi zaključi kviz s 5/5, vrstica pa se pojavi prek SSE brez osveževanja oziroma navigacije glavnega okvirja.

## Priprava in zagon

V korenu repozitorija zaženem lokalno aplikacijo:

```powershell
docker compose up --build -d --wait
```

Odvisnosti Playwright so v projektu že določene. Na novem računalniku jih namestim:

```powershell
cd testing/functional_testing
npm.cmd ci
npx.cmd playwright install chromium
```

Trije namenski računi so na mojem trenutnem okolju že pripravljeni. Če pripravljam popolnoma novo okolje, enkrat izvedem:

```powershell
node omar/prepare-accounts.mjs
```

Skripta uporablja lokalni `next/.env.local` in `backend/.env`, ustvari samo račune `omar.n5.*`, vstavi njihove vloge v lokalno bazo in zapiše gesla v Git-ignorirani `omar/.env`. Gesel ne izpiše. Če Firebase računi že obstajajo, lokalnega `.env` pa ni, se skripta zaradi varnosti ustavi in gesel ne ponastavi.

Vse moje teste zaženem z:

```powershell
npx.cmd playwright test --config omar/playwright.config.ts
```

Posamezen primer lahko zaženem z `--grep`, na primer:

```powershell
npx.cmd playwright test --config omar/playwright.config.ts --grep "OMR-FT-02"
```

Vidni brskalnik dobim z dodatkom `--headed`. HTML-poročilo po izvedbi odprem z:

```powershell
npx.cmd playwright show-report omar/playwright-report
```

Ročni posnetki zaslona niso potrebni. Moji testi pri uspehu sami pripnejo tri posnetke, pri neuspehu pa Playwright sam ustvari posnetek in `trace.zip`. Trace lahko vsebuje sejne podatke, zato ga ne dodajam v Git brez pregleda.

## Predvidena vključitev v cevovod

V GitHub Actions bi po uspešni gradnji frontenda in backenda dodal ločeno nalogo. Potrebovala bi Node.js, Chromium, lokalni PostgreSQL, zagnan backend in Next.js ter tri Firebase prijave iz GitHub Secrets. Bistveni koraki bi bili:

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test --config omar/playwright.config.ts
```

Cevovod bi shranil `omar/playwright-report` in `omar/test-results` kot artefakta tudi ob neuspehu. Izhodna koda 0 pomeni PASS, drugačna izhodna koda pa ustavi nalogo. Dejanskega skupinskega workflowa ne spreminjam, ker navodilo zahteva opis predvidene vključitve, skupni CI pa potrebuje dogovor glede Firebase Secrets in testne baze.

## Namerna napaka

V `next/src/components/attempts/AttemptPlayer.tsx` sem začasno spremenil pogoj samodejnega zaključka iz `timeLeftSeconds === 0` v `timeLeftSeconds < 0`. Ker je čas vedno omejen najmanj na nič, se zaključek ni sprožil. Moj OMR-FT-02 je pravilno padel, ker je URL ostal na strani poskusa. Nato sem datoteko obnovil in ponovno uspešno izvedel vse tri teste. Pokvarjena koda ni del končnega stanja repozitorija.
