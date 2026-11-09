# Poročilo: avtomatizirano funkcionalno testiranje (Patrik)

Avtomatizirani so testni primeri iz dokumentov QUIZIO-FT-01, 02 in 03 (22 primerov). Koda testov je v `testing/functional_testing/`, cevovod v datoteki `ci.yml` v tej mapi.

## 1. Izbira orodja

Izbrano orodje je **Playwright** s TypeScriptom.

- Vmesnik Quizio je napisan v Next.js in TypeScriptu, zato so testi v istem jeziku kot aplikacija.
- Testira celoten sistem prek pravega brskalnika (Next.js, Go API, PostgreSQL, Firebase), kar funkcionalni testi zahtevajo.
- Ima vse, kar testni primeri potrebujejo: ločene seje brskalnika (prijavljen / neprijavljen uporabnik), prestrezanje zahtev za simulacijo napak strežnika in neposredne klice API-ja.
- Samodejno čaka na elemente, zato so testi stabilni brez ročnih zamikov.
- Je primeren za cevovod: privzeto teče brez grafičnega vmesnika, sam namesti brskalnik (ne potrebuje gonilnikov) in vrne rezultate v konzolo, HTML in JUnit.

Selenium potrebuje ločen gonilnik za vsak brskalnik in njegovo različico, nima vgrajenega čakanja na elemente in ne zna prestrezati zahtev, zato bi bilo treba vse to dopisati sami ali dodati druge knjižnice. Tudi poročila in posnetki ob neuspehu niso vgrajeni. Cypress teče znotraj enega zavihka brskalnika, zato težko ustvari novo, ločeno sejo v istem testu (TC-01-04). Ker teče v brskalniku, tudi neposredno branje baze za preverjanje rezultatov ni preprosto. Playwright vse to podpira že v osnovi, z enim orodjem in enim ukazom za namestitev.

## 2. Vključitev v CI

Datoteka `ci.yml` je razširitev obstoječega cevovoda (`.github/workflows/ci.yml`, GitHub Actions) in ga v celoti nadomesti. Obstoječi nalogi `frontend` in `backend` ostaneta nespremenjeni, dodana pa je naloga `functional-tests`, ki teče ob vsakem `push` in `pull_request` na `main`, a šele, ko se obe nalogi uspešno zaključita (`needs: [frontend, backend]`). Lokalno ga lahko brez GitHuba zaženemo z orodjem `act` (`act -W ZK_NALOGE/ZK_naloga5/patrik/ci.yml --secret-file .secrets`).

Koraki naloge:

1. Iz skrivnosti GitHub ustvari `backend/.env` in `next/.env.local`.
2. Z `docker compose up` zažene bazo, Go API (ob zagonu izvede migracije) in Next.js.
3. Namesti testne odvisnosti in Chromium (`npx playwright install --with-deps chromium`).
4. Izvede teste brez grafičnega vmesnika (`npx playwright test`).
5. Shrani rezultate in dnevnike aplikacije ter ustavi sistem (tudi ob neuspehu).

Geslo testnega računa (`TEST_PASSWORD`) in ostale nastavitve aplikacije so shranjeni kot skrivnosti GitHub.

### 2.1 Pojasnilo dodane naloge

Funkcionalni testi potrebujejo zagnan celoten sistem (bazo, Go API in Next.js), nalogi `frontend` in `backend` pa kodo le preverita in zgradita, zato je testiranje dodano kot ločena naloga. Ker so testi počasnejši, tečejo šele, ko se obe nalogi uspešno zaključita; ob napaki v gradnji se preskočijo.

Vsaka naloga v GitHub Actions teče na novem, praznem računalniku, zato se rezultati gradnje iz prejšnjih nalog ne prenesejo in se sistem z `docker compose` zgradi znova. `docker-compose.yml` nastavitve aplikacije bere iz datotek `backend/.env` in `next/.env.local`, Next.js pa jih potrebuje že med gradnjo slike. Datoteki vsebujeta skrivnosti in nista v repozitoriju, zato ju naloga na začetku ustvari iz skrivnosti GitHub. Naloga `frontend` ju ne potrebuje, ker aplikacijo gradi brez Dockerja in skrivnosti dobi kot spremenljivke okolja.

