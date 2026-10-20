# Testiranje enot v projektu Quizio

Dokument opisuje stanje po izvedbi 20. oktobra 2026. Običajna zbirka vsebuje tri tabelarične teste s skupaj 37 podtesti za izbrane enote. Vsi navedeni podtesti so v končni, nepokvarjeni različici uspešni.

## Izbrane enote

### `DecodeJSON`

- Lokacija: `backend/internal/httpapi/shared/http.go`
- Namen: dekodira en JSON dokument, zavrne neznana polja, neveljavno sintakso, prazen body, napačne tipe in dodatne dokumente.
- Utemeljitev: funkcija je skupna vhodna meja več HTTP handlerjev; preveč permisivno dekodiranje lahko skrije napake odjemalca.
- Pričakovano vedenje: veljaven objekt se dekodira v ciljno strukturo, vsi neveljavni ali dodatni podatki vrnejo napako.

### `NormalizeLimit`

- Lokacija: `backend/internal/httpapi/shared/http.go`
- Namen: normalizira število rezultatov strani.
- Utemeljitev: gre za majhno čisto funkcijo z jasnimi robnimi vrednostmi, zato je primerna za tabelarični test.
- Pričakovano vedenje: vrednosti `<= 0` vrnejo `20`, interval `1..100` ostane nespremenjen, večje vrednosti vrnejo `100`.

### `UpdateAttemptStatus`

- Lokacija: `backend/internal/httpapi/attempts/update_attempt_status.go`
- Namen: preveri uporabnika, poskus, časovno stanje, pripadnost vprašanja in odgovora ter veljaven odgovor shrani.
- Utemeljitev: handler vsebuje več varnostnih in poslovnih vej, pri katerih napačen vrstni red ali izpuščeno preverjanje omogoči nedovoljen zapis.
- Pričakovano vedenje: samo veljaven odgovor aktivnega uporabnikovega poskusa vrne HTTP 200 in se shrani; ostali primeri vrnejo ustrezen status in JSON kodo napake.

Vsi trije testi so v `backend/private/tests/shared`: `decode_json_test.go`, `normalize_limit_test.go` in `update_attempt_status_test.go`. Handler uporablja `go-sqlmock`, ki simulira odgovore konkretnega `*sql.DB`; zato produkcijski `Handler` ni dobil testnih polj ali posebnega konstruktorja. Testi ne uporabljajo `time.Sleep`, prave baze, omrežja ali Firebase storitev.

## Testni primeri

### `TestDecodeJSON` — 8 podtestov

| Podtest | Vhod | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|
| `decodes_valid_object` | objekt z obema znanima poljema | brez napake, `name=quiz` | brez napake, podatki pravilni | PASS |
| `accepts_missing_optional_field` | objekt brez neobveznega polja | brez napake, `name=quiz` | brez napake, podatki pravilni | PASS |
| `rejects_unknown_fields` | dodatno polje `extra` | napaka | napaka | PASS |
| `rejects_invalid_syntax` | nedokončan objekt | napaka | napaka | PASS |
| `rejects_empty_body` | prazen body | napaka | napaka | PASS |
| `rejects_second_JSON_object` | dva zaporedna objekta | napaka | napaka | PASS |
| `rejects_wrong_data_type` | število namesto niza | napaka | napaka | PASS |
| `accepts_surrounding_whitespace` | veljaven objekt s presledki | brez napake, `name=quiz` | brez napake, podatki pravilni | PASS |

### `TestNormalizeLimit` — 13 podtestov

Pričakovane vrednosti so zapisane neposredno in niso izračunane s testirano funkcijo ali njenima konstantama.

