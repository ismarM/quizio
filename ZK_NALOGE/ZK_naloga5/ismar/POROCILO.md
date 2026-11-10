# Poročilo avtomatiziranega funkcionalnega testiranja – Naloga 5

Izvajalec: Ismar. Datum: 10. 11. 2026.

Za svoje tri scenarije iz naloge 3 sem uporabil Playwright 1.64.1 s TypeScriptom in
Chromiumom v načinu headless. Uporabil sem obstoječi paket testnih odvisnosti.
Ločeni brskalniški seji sta mi omogočili preizkus administratorja in običajnega
uporabnika, zaprtje zavihka pa sem izvedel z dejanskim `page.close()`.

Teste sem izvedel lokalno na Linuxu, z Node.js 24.22.2, Next.js 16.2.6, Go API-jem in
PostgreSQL 16. Uporabil sem frontend `http://localhost:3001`, backend na vratih 18081,
bazo `quizio_ismar_e2e` ter razvojni Firebase `quizio-4d0c9` z dvema potrjenima
namenskima računoma. Izhodiščni commit je bil `41a6fbbe8f7742a1bcfd8b919fe225c41d454b88`,
z novimi testnimi datotekami v tem worktreeju. V `appdb` nisem posegal. Ustvarjenih
testnih kvizov nisem brisal in nisem uporabil skupnih seed/cleanup skript.

## Dejanski rezultati

- **Pred mutacijo: 3 PASS, 0 FAIL.** ISM-FT-01 je preveril odsotnost osnutka in dostop
  po objavi, ISM-FT-02 rezultat 2/5, 40 % in 1/2 pravilnih, ISM-FT-03 pa nadaljevanje
  istega poskusa z ohranjenim odgovorom in prvotnim začetnim časom.
  [Izpis teka](dokazila/01-pass.txt).
- **Z mutacijo: izvedel sem samo ISM-FT-02, rezultat 1 FAIL.** V `buildResultSummary`
  sem `totalScore += question.value` začasno zamenjal z `totalScore += 1`.
  Prikaz je postal 1/5 in 20 %, preverjanje pričakovanih 2/5 pa je padlo.
  [Sprememba](dokazila/02-mutacija.patch), [izpis FAIL](dokazila/02-fail.txt),
  [posnetek uporabniške strani iz sledi](dokazila/ISM-FT-02-namerna-napaka.jpeg).
- **Po obnovi: 3 PASS, 0 FAIL.** Obnovil sem izvorno datoteko in preveril, da je enaka
  različici v Git. Nato sem ponovno izvedel celoten nabor.
  [Dokaz obnove](dokazila/02-obnova.txt), [izpis teka](dokazila/03-pass.txt),
  [pravilen rezultat po obnovi](dokazila/ISM-FT-02-po-obnovi.png).

Pri zadnjem ISM-FT-03 sem izmeril R1 = 300 s, R2 = 276 s in pretečeni čas približno
23,39 s. Odstopanje od R1 − pretečeni čas je približno 0,61 s, torej znotraj prvotne
tolerance 5 sekund. Preveril sem pravi `attempt.id`, `start_time`, ohranjen odgovor 4
in uspešno nadaljnje shranjevanje Ljubljane. [Meritve](dokazila/ISM-FT-03-casi-po-obnovi.json).

Uspešna stanja pred mutacijo sem shranil tudi kot posnetke
[ISM-FT-01](dokazila/ISM-FT-01-pred-napako.png),
[ISM-FT-02](dokazila/ISM-FT-02-pred-napako.png) in
[ISM-FT-03](dokazila/ISM-FT-03-pred-napako.png).

## Omejitve in ponovitev

Med pripravo sem popravil lokator praznega seznama in čakanje na posodobitev URL-ja
pri iskanju. Ti začetni neuspehi testne kode niso dokaz namerne aplikacijske napake.
Opazil sem tudi začasno omrežno napako Firebase pri prijavi. Dovolil sem eno ponovitev
prijave izključno ob `auth/network-request-failed`, celotnih testov pa nisem samodejno
ponavljal. Aktivni gesli hranim samo v lokalni Git-ignorirani datoteki.

Testiral sem samo Chromium in te tri scenarije. GitHub Actions nisem izvajal in novega
workflowa nisem dodal. Odvisnosti, headless zagon, HTML-poročilo, posnetke in sledi sem
opisal v [navodilih](README.md). Celotnih poročil s sledmi ne objavljam, ker lahko
vsebujejo podatke prijave. Pri pripravi in zagonu sem uporabil AI-asistenta; zgornji
rezultati izhajajo iz dejanskih avtomatiziranih tekov.
