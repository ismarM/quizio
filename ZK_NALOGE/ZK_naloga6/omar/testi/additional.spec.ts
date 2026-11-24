import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { expect, request, test } from "../../../../testing/functional_testing/node_modules/@playwright/test";

import {
  account,
  archiveQuiz,
  attachEvidence,
  checkEnvironment,
  createN6Quiz,
  login,
  publishQuiz,
  selectAnswer,
  startQuiz,
  waitForTimer,
  withDatabase,
} from "./support";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, "../../../..");

test.beforeAll(checkEnvironment);

test("OMR-FT-01 – RBAC neposredni dostop, operacije in nespremenjenost baze", async ({ browser }, testInfo) => {
  const anonymous = await browser.newContext();
  const admin = await browser.newContext();
  const user = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;

  try {
    const anonymousPage = await anonymous.newPage();
    for (const path of ["/admin", "/admin/quizzes/new", "/admin/quizzes/archived"]) {
      await anonymousPage.goto(path);
      await expect(anonymousPage).toHaveURL(/\/login(?:\?|$)/);
    }

    for (const operation of [
      anonymousPage.request.post("/api/proxy/quizzes", { data: {} }),
      anonymousPage.request.put("/api/proxy/quizzes/1", { data: {} }),
      anonymousPage.request.patch("/api/proxy/quizzes/1/publish", { data: {} }),
      anonymousPage.request.patch("/api/proxy/quizzes/1/archive", { data: { is_archived: true } }),
    ]) {
      expect((await operation).status()).toBe(401);
    }

    const adminPage = await admin.newPage();
    const userPage = await user.newPage();
    await login(adminPage, "admin");
    await login(userPage, "userA");
    quiz = await createN6Quiz(adminPage, "RBAC");

    for (const path of ["/admin", "/admin/quizzes/new", `/admin/quizzes/${quiz.id}`]) {
      await userPage.goto(path);
      await expect(userPage).toHaveURL(/\/login\?reason=unauthorized$/);
    }

    const before = await withDatabase(async (client) => (await client.query(
      'SELECT title, publish_date, is_archived FROM quizio."Quiz" WHERE id_Quiz = $1',
      [quiz!.id],
    )).rows[0]);

    const forbidden = await Promise.all([
      userPage.request.post("/api/proxy/quizzes", { data: {} }),
      userPage.request.put(`/api/proxy/quizzes/${quiz.id}`, { data: { title: "Nedovoljena sprememba" } }),
      userPage.request.patch(`/api/proxy/quizzes/${quiz.id}/publish`, { data: {} }),
      userPage.request.patch(`/api/proxy/quizzes/${quiz.id}/archive`, { data: { is_archived: true } }),
      userPage.request.get("/api/proxy/quizzes?scope=not_published"),
    ]);
    expect(forbidden.map((response) => response.status())).toEqual([403, 403, 403, 403, 403]);

    const after = await withDatabase(async (client) => (await client.query(
      'SELECT title, publish_date, is_archived FROM quizio."Quiz" WHERE id_Quiz = $1',
      [quiz!.id],
    )).rows[0]);
    expect(after).toEqual(before);

    await publishQuiz(adminPage, quiz);
    const secondPublish = await adminPage.request.patch(`/api/proxy/quizzes/${quiz.id}/publish`, { data: {} });
    expect(secondPublish.status()).toBe(409);
    expect((await secondPublish.json()).error).toBe("quiz_locked");
    const publishedState = await withDatabase(async (client) => (await client.query(
      'SELECT COUNT(*)::int AS count, BOOL_AND(publish_date IS NOT NULL) AS published, BOOL_OR(is_archived) AS archived FROM quizio."Quiz" WHERE id_Quiz = $1',
      [quiz!.id],
    )).rows[0]);
    expect(publishedState).toEqual({ count: 1, published: true, archived: false });

    const directBackend = await request.newContext({
      baseURL: "https://localhost:8080",
      ignoreHTTPSErrors: true,
    });
    try {
      const unsigned = await directBackend.patch(`/api/quizzes/${quiz.id}/archive`, {
        data: { is_archived: true },
        headers: { "X-User-IsAdmin": "true" },
      });
      expect([401, 403]).toContain(unsigned.status());
    } finally {
      await directBackend.dispose();
    }

    const unchangedAfterUnsignedCall = await withDatabase(async (client) => (await client.query(
      'SELECT is_archived FROM quizio."Quiz" WHERE id_Quiz = $1',
      [quiz!.id],
    )).rows[0].is_archived);
    expect(unchangedAfterUnsignedCall).toBe(false);
    await attachEvidence(adminPage, testInfo, "OMR-FT-01-rbac");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([anonymous.close(), admin.close(), user.close()]);
  }
});

