# Quizio — Plan integracije frontenda z backendom

## 1. Trenutno stanje

### Arhitektura (dobro zastavljena)

```
Browser (Next.js) → /api/proxy/[...path] (BFF) → Go backend → PostgreSQL
                           ↑
                    Firebase Auth (session cookie)
```

Proxy v `/api/proxy/[...path]/route.ts` že:
- verificira Firebase session cookie
- doda `X-User-Id`, `X-User-Email`, `X-User-IsAdmin` headerje
- podpiše vsak request z HMAC (timestamp + path + body)
- blokira admin rute za navadne uporabnike

Go backend zaupa samo BFF-ju — nikoli ne kliče Firebase neposredno. To je **pravilna arhitektura** (stateless BFF, SOT je baza).

### Problem

Večina komponent še vedno bere iz `mock-data.ts`. Backend je popolnoma implementiran (vse rute so žive, Swagger dokumentacija obstaja), frontend pa ga ne kliče.

---

## 2. Kako klicat backend s frontenda

### Vzorec za Server Components (priporočeno za začetne podatke)

```typescript
// next/src/app/quizzes/page.tsx
import { requireAuth } from "@/lib/serverAuth";
import { proxyFetchJson } from "@/lib/proxyClient"; // ← NE, to je za client

// Za server komponente kliči direktno (BFF je na istem procesu)
import { cookies, headers } from "next/headers";

export default async function QuizzesPage() {
  // Za javne rute (quizzes lista) ne rabiš auth
  const res = await fetch(`${process.env.GO_BACKEND_URL}/api/quizzes?limit=20&offset=0`, {
    headers: buildInternalHeaders(), // HMAC + user headers
    cache: "no-store",
  });
  const data = await res.json(); // { quizzes: [...], limit, offset }
  return <QuizBrowser quizzes={data.quizzes} />;
}
```

**Ampak** — ker imaš že proxy, je **enostavnejše** klicati proxy tudi iz server komponent:

```typescript
// Pomožna funkcija za server-side proxy klic
// next/src/lib/serverFetch.ts
import "server-only";
import { getSessionUser } from "@/lib/serverAuth";
import { applyHmacHeaders } from "@/lib/requestIntegrity";

const GO_BACKEND_URL = process.env.GO_BACKEND_URL!;
const HMAC_SECRET = process.env.HMAC_SECRET!;

export async function serverFetch(path: string, init: RequestInit = {}) {
  const user = await getSessionUser();
  const url = new URL(path, GO_BACKEND_URL);
  const headers = new Headers(init.headers);

  if (user) {
    headers.set("X-User-Email", user.email ?? "");
    headers.set("X-User-Id", user.postgresId.toString());
    headers.set("X-User-IsAdmin", user.isAdmin ? "true" : "false");
  }

  const body = init.body instanceof ArrayBuffer ? init.body : undefined;
  applyHmacHeaders(headers, url.pathname + url.search, body ?? null, HMAC_SECRET);

  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function serverFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await serverFetch(path, init);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
```

### Vzorec za Client Components (interaktivnost)

Za stvari, ki se sprožijo na klik (oddaja odgovorov, filtriranje itd.) uporabljaš obstoječi `proxyFetch` / `proxyFetchJson`:

```typescript
// Primer: oddaja quiza
import { proxyFetchJson } from "@/lib/proxyClient";
import type { AttemptResultResponse } from "@/lib/types"; // definiraj skupne tipe

async function finishAttempt(quizId: number) {
  const result = await proxyFetchJson<AttemptResultResponse>(
    `/quizzes/${quizId}/attempts/finish`,
    { method: "POST" }
  );
  return result;
}
```

---

## 3. Tipi — skupna definicija

Backend že ima `types.go` z vsemi DTO-ji. Potrebuješ TypeScript ekvivalente. **Ne definiraj tipov v vsakem komponentu posebej** — ustvari en centralni file:

```typescript
// next/src/lib/types.ts  ← USTVARI TA FILE

export interface QuizDTO {
  id: number;
  title: string;
  description?: string;
  created_at: string;       // ISO string (ne Date!)
  publish_date?: string;
  owner_id: number;
  is_archived: boolean;
  time_limit_seconds: number;
  question_count?: number;
  category_id?: number;
  image_url?: string;
  category_name?: string;
}

export interface QuizListResponse {
  quizzes: QuizDTO[];
  limit: number;
  offset: number;
}

export interface QuestionDTO {
  id: number;
  title: string;
  value: number;
  quiz_id: number;
  answers: AnswerDTO[];
}

export interface AnswerDTO {
  id: number;
  title: string;
  is_correct: boolean; // ← POZOR: backend vrača is_correct samo za admina!
}

export interface AttemptStatusResponse {
  attempt: AttemptDTO;
  responses: AttemptQuestionDTO[];
}

// ... itd.
```

