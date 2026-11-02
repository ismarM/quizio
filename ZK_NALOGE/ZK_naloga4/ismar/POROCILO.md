# Naloga 4 – Sistemsko testiranje: nenaden skok obremenitve

Izvajalec: Ismar. Status: **Izvedeno – FAIL**.

## Izbira in cilj

Izbral sem Grafana k6 in test nenadnega skoka obremenitve (spike test). Preveriti želim, kako se Quizio odzove ob hitrem povečanju sočasnih zahtev in ali po zmanjšanju obremenitve ponovno doseže sprejemljiv odzivni čas.

Patrik je v `../patrik/load_test_spec.md` pripravil load test strani `/quizzes` s postopnim dvigom do 50 VU in dve minuti stalne obremenitve. Moj test uporablja isto orodje, vendar drugo vrsto testa: kratek nenaden skok in preverjanje okrevanja. Razlika torej ni samo drug endpoint. Omarjevega načrta za Nalogo 4 v pregledanem lokalnem repozitoriju nisem našel; njegovo izbiro moramo še uskladiti v ekipi.

## Scenarij in predpogoji

Izbral sem `GET http://localhost:3000/api/proxy/categories`. Next.js preveri sejo, podpiše zahtevo za Go `GET /api/categories`, Go pa iz PostgreSQL prebere kategorije. Endpoint vrne JSON `{"categories":[{"id":1,"name":"..."}]}`. Handler `backend/internal/httpapi/quizzes/list_categories.go` in poizvedba `ListCategories` v `backend/internal/db/queries/queries.sql` samo bereta kategorije; ne ustvarjata kvizov ali poskusov.

Potrebujem lokalno zagnane Next.js, Go in PostgreSQL, veljavno sejo prijavljenega testnega uporabnika, vsaj eno kategorijo ter dosegljiv Firebase za preverjanje seje. Skripta v `setup()` preveri uspešen odziv in podatke; ob napačni pripravi prekine izvedbo pred obremenitvijo. Ne uporablja seeda ali čiščenja baze.

Merim celotno HTTP pot prek BFF, vključno s preverjanjem seje, ne samo Go ali baze. Vsi VU uporabljajo isto sejo; ne simuliram 20 različnih računov, prijav ali izrisa strani v brskalniku. Generator in aplikacija tečeta na istem računalniku, zato rezultatov ne bom neposredno posploševal na produkcijo.

## Vnaprej določen profil

VU pomeni navideznega uporabnika, ki zaporedno izvede GET in nato počaka 1 sekundo. Število VU ni enako številu zahtev na sekundo.

- 0–30 s: 1 VU, osnovna meritev (`baseline`).
- 30–31 s: hiter dvig na 20 VU (`transition`).
- 31–61 s: 20 VU, nenadno povečana obremenitev (`spike`).
- 61–62 s: hiter spust na 1 VU (`transition`).
- 62–92 s: 1 VU, preverjanje okrevanja (`recovery`).

Profil traja 92 sekund, poleg priprave in do 6 sekund za zaključevanje začetih iteracij. Ob zmanjšanju VU lahko začetne iteracije še do 6 sekund zaključujejo delo, zato dejanski upad ni povsem trenuten. Časovna omejitev posamezne zahteve je 5 sekund. Fazo določim ob začetku zahteve; zahteva, ki se zaključi po meji faze, ostane pripisana začetni fazi.

## Metrike in kriteriji PASS/FAIL

Za vsako od treh glavnih faz ločeno zabeležim povprečni odzivni čas in p95 (`http_req_duration`), število zahtev ter zahtev/s (`http_reqs`), delež napak (`http_req_failed`) in uspešnost preverjanj (`checks`). Pri odzivnem času gre za čas pošiljanja, čakanja in prejemanja; ne za čas izrisovanja uporabniškega vmesnika.

Kriterije sem določil pred izvedbo:

- Osnovna faza: p95 **< 500 ms**.
- Faza skoka: p95 **< 1000 ms**.
- Faza okrevanja: p95 **< 500 ms**; s tem preverjam vrnitev pod osnovni absolutni prag.
- V vsaki glavni fazi: delež neuspelih zahtev **< 1 %**, **100 %** preverjanj uspešnih in vsaj ena izvedena zahteva.
- Preverjanji zahtevata status **200** in veljaven JSON z nepraznim seznamom kategorij, celoštevilskimi ID-ji in nepraznimi imeni.

