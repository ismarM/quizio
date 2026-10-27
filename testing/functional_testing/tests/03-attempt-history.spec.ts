import { expect, test } from "@playwright/test";

import { ANONYMOUS } from "../support/auth";
import { applySeed, resetPreferences, setPreferences } from "../support/db";

// QUIZIO-FT-03: User – view history of past attempts (TP-03).
// The seed provides "FT Seed Quiz" (2 + 3 points) and one finished attempt: 2/5 points.

const QUIZ_TITLE = "FT Seed Quiz";

test.describe("TC-03 attempt history", () => {
  test.beforeAll(async () => {
    await applySeed();
  });
  test.afterEach(resetPreferences);

  test.describe("without a session", () => {
    test.use({ storageState: ANONYMOUS });

    test("TC-03-04 the history requires a session", async ({ page, request }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);

      const response = await request.get("/api/proxy/users/me/submissions?limit=100&offset=0");
      expect([401, 403]).toContain(response.status());
      expect(await response.text()).not.toContain(QUIZ_TITLE);
    });
  });

  test("TC-03-01 the finished attempt is listed", async ({ page }) => {
    await page.goto("/dashboard");

    const row = page.locator("article").filter({ hasText: QUIZ_TITLE });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Completed");
    await expect(row).toContainText("2/5");
    await expect(page.getByText("No recent attempts yet.")).toHaveCount(0);

    // The attempt started one day before the seed ran. The server renders the date in its own
    // time zone, so only a wide window is checked.
    const text = (await row.innerText()).replace(/\s+/g, " ");
    const rendered = text.match(/[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/)?.[0];
    expect(rendered).toBeDefined();
    const ageHours = (Date.now() - new Date(rendered as string).getTime()) / 3_600_000;
    expect(ageHours).toBeGreaterThan(6);
    expect(ageHours).toBeLessThan(60);
  });

  test("TC-03-02 the statistics match the history", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("article").filter({ hasText: "Completed quizzes" })).toContainText(
      /Completed quizzes\s*1\b/
    );
    await expect(page.locator("article").filter({ hasText: "Average score" })).toContainText(
      /Average score\s*40%/
    );
    await expect(page.getByText("1 completed")).toBeVisible();
    await expect(page.getByText("Next milestone: 10 quizzes")).toBeVisible();
  });

  test("TC-03-03 the history is shown in Slovenian", async ({ page }) => {
    await setPreferences({ theme: 0, language: 1 });

    await page.goto("/dashboard");

    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
    const panel = page.locator("section").filter({ hasText: "Nedavni poskusi" }).last();
    await expect(panel).toBeVisible();
    for (const heading of ["Kviz", "Datum", "Status", "Točke"]) {
      await expect(panel.getByText(heading, { exact: true })).toBeVisible();
    }
    const row = panel.locator("article").filter({ hasText: QUIZ_TITLE });
    await expect(row).toContainText("2/5");
    await expect(row).toContainText(/\d{1,2}\. \S+ \d{4}/); // sl-SI date format
  });
});
