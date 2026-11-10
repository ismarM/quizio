import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { Client } from "pg";
import { expect, type Page } from "@playwright/test";
import { QuizForm } from "../support/quiz-form";
import { applyHmacHeaders } from "../../../next/src/lib/api/request-integrity";

const accounts = {
  admin: "ismar.n5.admin@example.com",
  user: "ismar.n5.user@example.com",
};

// Samo branje: brez seeda, posodabljanja uporabnikov ali čiščenja baze.
export async function checkEnvironment() {
  const env = parseEnv(readFileSync(path.join(__dirname, "../../../backend/.env"), "utf8"));
  expect(env.DB_NAME, "Dovoljena je samo testna baza").toBe("quizio_ismar_e2e");
  expect(env.DB_HOST).toBe("localhost");
  expect(env.DB_PORT).toBe("5432");
  expect(env.SERVER_PORT).toBe("18081");
  const frontend = parseEnv(readFileSync(path.join(__dirname, "../../../next/.env.local"), "utf8"));
  expect(frontend.GO_BACKEND_URL).toBe("http://localhost:18081");
  expect(frontend.FIREBASE_PROJECT_ID).toBe("quizio-4d0c9");
  expect(frontend.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe("quizio-4d0c9");
  if (!env.HMAC_SECRET || env.HMAC_SECRET !== frontend.HMAC_SECRET) {
    throw new Error("Lokalni nastavitvi HMAC se ne ujemata.");
  }
  const client = new Client({
    host: env.DB_HOST, port: Number(env.DB_PORT), database: env.DB_NAME,
    user: env.DB_USER, password: env.DB_PASSWORD, ssl: false,
  });
  await client.connect();
  try {
    const database = await client.query("SELECT current_database() AS name");
    expect(database.rows[0].name).toBe("quizio_ismar_e2e");
    for (const role of ["admin", "user"] as const) {
      const prefix = role.toUpperCase();
      expect(process.env[`${prefix}_EMAIL`], "Uporabim samo namenski testni račun").toBe(accounts[role]);
      if (!process.env[`${prefix}_PASSWORD`]) {
        throw new Error(`Manjka ${prefix}_PASSWORD v ismar/.env; glej navodila naloge 5.`);
      }
      const { rows } = await client.query(
        'SELECT id_user, is_admin, language FROM quizio."User" WHERE email = $1', [accounts[role]],
      );
      expect(rows, "Namenski uporabnik mora že obstajati v testni bazi").toHaveLength(1);
      expect(rows[0].is_admin).toBe(role === "admin");
      expect(rows[0].language, "Testiram angleški UI kot pri nalogi 3").toBe(0);
      // Pred prijavo preverim tudi dejanski Go strežnik, ne samo datoteke .env.
      const headers = new Headers({ "X-User-Email": accounts[role] });
      applyHmacHeaders(headers, "/api/users/lookup", undefined, env.HMAC_SECRET);
      const response = await fetch("http://localhost:18081/api/users/lookup", {
        headers, signal: AbortSignal.timeout(5000),
      });
      expect(response.status, "Go mora uporabljati pripravljeno testno bazo").toBe(200);
      const payload = await response.json();
      expect(payload.user.id).toBe(rows[0].id_user);
      expect(payload.user.is_admin).toBe(rows[0].is_admin);
    }
  } finally {
    await client.end();
  }
}

export async function login(page: Page, role: "admin" | "user") {
  await page.goto("/login");
  await page.locator("#email").fill(accounts[role]);
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.locator("#password").fill(process.env[`${role.toUpperCase()}_PASSWORD`]!);
    await page.getByRole("button", { name: "Sign in with email", exact: true }).click();
    // Geslo odstranim iz DOM za morebitni error-context. Zasebna sled lahko še
    // vedno vsebuje zahtevo prijave, zato poročil s sledmi ne objavljam.
    await page.locator("#password").fill("", { timeout: 1000 }).catch(() => {
      // Če sem že preusmerjen, polja ni več.
    });
    try {
      await expect(page).toHaveURL(/\/quizzes$/);
      break;
    } catch (error) {
      if (attempt > 0 || !await page.getByText("Firebase: Error (auth/network-request-failed).", { exact: true }).isVisible()) throw error;
      console.log(`Ponovim prijavo ${role}: začasna omrežna napaka Firebase.`);
    }
  }
  const notice = page.getByRole("region", { name: "Cookie notice" });
  // section z aria-label ima vlogo region; čakam, da se obvestilo prikaže.
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Accept", exact: true }).click();
  const response = await page.request.get("/api/proxy/users/me");
  expect(response.status()).toBe(200);
  const { user } = await response.json();
  expect(user.email).toBe(accounts[role]);
  expect(user.is_admin).toBe(role === "admin");
}

