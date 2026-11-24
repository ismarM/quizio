# Poročilo funkcionalnega testiranja – Naloga 6

## Okolje in obseg

Funkcionalno testiranje sem izvedel 24. 11. 2026 na commitu
`d1f40f152a2f7b08822a7fa61ca9e2b1d9d10ad6`. Uporabil sem lokalni Docker
Compose sklad z Next.js, Go backendom in PostgreSQL 16 ter obstoječe namenske
Firebase račune iz Naloge 5. Gostitelj je poročal različico Windows
`10.0.26300.0`; uporabil sem Playwright 1.64.1, Chromium 156.0.8078.4 in
Firefox 157.0.

Nisem spreminjal aplikacijske kode, nalog drugih študentov ali skupnega CI/CD.
Ustvarjal sem samo kvize s predpono `N6-Omar` in vse svoje kvize na koncu
arhiviral. Zaradi timeouta je en kviz ostal aktiven; preveril sem njegov ID in
točen naslov ter ga naknadno arhiviral. Skupne baze nisem čistil.

## Rezultati

Najprej sem brez sprememb ponovno izvedel tri obstoječe teste. V Chromiumu so
vsi uspeli: OMR-FT-01 v 28,8 s, OMR-FT-02 v približno 1,5 minute in OMR-FT-03
v 41,3 s. Prvi omejeni zagon ni mogel doseči Firebase in sem ga pravilno
razvrstil kot težavo testnega okolja; veljavna ponovitev je bila 3/3 PASS.

Nato sem dodal pet raziskovalnih testov in jih izvedel v obeh brskalnikih.
Končni uradni nabor vsebuje 13 izvedb: **10 PASS in 3 FAIL**. Trije neuspehi
predstavljajo **dve različni potrjeni funkcionalni napaki**:

1. OMR-FT-03: administratorski REST GET lestvice skozi BFF dosledno vrne 404,
   čeprav backend endpoint obstaja. Napaka se pojavi v Chromiumu in Firefoxu.
2. OMR-FT-02: Firefox ob dirki avtomatskega in ročnega zaključka prejme tri
   uspešne odgovore 200, vendar ne preide na stran rezultata. Ponovljivost je
   2/2; strežniško stanje ostane pravilno.

## Pokritost dodatnih preverjanj

Pri RBAC sem preveril neposredne dostope brez seje in z navadnim uporabnikom,
nedovoljene create/edit/publish/archive zahteve, nespremenjenost baze, odjavo in
Back, ponovno objavo ter neposreden nepodpisan klic backenda. Vsa preverjanja
so uspela; druga objava istega kviza je pravilno vrnila 409 `quiz_locked`.

Pri časovniku sem preveril dejanski 60-sekundni iztek, reload, zaprtje in
ponovno odprtje, dva zavihka, začasen izpad povezave, mejni in pozni odgovor,
sočasne zaključke ter končno stanje API-ja in baze. Obnovitev in integriteta
podatkov sta pravilni v obeh brskalnikih. Potrjena je samo opisana Firefoxova
navigacijska napaka.

Pri SSE sem preveril posodobitev brez reload, dva skoraj sočasna zaključka,
restart lokalnega backenda, samodejno ponovno povezavo, točkovni in časovni
vrstni red, enaka rezultata, odsotnost podvojenih vrstic ter primerjavo z bazo.
SSE, UI in baza so bili pravilni. Primerjava z REST API-jem je razkrila 404 na
BFF poti.

## Razvrstitev odstopanj in dokazila

Med pripravo sem odpravil tri predpostavke dodatnega testa: ponovna objava je
namerno 409, obnovljeni poskus odpre prvo neodgovorjeno vprašanje, brskalniška
nastavitev offline pa ne prekine že odprte SSE povezave dovolj zanesljivo.
SSE prekinitev sem zato izvedel z nadzorovanim restartom lokalnega backenda.
To so bile težave avtomatizacije, ne napake aplikacije.

Prehodna Firebase prijavna napaka v prvem Firefox SSE teku je bila težava
okolja; veljavna ponovitev je prišla do konca. Namerne napake časovnika iz
Naloge 5 nisem ponovno vnašal in je ne prijavljam.

Playwrightove `trace.zip` datoteke sem po analizi odstranil, ker vsebujejo
sejne piškotke. Ohranil sem posnetke zaslona, HTML poročili brez ZIP sledi in
redigirane besedilne povzetke v `dokazila/`. Podrobni Jira bloki so v
`JIRA_NAPAKE.md`, vsi uradni rezultati pa v `rezultati_testiranja.csv`.