test("OMR-FT-01 – odjava in Back ne obnovita zaščitene seje", async ({ browser }, testInfo) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page, "userA");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    expect((await page.request.get("/api/proxy/users/me")).status()).toBe(401);
    await attachEvidence(page, testInfo, "OMR-FT-01-logout-back");
  } finally {
    await context.close();
  }
});

test("OMR-FT-02 – osvežitev, ponovno odprtje, dva zavihka in izpad povezave", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const user = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;

  try {
    const adminPage = await admin.newPage();
    let page = await user.newPage();
    await login(adminPage, "admin");
    await login(page, "userA");
    quiz = await createN6Quiz(adminPage, "TIMER-RESTORE", 1);
    await publishQuiz(adminPage, quiz);
    await startQuiz(page, quiz);
    await selectAnswer(page, quiz.id, "4");

    await page.reload();
    await expect(page.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();
    const restored = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    expect(restored.status()).toBe(200);
    expect((await restored.json()).responses).toHaveLength(1);

    const secondTab = await user.newPage();
    await secondTab.goto(`/attempts/${quiz.id}`);
    await expect(secondTab.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();
    await page.close();
    page = secondTab;

    await waitForTimer(page, "0:04");
    await user.setOffline(true);
    await page.waitForTimeout(6_000);
    await user.setOffline(false);
    await page.goto(`/attempts/${quiz.id}`);
    await expect(page).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 20_000 });
    await expect(page.getByText("2/5", { exact: true })).toBeVisible();

    const api = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    expect(api.status()).toBe(200);
    const payload = await api.json();
    expect(payload.attempt.time_taken_seconds).toBe(60);
    expect(payload.responses).toHaveLength(1);

    const database = await withDatabase(async (client) => (await client.query(
      `SELECT COUNT(*)::int AS attempts,
              COUNT(aq.tk_question)::int AS responses,
              EXTRACT(EPOCH FROM MAX(a.time_taken))::int AS seconds
       FROM quizio."Attempt" a
       LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
       WHERE a.tk_quiz = $1`,
      [quiz!.id],
    )).rows[0]);
    expect(database).toEqual({ attempts: 1, responses: 1, seconds: 60 });
    await attachEvidence(page, testInfo, "OMR-FT-02-restore-offline");
  } finally {
    await user.setOffline(false).catch(() => undefined);
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), user.close()]);
  }
});

test("OMR-FT-02 – odgovor ob meji, sočasna ročna/samodejna oddaja in pozni odgovor", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const user = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;

  try {
    const adminPage = await admin.newPage();
    const page = await user.newPage();
    await login(adminPage, "admin");
    await login(page, "userB");
    quiz = await createN6Quiz(adminPage, "TIMER-RACE", 1);
    await publishQuiz(adminPage, quiz);
    await startQuiz(page, quiz);

    const state = await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    const initial = await state.json();
    const question = initial.questions[0];
    const correct = question.answers.find((answer: { title: string }) => answer.title === "4");
    expect(correct).toBeDefined();

    await waitForTimer(page, "0:00");
    const [boundaryAnswer, manualFinishA, manualFinishB] = await Promise.all([
      page.request.patch(`/api/proxy/quizzes/${quiz.id}/attempts`, {
        data: { updates: [{ question_id: question.id, answer_id: correct.id }] },
      }),
      page.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
      page.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
    ]);
    expect([200, 409]).toContain(boundaryAnswer.status());
    expect(manualFinishA.status()).toBe(200);
    expect(manualFinishB.status()).toBe(200);

    await expect(page).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 20_000 });
    const late = await page.request.patch(`/api/proxy/quizzes/${quiz.id}/attempts`, {
      data: { updates: [{ question_id: question.id, answer_id: correct.id }] },
    });
    expect(late.status()).toBe(409);
    expect(["attempt_finished", "attempt_expired"]).toContain((await late.json()).error);

    const expectedResponses = boundaryAnswer.status() === 200 ? 1 : 0;
    const database = await withDatabase(async (client) => (await client.query(
      `SELECT COUNT(DISTINCT a.id_attempt)::int AS attempts,
              COUNT(aq.tk_question)::int AS responses,
              EXTRACT(EPOCH FROM MAX(a.time_taken))::int AS seconds
       FROM quizio."Attempt" a
       LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
       WHERE a.tk_quiz = $1`,
      [quiz!.id],
    )).rows[0]);
    expect(database).toEqual({ attempts: 1, responses: expectedResponses, seconds: 60 });
    await attachEvidence(page, testInfo, "OMR-FT-02-race");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), user.close()]);
  }
});

