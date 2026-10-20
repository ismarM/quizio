# Naloga 2 – Testiranje enot

Projekt Quizio ima frontend v Next.js, backend v Go in podatkovno bazo PostgreSQL. Pred pisanjem testov sem pregledal strukturo projekta, Go handlerje in pomožne funkcije, SQL migracije, obstoječe teste, primera v mapah `omar` in `patrik` ter `.github/workflows/ci.yml`.

Frontend trenutno nima nastavljenega Vitesta ali drugih testov. Backend že uporablja standardni Go paket `testing`, `httptest` in pri testih handlerjev tudi `go-sqlmock`. Za svojo nalogo sem izbral tri backend enote, ker jih je mogoče zanesljivo testirati brez prave baze, Firebase, omrežja ali drugih zunanjih storitev.

## Izbrane enote

### 1. `ScoreAttempt`

Lokacija je `backend/internal/httpapi/shared/scoring.go`. Funkcijo sem izbral, ker izvaja dejanski izračun doseženih in vseh možnih točk ter preverja pravilnost in pripadnost odgovora vprašanju.

Pričakovano vedenje:

- največje število točk je vsota vrednosti vseh vprašanj, tudi če katero ni odgovorjeno;
- točke se prištejejo samo za pravilen odgovor, ki pripada navedenemu vprašanju;
- napačen, neznan ali tujemu vprašanju pripisan odgovor ne prinese točk;
- prazen kviz vrne `(0, 0)`, kviz brez odgovorov pa `(0, vsota vprašanj)`;
- decimalne in ničelne vrednosti vprašanj se pravilno upoštevajo.

Primer: vprašanji, vredni `2,5` in `1,5`, imata skupaj `4` možne točke. Če je pravilen samo odgovor na prvo vprašanje, je rezultat `(2,5, 4)`.

### 2. `IsQuizPublishLocked`

Lokacija je `backend/internal/httpapi/quizzes/publish_quiz.go`. Funkcijo sem izbral, ker združuje stanje arhiviranja, nullable datum objave in časovno mejo.

Pričakovano vedenje:

- arhiviran kviz je vedno zaklenjen;
- kviz brez veljavnega datuma objave je odklenjen;
- datum v prihodnosti pomeni, da kviz še ni objavljen in je odklenjen;
- datum, ki je enak trenutnemu času ali je v preteklosti, pomeni zaklenjen kviz;
- pri `sql.NullTime{Valid: false}` se vsebina polja `Time` ne sme upoštevati.

Primer: ob času `12:00` je objava ob `12:00` že zaklenjena, objava eno nanosekundo pozneje pa še ni.

### 3. `IntegrityMiddleware`

Lokacija je `backend/internal/httpapi/IntegrityMiddleware.go`. Enoto sem izbral, ker ima več varnostnih in napakovnih vej: preverja skrivnost, časovni žig, HMAC podpis, pot z query parametri, identitetne glave in telo zahteve.

Pričakovano vedenje:

- zahteve za Swagger in zahteve z lokalnega naslova `127.0.0.1` se spustijo naprej brez podpisa;
- prazna strežniška skrivnost vrne HTTP `500` in kodo `server_error`;
- manjkajoč ali neveljaven časovni žig oziroma podpis vrne HTTP `401` in kodo `unauthorized`;
- časovni žig je dovoljen največ 10 sekund v preteklost ali prihodnost;
- podpis SHA-256 HMAC pokriva celoten `RequestURI`, časovni žig, tri identitetne glave in telo;
- sprememba query parametra, identitete ali telesa po podpisu mora biti zavrnjena;
- veljavna zahteva se preda naslednjemu handlerju, telo pa mora ostati berljivo.

Primer: pravilno podpisan `POST /api/quizzes?scope=mine` se izvede, po spremembi v `scope=all` pa vrne `401`.

## Testi in poimenovanje

Uporabil sem standardni Go paket `testing`. Vsi trije glavni testi so tabelarični in imajo obliko `TestFunkcija_Scenarij_PričakovaniRezultat`:

- `TestScoreAttempt_VariedResponses_ReturnsExpectedTotals`;
- `TestIsQuizPublishLocked_PublicationStates_ReturnExpectedLockState`;
- `TestIntegrityMiddleware_RequestValidation_ReturnsExpectedStatus`.

Skupaj vsebujejo 29 podtestov. Pričakovane vrednosti so zapisane neposredno iz zgornjih pravil in se ne računajo s testirano funkcijo. Testi pokrijejo običajne primere, prazne in mejne vrednosti, napačne in neznane podatke, vse pomembne pogojne veje ter HTTP napake.

Prava podatkovna baza in omrežje nista potrebna. Za middleware uporabljam `httptest.NewRequest`, `httptest.ResponseRecorder` in testni `next` handler, ki deluje kot mock ter preveri, ali je bila zahteva posredovana in ali je telo ostalo nespremenjeno. Časovna pravila objave uporabljajo fiksen čas. Pri HMAC testih sta stara in prihodnja časovna žiga dovolj oddaljena od meje, zato ni `time.Sleep` in testi ostanejo deterministični.

## Preverjanje z namernimi napakami

Skript `demonstrate_mutations.sh` naredi za vsako mutacijo novo začasno kopijo backenda. Požene samo ustrezen test in zahteva, da test pade. Kopijo nato izbriše, zato se namerna napaka nikoli ne zapiše v pravo produkcijsko kodo. Pred mutacijami in po vseh šestih mutacijah skript preveri pravilen baseline.

