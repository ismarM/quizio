# Poročilo avtomatiziranega funkcionalnega testiranja – Naloga 5

**Izvajalec:** Omar Ždralović  
**Datum izvedbe:** 16. 11. 2026  
**Končni rezultat:** **PASS**

## Izbira in okolje

Za moje tri testne primere iz Naloge 3 sem uporabil Playwright 1.64.1, TypeScript in Chromium v načinu headless. Izbral sem ga, ker podpira več ločenih sej, samodejno čakanje na elemente, spremljanje omrežnih odzivov in pravo SSE povezavo. Primeren je tudi za CI, kjer ne potrebuje grafičnega vmesnika ali ločenega gonilnika brskalnika.

Teste sem izvedel lokalno na Windows 10.0.26300 z Node.js 24.18.0, Docker 29.6.2, Docker Compose 5.3.1, procesorjem AMD Ryzen 7 5825U in približno 15,4 GiB RAM. Uporabil sem Chromium, lokalni Next.js, Go API, PostgreSQL 16 in razvojni Firebase. Izhodiščni commit je bil `7932464680a0ff39dea03d78fbfc195be22cab54`.

Pripravil sem tri namenske račune: enega administratorja in dva navadna uporabnika. Gesla sem shranil samo v lokalni Git-ignorirani `.env`. Nisem izvedel skupnega seeda ali brisanja baze. Ustvarjal sem samo kvize s predpono `N5-Omar`, po vsakem testu pa sem svoj kviz arhiviral.

## Rezultati pred namensko napako

Prvi uradni celoten tek se je začel ob 14:53:59 CET in trajal 153,90 sekunde:

| Moj test | Trajanje | Rezultat |
|---|---:|---|
| OMR-FT-01 – administratorske pravice | 23,89 s | PASS |
| OMR-FT-02 – samodejni zaključek po izteku | 90,63 s | PASS |
| OMR-FT-03 – sprotna SSE lestvica | 37,49 s | PASS |

Skupaj sem dobil **3 PASS, 0 FAIL, 0 SKIPPED in 0 FLAKY**. Izpis sem shranil v [01-pass.txt](dokazila/01-pass.txt). Uspešna stanja so na samodejno ustvarjenih posnetkih [OMR-FT-01](dokazila/OMR-FT-01-pass.png), [OMR-FT-02](dokazila/OMR-FT-02-pass.png) in [OMR-FT-03](dokazila/OMR-FT-03-pass.png).

## Preverjanje namerne napake

V klientni komponenti `AttemptPlayer.tsx` sem začasno spremenil:

```diff
- if (timeLimitSeconds > 0 && timeLeftSeconds === 0) {
+ if (timeLimitSeconds > 0 && timeLeftSeconds < 0) {
```

Časovnik ne more postati manjši od nič, zato se samodejni zaključek ni sprožil. Zagnal sem samo OMR-FT-02. Test je po 75 sekundah pravilno zaznal odstopanje:

- pričakovani URL: `/attempts/16/result`;
- dejanski URL: `/attempts/16`;
- rezultat: **1 FAIL**;
- izhodna koda Playwrighta: 1.

Spremembo in redigiran izpis sem shranil v [02-mutacija.patch](dokazila/02-mutacija.patch) in [02-fail.txt](dokazila/02-fail.txt). Ta neuspeh je pričakovan dokaz, da moj test zazna napako v aplikaciji.

## Rezultati po obnovi

Izvorni pogoj sem obnovil na `timeLeftSeconds === 0`, ponovno zgradil Next.js in preveril, da aplikacijska datoteka nima razlike glede na Git. TypeScript preverjanje je bilo uspešno. Končni celoten tek se je začel ob 15:05:26 CET in trajal 162,12 sekunde:

| Moj test | Trajanje | Rezultat |
|---|---:|---|
| OMR-FT-01 – administratorske pravice | 30,12 s | PASS |
| OMR-FT-02 – samodejni zaključek po izteku | 93,10 s | PASS |
| OMR-FT-03 – sprotna SSE lestvica | 37,40 s | PASS |

Končni rezultat je **3 PASS, 0 FAIL, 0 SKIPPED in 0 FLAKY**. Izpis je v [03-pass.txt](dokazila/03-pass.txt).

## Ugotovitve in omejitve

Moji testi so preverili celotno pot brskalnik → Next.js BFF → Go API → PostgreSQL. Prijave so uporabljale pravi razvojni Firebase, SSE dogodka nisem mockal, pri izteku pa nisem pospešil ure. OMR-FT-01 je potrdil 403 in nespremenjen osnutek za navadnega uporabnika, OMR-FT-02 rezultat 2/5 ter pozni odgovor 409, OMR-FT-03 pa vrstico 5/5 brez navigacije glavnega okvirja.

Med pripravo sem popravil dva napačna lokatorja v SSE testu: besedilo prazne lestvice in prikazno ime uporabnika. To sta bili napaki testne avtomatizacije pred uradnim rezultatom, ne zaznani napaki aplikacije. Prvi poskus prijave iz omejenega okolja je vrnil Firebase `auth/network-request-failed`; po dovoljenem omrežnem dostopu se napaka ni ponovila.

Testiral sem samo Chromium, tri moje scenarije in lokalno okolje. Dejanskega GitHub Actions workflowa nisem izvajal. Zasebnih HTML poročil in trace datotek nisem vključil v dokazila, ker lahko vsebujejo sejne podatke. Za oddajo sem ohranil samo redigirane izpise, patch in tri neobčutljive posnetke.

## Zaključek

Moji trije avtomatizirani funkcionalni testi na pravilni kodi uspejo. Namerno pokvarjen pogoj časovnika povzroči pričakovan FAIL v OMR-FT-02, po obnovi pa celoten nabor ponovno uspe. S tem sem preveril funkcionalnost testov in dokazal, da zaznajo konkretno napako v rešitvi.