test("OMR-FT-03 – sočasni zaključki, SSE ponovna povezava, vrstni red in brez podvojitev", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const userA = await browser.newContext();
  const userB = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createN6Quiz>> | undefined;

  try {
    const adminPage = await admin.newPage();
    const pageA = await userA.newPage();
    const pageB = await userB.newPage();
    await login(adminPage, "admin");
    await login(pageA, "userA");
    await login(pageB, "userB");
    quiz = await createN6Quiz(adminPage, "SSE-RECONNECT");
    await publishQuiz(adminPage, quiz);

    let streamConnections = 0;
    adminPage.on("response", (response) => {
      if (new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz!.id}/leaderboard/stream`
          && response.status() === 200) streamConnections += 1;
    });
    await adminPage.goto(`/quizzes/${quiz.id}/leaderboard`);
    await expect(adminPage.getByText("Live", { exact: true })).toBeVisible();

    await startQuiz(pageA, quiz);
    await selectAnswer(pageA, quiz.id, "4");
    await pageA.getByRole("button", { name: "Next", exact: true }).click();
    await selectAnswer(pageA, quiz.id, "Maribor");
    await pageA.waitForTimeout(2_200);

    await startQuiz(pageB, quiz);
    await selectAnswer(pageB, quiz.id, "4");
    await pageB.getByRole("button", { name: "Next", exact: true }).click();
    await selectAnswer(pageB, quiz.id, "Maribor");

    const [finishedA, finishedB] = await Promise.all([
      pageA.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
      pageB.request.post(`/api/proxy/quizzes/${quiz.id}/attempts/finish`),
    ]);
    expect(finishedA.status()).toBe(200);
    expect(finishedB.status()).toBe(200);

    await execFileAsync("docker", ["compose", "restart", "backend"], { cwd: repositoryRoot });
    await execFileAsync("docker", ["compose", "up", "-d", "--wait", "backend"], { cwd: repositoryRoot });

    await expect.poll(() => streamConnections, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
    await expect(adminPage.getByText("Live", { exact: true })).toBeVisible();

    const rows = adminPage.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    const first = rows.nth(0);
    const second = rows.nth(1);
    const playerB = account("userB").displayName;
    const playerA = account("userA").displayName;
    await expect(first).toContainText(playerB);
    await expect(first).toContainText("2/5 pts");
    await expect(second).toContainText(playerA);
    await expect(second).toContainText("2/5 pts");
    expect(await rows.allTextContents()).toHaveLength(2);

    const apiResponse = await adminPage.request.get(`/api/proxy/quizzes/${quiz.id}/leaderboard`);
    expect.soft(
      apiResponse.status(),
      "BFF mora administratorski GET lestvice posredovati obstoječemu backend endpointu",
    ).toBe(200);
    if (apiResponse.status() === 200) {
      const api = await apiResponse.json();
      expect(api.entries).toHaveLength(2);
      expect(api.entries.map((entry: { email: string }) => entry.email)).toEqual([
        account("userB").email,
        account("userA").email,
      ]);
      expect(new Set(api.entries.map((entry: { user_id: number }) => entry.user_id)).size).toBe(2);
    } else {
      await testInfo.attach("leaderboard-bff-404.txt", {
        body: `GET /api/proxy/quizzes/${quiz.id}/leaderboard\nHTTP ${apiResponse.status()}\n`,
        contentType: "text/plain",
      });
    }

    const database = await withDatabase(async (client) => (await client.query(
      `SELECT u.email, EXTRACT(EPOCH FROM a.time_taken)::int AS seconds,
              COUNT(aq.tk_question)::int AS responses
       FROM quizio."Attempt" a
       JOIN quizio."User" u ON u.id_user = a.tk_user
       LEFT JOIN quizio."Attempt_Question" aq ON aq.tk_attempt = a.id_attempt
       WHERE a.tk_quiz = $1
       GROUP BY u.email, a.time_taken
       ORDER BY seconds ASC`,
      [quiz!.id],
    )).rows);
    expect(database).toHaveLength(2);
    expect(database[0].email).toBe(account("userB").email);
    expect(database.every((row) => row.responses === 2)).toBe(true);
    await attachEvidence(adminPage, testInfo, "OMR-FT-03-reconnect-order");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), userA.close(), userB.close()]);
  }
});
