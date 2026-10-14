Zadostnost in pravilnost dokumentacije za vspostavitev projekta
Najdene pomanjklivosti:
- .env.local.example ni v repozitoriju
- manjkajo navodila za nastavljanje prvega admin uporabnika (ali neke vrste seed.sql)
- ni lokalnik emulatorjev in navodil za njihovo namestitev (da zaženeš projekt potrebuješ 3 zunanje storitve)
- openssl na windowsu ni privzeto nameščen
- ni navedeno kako vspostaviti firebase, supabase in gemini api projekte ter pridobiti ključe

Pregled standardov kodiranja:
- uporaba openapi za http handlerje na backendu, na frontendu ni nič
- po dogovoru na backendu pišemo sql kodo le preko sqlc
- na frontendu uporabljamo shadcn komponente in ne custom made
- nekonsistentno poimenuvanje datotek v backendu (PascalCase za middlewara in snake_case za ostalo)
- nekonsistentno poimenovanje datotek na frontendu (enako, poleg tega še pomišljaji)
- ni GoDoc komentarjev ali podobnega
- "magične" konstante (npr. hardcoded headerji in števila)

Predlagano:
- datoteke: na backendu uporabimo snake_case, na frontendu PascalCase za komponente in camelCase za .ts module
- spremenljivke: camelCase za neizvožene in PascalCase za izvožene
- GoDoc za dokumentiranje backend kode
- uporaba openapi tudi na frontendu
- ustrezno definirane in poimenovane "magične" konstante

Popravljena datoteka: auth_middleware.go (prej AuthMiddleware.go)
Spremembe:
- poimenovanje datoteke
- GoDoc dokumentacija
- definirani in poimenovani "magične" konstante

Pregled stanja testiranje in zagotavljanja kakovosti v projektu:
- lint + staticcheck + build v CI pipelinu (lint in type-check za nextjs, vet in staticcheck za go)
- unit testi za Go backend, ki se ne poženejo pri CI, pokritost ~25%, genereirani z LLM, uporaba "go test"
- ni unit testov za frontend
- ni integracijskega testiranja, testiranja UI ali E2E
- uporaba Fallow



Dodatno:

Dodatne ugotovitve glede dokumentacije:
- V README.md je zahtevana verzija Node.js 22+, medtem ko CI uporablja verzijo 20.19.0
- Manjkajo navodila za preverjanje, ali je bila namestitev uspešna in ali vse storitve pravilno delujejo
- Ni jasno dokumentirano, katere funkcionalnosti delujejo brez konfiguriranih zunanjih storitev
- Manjkajo navodila za odpravljanje pogostih napak pri namestitvi (npr. zasedeni porti, napačni API ključi)
- Razlika med lokalnim zagonom in zagonom z Docker Compose ni dovolj podrobno pojasnjena
- Za lokalni HTTPS se uporabljajo samopodpisani certifikati, ni pa dovolj pojasnjeno, kako jih pravilno uporabljati na različnih operacijskih sistemih
- V Docker Compose je nastavljena spremenljivka `NODE_TLS_REJECT_UNAUTHORIZED=0`, ki izklopi preverjanje TLS certifikatov

Dodatne ugotovitve glede standardov kodiranja:
- Ni jasno določenega maksimalnega obsega oziroma kompleksnosti posameznih funkcij

Dodatno popravljena datoteka:
- `IntegrityMiddleware.go` → `integrity_middleware.go`
- Dodani GoDoc komentarji
- Ponavljajoče se vrednosti prestavljene v poimenovane konstante
- Dodani komentarji za razumevanje HMAC preverjanja
- Funkcionalnost kode ostaja nespremenjena

Dodatne ugotovitve glede testiranja:
- Manjka avtomatsko preverjanje pokritosti kode s testi
- Smiselno bi bilo dodati testiranje robnih primerov, predvsem pri avtentikaciji, časovnih omejitvah in preverjanju HMAC podpisov
- Google Lighthouse, več iteracij

Uporaba generativnih agentov:
- skills datoteke (prenesene iz spleta, niso custom made)
- MCP strežniki (context7)
- AGENTS.md (branje nextjs dokumentacije, uporaba shadcn komponent, branje skillsov)
- 
