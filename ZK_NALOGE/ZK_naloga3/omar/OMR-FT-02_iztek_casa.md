# OMR-FT-02 – Samodejni zaključek po izteku časa

| Polje | Vsebina |
| --- | --- |
| ID | OMR-FT-02 |
| Odgovorna oseba | Omar Ždralović |
| Način | Avtomatiziran E2E z dejanskim 60-sekundnim čakanjem |
| Prioriteta | Visoka |
| Datum izvedbe | 3. 11. 2026 |
| Status | **PASS** |

## Cilj

Preveriti, da se poskus po dejanskem izteku časovne omejitve samodejno zaključi in da po izteku ni mogoče spremeniti odgovora.

Podlaga: `next/src/components/attempts/AttemptPlayer.tsx`, `backend/internal/httpapi/attempts/get_attempt_status.go` in `update_attempt_status.go`.

## Okolje in testni podatki

- Enako lokalno okolje kot pri OMR-FT-01.
- Uporabnik: `omar.ft.usera.1793702004714-3a9ade@example.com`.
- Kviz: ID 2, `OMR FT Timeout 1793702004714-3a9ade`, omejitev 60 sekund.
- Prvo vprašanje: pravilen odgovor 4, vrednost 2 točki.
- Drugo vprašanje: pravilen odgovor Ljubljana, vrednost 3 točke.
- Čas ni bil ponarejen ali pospešen.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat |
| --- | --- | --- | --- |
| 1 | Uporabnik začne reševanje. | Odpre se poskus z odštevalnikom. | Poskus je bil ustvarjen in prikazan. |
| 2 | Pravočasno izbere odgovor 4. | PATCH 200 in odgovor se shrani. | PATCH 200. |
| 3 | Ne odgovori na drugo vprašanje in ne klikne Submit. | Po dejanskem izteku sledi samodejni zaključek. | UI je po približno 62 sekundah sam prešel na rezultat. |
| 4 | Preveri rezultat in strežniško stanje. | Rezultat 2/5, en odgovor, zaključen poskus. | UI in API: 2/5; en shranjen odgovor; baza: `time_taken=00:01:00`. |
| 5 | Po izteku pošlje odgovor na drugo vprašanje. | Konflikt in rezultat ostane 2/5. | HTTP 409, koda `attempt_finished`; ponovni GET ostane 2/5 z enim odgovorom. |
| 6 | Arhivira svoj testni kviz. | Brez posega v druge podatke. | Baza potrjuje `is_archived=true` za kviz ID 2. |

## Končni rezultat

Strežniško določen čas je bil spoštovan, rezultat je ostal 2/5 in pozni odgovor ni spremenil poskusa. **Status: PASS.**

