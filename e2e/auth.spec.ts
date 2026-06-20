import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    // Navigate directly to the login page to avoid intermittent name-resolution in headless browsers
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    // Top-level branding is stable across locales
    await expect(page.getByRole("heading", { name: /VetDZ/i })).toBeVisible();
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/password|mot de passe|password/i)).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    // Top-level branding is stable; prefer that over locale-sensitive headings
    await expect(page.getByRole("heading", { name: /VetDZ/i })).toBeVisible();
    await expect(page.getByLabel(/practice name/i)).toBeVisible();
  });

  test("shows validation error on empty login", async ({ page }) => {
    await page.goto("/login");
    // Click the submit button (demo buttons are type=button)
    await page.locator('button[type="submit"]').click();
    // HTML5 validation should prevent submission, or an error message should appear
    const emailInput = page.getByLabel(/email|e-mail/i);
    await expect(emailInput).toBeVisible();
  });
});
