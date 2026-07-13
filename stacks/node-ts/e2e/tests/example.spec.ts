// Example e2e journey. Replace with the acceptance criteria a persona's journey implies
// (DECISIONS.md #9). Select by role / accessible name, not brittle CSS - the selector
// doubles as an a11y assertion and survives restyling.

import { expect, test } from "@playwright/test";

test("home page loads and shows the primary landmark", async ({ page }) => {
  await page.goto("/");

  // Role-based, not CSS - asserts the page is navigable, not just rendered.
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page).toHaveTitle(/.+/); // has a non-empty title
});
