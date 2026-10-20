# Naloga 2 – testi enot

## Izbrane enote in pričakovano vedenje

Izbral sem tri enote iz Go backend-a, ker imajo pomembno poslovno oziroma
validacijsko logiko, so deterministične in jih je mogoče preveriti brez
podatkovne baze:

1. **`ScoreAttempt`** (`internal/httpapi/shared/scoring.go`)  
   Izračuna dosežene in največje možne točke kviza. Upošteva samo pravilen
   odgovor, ki pripada isti nalogi kot odgovor uporabnika. Neznani, napačni ali
   odgovori iz druge naloge ne prinesejo točk. Največje število točk vključuje
   tudi neodgovorjene naloge.
2. **`SortLeaderboardEntries`** (`internal/httpapi/shared/scoring.go`)  
   Uredi lestvico po doseženih točkah padajoče. Če imata uporabnika enako
   število točk, zmaga krajši čas reševanja. Manjkajoč čas je najslabši
   izenačevalni kriterij. Funkcija mora varno obravnavati tudi prazen seznam in
   seznam z enim elementom.
3. **`IsQuizPublishLocked`** (`internal/httpapi/quizzes/publish_quiz.go`)  
   Arhiviran kviz je vedno zaklenjen. Kviz z objavo v prihodnosti je odklenjen,
   objava ob točnem času ali v preteklosti pa je zaklenjena. To pravilo je
   pomembno za pravilno objavljanje in ponovno razporejanje kvizov.

Mock objekti niso uporabljeni, ker izbrane funkcije nimajo zunanjih odvisnosti,
I/O ali podatkovne baze. Testne datoteke vsebujejo uvodni komentar z
utemeljitvijo izbire in opisom pravil.

## Preverjanje testov in namerne napake

Testi so black-box, tabelarični testi v ogrodju Go `testing`. Pokrivajo
običajne primere, robne vrednosti, neveljavne oziroma sumljive vhode ter
pogoje, ki morajo povzročiti zaklep. Za vsako testirano funkcijo je pripravljena
tudi namerno napačna različica:

- `scoring-faulty.go` vsebuje `ScoreAttemptFaulty` z napačnim preverjanjem
  pripadnosti odgovora nalogi in napačnim izračunom največjega števila točk;
  vsebuje tudi `SortLeaderboardEntriesFaulty` z obrnjenim vrstnim redom točk
  in napačno obravnavo manjkajočega časa;
- `publish_quiz-faulty.go` vsebuje `IsQuizPublishLockedFaulty` z napačnim
  ravnanjem pri arhiviranih kvizih in z obrnjenim pravilom za prihodnji datum.

Pripona `-faulty` v imenu datoteke označuje kopijo enote, namenjeno samo tej
nalogi. Ker Go v istem paketu ne more imeti dveh funkcij z enakim imenom,
imajo faulty funkcije še pripono `Faulty`. Aplikacija uporablja originalne
funkcije; faulty datoteke niso vključene v produkcijske klice. Testi trenutno
kličejo funkcije `*Faulty`, zato morajo z namernimi napakami odpovedati. Za
preverjanje pravilnih enot je treba v testih `Faulty` zamenjati z imenom
originalne funkcije, kot je navedeno v uvodnem komentarju vsakega testa.

Preverjanje v modulu `backend`:

```text
go test ./private/tests/shared ./private/tests/quizzes
```

Pričakovani rezultat pri faulty različicah je neuspeh testov, kar potrdi, da
testi napake zaznajo. Po zamenjavi klicev z originalnimi funkcijami testi
uspešno preverijo produkcijsko vedenje.


## Cevovod

Spremembe cevovoda bo pushal nekdo drug iz ekipe.

## Testi

- `scoring_quality_test.go` – testi za točkovanje;
- `leaderboard_quality_test.go` – testi za razvrščanje lestvice;
- `publish_lock_quality_test.go` – testi zaklepanja objave;

Testi so v projektu shranjeni na:

- `backend/private/tests/shared/scoring_quality_test.go`;
- `backend/private/tests/shared/leaderboard_quality_test.go`;
- `backend/private/tests/quizzes/publish_lock_quality_test.go`.
