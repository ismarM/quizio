# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: additional.spec.ts >> OMR-FT-03 – sočasni zaključki, SSE ponovna povezava, vrstni red in brez podvojitev
- Location: ..\..\ZK_NALOGE\ZK_naloga6\omar\testi\additional.spec.ts:249:5

# Error details

```
Error: BFF mora administratorski GET lestvice posredovati obstoječemu backend endpointu

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - alert [ref=f1e2]
  - main [ref=f1e3]:
    - generic [ref=f1e4]:
      - link "Quizio" [ref=f1e6] [cursor=pointer]:
        - /url: /quizzes
      - navigation
      - generic [ref=f1e7]:
        - link "O" [ref=f1e8] [cursor=pointer]:
          - /url: /dashboard
        - button "Sign out" [ref=f1e9] [cursor=pointer]
    - generic [ref=f1e11]:
      - generic [ref=f1e12]:
        - generic [ref=f1e13]:
          - generic [ref=f1e14]:
            - paragraph [ref=f1e15]: Question 2 / 2
            - heading "N6-Omar-SSE-RECONNECT-9c0219ab-af45-43a2-a1d7-2773b1161076" [level=1] [ref=f1e16]
          - generic [ref=f1e17]: 4:48
        - generic [ref=f1e23]:
          - generic [ref=f1e24]: Single choice
          - generic [ref=f1e25]: 3 points
        - heading "Glavno mesto Slovenije?" [level=2] [ref=f1e26]
        - generic [ref=f1e27]:
          - button "Ljubljana" [ref=f1e28] [cursor=pointer]
          - button "Maribor" [active] [ref=f1e31] [cursor=pointer]
        - generic [ref=f1e36]:
          - button "Previous" [ref=f1e37] [cursor=pointer]
          - button "Submit" [ref=f1e40] [cursor=pointer]
      - complementary [ref=f1e43]:
        - generic [ref=f1e44]:
          - paragraph [ref=f1e45]: Attempt progress
          - paragraph [ref=f1e47]:
            - text: Answered
            - strong [ref=f1e48]: "2"
            - text: of
            - strong [ref=f1e49]: "2"
            - text: questions.
          - generic [ref=f1e50]:
            - button "1" [ref=f1e51] [cursor=pointer]
            - button "2" [ref=f1e52] [cursor=pointer]
        - generic [ref=f1e53]:
          - paragraph [ref=f1e54]: Timer keeps running.
          - paragraph [ref=f1e55]: Closing the browser does not pause the quiz. Submit before the time runs out.
```

# Test source

```ts
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
  224 |     await expect(page).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 20_000 });
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
> 313 |     ).toBe(200);
      |       ^ Error: BFF mora administratorski GET lestvice posredovati obstoječemu backend endpointu
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
  325 |         contentType: "text/plain",
  326 |       });
  327 |     }
  328 | 
  329 |     const database = await withDatabase(async (client) => (await client.query(
  330 |       `SELECT u.email, EXTRACT(EPOCH FROM a.time_taken)::int AS seconds,
  331 |               COUNT(aq.tk_question)::int AS responses
  332 |        FROM quizio."Attempt" a
  333 |        JOIN quizio."User" u ON u.id_user = a.tk_user
  334 |        LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
  335 |        WHERE a.tk_quiz = $1
  336 |        GROUP BY u.email, a.time_taken
  337 |        ORDER BY seconds ASC`,
  338 |       [quiz!.id],
  339 |     )).rows);
  340 |     expect(database).toHaveLength(2);
  341 |     expect(database[0].email).toBe(account("userB").email);
  342 |     expect(database.every((row) => row.responses === 2)).toBe(true);
  343 |     await attachEvidence(adminPage, testInfo, "OMR-FT-03-reconnect-order");
  344 |   } finally {
  345 |     if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
  346 |     await Promise.all([admin.close(), userA.close(), userB.close()]);
  347 |   }
  348 | });
  349 | 
```