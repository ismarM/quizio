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
- Google Lighthouse, več iteracij

Uporaba generativnih agentov:
- skills datoteke (prenesene iz spleta, niso custom made)
- MCP strežniki (context7)
- AGENTS.md (branje nextjs dokumentacije, uporaba shadcn komponent, branje skillsov)
- 