| Podtest/vhod | Pričakovano | Dejansko | Status |
|---|---:|---:|---|
| `minimum_int32_uses_default` / `-2147483648` | 20 | 20 | PASS |
| `negative_ten_uses_default` / `-10` | 20 | 20 | PASS |
| `negative_one_uses_default` / `-1` | 20 | 20 | PASS |
| `zero_uses_default` / `0` | 20 | 20 | PASS |
| `one_is_unchanged` / `1` | 1 | 1 | PASS |
| `nineteen_is_unchanged` / `19` | 19 | 19 | PASS |
| `twenty_is_unchanged` / `20` | 20 | 20 | PASS |
| `fifty_is_unchanged` / `50` | 50 | 50 | PASS |
| `ninety_nine_is_unchanged` / `99` | 99 | 99 | PASS |
| `one_hundred_is_unchanged` / `100` | 100 | 100 | PASS |
| `one_hundred_one_is_capped` / `101` | 100 | 100 | PASS |
| `five_hundred_is_capped` / `500` | 100 | 100 | PASS |
| `maximum_int32_is_capped` / `2147483647` | 100 | 100 | PASS |

### `TestUpdateAttemptStatus` — 16 podtestov

| Podtest | Ključni vhod oziroma stanje SQL mocka | Pričakovano | Dejansko | Status |
|---|---|---|---|---|
| `accepts_valid_active_attempt_and_answer` | aktivni poskus, vprašanje 11, odgovor 21 | 200, en zapis | 200, en zapis | PASS |
| `rejects_missing_quiz_id` | manjka `quizId` | 400 / `invalid_quiz_id`, brez zapisa | enako | PASS |
| `rejects_invalid_quiz_id` | `quizId=abc` | 400 / `invalid_quiz_id`, brez zapisa | enako | PASS |
| `rejects_unauthenticated_user` | ni uporabnika v contextu | 401 / `unauthorized`, brez zapisa | enako | PASS |
| `rejects_invalid_JSON` | nedokončan JSON | 400 / `invalid_payload`, brez zapisa | enako | PASS |
| `returns_not_found_for_missing_attempt` | `sql.ErrNoRows` | 404 / `not_found`, brez zapisa | enako | PASS |
| `rejects_finished_attempt` | `TimeTaken.Valid=true` | 409 / `attempt_finished`, brez zapisa | enako | PASS |
| `rejects_expired_attempt` | začetek pred časovno omejitvijo | 409 / `attempt_expired`, brez odgovora, ena finalizacija | enako | PASS |
| `rejects_inactive_attempt` | `IsActive=false` | 409 / `attempt_expired`, brez odgovora, ena finalizacija | enako | PASS |
| `rejects_invalid_question_id` | `question_id=0` | 400 / `invalid_payload`, brez zapisa | enako | PASS |
| `rejects_invalid_answer_id` | `answer_id=0` | 400 / `invalid_payload`, brez zapisa | enako | PASS |
| `rejects_question_from_another_quiz` | vprašanje pripada kvizu 8 namesto 7 | 400 / `invalid_payload`, brez zapisa | enako | PASS |
| `rejects_answer_from_another_question` | seznam dovoljenih odgovorov ne vsebuje 21 | 400 / `invalid_payload`, brez zapisa | enako | PASS |
| `handles_attempt_database_error` | napaka pri `GetAttemptWithQuiz` | 500 / `get_attempt_failed`, brez zapisa | enako | PASS |
| `handles_answer_lookup_database_error` | napaka pri `ListAnswersByQuestion` | 500 / `load_answers_failed`, brez zapisa | enako | PASS |
| `handles_answer_save_database_error` | napaka pri `UpsertAttemptQuestion` | 500 / `update_attempt_failed`, brez uspešnega zapisa | enako | PASS |

## Namerno vnesene napake

Skript `backend/scripts/demonstrate_mutations.ps1` vsako mutacijo izvede v novi začasni kopiji backenda. Izvorna koda v repozitoriju zato ostane pravilna. Skript najprej preveri osnovno zbirko, zahteva neuspeh vsake mutacije, izvede ločeni namerno napačni test in na koncu še enkrat preveri pravilno kodo.

