# Potrjene funkcionalne napake za Jira

## Napaka 1

**Summary:** BFF vrača 404 za administratorski REST endpoint lestvice  
**Issue type:** Bug  
**Description:** Ob prijavljeni administratorski seji zahteva `GET /api/proxy/quizzes/{id}/leaderboard` vrne Next.js 404. Go backend endpoint `GET /api/quizzes/{quizId}/leaderboard` obstaja in je namenjen administratorju. SSE pot `/leaderboard/stream` deluje, zato sta UI in baza pravilna, običajni REST dostop skozi BFF pa ni dosegljiv. Vzrok je konflikt poti: posebna Next.js pot za `quizzes/[id]/leaderboard/stream` zasenči nadrejeno pot, na kateri ni `route.ts`, zato zahteva ne pride do splošnega catch-all BFF proxyja.  
**Classification:** Nedoslednost  
**Severity:** Medium  
**Severity justification:** Ne pride do izgube podatkov in uporabniška SSE lestvica deluje, vendar je dokumentirani administratorski API skozi edino dovoljeno BFF pot nedosegljiv. To onemogoča dosledno primerjavo API/UI in morebitne administrativne odjemalce.  
**Priority:** High  
**Status:** To Do  
**Application version:** Git commit `d1f40f152a2f7b08822a7fa61ca9e2b1d9d10ad6`  
**Browser:** Chromium 156.0.8078.4 in Firefox 157.0  
**Environment:** Microsoft Windows NT 10.0.26300.0; lokalni Docker Compose; Next.js + Go backend + PostgreSQL 16; razvojni Firebase  
**Test scenario ID:** OMR-FT-03  
**Steps to reproduce:**

1. Zaženite lokalni Docker Compose sklad na navedenem commitu.
2. Prijavite se z administratorskim računom.
3. Ustvarite in objavite lasten kviz ter naj ga zaključita dva uporabnika.
4. Z administratorsko sejo pošljite `GET /api/proxy/quizzes/{id}/leaderboard`.
5. Primerjajte odgovor z delujočo SSE lestvico in stanjem v bazi.

**Expected result:** BFF posreduje zahtevo obstoječemu backend endpointu in vrne HTTP 200 z urejenimi vnosi lestvice.  
**Actual result:** BFF vrne HTTP 404; UI prek SSE in baza kljub temu vsebujeta pravilni dve vrstici.  
**Reproducibility:** 4/4 veljavnih izvedb  
**Reporter:** Omar Ždralović  
**Assignee:** Razvijalec Next.js BFF oziroma skrbnik API poti (predlog; konkretna oseba ni znana)  
**Due date:** 2026-12-01  
**Labels:** `naloga6-omar`, `OMR-FT-03`  
**Attachments:** [redigiran HTTP dokaz](dokazila/04-bff-leaderboard-404.txt), [Chromium posnetek pravilne SSE lestvice](dokazila/test-results/additional-OMR-FT-03-–-soč-70e97-stni-red-in-brez-podvojitev-chromium/OMR-FT-03-reconnect-order.png), [Firefox posnetek ponovitve](dokazila/test-results-ponovitev-firefox/additional-OMR-FT-03-–-soč-70e97-stni-red-in-brez-podvojitev-firefox/OMR-FT-03-reconnect-order.png)

---

## Napaka 2

**Summary:** Firefox po uspešni sočasni oddaji ob 0:00 ostane na strani poskusa  
**Issue type:** Bug  
**Description:** V Firefoxu 157.0 pri zaključku na časovni meji avtomatski odjemalski `finish` in dva skoraj sočasna ročna `finish` klica vsi vrnejo HTTP 200, vendar uporabniški vmesnik ostane na `/attempts/{id}`. Strežniški poskus je pravilno zaključen, zato je napaka omejena na odjemalski prehod na rezultat. Enak test v Chromiumu pravilno odpre `/attempts/{id}/result`. Pregled je potrdil, da avtomatska zahteva iz strani ni manjkala; tudi ta je vrnila 200. Napaka je zato v Firefox/Next odjemalski navigaciji oziroma dirki zaključevanja, ne v backendu ali bazi.  
**Classification:** Napaka vmesnika  
**Severity:** Medium  
**Severity justification:** Rezultat se shrani in podatki niso izgubljeni, toda uporabnik po izteku ne dobi potrditve zaključka ter lahko napačno sklepa, da oddaja ni uspela. Napaka je potrjena v Firefoxu, ne v Chromiumu.  
**Priority:** High  
**Status:** To Do  
**Application version:** Git commit `d1f40f152a2f7b08822a7fa61ca9e2b1d9d10ad6`  
**Browser:** Firefox 157.0  
**Environment:** Microsoft Windows NT 10.0.26300.0; lokalni Docker Compose; Next.js + Go backend + PostgreSQL 16; razvojni Firebase  
**Test scenario ID:** OMR-FT-02  
**Steps to reproduce:**

1. V Firefoxu se prijavite z namenskim navadnim uporabnikom.
2. Začnite lasten objavljen kviz `N6-Omar-*` z omejitvijo 60 sekund.
3. Počakajte, da odštevalnik pokaže `0:00`.
4. Skoraj sočasno z avtomatsko oddajo pošljite še dve ročni zahtevi `POST /api/proxy/quizzes/{id}/attempts/finish`.
5. Preverite tri odzive in trenutni URL v naslednjih 20 sekundah.

**Expected result:** Zaključek je idempotenten, UI pa po prvem uspešnem zaključku preide na `/attempts/{id}/result`.  
**Actual result:** Vsi trije klici vrnejo HTTP 200 in baza kaže zaključen poskus, UI pa ostane na `/attempts/{id}`.  
**Reproducibility:** 2/2 Firefox izvedb; v Chromiumu 0/2  
**Reporter:** Omar Ždralović  
**Assignee:** Razvijalec komponente `AttemptPlayer` oziroma odjemalske Next.js navigacije (predlog; konkretna oseba ni znana)  
**Due date:** 2026-12-01  
**Labels:** `naloga6-omar`, `OMR-FT-02`  
**Attachments:** [redigiran omrežni povzetek](dokazila/05-firefox-timeout-navigacija.txt), [prvi posnetek neuspeha](dokazila/test-results/additional-OMR-FT-02-–-odg-901b1-jna-oddaja-in-pozni-odgovor-firefox/test-failed-1.png), [posnetek ponovitve](dokazila/test-results-ponovitev-firefox/additional-OMR-FT-02-–-odg-901b1-jna-oddaja-in-pozni-odgovor-firefox/test-failed-1.png)
