import { test, expect } from "@playwright/test";

test("demo login works and dashboard loads", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/login");

  // Click the first demo-role button (French demo UI: "Se connecter en tant...")
  const demoButton = page.getByRole("button", { name: /Se connecter en tant/i }).first();
  if (await demoButton.count() > 0) {
    await demoButton.click();
  } else {
    // Fallback: look for demo area and click its first button
    const demoAreaButton = page.locator("div", { hasText: /Essayez la démo/i }).getByRole("button").first();
    if (await demoAreaButton.count() > 0) {
      await demoAreaButton.click();
    } else {
      throw new Error("Demo login buttons not found. Ensure NEXT_PUBLIC_DEMO_MODE=true and reload the dev server.");
    }
  }

  // Wait for redirect to dashboard
  await page.waitForURL("http://127.0.0.1:3000/", { timeout: 10000 });

  // Verify branding/dashboard visible
  await expect(page.getByText(/VetDZ/i)).toBeVisible();
});