| Enota | Namerno vnesena napaka | Test, ki jo zazna | Rezultat |
|---|---|---|---|
| DecodeJSON | odstranjen `DisallowUnknownFields` | `TestDecodeJSON/rejects_unknown_fields` | FAIL zaznan |
| DecodeJSON | odstranjeno dekodiranje drugega dokumenta | `TestDecodeJSON/rejects_second_JSON_object` | FAIL zaznan |
| NormalizeLimit | privzeta vrednost 20 spremenjena v 10 | podtesti za `limit <= 0` | FAIL zaznan |
| NormalizeLimit | zgornja vrnjena meja 100 spremenjena v 200 | podtesti za 101, 500 in `MaxInt32` | FAIL zaznan |
| UpdateAttemptStatus | odstranjeno preverjanje zaključenega poskusa | `TestUpdateAttemptStatus/rejects_finished_attempt` | FAIL zaznan (handler je nadaljeval obdelavo in vrnil 400 namesto 409) |
| UpdateAttemptStatus | odstranjeno preverjanje pripadnosti odgovora | `TestUpdateAttemptStatus/rejects_answer_from_another_question` | FAIL zaznan (handler je poskusil nedovoljen zapis in vrnil 500 namesto 400) |

Dejanski izpisi so v `docs/test-evidence/01-decode-unknown-fields.txt` do `06-answer-question-membership.txt`. Osnovni in končni uspešni zagon sta v `00-baseline-pass.txt` in `08-final-pass.txt`.

Ločena demonstracija napačnega pričakovanja se izvede samo v začasni kopiji testa: za vhod `50` začasno pričakuje `51`. Ne obstaja v običajni testni zbirki, njen dokaz pa je `07-intentional-wrong-expectation.txt`. Ta primer ni del šestih mutacij produkcijskih enot.

## Kakovost testov

Pred dopolnitvijo je test `DecodeJSON` pokrival samo veljaven objekt, neznano polje in dodatni dokument ter pri uspehu ni preverjal dekodiranih podatkov. `NormalizeLimit` je imel samo štiri primere in je pričakovane vrednosti deloma vezal na produkcijske konstante. Handler ni imel izoliranih unit testov.

Izboljšave:

- dodane so vse zahtevane normalne, robne in neveljavne poti;
- uspešno dekodiranje preveri tudi vsebino rezultata;
- pričakovane meje limita so literalne vrednosti;
- vsak handler scenarij preveri HTTP status in JSON kodo napake;
- SQL mock zahteva točno pričakovane poizvedbe in s tem zazna nedovoljeno shranjevanje;
- fiksni čas odstrani nedeterminističnost;
- podtesti so neodvisni, ker vsak dobi novo mock povezavo;
- noben test ne uporablja PostgreSQL, omrežja ali Firebase.

## CI in pokritost

Lokalni ukazi iz mape `backend`:

```bash
go test -count=1 -run '^(TestDecodeJSON|TestNormalizeLimit|TestUpdateAttemptStatus)$' ./private/tests/shared
go test -race ./...
go test -coverpkg=./... -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
go vet ./...
go build ./...
```

Rezultati izvedbe 20. oktobra 2026:

- ciljni zagon vseh 37 tukaj dodanih scenarijev: PASS;
- šest mutacij: vseh šest pričakovano FAIL;
- končni ponovni zagon: PASS;
- `go vet ./...`: PASS;
- `go build ./...`: PASS;
- celotni `go test ./...` po pullu `db88a33`: FAIL samo v Patrikovih testih, ki
  namenoma kličejo tri funkcije `*Faulty`; testi iz tega poročila v istem stanju
  uspejo in tujih testov nismo spreminjali;
- `go test -race ./...`: ukaz je bil izveden, vendar lokalno ni mogel zgraditi race instrumentacije, ker Windows okolje nima C prevajalnika `gcc`; to ni bilo prikazano kot uspeh;
- skupna pokritost vseh backend paketov pred pullom `db88a33`: 12,1 %;
- `DecodeJSON`: 100,0 %, `NormalizeLimit`: 100,0 %, `UpdateAttemptStatus`: 94,2 %.

GitHub Actions ohranja obstoječa `go vet`, `staticcheck` in build preverjanja ter doda:

```bash
go test -v -coverpkg=./... -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

Testni korak nima `continue-on-error`, zato neuspešen test označi backend job kot neuspešen. Povzetek pokritosti in nalaganje `backend/coverage.out` uporabljata `if: always()`, zato se že ustvarjeno poročilo naloži kot artifact `backend-coverage` tudi po neuspehu poznejšega testa oziroma delno neuspešnem testnem zagonu.

