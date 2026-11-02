# ISM-FT-02 – Reševanje kviza, ročna oddaja in točkovanje

| Polje | Vsebina |
| --- | --- |
| ID | ISM-FT-02 |
| Odgovorna oseba | Ismar |
| Različica | 1.1 – vpis izvedbe |
| Način | Ročno, prek aplikacije |
| Prioriteta | Visoka |
| Status | PASS |

## Cilj in sledljivost

Preveriti osnovni uporabniški postopek od začetka reševanja do rezultata in pravilen seštevek različno ovrednotenih odgovorov.

Podlaga v repozitoriju: `next/src/components/attempts/AttemptPlayer.tsx`; `next/src/components/attempts/AttemptResult.tsx`; `backend/internal/httpapi/shared/scoring.go`. Poti so relativne na koren projekta.

## Predpogoji in testni podatki

Kviz je objavljen in nearhiviran. Običajni uporabnik je prijavljen in kviza še ni začel. Vprašanja, pravilni odgovori in točke so natančno taki kot v skupnih podatkih.

Uporabi [skupno pripravo okolja in vprašanji](README.md). Naslov kviza: `N3-Ismar-Oddaja-01-<oznaka izvedbe>`, časovna omejitev: **5 minut**. Pred izvedbo zapiši dejanski naslov in kategorijo spodaj. Scenariji uporabljajo ločene kvize in niso odvisni od uspeha drugih scenarijev.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat | Dokazilo |
| --- | --- | --- | --- | --- |
| 1 | Na seznamu poišči testni kviz, odpri podrobnosti in začni reševanje. | Odpre se reševanje z dvema vprašanjema in časovnikom za omejitev 5 minut. | Prikazani 2 vprašanji in omejitev 5 minut; po začetku je časovnik 4:55. | [Posnetek](dokazila/ISM-FT-02_01_podrobnosti.png) |
| 2 | Pri prvem vprašanju izberi odgovor 4. | Odgovor 4 je označen; aplikacija ne prikaže napake shranjevanja. | Izbran 4, vprašanje vredno 2 točki; brez vidne napake. | [Posnetek](dokazila/ISM-FT-02_02_prvi_odgovor.png) |
| 3 | Odpri drugo vprašanje in izberi Maribor. | Odgovor Maribor je označen; aplikacija ne prikaže napake shranjevanja. | Izbran Maribor, vprašanje vredno 3 točke; odgovorjeni 2 vprašanji, časovnik 4:50; brez vidne napake. | [Posnetek](dokazila/ISM-FT-02_03_drugi_odgovor.png) |
| 4 | Na zadnjem vprašanju pred iztekom časa klikni gumb za oddajo. | Poskus se zaključi in odpre se rezultat. | Prikazan Quiz completed in rezultat; čas reševanja 0:12. | [Posnetek](dokazila/ISM-FT-02_04_rezultat.png) |
| 5 | Preglej točke, odstotek in pregled odgovorov. | Dosežek je 2/5 točk oziroma 40 %, pravilno 1 od 2 vprašanj. Pregled kaže izbrana odgovora 4 in Maribor; prvi je pravilen, drugi napačen (pravilen je Ljubljana). | 2/5 točk, 40 %, 1/2 pravilnih. Prvo: izbran/pravilni 4, 2 točki. Drugo: izbran Maribor, pravilni Ljubljana, 0 točk. | [Posnetek](dokazila/ISM-FT-02_05_pregled_odgovorov.png) |

## Zapis dejanske izvedbe

| Polje | Vrednost ob izvedbi |
| --- | --- |
| Datum in čas začetka/konca | 2. 11. 2026; posnetki po imenih datotek 17:44:46–17:47:29. Točen začetek/konec in časovni pas nista zabeležena. |
| Izvajalec | Ismar; teste sem izvedel ročno. |
| Commit aplikacije | `0d4ba0e602dcb2a743c75175e3ef5a84b6e0d6d2` (zabeležil sem ga po izvedbi). |
| Naslov okolja | http://localhost:3000, lokalni Docker Compose po moji pripravi okolja. |
| OS, brskalnik in različica | EndeavourOS; Firefox 158.0.1 (64-bit), potrjeno s [posnetkom](dokazila/okolje_firefox.png). |
| Oznaki računov in vlog (brez gesel) | Običajni uporabniški profil T. |
| Dejanski naslov, ID kviza in kategorija | N3-Ismar-Oddaja-01; ID ni zabeležen; General. |
| ID/URL poskusa, če je uporabljen | Ni zabeležen. |
| Pripravljenost predpogojev in podatkov | Published, General, 2 vprašanji, 5 minut; vprašanja in točke potrjeni s posnetki reševanja in pregleda. |
| Dejanski skupni rezultat | Dosežen pričakovani rezultat 2/5, 40 %, 1/2 pravilnih; pregled obeh odgovorov ustreza izbiri in točkovanju. |
| Status | PASS |
| Odstopanje: korak, pričakovano, dejansko | Funkcionalnih odstopanj na dokazilih ni. Naslov brez dodatne oznake izvedbe. |
| Dokazila / povezava na napako | Pet posnetkov v mapi dokazila; povezave pri korakih. |

Scenarij sem izvedel ročno in na podlagi opažanj ter priloženih dokazil določil rezultat PASS. Podatke o OS, brskalniku in commitu sem dopolnil po izvedbi.

## Zapis dokazil izvedbe – 2. 11. 2026

Pri ročni izvedbi sem zbral naslednja dokazila za `N3-Ismar-Oddaja-01`:

- [Podrobnosti](dokazila/ISM-FT-02_01_podrobnosti.png): Published, General, 2 vprašanji, 5 minut, Start quiz.
- [Prvi odgovor](dokazila/ISM-FT-02_02_prvi_odgovor.png): izbran 4, vrednost 2 točki, časovnik 4:55; brez vidne napake.
- [Drugi odgovor](dokazila/ISM-FT-02_03_drugi_odgovor.png): izbran Maribor, vrednost 3 točke, časovnik 4:50, odgovorjeni 2 vprašanji; gumb Submit je viden, brez vidne napake.
- [Rezultat](dokazila/ISM-FT-02_04_rezultat.png): Quiz completed, 2/5 točk, 40 %, 1/2 pravilnih odgovorov, čas reševanja 0:12. Pregled prvega vprašanja kaže izbran in pravilen odgovor 4 ter 2 točki.

- [Celoten pregled odgovorov](dokazila/ISM-FT-02_05_pregled_odgovorov.png): drugo vprašanje prikazuje izbran Maribor, pravilni odgovor Ljubljana in 0 točk; prvo 4 in 2 točki.

Opaženi rezultati ustrezajo pričakovanjem; status **PASS**. Klik oddaje ni neposredno posnet; zaporedje kaže gumb Submit pri 4:50 in nato zaključen rezultat s časom reševanja 0:12. Test sem izvedel ročno in izvorne posnetke ohranil brez urejanja.
