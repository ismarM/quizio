# OMR-FT-01 – Preverjanje administratorskih pravic

| Polje | Vsebina |
| --- | --- |
| ID | OMR-FT-01 |
| Odgovorna oseba | Omar Ždralović |
| Način | Avtomatiziran E2E prek Chromiuma, pravega BFF in lokalne baze |
| Prioriteta | Visoka |
| Datum izvedbe | 3. 11. 2026 |
| Status | **PASS** |

## Cilj

Preveriti, da navadni prijavljeni uporabnik ne more odpreti administratorskega vmesnika ali objaviti kviza, administrator pa lahko objavi isti osnutek.

Podlaga: `next/src/app/admin/page.tsx`, `next/src/app/api/proxy/[...path]/route.ts` in `backend/internal/httpapi/quizzes/publish_quiz.go`.

## Okolje in testni podatki

- Lokalni Docker Compose: Next.js, Go backend in PostgreSQL so bili zdravi.
- URL: `http://localhost:3000`.
- Chromium 156.0.8078.4, Playwright 1.64.1, Windows 10.0.26300.
- Commit: `6363107f6b5a6361f92b53c5a7ebf7fac6c2fb97`.
- Testna računa: `omar.ft.admin.1793702004714-3a9ade@example.com` in `omar.ft.usera.1793702004714-3a9ade@example.com`.
- Kviz: ID 1, `OMR FT RBAC 1793702004714-3a9ade`.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat |
| --- | --- | --- | --- |
| 1 | Navadni uporabnik odpre `/admin`. | Preusmeritev z razlogom `unauthorized`. | Preusmerjen na `/login?reason=unauthorized`. |
| 2 | Navadni uporabnik pošlje objavni PATCH skozi BFF. | HTTP 403, kviz ostane osnutek. | HTTP 403; ponovni admin GET ni vseboval `publish_date`. |
| 3 | Administrator objavi isti kviz. | HTTP 200. | HTTP 200. |
| 4 | Administrator ponovno prebere kviz. | Objavljeno stanje je obstojno. | `publish_date` je bil shranjen. |
| 5 | Test varno zaključi pripravo. | Arhivira samo svoj kviz. | Baza potrjuje `is_archived=true` za kviz ID 1. |

## Končni rezultat

Vsa pričakovanja so izpolnjena. Navadni uporabnik ni spremenil stanja, administrator pa je isti kviz uspešno objavil. **Status: PASS.**

