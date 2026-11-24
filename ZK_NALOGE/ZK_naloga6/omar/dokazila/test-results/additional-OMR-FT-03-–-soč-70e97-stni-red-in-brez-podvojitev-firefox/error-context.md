# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: additional.spec.ts >> OMR-FT-03 – sočasni zaključki, SSE ponovna povezava, vrstni red in brez podvojitev
- Location: ..\..\ZK_NALOGE\ZK_naloga6\omar\testi\additional.spec.ts:249:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/quizzes$/
Received string:  "http://localhost:3000/login"
Timeout: 20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    42 × locator resolved to <html lang="en" class="h-full antialiased font-sans">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- main:
  - text: Quizio
  - paragraph: Account access
  - heading "Sign in. Start solving." [level=1]
  - paragraph: Log in to solve quizzes, save your attempts and access your dashboard. Admin users get access to quiz management.
  - paragraph: Solve published quizzes with your account.
  - paragraph: Keep your progress and results connected.
  - paragraph: Admin access appears automatically when allowed.
  - heading "Welcome back" [level=2]
  - paragraph: Sign in with email or Google.
  - button "Sign in" [disabled]
  - button "Register" [disabled]
  - text: Email
  - textbox "Email":
    - /placeholder: you@example.com
    - text: omar.n5.usera@example.com
  - text: Password
  - textbox "Password":
    - /placeholder: ••••••••
  - button "Signing in…" [disabled]
  - text: or
  - button "Continue with Google" [disabled]
- alert
- region "Cookie notice":
  - paragraph: Cookie notice
  - paragraph: Quizio uses necessary cookies for sign-in sessions and security. We do not use marketing cookies.
  - button "Accept"
