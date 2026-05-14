avtorizacija in avtentikacija preko firebase
client pridobi ID token of firebase auth in ga POST-a na /api/session, ki ga preveri preko Admin SDK in nastavi
session cookie. vsi routi ki zahtevajo login kličejo requireAuth (laufa na serveru) ki vrne user ali redirecta (middleware)
dodatni checki za role se implementirajo kasneje na enak način kot requireEmail() trenutno
/dashboard je login only, /admin je login + pravilni email
mail: tets@maaail.csssf geslo: geslo123

za design se uporabla tailwind + shadcn
uporabljaj čim manj "use client" razen kjer je smiselno
izogibaj se route handlerjem -> raje uporabi server actions

zaženeš z npm run dev