| Št. | Enota | Točna sprememba | Test, ki je napako zaznal |
|---:|---|---|---|
| 1 | `ScoreAttempt` | odstranjen `maxPoints += question.Value` | več podtestov: `maximum = 0, want 4` |
| 2 | `ScoreAttempt` | odstranjena veja `if answerQuestion[response.AnswerID] != response.QuestionID { continue }` | `correct_answer_attached_to_another_question_earns_no_points`: `achieved = 1.5, want 0` |
| 3 | `IsQuizPublishLocked` | odstranjena celotna veja `if state.IsArchived { return true }` | `archived_draft_is_locked` in `archived_future_quiz_remains_locked` |
| 4 | `IsQuizPublishLocked` | `!state.PublishDate.Time.After(now)` zamenjano z `state.PublishDate.Time.Before(now)` | `quiz_published_exactly_now_is_locked`: dobil `false`, pričakoval `true` |
| 5 | `IntegrityMiddleware` | `r.URL.RequestURI()` zamenjan z `r.URL.Path` | `valid_signature_forwards_request_and_restores_body`: status `401`, pričakovan `204` |
| 6 | `IntegrityMiddleware` | iz časovne kontrole odstranjen pogoj za preveč oddaljen prihodnji čas | `timestamp_too_far_in_the_future_is_unauthorized`: status `204`, pričakovan `401` |

Vseh šest mutacij je povzročilo pričakovan FAIL. Celotni izpisi so v mapi `test-evidence`, začetni rezultat je `00-baseline-pass.txt`, končni pa `07-final-pass.txt`.

## Pregled in izboljšanje kakovosti testov

Obstoječi `scoring_test.go` je preverjal osnovni izračun, ne pa praznega kviza, vseh pravilnih decimalnih odgovorov, ničelne vrednosti in neznanega vprašanja. Novi test doda te meje in ločeno preveri dosežene ter maksimalne točke.

Obstoječi `publish_quiz_test.go` ni preverjal najpomembnejše časovne meje, ko je datum objave natančno enak `now`. Prav tako ni preverjal neveljavnega `NullTime` z nepraznim časom in kombinacije arhiviranega kviza s prihodnjo objavo. Novi test doda vse tri scenarije.

Za `IntegrityMiddleware` prej ni bilo unit testov. Novi test preveri uspeh, vse glavne napake, obe smeri časovnega odmika, zaščito query parametrov, telesa in identitete ter oba dovoljena bypassa. Poleg statusa preverja JSON kodo napake, klic naslednjega handlerja in ohranitev telesa.

Pri izbranih pravilnih testih nisem našel testov brez assertionov ali testov, ki bi vedno uspeli. Našel pa sem demonstracijske teste `*Faulty`, ki namenoma kličejo pokvarjene funkcije in zato privzeti `go test ./...` vedno obarvajo rdeče. V CI so izločeni z `-skip 'Faulty'`; njihove datoteke in kolegove naloge niso bile spremenjene. Ismarjeve mutacije se namesto tega izvajajo samo na zahtevo in v začasnih kopijah.

## Ukazi

Ukazi se izvajajo iz `ZK_NALOGE/ZK-naloga2/ismar`:

```bash
go test -count=1 -v ./...
go test -count=1 -race ./...
go test -count=1 \
  -coverpkg=github.com/ismarM/quizio/internal/httpapi,github.com/ismarM/quizio/internal/httpapi/shared,github.com/ismarM/quizio/internal/httpapi/quizzes \
  -coverprofile=coverage.out ./...
go tool cover -func=coverage.out | tee coverage-summary.txt
go vet ./...
./demonstrate_mutations.sh
```

Za vse običajne backend teste brez namernih `*Faulty` demonstracij se iz mape `backend` uporabi:

```bash
go test -count=1 -skip 'Faulty' ./...
```

## Rezultati in pokritost

Lokalni rezultat 20. 10. 2026:

- 3 glavni tabelarični testi in 29 podtestov: PASS;
- `go test -race ./...`: PASS;
- `go vet ./...`: PASS;
- vseh 6 ločenih mutacij: pričakovan FAIL, torej so bile zaznane;
- končni zagon po mutacijah: PASS;
- `ScoreAttempt`: 100,0 %;
- `IsQuizPublishLocked`: 100,0 %;
- `IntegrityMiddleware`: 98,0 %;
- skupna pokritost treh širših paketov: 10,4 %. Ta odstotek vključuje tudi številne nepovezane HTTP handlerje, ki niso izbrane enote.

Ukaza za pokritost lokalno ustvarita `coverage.out` in `coverage-summary.txt` v tej mapi. Datoteki sta generirani in zato vključeni v `.gitignore`; CI ju kljub temu ustvari in shrani kot artifact.

## CI/CD

Repozitorij uporablja GitHub Actions. V `.github/workflows/ci.yml` je dodan job `Naloga 2 - Ismar (Go)`, ki ob pushu na `main`/`master` in ob pull requestu:

1. prenese Go odvisnosti;
2. požene teste z race detectorjem;
3. ponovno požene teste s `-coverprofile`;
4. izpiše `go tool cover -func`;
5. shrani `coverage.out` in `coverage-summary.txt` kot artifact `naloga2-ismar-coverage`.

Testni koraki nimajo `continue-on-error`, zato vsak nepričakovan neuspeh povzroči neuspeh joba in pipeline-a. Lokalno so bili preverjeni ukazi in struktura YAML. Dejanski zagon na GitHub Actions ter prenos artifacta je še treba potrditi po pushu na oddaljeni repozitorij.

## Uporabljena AI orodja

Pri pripravi naloge sem uporabil Codex. Drugih AI orodij nisem uporabil.
