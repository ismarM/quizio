import { expect, test } from "@playwright/test";

import {
  account,
  archiveQuiz,
  attachScreenshot,
  checkEnvironment,
  createQuiz,
  login,
  publishQuiz,
  selectAnswer,
  startQuiz,
} from "./support";

test.beforeAll(checkEnvironment);

test("OMR-FT-01 – navadni uporabnik ne more objaviti kviza", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const user = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createQuiz>> | undefined;
  try {
    const adminPage = await admin.newPage();
    const userPage = await user.newPage();
    await login(adminPage, "admin");
    await login(userPage, "userA");
    quiz = await createQuiz(adminPage, "RBAC");

    await userPage.goto("/admin");
    await expect(userPage).toHaveURL(/\/login\?reason=unauthorized$/);

    const forbidden = await userPage.request.patch(`/api/proxy/quizzes/${quiz.id}/publish`, { data: {} });
    expect(forbidden.status()).toBe(403);

    const before = await adminPage.request.get(`/api/proxy/quizzes/${quiz.id}`);
    expect(before.status()).toBe(200);
    expect((await before.json()).quiz.publish_date ?? null).toBeNull();

    await publishQuiz(adminPage, quiz);
    const after = await adminPage.request.get(`/api/proxy/quizzes/${quiz.id}`);
    expect(after.status()).toBe(200);
    expect((await after.json()).quiz.publish_date).toEqual(expect.any(String));
    await attachScreenshot(adminPage, testInfo, "OMR-FT-01-pass");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), user.close()]);
  }
});

test("OMR-FT-02 – poskus se samodejno zaključi po izteku časa", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const user = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createQuiz>> | undefined;
  try {
    const adminPage = await admin.newPage();
    const userPage = await user.newPage();
    await login(adminPage, "admin");
    await login(userPage, "userA");
    quiz = await createQuiz(adminPage, "IZTEK", 1);
    await publishQuiz(adminPage, quiz);
    await startQuiz(userPage, quiz);

    const activeAttempt = await selectAnswer(userPage, quiz.id, "4");
    await userPage.getByRole("button", { name: "Next", exact: true }).click();
    await expect(userPage.getByRole("heading", { name: "Glavno mesto Slovenije?", exact: true })).toBeVisible();

    await expect(userPage).toHaveURL(`/attempts/${quiz.id}/result`, { timeout: 75_000 });
    await expect(userPage.getByRole("heading", { name: "Quiz completed.", exact: true })).toBeVisible();
    await expect(userPage.getByText("2/5", { exact: true })).toBeVisible();

    const resultResponse = await userPage.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);
    expect(resultResponse.status()).toBe(200);
    const result = await resultResponse.json();
    expect(result.attempt.time_taken_seconds).toBe(60);
    expect(result.responses).toHaveLength(1);

    const secondQuestion = activeAttempt.questions.find((question) => question.title === "Glavno mesto Slovenije?");
    const lateAnswer = secondQuestion?.answers.find((answer) => answer.title === "Ljubljana");
    expect(secondQuestion).toBeDefined();
    expect(lateAnswer).toBeDefined();
    const lateUpdate = await userPage.request.patch(`/api/proxy/quizzes/${quiz.id}/attempts`, {
      data: { updates: [{ question_id: secondQuestion!.id, answer_id: lateAnswer!.id }] },
    });
    expect(lateUpdate.status()).toBe(409);
    expect((await lateUpdate.json()).error).toBe("attempt_finished");
    await attachScreenshot(userPage, testInfo, "OMR-FT-02-pass");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), user.close()]);
  }
});

test("OMR-FT-03 – lestvica se prek SSE posodobi brez osvežitve", async ({ browser }, testInfo) => {
  const admin = await browser.newContext();
  const observer = await browser.newContext();
  const solver = await browser.newContext();
  let quiz: Awaited<ReturnType<typeof createQuiz>> | undefined;
  try {
    const adminPage = await admin.newPage();
    const observerPage = await observer.newPage();
    const solverPage = await solver.newPage();
    await login(adminPage, "admin");
    await login(observerPage, "userA");
    await login(solverPage, "userB");
    quiz = await createQuiz(adminPage, "SSE");
    await publishQuiz(adminPage, quiz);

    const stream = observerPage.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz!.id}/leaderboard/stream`,
    );
    await observerPage.goto(`/quizzes/${quiz.id}/leaderboard`);
    expect((await stream).status()).toBe(200);
    await expect(observerPage.getByText("No one has completed this quiz yet.", { exact: true })).toBeVisible();

    let mainFrameNavigations = 0;
    observerPage.on("framenavigated", (frame) => {
      if (frame === observerPage.mainFrame()) mainFrameNavigations += 1;
    });

    await startQuiz(solverPage, quiz);
    await selectAnswer(solverPage, quiz.id, "4");
    await solverPage.getByRole("button", { name: "Next", exact: true }).click();
    await selectAnswer(solverPage, quiz.id, "Ljubljana");
    const finished = solverPage.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz!.id}/attempts/finish`
        && response.request().method() === "POST",
    );
    await solverPage.getByRole("button", { name: "Submit", exact: true }).click();
    expect((await finished).status()).toBe(200);
    await expect(solverPage).toHaveURL(`/attempts/${quiz.id}/result`);

    const player = account("userB").displayName;
    const row = observerPage.getByRole("row").filter({ hasText: player });
    await expect(row).toContainText("5/5 pts", { timeout: 15_000 });
    expect(mainFrameNavigations).toBe(0);
    await attachScreenshot(observerPage, testInfo, "OMR-FT-03-pass");
  } finally {
    if (quiz) await archiveQuiz(await admin.newPage(), quiz.id);
    await Promise.all([admin.close(), observer.close(), solver.close()]);
  }
});