> **Zakaj centralni file?** Ko backend spremeni tip (npr. doda polje), popraviš na enem mestu. Raztreseni tipi po komponentah pomenijo, da zamudaš spremembe in dobiš runtime errore.

---

## 4. Prioritiziran vrstni red integracije

### Faza 1 — Javni del (brez auth)

**`/quizzes` — seznam kvizov**

```typescript
// next/src/app/quizzes/page.tsx
import { serverFetchJson } from "@/lib/serverFetch";
import type { QuizListResponse } from "@/lib/types";

export default async function QuizzesPage() {
  const data = await serverFetchJson<QuizListResponse>("/api/quizzes?limit=20&offset=0");
  return <QuizBrowser quizzes={data.quizzes} />;
}
```

`QuizBrowser` dobi prave podatke, odstraniš `import { quizzes } from "@/lib/mock-data"`.

**`/quizzes/[id]` — detail kviza**

```typescript
const data = await serverFetchJson<{ quiz: QuizDTO }>(`/api/quizzes/${id}/info`);
// /info vrača samo metadata (brez vprašanj) — idealno za detail stran pred začetkom
```

---

### Faza 2 — Auth flow

Auth je **že integriran** (Firebase + session cookie). Kar manjka:

**Registracija uporabnika v Postgres ob prvem loginu:**

```typescript
// next/src/app/api/session/route.ts — to že obstaja, preveri ali kliče POST /api/users
// Ob kreaciji session mora poklicati:
await serverFetch("/api/users", {
  method: "POST",
  body: JSON.stringify({
    email: firebaseUser.email,
    language: 0,
    theme: 0,
    is_admin: false,
  }),
});
// Backend vrne user z id-jem → shrani postgresId v Firebase custom claims
```

`postgresId` se mora shraniti v Firebase custom claims, ker ga proxy bere iz `decoded.postgresId`. Preveri ali session route to že dela.

---

### Faza 3 — Reševanje kvizov

To je najpomembnejši flow. Točen vrstni red klicev:

```
1. POST /api/quizzes/{id}/attempts          → začni, dobi attempt.id
2. GET  /api/quizzes/{id}/attempts          → obnovi sejo (če je stran reloadana)
3. PATCH /api/quizzes/{id}/attempts         → ob vsakem odgovoru { updates: [{question_id, answer_id}] }
4. POST /api/quizzes/{id}/attempts/finish   → končaj, dobi rezultate
```

**Ključna napaka, ki se zgodi:** frontend shrani odgovore samo lokalno v state in pošlje vse naenkrat ob koncu. **To je napačno.** Backend dizajn zahteva, da pošiljaš `PATCH` ob **vsakem odgovorjenem vprašanju** — ker ob poteku časa browser samodejno ni tam, da bi poslal vse.

```typescript
// next/src/components/attempts/AttemptPlayer.tsx
async function selectAnswer(questionId: number, answerId: number) {
  setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  
  // TAKOJ pošlji na backend — ne čakaj na konec!
  await proxyFetchJson(`/quizzes/${quizId}/attempts`, {
    method: "PATCH",
    body: { updates: [{ question_id: questionId, answer_id: answerId }] },
  });
}
```

**Timer:** Ko poteče čas, `finish` pokliče BFF. Ker je backend stateless glede timerja, mora frontend zanesljivo poklicati finish. Dodaj `beforeunload` listener kot backup:

```typescript
useEffect(() => {
  const handleUnload = () => {
    // sendBeacon je zanesljivejši od fetch ob zapiranju taba
    navigator.sendBeacon(`/api/proxy/quizzes/${quizId}/attempts/finish`);
  };
  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}, [quizId]);
```

---

### Faza 4 — Dashboard

```typescript
// next/src/app/dashboard/page.tsx — odstraniš hardcoded recentAttempts
const user = await requireAuth();
const submissions = await serverFetchJson<SubmissionsResponse>(
  `/api/users/me/submissions?limit=5&offset=0`
);
const openSessions = await serverFetchJson<OpenSessionsResponse>(
  `/api/users/me/open-sessions`
);
```

---

### Faza 5 — Admin panel

```typescript
// next/src/app/admin/quizzes/new/page.tsx
// POST /api/quizzes — s celotnim quizom (title, questions[], answers[])
await proxyFetchJson("/quizzes", {
  method: "POST",
  body: {
    title, description, time_limit_seconds,
    owner_id: user.postgresId,
    questions: questions.map(q => ({
      title: q.title,
      value: q.value,
      answers: q.answers.map(a => ({ title: a.title, is_correct: a.isCorrect }))
    }))
  }
});
```

---

## 5. Filtriranje kvizov — server-side, ne client-side

