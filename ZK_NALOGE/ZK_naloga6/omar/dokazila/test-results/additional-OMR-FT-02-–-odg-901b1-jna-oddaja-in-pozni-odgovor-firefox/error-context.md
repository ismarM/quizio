# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: additional.spec.ts >> OMR-FT-02 – odgovor ob meji, sočasna ročna/samodejna oddaja in pozni odgovor
- Location: ..\..\ZK_NALOGE\ZK_naloga6\omar\testi\additional.spec.ts:192:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/attempts/46/result"
Received: "http://localhost:3000/attempts/46"
Timeout:  20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    42 × locator resolved to <html lang="en" class="h-full antialiased font-sans">…</html>
       - unexpected value "http://localhost:3000/attempts/46"

```

```yaml
- alert
- main:
  - link "Quizio":
    - /url: /quizzes
  - navigation
  - link "O":
    - /url: /dashboard
  - button "Sign out"
  - paragraph: Question 1 / 2
  - heading "N6-Omar-TIMER-RACE-e546a8a4-b82a-48be-bf17-212ddbe6a1f6" [level=1]
  - text: 0:00 Single choice 2 points
  - heading "Koliko je 2 + 2?" [level=2]
  - button "4"
  - button "5"
  - button "Previous" [disabled]
  - button "Next"
  - complementary:
    - paragraph: Attempt progress
    - paragraph:
      - text: Answered
      - strong: "0"
      - text: of
      - strong: "2"
      - text: questions.
    - button "1"
    - button "2"
    - paragraph: Timer keeps running.
    - paragraph: Closing the browser does not pause the quiz. Submit before the time runs out.
