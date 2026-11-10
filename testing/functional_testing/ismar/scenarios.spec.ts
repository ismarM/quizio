import { expect, test } from "@playwright/test";
import { checkEnvironment, createQuiz, login, openQuiz, publishQuiz, readTimer, searchQuiz, selectAnswer } from "./support";

test.beforeAll(checkEnvironment);

// Vsak test dobi svoja konteksta, nov kviz in svež poskus. Ni čiščenja baze.
test.beforeEach(async ({ page }) => { await login(page, "user"); });

test("ISM-FT-01 – objava osnutka in dostop uporabnika", async ({ page, browser }, testInfo) => {
  const admin = await browser.newContext({ baseURL: "http://localhost:3001" });
  try {
    const adminPage = await admin.newPage();
    await login(adminPage, "admin");
    const quiz = await createQuiz(adminPage, "Objava-01");
    await page.goto("/quizzes");
    await searchQuiz(page, quiz.title, "/quizzes");
    await expect(page.getByRole("heading", { name: quiz.title, exact: true })).toHaveCount(0);
    await expect(page.getByText("No quizzes found", { exact: true })).toBeVisible();
    await publishQuiz(adminPage, quiz.title, quiz.id);
    await openQuiz(page, quiz.title, quiz.id);
    await expect(page.getByRole("link", { name: "Start quiz", exact: true })).toBeVisible();
    const screenshot = testInfo.outputPath("ISM-FT-01.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("ISM-FT-01", { path: screenshot, contentType: "image/png" });
    // Kviza v tem scenariju ne začnem.
  } finally { await admin.close(); }
});

test("ISM-FT-02 – ročna oddaja in rezultat 2/5", async ({ page, browser }, testInfo) => {
  const admin = await browser.newContext({ baseURL: "http://localhost:3001" });
  try {
    const adminPage = await admin.newPage();
    await login(adminPage, "admin");
    const quiz = await createQuiz(adminPage, "Oddaja-01");
    await publishQuiz(adminPage, quiz.title, quiz.id);
    await openQuiz(page, quiz.title, quiz.id);
    await page.getByRole("link", { name: "Start quiz", exact: true }).click();
    await expect(page).toHaveURL(`/attempts/${quiz.id}`);
    await expect(page.getByText("Question 1 / 2", { exact: true })).toBeVisible();
    expect(await readTimer(page)).toBeGreaterThan(0);
    expect(await readTimer(page)).toBeLessThanOrEqual(300);
    await expect(page.getByRole("heading", { name: "Koliko je 2 + 2?", exact: true })).toBeVisible();
    await selectAnswer(page, quiz.id, "4");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();
    await selectAnswer(page, quiz.id, "Maribor");
    expect(await readTimer(page)).toBeGreaterThan(0);
    const finished = page.waitForResponse(r =>
      new URL(r.url()).pathname === `/api/proxy/quizzes/${quiz.id}/attempts/finish` && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    expect((await finished).status()).toBe(200);
    await expect(page).toHaveURL(`/attempts/${quiz.id}/result`);
    await expect(page.getByRole("heading", { name: "Quiz completed.", exact: true })).toBeVisible();
    await expect(page.getByText("2/5", { exact: true })).toBeVisible();
    await expect(page.getByText("40%", { exact: true })).toBeVisible();
    await expect(page.getByText("1/2", { exact: true })).toBeVisible();
    for (const [question, selected, correct, points] of [
      ["Koliko je 2 + 2?", "4", "4", "2"],
      ["Glavno mesto Slovenije?", "Maribor", "Ljubljana", "0"],
    ]) {
      const review = page.getByRole("article").filter({ has: page.getByRole("heading", { name: question, exact: true }) });
      for (const [label, value] of [["Selected", selected], ["Correct", correct], ["Points", points]]) {
        await expect(review.getByText(label, { exact: true }).locator("..").locator("p").last()).toHaveText(value);
      }
    }
    const result = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    expect(result.status()).toBe(200);
    expect((await result.json()).attempt.time_taken_seconds).toEqual(expect.any(Number));
    const screenshot = testInfo.outputPath("ISM-FT-02.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("ISM-FT-02", { path: screenshot, contentType: "image/png" });
  } finally { await admin.close(); }
});

test("ISM-FT-03 – nadaljevanje po zaprtju zavihka", async ({ page, context, browser }, testInfo) => {
  const admin = await browser.newContext({ baseURL: "http://localhost:3001" });
  try {
    const adminPage = await admin.newPage();
    await login(adminPage, "admin");
    const quiz = await createQuiz(adminPage, "Nadaljevanje-01");
    await publishQuiz(adminPage, quiz.title, quiz.id);
    await openQuiz(page, quiz.title, quiz.id);
    await page.getByRole("link", { name: "Start quiz", exact: true }).click();
    await expect(page).toHaveURL(`/attempts/${quiz.id}`);
    const before = await selectAnswer(page, quiz.id, "4");
    const url = page.url();
    const r1 = await readTimer(page);
    const t1 = Date.now();
    await page.close();
    // Resnično počakam 20 sekund: ne ponarejam ure brskalnika ali strežnika.
    await new Promise(resolve => setTimeout(resolve, 20_000));
    const reopened = await context.newPage();
    await reopened.goto(`/quizzes/${quiz.id}`);
    await reopened.getByRole("link", { name: "Continue quiz", exact: true }).click();
    await expect(reopened).toHaveURL(url);
    const r2 = await readTimer(reopened);
    const t2 = Date.now();
    const elapsed = (t2 - t1) / 1000;
    expect(r2).toBeGreaterThan(0);
    expect(r1).toBeLessThanOrEqual(300);
    expect(Math.abs(r2 - (r1 - elapsed))).toBeLessThanOrEqual(5);
    const response = await reopened.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    expect(response.status()).toBe(200);
    const after = await response.json();
    expect(after.attempt.id).toBe(before.attempt.id);
    expect(after.attempt.start_time).toBe(before.attempt.start_time);
    expect(after.attempt.time_taken_seconds == null).toBe(true);
    expect(after.responses).toEqual(before.responses);
    await reopened.getByRole("button", { name: "1", exact: true }).click();
    await expect(reopened.getByRole("button", { name: "4", exact: true }).locator("svg.lucide-check")).toBeVisible();
    await reopened.getByRole("button", { name: "2", exact: true }).click();
    const saved = await selectAnswer(reopened, quiz.id, "Ljubljana");
    expect(saved.responses).toHaveLength(2);
    const screenshot = testInfo.outputPath("ISM-FT-03.png");
    await reopened.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("ISM-FT-03", { path: screenshot, contentType: "image/png" });
    await testInfo.attach("nadaljevanje.json", {
      body: JSON.stringify({ url, attemptId: after.attempt.id, startTime: after.attempt.start_time, r1, t1, r2, t2, elapsed }, null, 2),
      contentType: "application/json",
    });
    // Oddaja ni del tega scenarija.
  } finally { await admin.close(); }
});
