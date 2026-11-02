# ISM-FT-03 – Nadaljevanje kviza po zaprtju zavihka

| Polje | Vsebina |
| --- | --- |
| ID | ISM-FT-03 |
| Odgovorna oseba | Ismar |
| Različica | 1.1 – vpis izvedbe |
| Način | Ročno, prek aplikacije |
| Prioriteta | Visoka |
| Status | PASS |

## Cilj in sledljivost

Preveriti ohranitev shranjenega odgovora in prvotne časovne omejitve ob nenamernem zaprtju zavihka.

Podlaga v repozitoriju: `next/src/components/attempts/AttemptPlayer.tsx`; `docs/ARCHITECTURE.md`. Poti so relativne na koren projekta.

## Predpogoji in testni podatki

Ločen kviz je objavljen in nearhiviran, s podatki iz skupne tabele. Prijavljeni običajni uporabnik ga še ni začel. Uporabi isti profil brskalnika ves čas in med prekinitvijo ne izbriši seje.

Uporabi [skupno pripravo okolja in vprašanji](README.md). Naslov kviza: `N3-Ismar-Nadaljevanje-01-<oznaka izvedbe>`, časovna omejitev: **5 minut**. Pred izvedbo zapiši dejanski naslov in kategorijo spodaj. Scenariji uporabljajo ločene kvize in niso odvisni od uspeha drugih scenarijev.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat | Dokazilo |
| --- | --- | --- | --- | --- |
| 1 | Poišči testni kviz in začni reševanje. Zabeleži URL poskusa. | Odpre se nov poskus z dvema vprašanjema in omejitvijo 5 minut. | Prikazana 2 vprašanja, časovnik 4:55; poznejši posnetki kažejo URL /attempts/31. | [Posnetek](dokazila/ISM-FT-03_01_zacetek.png) |
| 2 | Pri prvem vprašanju izberi 4 in počakaj nekaj sekund. | Odgovor je označen, napake shranjevanja ni. | Izbral sem odgovor 4; začetni posnetek kaže 1 odgovorjeno vprašanje, poznejši pa ohranjeno izbiro 4. | [Posnetek](dokazila/ISM-FT-03_06_ohranjen_prvi_odgovor.png) |
| 3 | Zabeleži preostali čas R1 in uro t1, nato zapri zavihek aplikacije. | Podatka R1 in t1 sta zapisana za primerjavo; profil brskalnika ostane ohranjen. | Pred prekinitvijo: 17:53:00, R1 = 4:11, /attempts/31. Nato sem zaprl zavihek; tega dejanja nisem neposredno posnel. | [Posnetek](dokazila/ISM-FT-03_02_pred_zaprtjem.png) |
| 4 | Po približno 20 sekundah v istem profilu ponovno odpri aplikacijo in nadaljuj odprti poskus (prek uporabniške nadzorne plošče ali shranjenega URL-ja). Zabeleži URL, čas R2 in uro t2. | Odpre se isti poskus (isti ID v URL-ju). Čas ni ponastavljen: R2 je približno R1 minus razlika t2 − t1, z dovoljeno toleranco 5 sekund zaradi odčitavanja. Poskus še ni potekel. | Ob 17:53:20 je na /quizzes/31 viden Continue quiz; ob 17:53:28 je ponovno odprt /attempts/31, R2 = 3:42, eno odgovorjeno vprašanje. | [Posnetek](dokazila/ISM-FT-03_04_po_nadaljevanju.png) |
| 5 | Prek številke vprašanja odpri prvo vprašanje. | Odgovor 4 ostane izbran, tudi če aplikacija ob nadaljevanju najprej odpre prvo neodgovorjeno vprašanje. | Ob 17:54:05 je na prvem vprašanju izbran 4; isti poskus /attempts/31. | [Posnetek](dokazila/ISM-FT-03_06_ohranjen_prvi_odgovor.png) |
| 6 | Odpri drugo vprašanje in izberi Ljubljana. | Uporabnik lahko nadaljuje; odgovor je označen brez napake shranjevanja. Oddaja ni predmet tega scenarija. | Po nadaljevanju je drugo vprašanje najprej neodgovorjeno, nato je izbrana Ljubljana; prikazano 2 od 2 odgovorjenih, brez vidne napake. | [Posnetek](dokazila/ISM-FT-03_05_drugi_odgovor.png) |

## Zapis dejanske izvedbe

| Polje | Vrednost ob izvedbi |
| --- | --- |
| Datum in čas začetka/konca | 2. 11. 2026; dokazila 17:52:15–17:54:12 po imenih datotek. Na posnetkih z namizjem je ura vidna; točen začetek/konec izvedbe ni zabeležen. |
| Izvajalec | Ismar; teste sem izvedel ročno. |
| Commit aplikacije | `0d4ba0e602dcb2a743c75175e3ef5a84b6e0d6d2` (zabeležil sem ga po izvedbi). |
| Naslov okolja | http://localhost:3000; lokalni Docker Compose. |
| OS, brskalnik in različica | EndeavourOS; Firefox 158.0.1 (64-bit), potrjeno s [posnetkom](dokazila/okolje_firefox.png). |
| Oznaki računov in vlog (brez gesel) | Običajni uporabniški profil T. |
| Dejanski naslov, ID kviza in kategorija | N3-Ismar-Nadaljevanje-01; kviz 31; General. |
| ID/URL poskusa, če je uporabljen | 31; http://localhost:3000/attempts/31. |
| Pripravljenost predpogojev in podatkov | Dve vprašanji in omejitev 5 minut; račun prijavljen, na podrobnostih Published in Continue quiz. |
| Dejanski skupni rezultat | Isti poskus, ohranjen odgovor 4, čas upošteva prekinitev, nadaljnje odgovarjanje mogoče. |
| Status | PASS |
| Odstopanje: korak, pričakovano, dejansko | Ni zaznanega funkcionalnega odstopanja od pričakovanj. Ponovno sem se premaknil skozi vprašanja; odgovori so ostali izbrani. Naslov brez dodatne oznake izvedbe. |
| Dokazila / povezava na napako | Sedem izvornih posnetkov v mapi dokazila; spodaj dodatne povezave. |

Scenarij sem izvedel ročno in na podlagi opažanj ter priloženih dokazil določil rezultat **PASS**. Zavihek sem med postopkom zaprl, vendar zaprtja nisem neposredno posnel.

## Primerjava časov in opažanja

R1 = 4:11 ob t1 = 17:53:00; R2 = 3:42 ob t2 = 17:53:28. Preteklo je 28 sekund, časovnik se je zmanjšal za 29 sekund; odstopanje 1 sekunde je znotraj vnaprej določene tolerance 5 sekund. Časovnik se ni ponastavil.

Po nadaljevanju sem se moral ponovno premakniti skozi vprašanja, vendar so bile izbire ohranjene. Scenarij ne zahteva ohranitve trenutne strani vprašanja. Implementacija `AttemptPlayer.tsx` ob odprtju izbere prvo neodgovorjeno vprašanje, če so odgovorjena vsa, pa prvo vprašanje. To je skladno z opažanjem in ni izguba odgovorov.

Dodatna dokazila: [Continue quiz](dokazila/ISM-FT-03_03_nadaljuj.png), [ohranjena Ljubljana ob 17:54:12](dokazila/ISM-FT-03_07_ohranjen_drugi_odgovor.png). Izvorni posnetki so ohranjeni brez urejanja.
