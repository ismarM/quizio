# OMR-FT-03 – Sprotna posodobitev lestvice

| Polje | Vsebina |
| --- | --- |
| ID | OMR-FT-03 |
| Odgovorna oseba | Omar Ždralović |
| Način | Avtomatiziran E2E v dveh ločenih brskalniških kontekstih |
| Prioriteta | Visoka |
| Datum izvedbe | 3. 11. 2026 |
| Status | **PASS** |

## Cilj

Preveriti, da se že odprta lestvica po zaključku kviza drugega uporabnika posodobi prek prave SSE povezave in brez osveževanja strani.

Podlaga: `next/src/lib/hooks/use-leaderboard.ts`, SSE proxy in `backend/internal/httpapi/quizzes/stream_leaderboard.go`.

## Okolje in testni podatki

- Enako lokalno okolje kot pri OMR-FT-01.
- Opazovalec: `omar.ft.usera.1793702004714-3a9ade@example.com`.
- Reševalec: `omar.ft.userb.1793702004714-3a9ade@example.com`.
- Kviz: ID 3, `OMR FT SSE 1793702004714-3a9ade`, vprašanji za 2 in 3 točke.
- SSE dogodki niso bili mockani.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat |
| --- | --- | --- | --- |
| 1 | Opazovalec odpre lestvico. | Prava SSE povezava odgovori z 200. | `leaderboard/stream` je vrnil HTTP 200. |
| 2 | Stran ostane odprta brez reload. | Reševalca še ni na lestvici. | Pred zaključkom vrstice reševalca ni bilo. |
| 3 | Reševalec pravilno odgovori in zaključi kviz. | Rezultat 5/5 se shrani. | PATCH in finish sta vrnila 200; rezultat je 5/5; baza vsebuje dva odgovora. |
| 4 | Opazuj prvotno odprto stran. | Nova vrstica se pojavi brez navigacije. | Vrstica 5/5 se je pojavila; število navigacij glavnega okvirja je ostalo 0. |
| 5 | Preveri uvrstitev. | Reševalec je prvi. | Reševalec je bil v prvi vrstici. |
| 6 | Arhivira svoj testni kviz. | Brez posega v druge podatke. | Baza potrjuje `is_archived=true` za kviz ID 3. |

## Končni rezultat

Funkcionalna SSE posodobitev je uspela brez reload. Opazovana čakalna doba v tem zagonu je bila približno 106 ms, vendar ta splošni E2E test ni nadzorovana meritev in zato ne dokazuje NFR meje 200 ms. **Status: PASS.**

