# Funkcionalni testi (Playwright)

Avtomatizirani funkcionalni testi za Quizio. Implementirajo testne primere iz dokumentov v `ZK_NALOGE/ZK_naloga3/patrik/` (ISO/IEC/IEEE 29119-3:2021). Testi delujejo prek brskalnika (Chromium) nad pravim sistemom: Next.js, Go API, PostgreSQL in Firebase.

## Struktura

| Pot | Vsebina |
| :--- | :--- |
| `playwright.config.ts` | Nastavitve: en delavec, projekta `setup` in `chromium`, shranjena seja |
| `seed/seed.sql`, `seed/run-seed.mjs` | Testni uporabnik (admin), kviz `FT Seed Quiz` in en zaključen poskus |
| `support/credentials.ts` | Prebere e-pošto in geslo iz okolja |
| `support/auth.ts` | Prijava prek obrazca, `ANONYMOUS` (brez seje) |
| `support/db.ts` | Seed, nastavitve uporabnika in preverjanje podatkov v bazi (`pg`) |
| `support/quiz-form.ts` | Page object za obrazec »Create quiz« |
| `tests/auth.setup.ts` | Počisti bazo, izvede seed, prijavi uporabnika in shrani sejo v `.auth/user.json` |
| `tests/purge.teardown.ts` | Po vseh testih (tudi neuspešnih) počisti bazo |
| `seed/run-purge.mjs`, `../purge.sql` | `npm run purge`: izbriše vse podatke aplikacije razen kategorij |
| `tests/01-theme-language.spec.ts` | QUIZIO-FT-01, TP-01 |
| `tests/02-admin-create-quiz.spec.ts` | QUIZIO-FT-02, TP-02 |
| `tests/03-attempt-history.spec.ts` | QUIZIO-FT-03, TP-03 |

Datoteke so oštevilčene, da si testni postopki sledijo v istem vrstnem redu kot v dokumentih. Teče en delavec, ker vsi testi uporabljajo istega uporabnika in isto bazo.

## Okolje

| Spremenljivka | Pomen | Privzeto |
| :--- | :--- | :--- |
| `TEST_PASSWORD` | Geslo testnega uporabnika (**obvezno**) | – |
| `TEST_EMAIL` | E-pošta testnega uporabnika | `functional_tests@nipravimail.com` |
| `BASE_URL` | Naslov aplikacije | `http://localhost:3000` |
| `DATABASE_URL` | Povezava na PostgreSQL (seed in preverjanje podatkov) | `postgres://postgres:postgres@localhost:5432/appdb` |

Vrednosti so v skupni datoteki `testing/.env` (uporabljata jo funkcionalni in sistemski testi). `playwright.config.ts` in `npm run seed` jo naložita samodejno. Datoteka je v `.gitignore`; za nov računalnik jo ustvari iz `testing/.env.example`.

Predpogoji: v Firebase konzoli obstaja račun `functional_tests@nipravimail.com`, `docker compose up` v korenu projekta teče in migracije so izvedene.

## Zagon

Iz korena projekta (namesti odvisnosti in Chromium, nato zažene vse teste):

```bash
npm run functional_tests
```

Iz te mape:

```bash
npm test                 # vsi testi (najprej auth.setup.ts)
npx playwright test tests/03-attempt-history.spec.ts   # ena datoteka
npm run test:ui          # interaktivno
npm run report           # HTML poročilo po zagonu
npm run typecheck        # preverjanje tipov
```

`npm run seed` ročno naloži samo seed. Seed je idempotenten: pred ponovnim ustvarjanjem izbriše uporabnikove kvize s predpono `FT `, zato ga vsaka datoteka z testi (`beforeAll`) ponovno izvede, uporabnikove nastavitve pa se vrnejo na Light/English.

## Preslikava testnih primerov

**QUIZIO-FT-01 – tema in jezik** (`01-theme-language.spec.ts`)

| Testni primer | Test |
| :--- | :--- |
| TC-01-01 | stored preferences are shown |
| TC-01-02 | save the dark theme |
| TC-01-03 | save the Slovenian language |
| TC-01-04 | preferences survive a new session (nov kontekst brskalnika + nova prijava) |
| TC-01-05 | unsaved change is discarded |
| TC-01-06 | backend error restores the previous values (`PATCH` prestrežen z `page.route`, HTTP 500) |
| TC-01-07 | anonymous access redirects to login |

TC-01-02 do 04 so odvisni drug od drugega (`describe.serial`).

**QUIZIO-FT-02 – ustvarjanje kviza** (`02-admin-create-quiz.spec.ts`)

| Testni primer | Test |
| :--- | :--- |
| TC-02-01 | the form opens in the draft state |
| TC-02-02 | create a minimal quiz (odziv, seznam `/admin`, zapis v bazi) |
| TC-02-03 | create a full quiz (primerjava z bazo in z urejevalnikom) |
| TC-02-04 | the title is required |
| TC-02-05 | time limit boundaries |
| TC-02-06 | the only question cannot be removed |
| TC-02-07 | question rules |
| TC-02-08 | a new quiz is a draft and not in the public list |
| TC-02-09 | a server error keeps the entered data (`POST` prestrežen, HTTP 500) |
| TC-02-10 | anonymous access is blocked |
| TC-02-11 | cancel creates nothing |

TC-02-02, 03 in 08 so na koncu (`describe.serial`); TC-02-08 potrebuje kviz iz TC-02-02.

**QUIZIO-FT-03 – zgodovina poskusov** (`03-attempt-history.spec.ts`)

| Testni primer | Test |
| :--- | :--- |
| TC-03-01 | the finished attempt is listed |
| TC-03-02 | the statistics match the history |
| TC-03-03 | the history is shown in Slovenian (jezik se nastavi neposredno v bazi) |
| TC-03-04 | the history requires a session |

## Opombe

- **Validacija obrazca.** V obrazcu »Create quiz« je gumb »Save draft« onemogočen, dokler vnos ni veljaven; sporočila o napakah (npr. »Title is required.«) se pri običajni uporabi ne prikažejo. Testi zato preverjajo onemogočen gumb in da zahteva ni bila poslana. Vprašanja z manj kot dvema odgovoroma ali brez pravilnega odgovora v obrazcu ni mogoče ustvariti (TC-02-07 c, d).
- **Iskalniki.** Oznake polj v obrazcu niso povezane z vnosnimi polji, zato testi uporabljajo besedilo označb mest (`placeholder`), vloge in strukturo strani.
- **Datum poskusa** (TC-03-01) strežnik izpiše v svojem časovnem pasu, zato se preveri samo širok časovni razpon (6 do 60 ur).
- **CI:** testi niso del CI; zaganjajo se lokalno proti `docker compose`.
