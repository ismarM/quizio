# Naloga 6 – Upravljanje napak (Ismar)

Izvajalec: Ismar. Datum izvedbe: 24. 11. 2026.

Uporabil sem skupno **Jira Cloud**, projekt [quizio (KAN)](https://pako25.atlassian.net/jira/software/projects/KAN/boards/2). Orodje je že pripravil Patrik; oblačna različica ne zahteva lokalne namestitve. Patrik je že vpisal KAN-4 za svoj TC-01-03. Njegovega zapisa in nastavitev nisem spreminjal.

## Nastavitve evidence

Preverjene možnosti polja **Tip napake**: Napaka, Pomanjkljivost, Nedoslednost. Polje **Kritičnost** ima štiri možnosti: Nizka, Srednja, Visoka, Kritično. Uporabljam izbirno kritičnost `customfield_10052`; obstaja tudi starejše istoimensko številsko polje `customfield_10045`, ki ga ne uporabljam. Prioriteta je ločeno polje.

Pomen nivojev za moje zapise: nizka pomeni manjšo motnjo brez vpliva na rezultat; srednja oteženo izvedbo s ponovljivim obvozom; visoka možnost izgube uporabnikovega dela ali napačnega rezultata; kritična onemogočeno jedrno delovanje za večino uporabnikov oziroma obsežno izgubo podatkov. Ni treba umetno ustvariti napake za vsak nivo.

Stanja plošče: Novo, V delu, Popravljeno, V preverjanju, Ponovno odprto, Zaprto. Moja zapisa ostajata v stanju Novo, saj aplikacijske kode pri tej nalogi nisem popravljal. Po popravku je treba ponoviti isti preizkus in šele nato napako zapreti ali ponovno odpreti.

Oba zapisa vsebujeta ime, opis, dejanski in pričakovani rezultat, stanje, tip, kritičnost, prioriteto, commit, brskalnik, OS, ID scenarija, postopek ponovitve, zadolženega in povezave na dokazila. Jira samodejno hrani poročevalca ter datum nastanka in posodobitve. Rok odprave ni določen; rok oddaje naloge ni samodejno rok za popravek aplikacije.

## Okolje in metoda

Commit aplikacije: `d1f40f152a2f7b08822a7fa61ca9e2b1d9d10ad6`. Linux, Chromium 156.0.8078.4, Playwright headless. Frontend `http://localhost:3001`, Go API `http://localhost:18081`, PostgreSQL baza `quizio_ismar_e2e`, obstoječa namenska uporabnika iz naloge 5. Uporabljene so bile lokalne ignorirane nastavitve prejšnjega testnega worktreeja. Gesla in seje niso vključeni v oddajo. Baze appdb nisem spreminjal in skupnih destruktivnih seed/cleanup skript nisem zagnal.

Ponovno sem izvedel prvotne teste ISM-FT-01, ISM-FT-02 in ISM-FT-03: **3 uspešni testi (1,9 minute)**. Dokazila tega teka so v lokalnem Playwright poročilu `testing/functional_testing/ismar/playwright-report`. Prejšnja namerna mutacija iz naloge 5 ni odprta napaka in ni del te evidence.

Scenarija ISM-FT-02 in ISM-FT-03 sem razširil na neuspešno oddajo oziroma shranjevanje. Playwright prestreže samo izbrano zahtevo in vrne HTTP 500; ostala aplikacija in baza sta resnični. S tem preverjam odziv aplikacije na neuspeh, ne pogostosti napak strežnika. Koda aplikacije ni spremenjena. Pri ISM-FT-03 uporabim reload kot ponovljivo ponovno odprtje stanja; prvotni test še vedno preverja dejansko zaprtje zavihka in 20-sekundno prekinitev.

## Identificirane napake

- [KAN-5](https://pako25.atlassian.net/browse/KAN-5), **Napaka / Visoka**, ISM-FT-03: po neuspešnem PATCH je odgovor označen in števec povečan, API pa ima `responses=[]`. Ob ponovnem nalaganju izbira izgine. Uporabnik ne dobi opozorila, da odgovor ni shranjen. [Podatki](dokazila/save.json), [posnetek](dokazila/save.png).
- [KAN-6](https://pako25.atlassian.net/browse/KAN-6), **Pomanjkljivost / Srednja**, ISM-FT-02: po neuspešnem POST finish aplikacija poskuša prikazati rezultat, nato se vrne na aktivno reševanje brez vidnega opozorila. Poskus ostane nedokončan, čas teče naprej. [Podatki](dokazila/finish.json), [posnetek](dokazila/finish.png).
- ISM-FT-01: v izvedenem obsegu ni zaznane funkcionalne napake; brez izmišljenega vnosa v Jiro.

## Ponovitev in oddaja

Iz mape `testing/functional_testing` ob pripravljenem okolju naloge 5:

```sh
npx playwright test --config ismar/playwright.config.ts
npx playwright test --config ismar/errors.config.ts
```

Drugi ukaz potrjuje opaženo napačno vedenje (karakterizacijska testa), zato uspešen test pomeni potrjeno reprodukcijo, ne odpravljeno napako. Prvi poskus novih testov je imel napačno pričakovanje `null` namesto odsotnega polja in napačno pričakovanje končnega URL-ja; po pregledu dejanskih odzivov sem popravil testno kodo ter ponovil izvedbo. To niso dodatne aplikacijske napake.

Za oddajo sta pripravljena [CSV izvoz](napake.csv) (UTF-8 BOM, ločilo podpičje) in [JSON izvoz](napake.json). Gre za izvoz dejanskih zapisov KAN-5 in KAN-6 prek Jira REST API v prijavljeni seji, s sploščenimi dokumentnimi polji za berljivost. Izvoz vključuje vse vsebinske informacije mojih prijav. Patrikova napaka ni vključena. Priloženi so [izpis reprodukcije](dokazila/robni-testi.txt), posnetki in podatki odzivov. Celotne sledi z morebitnimi prijavnimi podatki ostanejo lokalne.

Pri pripravi in izvedbi sem uporabil AI-asistenta. Omejitev: preverjen je Chromium in lokalno okolje, ne drugi brskalniki ali produkcija. Naloga je pripravljena za oddajo; oddaja v učilnico ni izvedena.
