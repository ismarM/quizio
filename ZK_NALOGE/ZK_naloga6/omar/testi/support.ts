import { randomUUID } from "node:crypto";

import { expect, type Page, type TestInfo } from "../../../../testing/functional_testing/node_modules/@playwright/test";
import { Client } from "../../../../testing/functional_testing/node_modules/pg";

import { QuizForm } from "../../../../testing/functional_testing/support/quiz-form";
import {
  account,
  archiveQuiz,
  checkEnvironment,
  login,
  publishQuiz,
  selectAnswer,
  startQuiz,
  type CreatedQuiz,
} from "../../../../testing/functional_testing/omar/support";

export {
  account,
  archiveQuiz,
  checkEnvironment,
  login,
  publishQuiz,
  selectAnswer,
  startQuiz,
};

export async function createN6Quiz(
  page: Page,
  scenario: string,
  timeLimitMinutes = 5,
): Promise<CreatedQuiz> {
  const title = `N6-Omar-${scenario}-${randomUUID()}`;
  const form = new QuizForm(page);
  await form.open();
  await form.title.fill(title);
  await form.description.fill("Naloga 6 – namenski raziskovalni funkcionalni test Omarja Ždralovića.");
  await form.category.selectOption({ label: "General" });
  await form.timeLimit.fill(String(timeLimitMinutes));
  await form.fillQuestion(0, {
    text: "Koliko je 2 + 2?",
    points: "2",
    answers: ["4", "5"],
    correct: 0,
  });
  await form.addQuestion();
  await form.fillQuestion(1, {
    text: "Glavno mesto Slovenije?",
    points: "3",
    answers: ["Ljubljana", "Maribor"],
    correct: 0,
  });
  const response = await form.submit();
  expect(response.status()).toBe(201);
  const payload = await response.json();
  await expect(page).toHaveURL(/\/admin$/);
  return { id: payload.quiz.id, title };
}

export function databaseUrl() {
  return process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb";
}

export async function withDatabase<T>(operation: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    return await operation(client);
  } finally {
    await client.end();
  }
}

export async function attachEvidence(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

export async function waitForTimer(page: Page, value: string) {
  await expect(page.getByText(value, { exact: true })).toBeVisible({ timeout: 70_000 });
}
