// The smoke journey: the app is up, navigable, and the /api/* rewrite really reaches the
// Fastify service. Select by role / accessible name, not brittle CSS (DECISIONS.md #9).

import { expect, test } from "@playwright/test";

test("home page loads and shows the primary landmark", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page).toHaveTitle(/.+/); // has a non-empty title
  await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
});

test("the /api/* rewrite proxies to the Fastify service", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" }); // Fastify's payload, via :3000
});
