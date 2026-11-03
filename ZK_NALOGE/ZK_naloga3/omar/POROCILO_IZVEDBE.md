# Poročilo funkcionalnega testiranja – Omar

Izvajalec: **Omar Ždralović**. Datum izvedbe: **3. 11. 2026**.

## Okolje in način izvedbe

Testi so bili izvedeni lokalno prek Docker Compose na `http://localhost:3000`.

| Podatek | Vrednost |
| --- | --- |
| Čas izvedbe | približno 11:33–11:36 CET |
| Commit | `6363107f6b5a6361f92b53c5a7ebf7fac6c2fb97` |
| OS | Microsoft Windows 10.0.26300 |
| Brskalnik | Chromium 156.0.8078.4 |
| Playwright | 1.64.1 |
| Storitve | Next.js, Go backend in PostgreSQL; vse zdrave |
| Baza | Lokalni PostgreSQL `appdb` |
| Računi | En namenski administrator in dva namenska navadna uporabnika; gesla niso zapisana |

Izvedba je preverila celoten tok brskalnik → Next.js BFF → Go API → PostgreSQL → odziv v UI. Uporabljeni niso bili skupni seed, `purge.sql`, mockani SSE dogodki ali ponarejen čas. Vsak scenarij je ustvaril svoj kviz s predpono `OMR FT`; po preverjanju so bili vsi trije kvizi arhivirani.

## Rezultati

| Scenarij | Dejanski rezultat | Status |
| --- | --- | --- |
| [OMR-FT-01](OMR-FT-01_RBAC.md) – Administratorske pravice | Uporabnik: preusmeritev in HTTP 403 brez spremembe; administrator: HTTP 200 in obstojna objava istega kviza. | **PASS** |
| [OMR-FT-02](OMR-FT-02_iztek_casa.md) – Iztek časa | Dejanski iztek po približno 62 s, samodejni rezultat 2/5, en odgovor, pozni PATCH 409 in brez spremembe. | **PASS** |
| [OMR-FT-03](OMR-FT-03_lestvica_SSE.md) – Lestvica SSE | SSE HTTP 200; rezultat 5/5 se je prikazal v prvi vrstici brez reload oziroma navigacije. | **PASS** |

**Skupaj: 3 PASS, 0 FAIL, 0 BLOCKED, 0 NOT RUN.**

## Dnevnik izvedbe

| Dogodek | Rezultat |
| --- | --- |
| Varnostni pregled okolja | Docker Desktop 4.83.0; backend in PostgreSQL healthy; frontend HTTP 200. |
| Prvi pripravljalni zagon | Ni dosegel scenarijev, ker ustrezni Chromium build še ni bil nameščen. |
| Drugi pripravljalni zagon | Ni dosegel scenarijev, ker je cookie notice prekrival gumb registracije. Testni kontekst je bil nato pravilno nastavljen kot uporabnik, ki je obvestilo sprejel. |
| Končni zagon | `3 passed (2.4m)`. |
| OMR-FT-01 | Kviz ID 1; 403 za uporabnika, 200 za admina, objava obstojna. |
| OMR-FT-02 | Kviz ID 2; 2/5; en odgovor; 409 `attempt_finished`; DB `time_taken=00:01:00`. |
| OMR-FT-03 | Kviz ID 3; SSE 200; 5/5; prva vrstica; 0 navigacij; dva odgovora v bazi. |
| Čiščenje | Vsi trije kvizi `OMR FT` so bili arhivirani; drugi podatki niso bili brisani. |

Prva dva zagona sta bila pripravljalni težavi testnega orodja oziroma interakcije z UI in nista bila funkcionalna rezultata aplikacije. Končni zagon je uspešno izvedel vse tri scenarije.

## Omejitve

- Dokaz je sestavljen iz Playwright izpisa ter neposrednega preverjanja baze;
- Testni Firebase računi ostanejo namenski računi testnega projekta.
- Opazovanih približno 106 ms pri SSE ni formalna oziroma nadzorovana meritev NFR-06.
- Skupna datoteka `odgovornosti-funkcionalnega-testiranja.ods` ni bila spremenjena.

