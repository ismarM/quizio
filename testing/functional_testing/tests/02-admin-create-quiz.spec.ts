import { expect, test } from "@playwright/test";

import { ANONYMOUS } from "../support/auth";
import { applySeed, countQuizzes, findQuizzes, getQuestions } from "../support/db";
import { QuizForm } from "../support/quiz-form";

// QUIZIO-FT-02: Admin – create a new quiz (TP-02).
// The quiz titles start with "FT " so that the seed removes them before the next run.

test.describe("TC-02 create a new quiz", () => {
  test.beforeAll(applySeed);

  test.describe("without a session", () => {
    test.use({ storageState: ANONYMOUS });

    test("TC-02-10 anonymous access is blocked", async ({ page, request }) => {
      const title = "FT Anonymous Quiz";

      await page.goto("/admin/quizzes/new");
      await expect(page).toHaveURL(/\/login/);

      const response = await request.post("/api/proxy/quizzes", {
        data: { title, time_limit: 60, questions: [] },
      });
      expect([401, 403]).toContain(response.status());
      expect(await findQuizzes(title)).toHaveLength(0);
    });
  });

  test("TC-02-01 the form opens in the draft state", async ({ page }) => {
    const form = new QuizForm(page);

    await form.open();

    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(form.title).toHaveValue("");
    await expect(form.description).toHaveValue("");
    await expect(form.timeLimit).toHaveValue("15");
    const firstCategory = await form.category.locator("option").first().getAttribute("value");
    await expect(form.category).toHaveValue(firstCategory ?? "");
    await expect(form.questions).toHaveCount(1);
    await expect(form.questionText(0)).toHaveValue("");
    await expect(form.save).toBeVisible();
    await expect(form.save).toBeDisabled(); // title and question text are still empty
  });

  test("TC-02-04 the title is required", async ({ page }) => {
    const form = new QuizForm(page);
    const sent = form.trackCreateRequests();
    await form.open();
    await form.fillMinimal("FT Title Required Quiz");
    await expect(form.save).toBeEnabled();

    await form.title.fill("");
    await expect(form.save).toBeDisabled();

    await form.title.fill("   ");
    await expect(form.save).toBeDisabled();

    expect(sent).toHaveLength(0);
    expect(await findQuizzes("FT Title Required Quiz")).toHaveLength(0);
  });

  test("TC-02-05 time limit boundaries", async ({ page }) => {
    const title = "FT Time Limit Quiz";
    const form = new QuizForm(page);
    await form.open();
    await form.fillMinimal(title);

    for (const invalid of ["0", "-1", ""]) {
      await form.timeLimit.fill(invalid);
      await expect(form.save).toBeDisabled();
    }
    expect(await findQuizzes(title)).toHaveLength(0);

    await form.timeLimit.fill("1");
    await expect(form.save).toBeEnabled();
    const response = await form.submit();

    expect(response.ok()).toBe(true);
    const [quiz] = await findQuizzes(title);
    expect(quiz.time_limit_seconds).toBe(60);
  });

  test("TC-02-06 the only question cannot be removed", async ({ page }) => {
    const form = new QuizForm(page);
    const sent = form.trackCreateRequests();
    await form.open();
    await form.fillMinimal("FT No Questions Quiz");
    const removeFirst = form.question(0).getByRole("button", { name: "Remove" }).first();

    // A quiz can never reach zero questions through the UI: Remove is disabled for the last one.
    await expect(removeFirst).toBeDisabled();

    await form.addQuestion();
    await expect(form.questions).toHaveCount(2);
    await expect(removeFirst).toBeEnabled();
    await removeFirst.click();

    await expect(form.questions).toHaveCount(1);
    await expect(removeFirst).toBeDisabled();
    expect(sent).toHaveLength(0);
    expect(await findQuizzes("FT No Questions Quiz")).toHaveLength(0);
  });

  test("TC-02-07 question rules", async ({ page }) => {
    const form = new QuizForm(page);
    await form.open();
    await form.fillMinimal("FT Question Rules Quiz");
    await expect(form.save).toBeEnabled();

    // (a) empty question text
    await form.questionText(0).fill("");
    await expect(form.save).toBeDisabled();
    await form.questionText(0).fill("2+2?");
    await expect(form.save).toBeEnabled();

    // (b) points 0
    await form.points(0).fill("0");
    await expect(form.save).toBeDisabled();
    await form.points(0).fill("1");
    await expect(form.save).toBeEnabled();

    // (c) fewer than two answers cannot be reached: Remove is disabled at two answers
    // (three disabled buttons: the only question's Remove and the two answers' Remove)
    await expect(
      form.question(0).locator("button:disabled").filter({ hasText: "Remove" })
    ).toHaveCount(3);

    // (d) there is always exactly one correct answer, also after removing the correct one
    await expect(form.question(0).locator('input[type="radio"]:checked')).toHaveCount(1);
    await form.question(0).getByRole("button", { name: "Add answer" }).click();
    await form.answers(0).nth(2).fill("5");
    await form.radios(0).nth(2).check();
    await form.question(0).getByRole("button", { name: "Remove" }).nth(3).click(); // third answer
    await expect(form.answers(0)).toHaveCount(2);
    await expect(form.question(0).locator('input[type="radio"]:checked')).toHaveCount(1);
    await expect(form.save).toBeEnabled();

    // (e) empty answer text
    await form.answers(0).nth(1).fill("");
    await expect(form.save).toBeDisabled();
  });

  test("TC-02-09 a server error keeps the entered data", async ({ page }) => {
    const title = "FT Server Error Quiz";
    const form = new QuizForm(page);
    await page.route(
      (url) => url.pathname === "/api/proxy/quizzes",
      (route) =>
        route.request().method() === "POST"
          ? route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "Simulated failure" }),
            })
          : route.continue()
    );
    await form.open();
    await form.fillMinimal(title);

    await form.save.click();

    await expect(page.getByText("Simulated failure")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/quizzes\/new/);
    await expect(form.title).toHaveValue(title);
    await expect(form.questionText(0)).toHaveValue("2+2?");
    await expect(form.save).toBeEnabled();
    expect(await findQuizzes(title)).toHaveLength(0);
  });

  test("TC-02-11 cancel creates nothing", async ({ page }) => {
    const title = "FT Cancelled Quiz";
    const form = new QuizForm(page);
    const before = await countQuizzes();
    await form.open();
    await form.title.fill(title);
    await form.questionText(0).fill("Will be discarded");

    await form.cancel.click();

    await expect(page).toHaveURL(/\/admin\/quizzes$/);
    expect(await findQuizzes(title)).toHaveLength(0);
    expect(await countQuizzes()).toBe(before);
  });

  // The creating cases come last; TC-02-08 needs the quiz created by TC-02-02.
  test.describe.serial("creating quizzes", () => {
    const minimalTitle = "FT Minimal Quiz";

    test("TC-02-02 create a minimal quiz", async ({ page }) => {
      const form = new QuizForm(page);
      const before = await countQuizzes();
      await form.open();
      await form.fillMinimal(minimalTitle);

      const response = await form.submit();

      expect(response.ok()).toBe(true);
      await expect(page).toHaveURL(/\/admin$/);
      const row = page.locator('article[role="link"]').filter({ hasText: minimalTitle }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText("Draft");

      const quizzes = await findQuizzes(minimalTitle);
      expect(quizzes).toHaveLength(1);
      expect(quizzes[0].time_limit_seconds).toBe(60);
      expect(quizzes[0].published).toBe(false);
      expect(await countQuizzes()).toBe(before + 1);
    });

    test("TC-02-03 create a full quiz", async ({ page }) => {
      const title = `FT Full Quiz ${Date.now()}`;
      const description = "Created by functional test";
      const form = new QuizForm(page);
      await form.open();

      await form.title.fill(title);
      await form.description.fill(description);
      await form.category.selectOption({ index: 1 });
      const categoryId = Number(await form.category.inputValue());
      await form.timeLimit.fill("15");
      const questions = [
        { text: "Question one?", points: "1", answers: ["A1", "B1", "C1", "D1"], correct: 0 },
        { text: "Question two?", points: "5", answers: ["A2", "B2", "C2", "D2"], correct: 2 },
        { text: "Question three?", points: "10", answers: ["A3", "B3", "C3", "D3"], correct: 3 },
      ];
      for (const [index, question] of questions.entries()) {
        if (index > 0) {
          await form.addQuestion();
        }
        await form.fillQuestion(index, question);
      }

      const response = await form.submit();
      expect(response.ok()).toBe(true);
      await expect(page).toHaveURL(/\/admin$/);

      const [quiz] = await findQuizzes(title);
      expect(quiz).toMatchObject({
        title,
        description,
        category_id: categoryId,
        time_limit_seconds: 900,
        published: false,
      });
      expect(await getQuestions(quiz.id)).toEqual(
        questions.map((q) => ({
          title: q.text,
          points: Number(q.points),
          answers: q.answers,
          correct: [q.answers[q.correct]],
        }))
      );

      // The detail view shows the stored values in the same order.
      await page.goto(`/admin/quizzes/${quiz.id}`);
      await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
      const values = await page
        .locator("input, textarea")
        .evaluateAll((elements) => elements.map((e) => (e as HTMLInputElement).value));
      expect(values).toEqual(
        expect.arrayContaining([title, description, "15", ...questions.map((q) => q.text), ...questions.flatMap((q) => q.answers)])
      );
    });

    test("TC-02-08 a new quiz is a draft and not in the public list", async ({ page }) => {
      await page.goto(`/quizzes?query=${encodeURIComponent(minimalTitle)}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(minimalTitle)).toHaveCount(0);

      await page.goto("/admin");
      const row = page.locator('article[role="link"]').filter({ hasText: minimalTitle }).first();
      await expect(row).toContainText("Draft");
    });
  });
});
