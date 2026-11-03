# Poročilo sistemskega testiranja (Naloga 4)

**Scenarij:** OMR-ST-01 – vzdržljivostni test (Autocannon)  
**Končni status:** **PASS**  
**Datum izvedbe:** 3. 11. 2026

## 1. Kontekst in cilj

Test je šest minut enakomerno obremenjeval lokalni avtenticirani `GET /api/proxy/categories` s ciljem 10 zahtev/s. Zahteve so šle skozi celotno pot Next.js BFF → Go API → PostgreSQL, vključno s preverjanjem Firebase seje. Ogrevanje je trajalo 15 sekund, nato so sledile tri zaporedne 120-sekundne faze A, B in C.

Test ni spreminjal aplikacijske kode ali podatkov. Ni izvedel seeda, brisanja, migracij, prijav med obremenitvijo ali drugih HTTP metod. Varnostna kontrola v skripti dovoli samo lokalni `GET http://localhost:3000/api/proxy/categories`.

## 2. Evidenca končne izvedbe

| Podatek | Dejanska vrednost |
|---|---|
| Izvajalec | Omar Ždralović |
| Čas | 3. 11. 2026, 12:04:24–12:10:46 CET (11:04:24–11:10:46 UTC) |
| Commit pred dodajanjem datotek naloge | `b97fa2acbc06d8948162614cfb55848d1cdba15e` |
| Cilj | `http://localhost:3000/api/proxy/categories` |
| Okolje | lokalni Docker Compose, ločena lokalna baza |
| OS | Windows 10.0.26300, x64 |
| CPU | AMD Ryzen 7 5825U, 16 logičnih procesorjev |
| RAM | 16.540.139.520 B (približno 15,4 GiB) |
| Node.js / Autocannon | v24.18.0 / 8.0.0 |
| Docker / Compose | 29.6.2 / 5.3.1 |
| Vsebniki | `quizio-next-1`, `quizio-backend-1`, `quizio-postgres-1` |
| Profil | 15 s ogrevanja; A/B/C po 120 s; 5 povezav; `pipelining=1`; `overallRate=10` |
| Izhodna koda končnega programa | 0 |

Backend in PostgreSQL sta bila pred izvedbo `healthy`, Next.js pa `running`. Generator in vsi vsebniki so tekli na istem računalniku. Sveža seja obstoječega testnega uporabnika je bila procesu posredovana samo prek `QUIZIO_SESSION`; njena vrednost ni bila izpisana ali shranjena.

## 3. Vnaprej določeni kriteriji

- preflight in končna kontrola: HTTP 200 ter veljaven neprazen seznam kategorij;
- vsaka faza: manj kot 1 % HTTP/omrežnih napak, p95 < 1500 ms in vsaj 9 zahtev/s;
- vsa telesa odzivov morajo ustrezati pričakovani JSON shemi;
- p95(C) ≤ 1,5 × p95(A);
- vse tri faze se morajo v celoti zaključiti.

Autocannon 8.0.0 nima privzetega polja p95 v končnem histogramu. Skripta zato iz dogodka `response` zbere latenco vsakega odziva in iz dejanskih vzorcev izračuna avg, p50, p95 in p99. Funkcija `verifyBody` hkrati preveri telo vsakega odziva. `overallRate=10` je v tej različici skupna ciljna hitrost vseh petih povezav; workerji in `connectionRate` niso uporabljeni.

## 4. Rezultati končnega teka

Preflight je vrnil HTTP 200 in veljaven JSON v 517,06 ms. Ogrevanje je trajalo 15,12 s ter vrnilo 132 odzivov brez napak; ogrevalne meritve niso vključene v A/B/C.

| Metrika | Faza A | Faza B | Faza C |
|---|---:|---:|---:|
| Dejansko trajanje | 120,88 s | 121,00 s | 121,00 s |
| Odzivi / poskusi | 1168 / 1168 | 1189 / 1189 | 1100 / 1100 |
| Dejanske zahteve/s | 9,662 | 9,826 | 9,091 |
| Povprečna latenca | 457,18 ms | 424,55 ms | 507,57 ms |
| p50 | 418,48 ms | 414,83 ms | 445,94 ms |
| p95 | 705,55 ms | 487,23 ms | 781,24 ms |
| p99 | 1018,43 ms | 737,09 ms | 1391,49 ms |
| HTTP 200 | 1168 | 1189 | 1100 |
| HTTP 401 / 403 / 429 / 5xx | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Omrežne napake / timeouti | 0 / 0 | 0 / 0 | 0 / 0 |
| Neveljavna telesa | 0 | 0 | 0 |
| Delež neuspelih zahtev | 0,000 % | 0,000 % | 0,000 % |
| Ocena faze | **PASS** | **PASS** | **PASS** |

Kontrola po vsaki fazi ter končna kontrola so vrnile HTTP 200 in veljaven JSON. Končna kontrola je trajala 499,85 ms.

