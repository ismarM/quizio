# Poročilo ročnega funkcionalnega testiranja – Naloga 3

Izvajalec: **Ismar**. Datum izvedbe: **2. 11. 2026**.

## Okolje in način izvedbe

Quizio sem zagnal lokalno prek Docker Compose na `http://localhost:3000`. OS: EndeavourOS. Brskalnik: Firefox 158.0.1 (64-bit), [dokazilo](dokazila/okolje_firefox.png). Po izvedbi sem zabeležil commit `0d4ba0e602dcb2a743c75175e3ef5a84b6e0d6d2`.

Postopke sem izvedel ročno v administratorskem in ločenem običajnem uporabniškem profilu. V poročilu sem zabeležil svoja opažanja in priložil posnetke zaslona. Pri pripravi dokumentacije sem si pomagal z AI-asistentom; aplikacijo sem uporabljal in teste izvedel sam. Za te tri scenarije nisem uporabil avtomatizacije Playwright ali k6.

## Rezultati

| Scenarij | Dejanski rezultat | Status |
| --- | --- | --- |
| [ISM-FT-01](ISM-FT-01_objava_osnutka.md) – Objava osnutka | Pred objavo ni zadetkov; po objavi kviz viden, podrobnosti omogočajo začetek. | PASS |
| [ISM-FT-02](ISM-FT-02_rocna_oddaja.md) – Ročna oddaja in točkovanje | Izbiri 4 in Maribor; rezultat 2/5, 40 %, 1/2 pravilnih; pregled obeh odgovorov ustreza. | PASS |
| [ISM-FT-03](ISM-FT-03_nadaljevanje.md) – Nadaljevanje po zaprtju zavihka | Isti poskus 31, ohranjen odgovor 4, možno nadaljnje odgovarjanje; časovnik v 28 sekundah pade s 4:11 na 3:42. | PASS |

Izvedel sem 3 scenarije: 3 PASS, 0 FAIL. Pri izvedbi nisem zaznal funkcionalnih odstopanj od določenih pričakovanj. To ne pomeni, da je preverjena celotna aplikacija.

## Opažanja in omejitve

Pri nadaljevanju sem se moral ponovno premakniti med vprašanji, vendar so bili odgovori ohranjeni. Ohranjanje trenutno odprtega vprašanja ni zahtevano v tem scenariju; implementacija ob odprtju izbere prvo neodgovorjeno vprašanje oziroma prvo, če so odgovorjena vsa.

Posnetki niso neprekinjen posnetek izvedbe. Med izvedbo sem zaprl zavihek, vendar tega dejanja nisem neposredno posnel; časi in isti URL poskusa so vidni na dokazilih. Točnih začetkov in koncev izvedb, ID-jev prvih dveh kvizov in ID-ja drugega poskusa nisem zabeležil, zato teh podatkov nisem naknadno dopolnjeval. Čas objave v aplikaciji in ura namizja se razlikujeta; vzrok oziroma časovni pas ni preverjen in ni predmet teh scenarijev.

[Skupna ODS-preglednica](../odgovornosti-funkcionalnega-testiranja.ods) je dopolnjena: prevzel sem objavo osnutka (ISM-FT-01), ročno oddajo (ISM-FT-02) in nadaljevanje po zaprtju zavihka (ISM-FT-03). Patrikove dodelitve so ohranjene. Drugim članom nove naloge niso dodeljene brez dogovora; skupno oddajo mora ekipa dopolniti z njihovimi tremi scenariji in rezultati.
