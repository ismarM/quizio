# ISM-FT-01 – Objava osnutka in dostop uporabnika

| Polje | Vsebina |
| --- | --- |
| ID | ISM-FT-01 |
| Odgovorna oseba | Ismar |
| Različica | 1.1 – vpis izvedbe |
| Način | Ročno, prek aplikacije |
| Prioriteta | Visoka |
| Status | PASS |

## Cilj in sledljivost

Preveriti prehod iz osnutka v objavljen kviz ter njegovo vidnost običajnemu uporabniku. S tem preverimo poslovni korak po ustvarjanju kviza, ki ga obravnava Patrik.

Podlaga v repozitoriju: `docs/features.md`; `next/src/components/admin/AdminQuizMobileActions.tsx`; `next/src/components/admin/AdminQuizBrowser.tsx`. Poti so relativne na koren projekta.

## Predpogoji in testni podatki

Administrator in običajni uporabnik sta prijavljena v ločenih profilih. Testni kviz je veljaven, neobjavljen, nenačrtovan in nearhiviran osnutek.

Uporabi [skupno pripravo okolja in vprašanji](README.md). Naslov kviza: `N3-Ismar-Objava-01-<oznaka izvedbe>`, časovna omejitev: **5 minut**. Pred izvedbo zapiši dejanski naslov in kategorijo spodaj. Scenariji uporabljajo ločene kvize in niso odvisni od uspeha drugih scenarijev.

## Koraki in rezultati

| Korak | Dejanje | Pričakovani rezultat | Dejanski rezultat | Dokazilo |
| --- | --- | --- | --- | --- |
| 1 | Kot običajni uporabnik odpri `/quizzes`, odstrani filtre in poišči točen naslov testnega kviza. | Kviza ni na uporabniškem seznamu. | Iskanje N3-Ismar vrne 0 kvizov (No quizzes found). | [Posnetek](dokazila/ISM-FT-01_02_pred_objavo.png) |
| 2 | V administratorskem profilu odpri `/admin` in poišči isti kviz. | Kviz obstaja in je označen kot osnutek. | Testni kviz je Draft, General, 2 vprašanji, 5 minut, Not scheduled. | [Posnetek](dokazila/ISM-FT-01_01_osnutek.png) |
| 3 | Pri kvizu izberi takojšnjo objavo (po potrebi odpri meni dejanj) in potrdi, če aplikacija to zahteva. | Objava uspe; prikazano je objavljeno stanje. | Testni kviz je Published; prikazano število objavljenih kvizov se poveča s 5 na 6. | [Posnetek](dokazila/ISM-FT-01_03_objavljeno.png) |
| 4 | V uporabniškem profilu osveži `/quizzes`, odstrani filtre in poišči naslov. | Objavljeni kviz je viden. | Iskanje N3 vrne testni kviz z 2 vprašanjema in omejitvijo 5 minut. | [Posnetek](dokazila/ISM-FT-01_04_uporabniski_seznam.png) |
| 5 | Odpri podrobnosti kviza. | Naslov in časovna omejitev ustrezata podatkom; uporabniku je omogočen začetek reševanja. Kviza še ne začni. | Podrobnosti kažejo pravilen naslov, opis, Published, General, 2 vprašanji, 5 minut in gumb Start quiz. | [Posnetek](dokazila/ISM-FT-01_05_podrobnosti.png) |

## Zapis dejanske izvedbe

| Polje | Vrednost ob izvedbi |
| --- | --- |
| Datum in čas začetka/konca | 2. 11. 2026; posnetki po imenih izvornih datotek 17:34:12–17:38:14 (točen začetek/konec izvedbe ni zabeležen). Čas objave v aplikaciji je 04:37 PM; časovni pas ni potrjen. |
| Izvajalec | Ismar; teste sem izvedel ročno. |
| Commit aplikacije | `0d4ba0e602dcb2a743c75175e3ef5a84b6e0d6d2` (zabeležil sem ga po izvedbi). |
| Naslov okolja | Lokalni Docker Compose, http://localhost:3000 (okolje sem pripravil z Docker Compose). |
| OS, brskalnik in različica | EndeavourOS; Firefox 158.0.1 (64-bit), potrjeno s [posnetkom](dokazila/okolje_firefox.png). |
| Oznaki računov in vlog (brez gesel) | Administratorski profil I; ločen običajni profil T (uporabil sem ločena profila). |
| Dejanski naslov, ID kviza in kategorija | N3-Ismar-Objava-01; ID ni zabeležen; General. |
| ID/URL poskusa, če je uporabljen | Ni potreben; scenarij ne vključuje začetka reševanja. |
| Pripravljenost predpogojev in podatkov | Dostop obeh profilov in stanje osnutka potrjena z dokazili; prikazani 2 vprašanji in 5 minut. Vsebina vprašanj se v tem scenariju ni preverjala. |
| Dejanski skupni rezultat | Osnutek pred objavo ni viden uporabniku; po objavi je viden in omogoča začetek reševanja. |
| Status | PASS |
| Odstopanje: korak, pričakovano, dejansko | Funkcionalnih odstopanj na dokazilih ni. Uporabljeni iskalni predponi N3-Ismar in N3 namesto celotnega naslova. Admin osnutek zajet pred iskanjem brez zadetkov. Naslov brez dodatne oznake izvedbe. |
| Dokazila / povezava na napako | Pet posnetkov v mapi dokazila, povezave pri posameznih korakih. |

Scenarij sem izvedel ročno in na podlagi opažanj ter priloženih dokazil določil rezultat PASS. Podatke o OS, brskalniku in commitu sem dopolnil po izvedbi. Izvorne posnetke sem ohranil brez urejanja.
