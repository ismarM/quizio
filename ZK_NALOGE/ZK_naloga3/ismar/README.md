# Naloga 3 – Ismar: ročno funkcionalno testiranje

Odgovorna oseba: **Ismar**. Različica dokumentacije: **1.1**.

Dokumenti opisujejo tri potrjene uporabniške postopke. Struktura smiselno povzema elemente testne dokumentacije ISO/IEC/IEEE 29119-3:2021 (cilj in sledljivost, predpogoji, podatki, postopek, pričakovanja ter zapis izvedbe). Ne predstavlja trditve o popolni skladnosti s standardom.

## Scenariji

- [ISM-FT-01 – Objava osnutka](ISM-FT-01_objava_osnutka.md)
- [ISM-FT-02 – Ročna oddaja in točkovanje](ISM-FT-02_rocna_oddaja.md)
- [ISM-FT-03 – Nadaljevanje po zaprtju zavihka](ISM-FT-03_nadaljevanje.md)
- [Poročilo izvedbe](POROCILO_IZVEDBE.md)
- [Skupna preglednica odgovornosti](../odgovornosti-funkcionalnega-testiranja.ods)

Vsi trije scenariji imajo po moji ročni izvedbi in pregledu dokazil status **PASS**. Dejanski rezultati in dokazila so v posameznih dokumentih; nezabeleženi podatki so izrecno označeni.

## Priprava okolja in navodila za ponovitev

1. Uporabi lokalno testno okolje po [README projekta](../../../README.md). Potrebuješ Docker Compose ter veljavni datoteki `backend/.env` in `next/.env.local` z enakim `HMAC_SECRET` in ustreznimi nastavitvami Firebase. Skrivnosti in gesla ne sodijo v poročilo.
2. Ko začneš izvedbo, iz korena repozitorija zaženi `docker compose up --build -d`. Backend ob Docker zagonu izvede migracije. Odpri `http://localhost:3000`.
3. Pripravi administratorski račun z dostopom do `/admin` in ločen običajni račun. Če administratorskih pravic nimaš, naj račun pripravi obstoječi administrator. Registracija sama po sebi ni dokaz administratorskih pravic.
4. Uporabi dva ločena profila brskalnika, enega za vsako vlogo. Zabeleži različico brskalnika, OS, datum, naslov aplikacije in dejanski commit (`git rev-parse HEAD`). Pripravljenost okolja potrdi šele ob izvedbi.
5. Kot administrator prek aplikacije pripravi tri ločene kvize. Izberi obstoječo kategorijo in jo zabeleži. Naslovom dodaj enako oznako izvedbe, npr. datum in uro, da jih ločiš od prejšnjih ponovitev.
6. Za ISM-FT-01 ohrani osnutek; za ISM-FT-02 in ISM-FT-03 pripravi objavljena kviza. Uporabnik slednjih še ne sme začeti. En uporabnik ima en poskus na kviz; pri ponovitvi pripravi nov kviz ali drug testni račun.

Za te ročne scenarije ne zaganjaj `functional_tests`, `system_tests`, seeda ali `testing/purge.sql`; obstoječa avtomatizacija lahko briše aplikacijske podatke. Slike in generiranje z AI niso del teh postopkov.

## Skupni testni podatki

| Vprašanje | Odgovora | Pravilen odgovor | Točke |
| --- | --- | --- | --- |
| Koliko je 2 + 2? | 4; 5 | 4 | 2 |
| Glavno mesto Slovenije? | Ljubljana; Maribor | Ljubljana | 3 |

Vsi trije kvizi lahko uporabijo ti dve vprašanji, časovno omejitev 5 minut in poljubno obstoječo kategorijo. Pravilnost podatkov preveri pred objavo.

## Pravila beleženja in zaključka

Pri vsakem koraku zapiši opažanje in po potrebi ime posnetka zaslona. PASS pomeni, da so izpolnjena vsa pričakovanja scenarija; FAIL pomeni vsaj eno dejansko odstopanje. Če izvedba zaradi okolja ali predpogojev ni mogoča, ohrani »Ni izvedeno« in zapiši razlog. Ne označi je kot PASS.

Ob napaki zabeleži korak, pričakovano in opaženo vedenje, čas ter dokazilo. Ponovno izvedbo zapiši ločeno in ohrani prvotni rezultat. Po zbiranju dokazil se odjavi in zapri testne profile. Morebitno arhiviranje testnih kvizov uskladi z ekipo; ne briši skupnih podatkov.
