# Naloga 2 – testi enot

## Izbrane enote in pričakovano vedenje

Izbrane tri enote iz Go backenda, ker vsebujejo validacijo, mejne pogoje
oziroma pomembno poslovno logiko:

1. **`DecodeJSON`** (`internal/httpapi/shared/http.go`)  
   Dekodira natanko en veljaven JSON objekt. Sprejeti mora pravilna in manjkajoča
   neobvezna polja ter presledke okoli dokumenta. Z napako mora zavrniti neznana
   polja, napačne podatkovne tipe, neveljavno sintakso, prazno telo in dodaten
   JSON dokument.
2. **`NormalizeLimit`** (`internal/httpapi/shared/http.go`)  
   Za vrednosti, manjše ali enake nič, vrne privzeto omejitev `20`. Vrednosti od
   `1` do `100` pusti nespremenjene, večje vrednosti pa omeji na `100`.
3. **`UpdateAttemptStatus`**
   (`internal/httpapi/attempts/update_attempt_status.go`)  
   Preveri ID kviza in prijavljenega uporabnika, veljavnost JSON-a, obstoj ter
   stanje poskusa, časovno omejitev in pripadnost vprašanja ter odgovora. Veljavne
   odgovore shrani in vrne rezultat; pričakovane napake vrnejo ustrezen HTTP
   status in stabilno JSON kodo napake.

Pri prvih dveh enotah mocki niso potrebni. Test `UpdateAttemptStatus` uporablja
`go-sqlmock`: javni HTTP handler in pravi `sqlc.Queries` se izvajata brez prave
podatkovne baze, vse pričakovane SQL interakcije pa so preverjene.

## Preverjanje testov in namerne napake

Uporabljeno je Go ogrodje `testing`, testi so black-box in tabelarični. Imena
podtestov opisujejo pričakovano vedenje. Skupaj je 37 scenarijev:

- `DecodeJSON`: 8 običajnih, robnih in neveljavnih vhodov;
- `NormalizeLimit`: 13 vrednosti, vključno z `MinInt32` in `MaxInt32`;
- `UpdateAttemptStatus`: 16 vej handlerja, vključno z napakami baze.

Napake so bile vnesene v testirane enote, ne v teste. Skripta
`backend/scripts/demonstrate_mutations.ps1` za vsako preverjanje naredi začasno
kopijo backenda, spremeni samo produkcijsko datoteko in požene nespremenjen test.
Preverjenih je šest mutacij oziroma po dve na enoto:

- `DecodeJSON`: odstranjena zavrnitev neznanih polj in dodanega dokumenta;
- `NormalizeLimit`: napačna privzeta vrednost `10` in napačna zgornja meja `200`;
- `UpdateAttemptStatus`: odstranjena zavrnitev končanega poskusa in preverjanje,
  ali odgovor pripada vprašanju.

Vseh šest spremenjenih enot je povzročilo pričakovan `FAIL`; izpisi so v
`docs/test-evidence/01-*.txt` do `06-*.txt`. Produkcijske datoteke se po
preverjanju ne spreminjajo, zato običajna zbirka testov ostane uspešna. Ločen
primer `07-intentional-wrong-expectation.txt` samo demonstrira, kako test izpiše
napačno pričakovano vrednost, in ni del končnih testov.

Ob padcu podtest izpiše dejansko ter pričakovano vrednost, HTTP status oziroma
kodo napake. Ukaz `go test` vrne neničelno izhodno kodo, zato se ustavi tudi
GitHub Actions backend job.

Preverjanje treh enot v modulu `backend`:

```text
go test -count=1 -run "^(TestDecodeJSON|TestNormalizeLimit|TestUpdateAttemptStatus)$" ./private/tests/shared
go vet ./...
go build ./...
```


## Cevovod

Backend korak v `.github/workflows/ci.yml` požene teste z
`-coverpkg=./... -coverprofile=coverage.out`. Neuspešen test ustavi job, povzetek
pokritosti se izpiše v log, datoteka `backend/coverage.out` pa se naloži kot
artefakt `backend-coverage` tudi ob neuspehu naslednjega koraka.

## Pregled drugih testov

Pregledani so bili tudi obstoječi testi za avtentikacijski kontekst, HTTP
pomožne funkcije, pretvorbe `NULL` vrednosti, preslikavo kviza, točkovanje,
lestvico in zaklep objave kviza.

Izboljšan je bil obstoječi `TestParseIDParam` v
`backend/private/tests/shared/http_test.go`. Prej je preverjal samo običajen
pozitiven ID, ničlo in besedilo. Zdaj tabelarično preverja sedem primerov:
običajen pozitiven ID, največji `int32`, manjkajoč ID, negativen ID, ničlo,
besedilo in prekoračitev `int32` (`2147483648`).

Novi robni primer je odkril napako v enoti `ParseIDParam`: uporaba
`strconv.Atoi` je na 64-bitnem sistemu sprejela število, večje od `int32`, nato
pa ga je pretvorba v `int32` prevesila v negativno vrednost. Enota zdaj uporablja
`strconv.ParseInt(value, 10, 32)`, zato je obseg preverjen pred pretvorbo. Test
faila, če je ID manjkajoč, neštevilski, manjši ali enak nič oziroma izven obsega
`int32`, ali če veljaven ID ne vrne pričakovane vrednosti.