```

# Test source

```ts
  1   | import { randomUUID } from "node:crypto";
  2   | 
  3   | import { expect, type Page, type TestInfo } from "@playwright/test";
  4   | import { Client } from "pg";
  5   | 
  6   | import { QuizForm } from "../support/quiz-form";
  7   | 
  8   | export type Role = "admin" | "userA" | "userB";
  9   | 
  10  | export type CreatedQuiz = {
  11  |   id: number;
  12  |   title: string;
  13  | };
  14  | 
  15  | type AttemptResult = {
  16  |   attempt: { id: number; time_taken_seconds?: number };
  17  |   questions: Array<{
  18  |     id: number;
  19  |     title: string;
  20  |     answers: Array<{ id: number; title: string }>;
  21  |   }>;
  22  |   responses: Array<{ question_id: number; answer_id: number }>;
  23  | };
  24  | 
  25  | const accountDefaults = {
  26  |   admin: { email: "omar.n5.admin@example.com", emailEnv: "ADMIN_EMAIL", passwordEnv: "ADMIN_PASSWORD", isAdmin: true, displayName: "Omar N5 Admin" },
  27  |   userA: { email: "omar.n5.usera@example.com", emailEnv: "USER_A_EMAIL", passwordEnv: "USER_A_PASSWORD", isAdmin: false, displayName: "Omar N5 User A" },
  28  |   userB: { email: "omar.n5.userb@example.com", emailEnv: "USER_B_EMAIL", passwordEnv: "USER_B_PASSWORD", isAdmin: false, displayName: "Omar N5 User B" },
  29  | } as const;
  30  | 
  31  | export function account(role: Role) {
  32  |   const definition = accountDefaults[role];
  33  |   return {
  34  |     email: process.env[definition.emailEnv] ?? definition.email,
  35  |     password: process.env[definition.passwordEnv] ?? "",
  36  |     isAdmin: definition.isAdmin,
  37  |     displayName: definition.displayName,
  38  |   };
  39  | }
  40  | 
  41  | export async function checkEnvironment() {
  42  |   const baseUrl = new URL(process.env.BASE_URL ?? "http://localhost:3000");
  43  |   expect(baseUrl.protocol, "Testiram samo lokalni HTTP").toBe("http:");
  44  |   expect(["localhost", "127.0.0.1"], "Testiram samo lokalno aplikacijo").toContain(baseUrl.hostname);
  45  | 
  46  |   const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb";
  47  |   const parsedDatabaseUrl = new URL(databaseUrl);
  48  |   expect(["localhost", "127.0.0.1"], "Testiram samo lokalno bazo").toContain(parsedDatabaseUrl.hostname);
  49  | 
  50  |   const client = new Client({ connectionString: databaseUrl });
  51  |   await client.connect();
  52  |   try {
  53  |     const database = await client.query("SELECT current_database() AS name");
  54  |     expect(database.rows[0].name).toBe(parsedDatabaseUrl.pathname.slice(1));
  55  | 
  56  |     for (const role of ["admin", "userA", "userB"] as const) {
  57  |       const user = account(role);
  58  |       expect(user.password, `V omar/.env manjka geslo za ${role}`).not.toBe("");
  59  |       const { rows } = await client.query(
  60  |         'SELECT is_admin, language FROM quizio."User" WHERE email = $1',
  61  |         [user.email],
  62  |       );
  63  |       expect(rows, `V lokalni bazi manjka namenski uporabnik ${user.email}`).toHaveLength(1);
  64  |       expect(rows[0].is_admin).toBe(user.isAdmin);
  65  |       expect(rows[0].language, "Testi pričakujejo angleški uporabniški vmesnik").toBe(0);
  66  |     }
  67  |   } finally {
  68  |     await client.end();
  69  |   }
  70  | }
  71  | 
  72  | export async function login(page: Page, role: Role) {
  73  |   const user = account(role);
  74  |   await page.goto("/login");
  75  |   await page.locator("#email").fill(user.email);
  76  | 
  77  |   for (let attempt = 0; attempt < 2; attempt += 1) {
  78  |     await page.locator("#password").fill(user.password);
  79  |     await page.getByRole("button", { name: "Sign in with email", exact: true }).click();
  80  |     await page.locator("#password").fill("", { timeout: 1000 }).catch(() => undefined);
  81  |     try {
> 82  |       await expect(page).toHaveURL(/\/quizzes$/);
      |                          ^ Error: expect(page).toHaveURL(expected) failed
  83  |       break;
  84  |     } catch (error) {
  85  |       const networkError = page.getByText("Firebase: Error (auth/network-request-failed).", { exact: true });
  86  |       if (attempt > 0 || !(await networkError.isVisible())) throw error;
  87  |     }
  88  |   }
  89  | 
  90  |   const notice = page.getByRole("region", { name: "Cookie notice" });
  91  |   if (await notice.isVisible().catch(() => false)) {
  92  |     await notice.getByRole("button", { name: "Accept", exact: true }).click();
  93  |   }
  94  | 
  95  |   const response = await page.request.get("/api/proxy/users/me");
  96  |   expect(response.status()).toBe(200);
  97  |   const payload = await response.json();
  98  |   expect(payload.user.email).toBe(user.email);
  99  |   expect(payload.user.is_admin).toBe(user.isAdmin);
  100 | }
  101 | 
  102 | export async function createQuiz(page: Page, scenario: string, timeLimitMinutes = 5): Promise<CreatedQuiz> {
  103 |   const title = `N5-Omar-${scenario}-${randomUUID()}`;
  104 |   const form = new QuizForm(page);
  105 |   await form.open();
  106 |   await form.title.fill(title);
  107 |   await form.description.fill("Naloga 5 – moj namenski avtomatizirani funkcionalni test.");
  108 |   await form.category.selectOption({ label: "General" });
  109 |   await form.timeLimit.fill(String(timeLimitMinutes));
  110 |   await form.fillQuestion(0, {
  111 |     text: "Koliko je 2 + 2?",
  112 |     points: "2",
  113 |     answers: ["4", "5"],
  114 |     correct: 0,
  115 |   });
  116 |   await form.addQuestion();
  117 |   await form.fillQuestion(1, {
  118 |     text: "Glavno mesto Slovenije?",
  119 |     points: "3",
  120 |     answers: ["Ljubljana", "Maribor"],
  121 |     correct: 0,
  122 |   });
  123 |   const response = await form.submit();
  124 |   expect(response.status()).toBe(201);
  125 |   const payload = await response.json();
  126 |   await expect(page).toHaveURL(/\/admin$/);
  127 |   return { id: payload.quiz.id, title };
  128 | }
  129 | 
  130 | export async function publishQuiz(page: Page, quiz: CreatedQuiz) {
  131 |   await page.goto("/admin");
  132 |   await searchQuiz(page, quiz.title, "/admin");
  133 |   const row = page.locator('article[role="link"]').filter({ hasText: quiz.title });
  134 |   await expect(row).toHaveCount(1);
  135 |   await expect(row).toContainText("Draft");
  136 |   await row.getByRole("button", { name: "Publish", exact: true }).click();
  137 |   const saved = page.waitForResponse((response) =>
  138 |     new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz.id}/publish`
  139 |       && response.request().method() === "PATCH",
  140 |   );
  141 |   await page.getByRole("dialog").getByRole("button", { name: "Publish now", exact: true }).click();
  142 |   expect((await saved).status()).toBe(200);
  143 |   await expect(row).toContainText("Published");
  144 | }
  145 | 
  146 | export async function archiveQuiz(page: Page, quizId: number) {
  147 |   const response = await page.request.patch(`/api/proxy/quizzes/${quizId}/archive`, {
  148 |     data: { is_archived: true },
  149 |   });
  150 |   expect(response.status(), `Arhiviranje mojega kviza ${quizId}`).toBe(200);
  151 | }
  152 | 
  153 | export async function openQuiz(page: Page, quiz: CreatedQuiz) {
  154 |   await page.goto("/quizzes");
  155 |   await searchQuiz(page, quiz.title, "/quizzes");
  156 |   await page.getByRole("heading", { name: quiz.title, exact: true }).click();
  157 |   await expect(page).toHaveURL(`/quizzes/${quiz.id}`);
  158 |   await expect(page.getByRole("link", { name: "Start quiz", exact: true })).toBeVisible();
  159 | }
  160 | 
  161 | export async function startQuiz(page: Page, quiz: CreatedQuiz) {
  162 |   await openQuiz(page, quiz);
  163 |   await page.getByRole("link", { name: "Start quiz", exact: true }).click();
  164 |   await expect(page).toHaveURL(`/attempts/${quiz.id}`);
  165 | }
  166 | 
  167 | export async function selectAnswer(page: Page, quizId: number, answer: string): Promise<AttemptResult> {
  168 |   const saved = page.waitForResponse((response) =>
  169 |     new URL(response.url()).pathname === `/api/proxy/quizzes/${quizId}/attempts`
  170 |       && response.request().method() === "PATCH",
  171 |   );
  172 |   const option = page.getByRole("button", { name: answer, exact: true });
  173 |   await option.click();
  174 |   const response = await saved;
  175 |   expect(response.status()).toBe(200);
  176 |   await expect(option.locator("svg.lucide-check")).toBeVisible();
  177 |   return response.json();
  178 | }
  179 | 
  180 | export async function searchQuiz(page: Page, title: string, pathname: string) {
  181 |   await expect(async () => {
  182 |     await page.getByRole("searchbox").fill(title);
```