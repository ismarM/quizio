import { randomUUID } from "node:crypto";

import { expect, type Page, type TestInfo } from "@playwright/test";
import { Client } from "pg";

import { QuizForm } from "../support/quiz-form";

export type Role = "admin" | "userA" | "userB";

export type CreatedQuiz = {
  id: number;
  title: string;
};

type AttemptResult = {
  attempt: { id: number; time_taken_seconds?: number };
  questions: Array<{
    id: number;
    title: string;
    answers: Array<{ id: number; title: string }>;
  }>;
  responses: Array<{ question_id: number; answer_id: number }>;
};

const accountDefaults = {
  admin: { email: "omar.n5.admin@example.com", emailEnv: "ADMIN_EMAIL", passwordEnv: "ADMIN_PASSWORD", isAdmin: true, displayName: "Omar N5 Admin" },
  userA: { email: "omar.n5.usera@example.com", emailEnv: "USER_A_EMAIL", passwordEnv: "USER_A_PASSWORD", isAdmin: false, displayName: "Omar N5 User A" },
  userB: { email: "omar.n5.userb@example.com", emailEnv: "USER_B_EMAIL", passwordEnv: "USER_B_PASSWORD", isAdmin: false, displayName: "Omar N5 User B" },
} as const;

export function account(role: Role) {
  const definition = accountDefaults[role];
  return {
    email: process.env[definition.emailEnv] ?? definition.email,
    password: process.env[definition.passwordEnv] ?? "",
    isAdmin: definition.isAdmin,
    displayName: definition.displayName,
  };
}

export async function checkEnvironment() {
  const baseUrl = new URL(process.env.BASE_URL ?? "http://localhost:3000");
  expect(baseUrl.protocol, "Testiram samo lokalni HTTP").toBe("http:");
  expect(["localhost", "127.0.0.1"], "Testiram samo lokalno aplikacijo").toContain(baseUrl.hostname);

  const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb";
  const parsedDatabaseUrl = new URL(databaseUrl);
  expect(["localhost", "127.0.0.1"], "Testiram samo lokalno bazo").toContain(parsedDatabaseUrl.hostname);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const database = await client.query("SELECT current_database() AS name");
    expect(database.rows[0].name).toBe(parsedDatabaseUrl.pathname.slice(1));

    for (const role of ["admin", "userA", "userB"] as const) {
      const user = account(role);
      expect(user.password, `V omar/.env manjka geslo za ${role}`).not.toBe("");
      const { rows } = await client.query(
        'SELECT is_admin, language FROM quizio."User" WHERE email = $1',
        [user.email],
      );
      expect(rows, `V lokalni bazi manjka namenski uporabnik ${user.email}`).toHaveLength(1);
      expect(rows[0].is_admin).toBe(user.isAdmin);
      expect(rows[0].language, "Testi pričakujejo angleški uporabniški vmesnik").toBe(0);
    }
  } finally {
    await client.end();
  }
}

export async function login(page: Page, role: Role) {
  const user = account(role);
  await page.goto("/login");
  await page.locator("#email").fill(user.email);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Sign in with email", exact: true }).click();
    await page.locator("#password").fill("", { timeout: 1000 }).catch(() => undefined);
    try {
      await expect(page).toHaveURL(/\/quizzes$/);
      break;
    } catch (error) {
      const networkError = page.getByText("Firebase: Error (auth/network-request-failed).", { exact: true });
      if (attempt > 0 || !(await networkError.isVisible())) throw error;
    }
  }

  const notice = page.getByRole("region", { name: "Cookie notice" });
  if (await notice.isVisible().catch(() => false)) {
    await notice.getByRole("button", { name: "Accept", exact: true }).click();
  }

  const response = await page.request.get("/api/proxy/users/me");
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.user.email).toBe(user.email);
  expect(payload.user.is_admin).toBe(user.isAdmin);
}

export async function createQuiz(page: Page, scenario: string, timeLimitMinutes = 5): Promise<CreatedQuiz> {
  const title = `N5-Omar-${scenario}-${randomUUID()}`;
  const form = new QuizForm(page);
  await form.open();
  await form.title.fill(title);
  await form.description.fill("Naloga 5 – moj namenski avtomatizirani funkcionalni test.");
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

export async function publishQuiz(page: Page, quiz: CreatedQuiz) {
  await page.goto("/admin");
  await searchQuiz(page, quiz.title, "/admin");
  const row = page.locator('article[role="link"]').filter({ hasText: quiz.title });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Draft");
  await row.getByRole("button", { name: "Publish", exact: true }).click();
  const saved = page.waitForResponse((response) =>
    new URL(response.url()).pathname === `/api/proxy/quizzes/${quiz.id}/publish`
      && response.request().method() === "PATCH",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Publish now", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(row).toContainText("Published");
}

export async function archiveQuiz(page: Page, quizId: number) {
  const response = await page.request.patch(`/api/proxy/quizzes/${quizId}/archive`, {
    data: { is_archived: true },
  });
  expect(response.status(), `Arhiviranje mojega kviza ${quizId}`).toBe(200);
}

export async function openQuiz(page: Page, quiz: CreatedQuiz) {
  await page.goto("/quizzes");
  await searchQuiz(page, quiz.title, "/quizzes");
  await page.getByRole("heading", { name: quiz.title, exact: true }).click();
  await expect(page).toHaveURL(`/quizzes/${quiz.id}`);
  await expect(page.getByRole("link", { name: "Start quiz", exact: true })).toBeVisible();
}

export async function startQuiz(page: Page, quiz: CreatedQuiz) {
  await openQuiz(page, quiz);
  await page.getByRole("link", { name: "Start quiz", exact: true }).click();
  await expect(page).toHaveURL(`/attempts/${quiz.id}`);
}

export async function selectAnswer(page: Page, quizId: number, answer: string): Promise<AttemptResult> {
  const saved = page.waitForResponse((response) =>
    new URL(response.url()).pathname === `/api/proxy/quizzes/${quizId}/attempts`
      && response.request().method() === "PATCH",
  );
  const option = page.getByRole("button", { name: answer, exact: true });
  await option.click();
  const response = await saved;
  expect(response.status()).toBe(200);
  await expect(option.locator("svg.lucide-check")).toBeVisible();
  return response.json();
}

export async function searchQuiz(page: Page, title: string, pathname: string) {
  await expect(async () => {
    await page.getByRole("searchbox").fill(title);
    await expect(page).toHaveURL((url) =>
      url.pathname === pathname && url.searchParams.get("query") === title,
      { timeout: 3000 },
    );
  }).toPass({ timeout: 15_000 });
}

export async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const screenshot = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach(name, { path: screenshot, contentType: "image/png" });
}