`QuizBrowser` trenutno filtrira **na frontendu** iz mock podatkov. Ko prideš na pravi backend, filtriraj na **backendu** z query parametri:

```
GET /api/quizzes?limit=8&offset=0&category_id=3&search=science
```

Zakaj? Ker:
- frontend dobi samo 8 kvizov naenkrat (paginacija), ne vseh
- iskanje po 1000 kvizih v JS-u je počasno in brez smisla
- backend že podpira query parametre (preveri swagger)

```typescript
// QuizBrowser postane client component samo za UI state (query, page)
// Dejansko fetchanje se zgodi v page.tsx ali z route handler
"use client";

export function QuizBrowser({ initialQuizzes, total }: Props) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSearch(query: string) {
    // Posodobi URL → Next.js re-fetcha page z novimi searchParams
    router.push(`/quizzes?search=${query}`);
  }
}

// page.tsx bere searchParams in pošlje pravi request
export default async function QuizzesPage({ searchParams }) {
  const { search, category_id, offset = "0" } = await searchParams;
  const data = await serverFetchJson<QuizListResponse>(
    `/api/quizzes?limit=8&offset=${offset}${search ? `&search=${search}` : ""}${category_id ? `&category_id=${category_id}` : ""}`
  );
  return <QuizBrowser initialQuizzes={data.quizzes} total={data.limit} />;
}
```

---

## 6. Error handling — vzorec

Nikoli ne pusti async klica brez error handlinga v Server Komponentah:

```typescript
// BAD — crashne celotno stran
const data = await serverFetchJson<QuizListResponse>("/api/quizzes");

// GOOD — Next.js error.tsx ujame napako
// ali bolj eksplicitno:
let quizzes: QuizDTO[] = [];
try {
  const data = await serverFetchJson<QuizListResponse>("/api/quizzes");
  quizzes = data.quizzes;
} catch (err) {
  console.error("Failed to load quizzes:", err);
  // prikaži prazno stanje, ne crash
}
```

Za client komponente dodaj loading/error state:

```typescript
const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

async function submit() {
  setStatus("loading");
  try {
    await proxyFetchJson(...);
    setStatus("idle");
  } catch {
    setStatus("error");
  }
}
```

---

## 7. Slike (Image Upload)

Backend ima `/api/upload` (Next.js route) in ta vrne URL. Workflow:

```
1. Frontend: POST /api/upload { filename: "quiz-cover.jpg" } → { url: "https://..." }  
2. Frontend: shrani url v state  
3. Ob shranjevanju quiza: pošlji image_url v CreateQuizRequest  
```

Glede na komentar v načrtu (`Supabase Storage ali ločena node app`) — priporočam **Supabase Storage** ker je že omenjen in imaš `supabase.ts`. Upload route v Next.js dobi signed URL od Supabase, frontend uploadira direktno na Supabase (ne gre skozi BFF za sam file):

```typescript
// /api/upload/route.ts
const { data } = await supabase.storage.from("quiz-images")
  .createSignedUploadUrl(`quizzes/${uuid()}.jpg`);
return NextResponse.json({ uploadUrl: data.signedUrl, publicUrl: data.path });
```

---

## 8. Checklist pred produkcijo

- [ ] `mock-data.ts` se ne importa nikjer (samo v nekih UI komponentah za default vrednosti je OK)
- [ ] Vsi API klici imajo error handling
- [ ] `PATCH /attempts` se kliče ob vsakem odgovoru, ne samo ob koncu
- [ ] `beforeunload` listener za finish attempt
- [ ] `postgresId` se pravilno shrani v Firebase custom claims ob registraciji
- [ ] Server komponente ne puščajo občutljivih podatkov (is_correct) v HTML za navadne uporabnike
- [ ] `.env.local` vsebuje `GO_BACKEND_URL`, `HMAC_SECRET`, Firebase konfiguracijo
- [ ] `HMAC_SECRET` je isti na Next.js in Go backendu

---

## 9. Povzetek ključnih odločitev

| Odločitev | Zakaj |
|---|---|
| BFF proxy za vse backend klice | Firebase token nikoli ne gre do Go — čistejša ločitev, Go ne rabi Firebase SDK |
| HMAC podpis vsakega requesta | Prepreči, da bi kdo klical Go backend direktno (bypass BFF) |
| Server Components za začetne podatke | Hitrejši first load, boljši SEO, ni loading spinnerjev za statično vsebino |
| `proxyFetch` za client interakcije | Enostaven klic skozi proxy brez ročnega upravljanja tokenov |
| Server-side filtriranje | Paginacija deluje pravilno, baza je hitrejša od JS-a za iskanje |
| PATCH ob vsakem odgovoru | Backend je stateless glede timerja — edina zanesljiva rešitev |