## 3. Zagon testov

Enkratna priprava:

```bash
cp backend/.env.example backend/.env
cp next/.env.local.example next/.env.local
cp testing/.env.example testing/.env
```

V datoteke vpiši manjkajoče vrednosti (v `testing/.env` geslo `TEST_PASSWORD`). Račun `functional_tests@nipravimail.com` mora obstajati v Firebase.

Zagon iz korena projekta:

```bash
docker compose up -d --build      # 1. zažene sistem
npm run functional_tests          # 2. namesti odvisnosti in Chromium, izvede teste
cd testing/functional_testing
npm run report                    # 3. odpre HTML poročilo
cd ../..
docker compose down               # 4. ustavi sistem
```

Testi tečejo zaporedno z enim delavcem, ker si delijo uporabnika in bazo:

1. `auth.setup.ts`: izprazni bazo, naloži testne podatke (seed), prijavi uporabnika in shrani sejo.
2. `01-theme-language.spec.ts`: tema in jezik.
3. `02-admin-create-quiz.spec.ts`: ustvarjanje kviza.
4. `03-attempt-history.spec.ts`: zgodovina poskusov.
5. `purge.teardown.ts`: izprazni bazo (tudi ob neuspehu).

## 4. Dnevniki in rezultati

**Lokalno:**

- Konzola izpiše vsak test (✓ / ✘) in povzetek; ob neuspehu pričakovano in dejansko vrednost.
- HTML poročilo je v `playwright-report/` in se odpre z `npm run report`.
- Za neuspešne teste se v `test-results/` shranita posnetek zaslona in sled (`trace.zip`), ki se odpre v HTML poročilu ali z `npx playwright show-trace`.
- Dnevniki aplikacije: `docker compose logs`.

**V GitHub Actions** (zavihek Actions → tek »CI« → naloga »Functional tests (Playwright)«):

- Dnevnik koraka »Run functional tests« vsebuje enak izpis kot lokalna konzola.
- Artefakt `playwright-results` (na dnu strani teka) vsebuje HTML poročilo, posnetke in sledi neuspešnih testov ter dnevnike aplikacije (`docker.log`). HTML poročilo se po prenosu odpre z `npx playwright show-report playwright-report`.
- Rdeč križec pri nalogi pomeni neuspešen test; zahteva za združitev pokaže neuspešno preverjanje.

## 5. Preverjanje zaznave napake

Da preverimo, ali testi zaznajo napako, smo spremenili pričakovani rezultat testnega primera TC-01-03, ki je prej uspel. Po preklopu jezika na slovenščino zdaj pričakujemo sporočilo »Profil posodobljen.« namesto »Profile updated.«. Sprememba je narejena v dokumentu TC-01 in v testu (`tests/01-theme-language.spec.ts`), koda aplikacije pa je ostala nespremenjena.

Testi so bili zagnani z ukazom `npx playwright test tests/01-theme-language.spec.ts`. Rezultat je bil pričakovan:

- **TC-01-03 je neuspešen.** Playwright na strani ni našel besedila »Profil posodobljen.«, ker aplikacija prikaže »Profile updated.«. V konzoli je izpisana napaka s pričakovano vrednostjo in vrstico v testu, v `test-results/` pa sta shranjena posnetek zaslona in sled.
- **TC-01-04 je preskočen,** ker je odvisen od uspeha TC-01-03.
- **Ostali testi so uspešni,** zato je neuspeh omejen na spremenjeno pričakovanje.

Test je torej odstopanje zaznal. Ugotovili smo tudi, da sporočilo o uspehu nastane pred zamenjavo jezika in zato ostane v angleščini, čeprav je preostali vmesnik že v slovenščini. To je manjša napaka v prevodu aplikacije, ki jo test zdaj razkrije.