export async function createQuiz(page: Page, scenario: string) {
  const title = `N3-Ismar-${scenario}-${randomUUID()}`;
  const form = new QuizForm(page);
  await form.open();
  await form.title.fill(title);
  await form.description.fill("Naloga 5 – ločen testni kviz za Ismarjev scenarij.");
  await form.category.selectOption({ label: "General" });
  await form.timeLimit.fill("5");
  await form.fillQuestion(0, { text: "Koliko je 2 + 2?", points: "2", answers: ["4", "5"], correct: 0 });
  await form.addQuestion();
  await form.fillQuestion(1, { text: "Glavno mesto Slovenije?", points: "3", answers: ["Ljubljana", "Maribor"], correct: 0 });
  const response = await form.submit();
  expect(response.status()).toBe(201);
  const { quiz } = await response.json();
  await expect(page).toHaveURL(/\/admin$/);
  return { id: quiz.id as number, title };
}

export async function publishQuiz(page: Page, title: string, quizId: number) {
  await page.goto("/admin");
  await searchQuiz(page, title, "/admin");
  const row = page.locator('article[role="link"]').filter({ hasText: title });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Draft");
  await expect(row).toContainText("Not scheduled");
  await row.getByRole("button", { name: "Publish", exact: true }).click();
  const saved = page.waitForResponse(r =>
    new URL(r.url()).pathname === `/api/proxy/quizzes/${quizId}/publish` && r.request().method() === "PATCH",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Publish now", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(row).toContainText("Published");
}

export async function openQuiz(page: Page, title: string, quizId: number) {
  await page.goto("/quizzes"); // brez filtrov iz prejšnjih obiskov
  await searchQuiz(page, title, "/quizzes");
  await page.getByRole("heading", { name: title, exact: true }).click();
  await expect(page).toHaveURL(`/quizzes/${quizId}`);
  await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();
  const questions = page.getByText("Questions", { exact: true }).locator("..").locator("..");
  const time = page.getByText("Time limit", { exact: true }).locator("..").locator("..");
  await expect(questions).toContainText("2");
  await expect(time).toContainText("5");
}

export async function searchQuiz(page: Page, title: string, pathname: string) {
  // Začetni učinek komponente lahko med hidracijo ponastavi vnos. Ponovim samo
  // nenevarno iskanje, dokler UI ne potrdi filtra v URL-ju (router.replace).
  await expect(async () => {
    await page.getByRole("searchbox").fill(title);
    await expect(page).toHaveURL(url => url.pathname === pathname && url.searchParams.get("query") === title, { timeout: 3000 });
  }).toPass({ timeout: 15_000 });
}

export async function selectAnswer(page: Page, quizId: number, answer: string) {
  const saved = page.waitForResponse(r =>
    new URL(r.url()).pathname === `/api/proxy/quizzes/${quizId}/attempts` && r.request().method() === "PATCH",
  );
  const option = page.getByRole("button", { name: answer, exact: true });
  await option.click();
  const response = await saved;
  expect(response.status(), "Odgovor mora biti shranjen pred naslednjim dejanjem").toBe(200);
  await expect(option.locator("svg.lucide-check")).toBeVisible();
  return response.json();
}

export function timer(page: Page) {
  return page.locator("div:has(> svg.lucide-clock-3)")
    .filter({ hasText: /^\d+:\d{2}$/ });
}

export async function readTimer(page: Page) {
  const text = (await timer(page).innerText()).trim();
  const [minutes, seconds] = text.split(":").map(Number);
  expect(Number.isFinite(minutes + seconds)).toBe(true);
  return minutes * 60 + seconds;
}