To so moja merila za lokalni test, ne dokumentirana produkcijska SLA. Zaradi majhnega števila vzorcev v 30-sekundnih fazah je p95 samo kratka orientacijska meritev. Pripravljalna zahteva in prehodni fazi so v skupnih metrikah, vendar ne v pragovih glavnih faz. Skupni PASS zahteva izpolnitev vseh pragov vseh treh glavnih faz. Neizpolnjen prag pomeni FAIL; neuspešna priprava ali napaka zagona pomeni neveljavno izvedbo, ki jo opišem in ne označim kot PASS. Pragov po ogledu rezultatov ne bom spreminjal zato, da bi test uspel.

## Postopek izvedbe in ponovitve

1. Če so obstoječi vsebniki ustavljeni z `docker compose stop`, jih iz korena projekta zaženem z `docker compose start`. Za prvo gradnjo ali po spremembah uporabim `docker compose up --build -d`. Uporabim obstoječi `backend/.env` in `next/.env.local` z veljavnimi nastavitvami in enakim `HMAC_SECRET`.
2. Preverim `docker compose ps` in se v Firefoxu prijavim na `http://localhost:3000`. Med meritvijo ne uporabljam aplikacije in ne poganjam drugih testov.
3. Preverim nameščen k6 z `k6 version`. Če ni nameščen, uporabim [uradna navodila za namestitev](https://grafana.com/docs/k6/latest/set-up/install-k6/); za ta test ne dodajam Docker konfiguracije.
4. V Firefoxovih razvijalskih orodjih odprem Storage/Shramba → Cookies/Piškotki → `http://localhost:3000` in kopiram samo vrednost piškotka `session`. Vrednosti ne pošiljam v pogovor, ne shranjujem v poročilo in ne vključim v Git. `HttpOnly` preprečuje branje iz JavaScripta strani, ne pregleda v razvijalskih orodjih.
5. V zsh iz korena projekta vrednost vnesem skrito, da je ne zapišem neposredno v zgodovino ukazov:

   ```zsh
   read -rs 'QUIZIO_SESSION?Prilepi vrednost session in pritisni Enter: '
   export QUIZIO_SESSION
   ```

   Ukaz `read` prepišem dobesedno. Šele ko se izpiše poziv, prilepim vrednost piškotka kot skriti vnos in pritisnem Enter. Vrednosti ne vstavljam v besedilo ukaza.

6. Pred testom zabeležim datum, commit (`git rev-parse HEAD`), OS, CPU, RAM, različici k6 in Docker ter stanje okolja. Nato zaženem samo svojo skripto:

   ```zsh
   ~/.local/bin/k6 run ZK_NALOGE/ZK_naloga4/ismar/load_test.js
   ```

   Ne dodajam `--vus`, `--duration` ali `--stage`, ker je celoten profil že določen v skripti. Ob zaključku zabeležim izhodno kodo (takoj z `echo $?`) in shranim končni izpis oziroma njegov posnetek brez piškotka. Za posamezne faze uporabim označene metrike `phase:baseline`, `phase:spike` in `phase:recovery`, ne samo skupnega povzetka. Zahteve/s posamezne faze izračunam iz števila zahtev in 30-sekundnega merilnega okna; zaradi zaključevanja začetih zahtev gre za približek.
7. Po izvedbi odstranim spremenljivko iz seje lupine:

   ```zsh
   unset QUIZIO_SESSION
   ```

Ne zaganjam obstoječih `npm run system_tests` ali `test:load`, ker Patrikova avtomatizacija vključuje brisanje podatkov. Ob zavrnjeni seji se ponovno prijavim in uredim pripravo; napake ne predstavljam kot dokaza zmogljivosti endpointa.

## Zapis dejanske izvedbe

Test sem izvedel 2. 11. 2026. Točne ure začetka in konca uspešno zaključenega teka nisem zabeležil. Spodnji rezultati so prepisani iz mojega končnega izpisa k6 in izpisa `echo $?`; ne predstavljajo nove ali ponovljene meritve.

Okolje sem pred izvedbo preveril:

- Lokalni Quizio: `http://localhost:3000`, Next.js, Go in PostgreSQL v obstoječem Docker Compose; baza in backend sta bila označena kot healthy, frontend je bil zagnan.
- HEAD repozitorija ob pripravi: `65bd7013842e065f74b3aa85b98a2f1c15ef00f9` (commit dokumentacije Naloge 3). Nove testne datoteke Naloge 4 so bile še necommitane. Točnega commita v zgrajenih Docker slikah nisem neodvisno preveril.
- OS: EndeavourOS; procesor AMD Ryzen 7 8845HS, 8 jeder / 16 niti; RAM približno 30 GiB po izpisu `free -h`.
- k6 v2.3.0, commit `e088784614`, Go 1.26.8, linux/amd64; uradna samostojna različica v `~/.local/bin/k6`.
- Docker 29.9.2; Docker Compose 5.6.1.
- Generator in aplikacija sta tekla na istem računalniku. Natančnega seznama drugih procesov in porabe CPU/RAM med testom nisem zajel.

### Prvi poskus – neuspešna priprava

Pri prvem poskusu sem napačno vnesel piškotek seje. Pripravljalna zahteva je vrnila HTTP 401 in skripta se je ustavila v `setup()`, preden je začela izvajati obremenitev. Nobena glavna faza ni izvedla zahtev. Ta poskus sem označil kot neveljavno izvedbo zaradi priprave, ne kot meritev zmogljivosti. Vnos sem popravil in test ponovno zagnal. Vrednosti piškotka nisem vključil v datoteke poročila.

### Drugi poskus – zaključena meritev

- **Osnovna faza:** 22 zahtev, avg **394,63 ms**, p95 **428,61 ms**, približno **0,73 zahtev/s**, napake **0 %**, preverjanja **100 %**. Rezultat: **PASS**.
- **Faza skoka:** 422 zahtev, avg **422,55 ms**, p95 **681,55 ms**, približno **14,07 zahtev/s**, napake **0 %**, preverjanja **100 %**. Rezultat: **PASS**.
- **Faza okrevanja:** 23 zahtev, avg **404,08 ms**, p95 **667,38 ms**, približno **0,77 zahtev/s**, napake **0 %**, preverjanja **100 %**. Rezultat: **FAIL**, ker p95 ni pod 500 ms.

Zahteve/s posameznih faz sem izračunal kot število zahtev / 30 sekund. Vrstice s hitrostjo pri označenih metrikah v povzetku k6 uporabljajo trajanje celotnega teka, zato jih ne predstavljam kot hitrost samo tiste 30-sekundne faze.

Skupni podatki iz k6:

- Trajanje teka: **1 min 33,1 s**; profil 1 min 32 s.
- Največ VU: **20**.
- HTTP zahtev: **490**, skupna prepustnost **5,261028 zahtev/s**; napake **0/490 (0 %)**.
- Dokončanih iteracij: **489**, prekinjenih: **0**.
- Preverjanj: **978/978 uspešnih (100 %)**; status 200 in veljavne neprazne kategorije.
- Skupni odzivni čas: avg **419,38 ms**, mediana **368,91 ms**, p95 **681,01 ms**, minimum **322,79 ms**, maksimum **1,96 s**.
- Izhodna koda: **99**; prekoračen prag `http_req_duration{phase:recovery}`.

Tri glavne faze skupaj vsebujejo 467 zahtev. Preostalih 23 zahtev predstavljajo pripravljalna zahteva in zahteve prehodnih faz. Pripravljalna zahteva ne izvaja `check`, zato 489 iteracij ustreza 978 preverjanjem, skupno pa je HTTP zahtev 490.

Ključni odlomek iz terminala sem ohranil v poročilu, zato dodatna datoteka dokazila ni potrebna:

```text
http_req_duration{phase:baseline}  p(95)=428.61ms  p(95)<500   PASS
http_req_duration{phase:spike}     p(95)=681.55ms  p(95)<1000  PASS
http_req_duration{phase:recovery}  p(95)=667.38ms  p(95)<500   FAIL
running (1m33.1s), 00/20 VUs, 489 complete and 0 interrupted iterations
ERRO[0093] thresholds on metrics 'http_req_duration{phase:recovery}' have been crossed
```

Zgornje tri vrstice so skrajšan prepis številk in ocen iz terminala; zadnji dve vrstici sta izvirni izpis. `echo $?` je vrnil `99`. Po izvedbi sem izvedel `unset QUIZIO_SESSION`.

## Ugotovitev

**Skupni rezultat je FAIL.** Sistem je med tem testom vse zahteve obdelal uspešno in vrnil pričakovane podatke, vendar faza okrevanja ni dosegla vnaprej določenega praga p95 < 500 ms. Pragov po izvedbi nisem spreminjal.

Povprečje okrevanja (404,08 ms) je blizu osnovnemu povprečju (394,63 ms), vendar je bil p95 višji. Iz enega kratkega testa in samo 23 vzorcev okrevanja ne morem sklepati, da gre za trajno poslabšanje ali določiti vzroka. Nisem meril porabe virov in posameznih komponent; možni vplivi vključujejo preverjanje seje, zunanje klice Firebase in skupne vire lokalnega računalnika, vendar jih s tem testom nisem potrdil.

S tem sem izvedel načrtovani sistemski test in dokumentiral tudi neuspešen kriterij. Morebitna prihodnja ponovitev z istimi pragovi bi bila nova meritev, ki prvotnega rezultata ne bi nadomestila.

## Viri

- [Scenariji k6](https://grafana.com/docs/k6/latest/using-k6/scenarios/)
- [Ramping VUs](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-vus/)
- [Pragovi uspešnosti](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Vgrajene metrike](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)
