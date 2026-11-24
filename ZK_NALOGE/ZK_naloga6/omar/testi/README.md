# Dodatni testi za Nalogo 6

Teste zaženem iz `testing/functional_testing`, kjer so nameščene obstoječe odvisnosti:

```powershell
npx.cmd playwright test --config ../../ZK_NALOGE/ZK_naloga6/omar/testi/playwright.config.ts
```

Samo Chromium zaženem z `--project=chromium`, samo Firefox pa z `--project=firefox`.
Konfiguracija prebere obstoječi Git-ignorirani `testing/functional_testing/omar/.env`.
Testi ne izpisujejo gesel, uporabljajo le lokalni URL in lokalno bazo, ustvarjajo
samo kvize `N6-Omar-*` ter svoje kvize po izvedbi arhivirajo.

Sledi (`trace.zip`) namenoma niso del dokazil, ker lahko vsebujejo sejne piškotke.