Razmerje p95(C)/p95(A) je **1,107**, kar izpolni zahtevo ≤ 1,5. Pozna faza je imela višjo p95 od zgodnje, vendar ne dovolj visoko za vnaprej določen FAIL. Vse faze so dosegle najmanj 9 zahtev/s; faza C je bila z 9,091 zahtev/s blizu praga, zato rezultat ni dokaz rezerve zmogljivosti nad predpisano obremenitvijo.

## 5. Docker viri

`docker stats --no-stream` je ustvaril 26 časovnih vzorcev za vsak izmed treh vsebnikov, skupaj 78 podatkovnih vrstic. Med zaporednimi začetki vzorčenja za isti vsebnik je bilo od 15,000 do 15,020 s, povprečno 15,008 s. Napak vzorčenja ni bilo.

| Vsebnik | Prvi pomnilniški vzorec | Zadnji vzorec | Najvišji opaženi CPU |
|---|---:|---:|---:|
| Next.js | 220,1 MiB | 221,1 MiB | 19,77 % |
| Go backend | 16,68 MiB | 16,93 MiB | 6,90 % |
| PostgreSQL | 57,74 MiB | 58,04 MiB | 7,50 % |

V končnem teku ni vidna večja rast pomnilnika. Razlike med prvim in zadnjim vzorcem so približno 0,45 % za Next.js, 1,50 % za backend in 0,52 % za PostgreSQL. Tako kratek test in dve končni točki ne dokazujeta odsotnosti memory leaka; ugotovitev je samo diagnostična.

## 6. Dnevnik poskusov in odstopanja

1. Prvi pripravljalni zagon ni začel obremenitve, ker je začasni Windows zaganjalnik vrnil `spawn EINVAL`. Popravljen je bil tako, da je neposredno zagnal Node. To ni meritev sistema.
2. Naslednji poskus je zaključil fazo A, nato pa se je zbiralnik ustavil zaradi prezgodnjega izračuna C/A. Ker fazi B in C nista bili izvedeni, je poskus neveljaven in ni označen kot PASS ali FAIL sistema.
3. Prvi celotni tek (11:57:20–12:03:40 CET) je vrnil FAIL: A 8,014 req/s in p95 1200,70 ms; B 9,918 req/s in p95 488,78 ms; C 9,888 req/s in p95 473,45 ms. V vseh fazah je bilo 0 napak. Pri naknadnem pregledu je bilo ugotovljeno, da se je naslednji Docker vzorec razporedil 15 s po zaključku prejšnjega ukaza, zato je bil dejanski razmik približno 17 s namesto zahtevanih 15 s. Rezultat je ohranjen v tem dnevniku, ni pa uporabljen kot končni metodološko skladen tek.
4. Razporejevalnik je bil popravljen na fiksni 15-sekundni interval. Končni celotni tek je nato izpolnil vse kriterije in vrnil izhodno kodo 0. Ponovitev je bila izvedena zaradi skladnosti vzorčenja, ne zaradi spreminjanja pragov ali prikrivanja prejšnjega FAIL.

## 7. Dokazila in ponovitev

Končna dokazila:

- `dokazila/results.json` – celotni strukturirani rezultat;
- `dokazila/docker-stats.csv` – časovne meritve virov;
- `dokazila/summary.txt` – kratek povzetek PASS/FAIL.

Ukazi za običajno ponovitev iz korena repozitorija v PowerShellu:

```powershell
cd ZK_NALOGE/ZK_naloga4/omar
npm.cmd install
$secure = Read-Host 'Session cookie' -AsSecureString
$env:QUIZIO_SESSION = [System.Net.NetworkCredential]::new('', $secure).Password
npm.cmd run test:soak
Remove-Item Env:QUIZIO_SESSION
```

Pred zagonom morajo biti lokalni vsebniki že zagnani. Ne uporabljata se korenski `system_tests` ali `testing/system_testing` ukaz `test:load`, ker njun postopek vključuje `purge` in `seed`.

## 8. Zaključek in omejitve

**Končni rezultat OMR-ST-01 je PASS.** V končnem teku so bile vse zahteve uspešne in vsebina veljavna, vse tri faze so dosegle prag prepustnosti ter latence, pozna faza pa ni presegla dovoljenega razmerja do zgodnje faze. Sistem je po obremenitvi ostal dostopen.

Rezultat velja samo za opisani lokalni računalnik, eno sejo, en bralni endpoint in kratek šestminutni test. Ne predstavlja produkcijskega SLA, 24-urnega soak testa, testiranja različnih uporabnikov ali dokaza odsotnosti puščanja pomnilnika. Razlika med prvim celotnim FAIL in končnim PASS kaže tudi variabilnost lokalnega okolja in zunanjega preverjanja Firebase; za močnejši sklep bi bilo treba izvesti več enako konfiguriranih ponovitev ali daljši test.
