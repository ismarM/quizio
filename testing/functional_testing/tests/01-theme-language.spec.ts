import { expect, test, type Page, type Request, type Response } from "@playwright/test";

import { ANONYMOUS, loginViaUi } from "../support/auth";
import { applySeed, getPreferences, resetPreferences } from "../support/db";

// QUIZIO-FT-01: User – select theme and language (TP-01).

const isPrefsPath = (url: string) => new URL(url).pathname === "/api/proxy/users/me/preferences";
const isPrefsPatch = (r: Request) => isPrefsPath(r.url()) && r.method() === "PATCH";
const isPrefsPatchResponse = (r: Response) => isPrefsPatch(r.request());

const html = (page: Page) => page.locator("html");
const themeSelect = (page: Page) => page.locator("#dashboard-theme");
const languageSelect = (page: Page) => page.locator("#dashboard-language");
// The profile form's submit button; text depends on the language, so it is located by structure.
const saveButton = (page: Page) =>
  page.locator("form").filter({ has: themeSelect(page) }).locator('button[type="submit"]');

async function savePreferences(page: Page) {
  const [request, response] = await Promise.all([
    page.waitForRequest(isPrefsPatch),
    page.waitForResponse(isPrefsPatchResponse),
    saveButton(page).click(),
  ]);
  return { request, response };
}

test.describe("TC-01 theme and language", () => {
  test.beforeAll(applySeed);
  test.afterAll(resetPreferences);

  test.describe("without a session", () => {
    test.use({ storageState: ANONYMOUS });

    test("TC-01-07 anonymous access redirects to login", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page).toHaveURL(/\/login/);
      await expect(themeSelect(page)).toHaveCount(0);
    });
  });

  test.describe("independent cases", () => {
    test.beforeEach(resetPreferences);

    test("TC-01-01 stored preferences are shown", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
      await expect(themeSelect(page)).toHaveValue("0");
      await expect(languageSelect(page)).toHaveValue("0");
      await expect(html(page)).toHaveAttribute("lang", "en");
      await expect(html(page)).not.toHaveClass(/dark/);
      await expect(saveButton(page)).toBeDisabled();
    });

    test("TC-01-05 unsaved change is discarded", async ({ page }) => {
      await page.goto("/dashboard");
      await themeSelect(page).selectOption("1");
      await languageSelect(page).selectOption("1");
      await expect(html(page)).toHaveClass(/dark/); // preview is applied while unsaved

      await page.reload();

      await expect(html(page)).not.toHaveClass(/dark/);
      await expect(html(page)).toHaveAttribute("lang", "en");
      await expect(themeSelect(page)).toHaveValue("0");
      await expect(languageSelect(page)).toHaveValue("0");
      expect(await getPreferences()).toEqual({ theme: 0, language: 0 });
    });

    test("TC-01-06 backend error restores the previous values", async ({ page }) => {
      await page.route(
        (url) => isPrefsPath(url.toString()),
        (route) =>
          route.request().method() === "PATCH"
            ? route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({ error: "Simulated failure" }),
              })
            : route.continue()
      );
      await page.goto("/dashboard");
      await themeSelect(page).selectOption("1");

      await saveButton(page).click();

      await expect(page.getByText("Simulated failure")).toBeVisible();
      await expect(html(page)).not.toHaveClass(/dark/);
      await expect(themeSelect(page)).toHaveValue("0");
      expect(await page.evaluate(() => window.localStorage.getItem("quizio-theme"))).not.toBe("dark");
      expect((await getPreferences()).theme).toBe(0);
    });
  });

  // Each case builds on the state saved by the previous one.
  test.describe.serial("saved preferences", () => {
    test.beforeAll(resetPreferences);

    test("TC-01-02 save the dark theme", async ({ page }) => {
      await page.goto("/dashboard");
      await themeSelect(page).selectOption("1");

      const { request, response } = await savePreferences(page);

      expect(request.postDataJSON()).toEqual({ language: 0, theme: 1 });
      expect(response.ok()).toBe(true);
      await expect(page.getByText("Profile updated.")).toBeVisible();
      await expect(saveButton(page)).toBeDisabled();
      expect(await page.evaluate(() => window.localStorage.getItem("quizio-theme"))).toBe("dark");

      await page.reload();
      await expect(html(page)).toHaveClass(/dark/);
      await expect(themeSelect(page)).toHaveValue("1");

      await page.goto("/quizzes");
      await expect(html(page)).toHaveClass(/dark/);
    });

    test("TC-01-03 save the Slovenian language", async ({ page }) => {
      await page.goto("/dashboard");
      await languageSelect(page).selectOption("1");

      const { request } = await savePreferences(page);

      expect(request.postDataJSON()).toEqual({ language: 1, theme: 1 });
      await expect(html(page)).toHaveAttribute("lang", "sl");
      // The success message keeps the language it was created in, so accept either.
      await expect(page.getByText(/Profile updated\.|Profil posodobljen\./)).toBeVisible();
      await expect(page.getByText("Tema", { exact: true })).toBeVisible();
      await expect(page.getByText("Jezik", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Shrani profil" })).toBeVisible();
    });

    test("TC-01-04 preferences survive a new session", async ({ browser, baseURL }) => {
      // A truly new session: without this, the project's stored session would be applied.
      const context = await browser.newContext({ baseURL, storageState: ANONYMOUS });
      try {
        const page = await context.newPage();
        await loginViaUi(page);
        await page.goto("/dashboard");

        await expect(html(page)).toHaveAttribute("lang", "sl");
        await expect(html(page)).toHaveClass(/dark/);
        await expect(themeSelect(page)).toHaveValue("1");
        await expect(languageSelect(page)).toHaveValue("1");
      } finally {
        await context.close();
      }
    });
  });
});
