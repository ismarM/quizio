# Quizio – Naloga 4: vzdržljivostno sistemsko testiranje

**Izvajalec:** Omar Ždralović  
**Vrsta:** endurance / soak test (dolgotrajna, enakomerna obremenitev)  
**Orodje:** Autocannon (Node.js)  
**Status:** IZVEDENO – končni metodološko skladen tek je **PASS** (3. 11. 2026).

## Primerjava dela ekipe

| Član | Test | Orodje | Obstoječa dokumentacija |
|---|---|---|---|
| Patrik | Load: 0 → 50 VU, 2 min stabilne obremenitve, `/quizzes` | k6 | `../patrik/load_test_spec.md` |
| Ismar | Spike: 1 → 20 → 1 VU, `/api/proxy/categories` | k6 | `../ismar/POROCILO.md` in `load_test.js` |
| Omar | Soak: 10 zahtev/s, 6 minut, `/api/proxy/categories` | Autocannon | Ta mapa |


## Datoteke

- `SPECIFIKACIJA_TESTA.md` – cilj, hipoteza, pogoji, obremenitev, metrike, kriteriji in omejitve.
- `POSTOPEK_IZVEDBE.md` – ponovljiv postopek in zaščita podatkov.
- `POROCILO_IZVEDBE.md` – dejansko poročilo z meritvami, omejitvami in zaključkom.
- `soak-test.mjs` – varen lokalni merilni program; izvaja samo predpisani GET.
- `package.json` in `package-lock.json` – lokalno zaklenjen Autocannon 8.0.0.
- `dokazila/` – prostor za izpise in meritve **brez sejnih piškotkov in skrivnosti**.

## Povezava s projektom

Quizio: Next.js BFF → Go REST API → PostgreSQL, z avtentikacijo Firebase. Relevantno: `README.md`, `docs/features.md` (NFR-07/NFR-08), `docs/ARCHITECTURE.md`, `backend/internal/httpapi/quizzes/list_categories.go`, `testing/system_testing/`, `ZK_NALOGE/ZK_naloga4/`.

To je sistemski HTTP test skozi BFF, ne test vizualnega izrisovanja brskalnika, ne test prijavljanja različnih uporabnikov in ne dokaz proizvodne skalabilnosti.
