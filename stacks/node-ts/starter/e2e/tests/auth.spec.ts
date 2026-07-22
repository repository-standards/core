// The auth journey (DECISIONS.md #10): sign up through the UI, land on the protected
// dashboard, and prove the SAME session cookie satisfies BOTH gates - the Next proxy
// (page) and the Fastify service (/api/me through the rewrite). Plus the default-deny
// counterpart: signed out, the dashboard redirects and the API answers 401.

import { expect, test } from "@playwright/test";

test("sign up, reach the dashboard, and be known to the API", async ({ page }) => {
  const email = `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("starter-Passw0rd!");
  await page.getByRole("button", { name: "Create account" }).click();

  // Gate 1: the Next proxy lets the fresh session through to the protected page.
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Gate 2: the Fastify service validates the same cookie through the /api/* rewrite.
  const me = await page.request.get("/api/me");
  expect(me.status()).toBe(200);
  const body = (await me.json()) as { user: { email: string } };
  expect(body.user.email).toBe(email);
});

test("signed out, the dashboard redirects to sign-in (default-deny)", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/sign-in?next=%2Fdashboard");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("signed out, /api/me is denied (default-deny at the API gate)", async ({ request }) => {
  const response = await request.get("/api/me");
  expect(response.status()).toBe(401);
  const body = (await response.json()) as { errorCode: string };
  expect(body.errorCode).toBe("UNAUTHORIZED");
});