```

# Test source

```ts
  124 |     await page.goBack();
  125 |     await expect(page).toHaveURL(/\/login(?:\?|$)/);
  126 |     expect((await page.request.get("/api/proxy/users/me")).status()).toBe(401);
  127 |     await attachEvidence(page, testInfo, "OMR-FT-01-logout-back");
  128 |   } finally {
  129 |     await context.close();
  130 |   }
  131 | });
  132 | 
  133 | test("OMR-FT-02 – osvežitev, ponovno odprtje, dva zavihka in izpad povezave", async ({ browser }, testInfo) => {
  134 |   const admin = await browser.newContext();
  135 |   const user = await browser.newContext();
  136 |   let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;
  137 | 
  138 |   try {
  139 |     const adminPage = await admin.newPage();
  140 |     let page = await user.newPage();
  141 |     await login(adminPage, "admin");
  142 |     await login(page, "userA");
  143 |     quiz = await createN6Quiz(adminPage, "TIMER-RESTORE", 1);
  144 |     await publishQuiz(adminPage, quiz);
  145 |     await startQuiz(page, quiz);
  146 |     await selectAnswer(page, quiz.id, "4");
  147 | 
  148 |     await page.reload();
  149 |     await expect(page.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();
  150 |     const restored = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
  151 |     expect(restored.status()).toBe(200);
  152 |     expect((await restored.json()).responses).toHaveLength(1);
  153 | 
  154 |     const secondTab = await user.newPage();
  155 |     await secondTab.goto(`/attempts/${quiz.id}`);
  156 |     await expect(secondTab.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();
  157 |     await page.close();
  158 |     page = secondTab;
  159 | 
  160 |     await waitForTimer(page, "0:04");
  161 |     await user.setOffline(true);
  162 |     await page.waitForTimeout(6_000);
  163 |     await user.setOffline(false);
  164 |     await page.goto(`/attempts/${quiz.id}`);
  165 |     await expect(page).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 20_000 });
  166 |     await expect(page.getByText("2/5", { exact: true })).toBeVisible();
  167 | 
  168 |     const api = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
  169 |     expect(api.status()).toBe(200);
  170 |     const payload = await api.json();
  171 |     expect(payload.attempt.time_taken_seconds).toBe(60);
  172 |     expect(payload.responses).toHaveLength(1);
  173 | 
  174 |     const database = await withDatabase(async (client) => (await client.query(
  175 |       `SELECT COUNT(*)::int AS attempts,
  176 |               COUNT(aq.tk_question)::int AS responses,
  177 |               EXTRACT(EPOCH FROM MAX(a.time_taken))::int AS seconds
  178 |        FROM quizio."Attempt" a
  179 |        LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
  180 |        WHERE a.tk_quiz = $1`,
  181 |       [quiz!.id],
  182 |     )).rows[0]);
  183 |     expect(database).toEqual({ attempts: 1, responses: 1, seconds: 60 });
  184 |     await attachEvidence(page, testInfo, "OMR-FT-02-restore-offline");
  185 |   } finally {
  186 |     await user.setOffline(false).catch(() => undefined);
  187 |     if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
  188 |     await Promise.all([admin.close(), user.close()]);
  189 |   }
  190 | });
  191 | 
  192 | test("OMR-FT-02 – odgovor ob meji, sočasna ročna/samodejna oddaja in pozni odgovor", async ({ browser }, testInfo) => {
  193 |   const admin = await browser.newContext();
  194 |   const user = await browser.newContext();
  195 |   let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;
  196 | 
  197 |   try {
  198 |     const adminPage = await admin.newPage();
  199 |     const page = await user.newPage();
  200 |     await login(adminPage, "admin");
  201 |     await login(page, "userB");
  202 |     quiz = await createN6Quiz(adminPage, "TIMER-RACE", 1);
  203 |     await publishQuiz(adminPage, quiz);
  204 |     await startQuiz(page, quiz);
  205 | 
  206 |     const state = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
  207 |     const initial = await state.json();
  208 |     const question = initial.questions[0];
  209 |     const correct = question.answers.find((answer: { title: string }) => answer.title === "4");
  210 |     expect(correct).toBeDefined();
  211 | 
  212 |     await waitForTimer(page, "0:00");
  213 |     const [boundaryAnswer, manualFinishA, manualFinishB] = await Promise.all([
  214 |       page.request.patch(`/api/proxy/quizzes/${quiz.id}/attempts`, {
  215 |         data: { updates: [{ question_id: question.id, answer_id: correct.id }] },
  216 |       }),
  217 |       page.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
  218 |       page.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
  219 |     ]);
  220 |     expect([200, 409]).toContain(boundaryAnswer.status());
  221 |     expect(manualFinishA.status()).toBe(200);
  222 |     expect(manualFinishB.status()).toBe(200);
  223 | 
> 224 |     await expect(page).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 20_000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  225 |     const late = await page.request.patch(`/api/proxy/quizzes/${quiz.id}/attempts`, {
  226 |       data: { updates: [{ question_id: question.id, answer_id: correct.id }] },
  227 |     });
  228 |     expect(late.status()).toBe(409);
  229 |     expect(["attempt_finished", "attempt_expired"]).toContain((await late.json()).error);
  230 | 
  231 |     const expectedResponses = boundaryAnswer.status() === 200 ? 1 : 0;
  232 |     const database = await withDatabase(async (client) => (await client.query(
  233 |       `SELECT COUNT(DISTINCT a.id_attempt)::int AS attempts,
  234 |               COUNT(aq.tk_question)::int AS responses,
  235 |               EXTRACT(EPOCH FROM MAX(a.time_taken))::int AS seconds
  236 |        FROM quizio."Attempt" a
  237 |        LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
  238 |        WHERE a.tk_quiz = $1`,
  239 |       [quiz!.id],
  240 |     )).rows[0]);
  241 |     expect(database).toEqual({ attempts: 1, responses: expectedResponses, seconds: 60 });
  242 |     await attachEvidence(page, testInfo, "OMR-FT-02-race");
  243 |   } finally {
  244 |     if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
  245 |     await Promise.all([admin.close(), user.close()]);
  246 |   }
  247 | });
  248 | 
  249 | test("OMR-FT-03 – sočasni zaključki, SSE ponovna povezava, vrstni red in brez podvojitev", async ({ browser }, testInfo) => {
  250 |   const admin = await browser.newContext();
  251 |   const userA = await browser.newContext();
  252 |   const userB = await browser.newContext();
  253 |   let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;
  254 | 
  255 |   try {
  256 |     const adminPage = await admin.newPage();
  257 |     const pageA = await userA.newPage();
  258 |     const pageB = await userB.newPage();
  259 |     await login(adminPage, "admin");
  260 |     await login(pageA, "userA");
  261 |     await login(pageB, "userB");
  262 |     quiz = await createN6Quiz(adminPage, "SSE-RECONNECT");
  263 |     await publishQuiz(adminPage, quiz);
  264 | 
  265 |     let streamConnections = 0;
  266 |     adminPage.on("response", (response) => {
  267 |       if (new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz!.id}/leaderboard/stream`
  268 |           && response.status() === 200) streamConnections += 1;
  269 |     });
  270 |     await adminPage.goto(`/quizzes/${quiz.id}/leaderboard`);
  271 |     await expect(adminPage.getByText("Live", { exact: true })).toBeVisible();
  272 | 
  273 |     await startQuiz(pageA, quiz);
  274 |     await selectAnswer(pageA, quiz.id, "4");
  275 |     await pageA.getByRole("button", { name: "Next", exact: true }).click();
  276 |     await selectAnswer(pageA, quiz.id, "Maribor");
  277 |     await pageA.waitForTimeout(2_200);
  278 | 
  279 |     await startQuiz(pageB, quiz);
  280 |     await selectAnswer(pageB, quiz.id, "4");
  281 |     await pageB.getByRole("button", { name: "Next", exact: true }).click();
  282 |     await selectAnswer(pageB, quiz.id, "Maribor");
  283 | 
  284 |     const [finishedA, finishedB] = await Promise.all([
  285 |       pageA.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
  286 |       pageB.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
  287 |     ]);
  288 |     expect(finishedA.status()).toBe(200);
  289 |     expect(finishedB.status()).toBe(200);
  290 | 
  291 |     await execFileAsync("docker", ["compose", "restart", "backend"], { cwd: repositoryRoot });
  292 |     await execFileAsync("docker", ["compose", "up", "-d", "--wait", "backend"], { cwd: repositoryRoot });
  293 | 
  294 |     await expect.poll(() => streamConnections, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
  295 |     await expect(adminPage.getByText("Live", { exact: true })).toBeVisible();
  296 | 
  297 |     const rows = adminPage.locator("tbody tr");
  298 |     await expect(rows).toHaveCount(2);
  299 |     const first = rows.nth(0);
  300 |     const second = rows.nth(1);
  301 |     const playerB = account("userB").displayName;
  302 |     const playerA = account("userA").displayName;
  303 |     await expect(first).toContainText(playerB);
  304 |     await expect(first).toContainText("2/5 pts");
  305 |     await expect(second).toContainText(playerA);
  306 |     await expect(second).toContainText("2/5 pts");
  307 |     expect(await rows.allTextContents()).toHaveLength(2);
  308 | 
  309 |     const apiResponse = await adminPage.request.get(`/api/proxy/quizzes/${quiz.id}/leaderboard`);
  310 |     expect.soft(
  311 |       apiResponse.status(),
  312 |       "BFF mora administratorski GET lestvice posredovati obstoječemu backend endpointu",
  313 |     ).toBe(200);
  314 |     if (apiResponse.status() === 200) {
  315 |       const api = await apiResponse.json();
  316 |       expect(api.entries).toHaveLength(2);
  317 |       expect(api.entries.map((entry: { email: string }) => entry.email)).toEqual([
  318 |         account("userB").email,
  319 |         account("userA").email,
  320 |       ]);
  321 |       expect(new Set(api.entries.map((entry: { user_id: number }) => entry.user_id)).size).toBe(2);
  322 |     } else {
  323 |       await testInfo.attach("leaderboard-bff-404.txt", {
  324 |         body: `GET /api/proxy/quizzes/${quiz.id}/leaderboard\nHTTP ${apiResponse.status()}\n`,
```