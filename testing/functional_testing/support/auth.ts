import type { Page } from "@playwright/test";

import { getTestCredentials } from "./credentials";

/** Logs in through the login form (Firebase email/password) and waits for the redirect. */
export async function loginViaUi(page: Page) {
  const { email, password } = getTestCredentials();

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in with email", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Context option for tests that must run without a session. */
export const ANONYMOUS = { cookies: [], origins: [] };
