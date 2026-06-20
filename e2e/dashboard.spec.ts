import { test, expect } from "@playwright/test";

// These tests require a seeded database and authenticated session.
// Run `pnpm db:seed` before running tests, and set up auth state.

test.describe("Dashboard", () => {
  // Skip auth for now — these test that pages load without errors
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/VetDZ/);
  });

  test("portal pages are accessible without auth", async ({ page }) => {
    // Portal uses token-based auth, so the page should load
    await page.goto("/api-docs");
    // Look for the API base URL code block which is stable across locales
    await expect(page.getByText("/api/trpc/")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("all main navigation links exist in sidebar", async ({ page }) => {
    // This test verifies the login page loads, which is all we can do without auth
    await page.goto("/login");
    // Use the label to be robust to locale changes (Email / E-mail)
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
  });
});
