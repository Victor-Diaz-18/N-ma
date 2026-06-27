import { test, expect } from "@playwright/test";

test.describe("Navigation & Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@eduquest.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test("navbar shows all links", async ({ page }) => {
    await expect(page.locator('[data-testid="nav-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-cursos"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-ranking"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-perfil"]')).toBeVisible();
  });

  test("navigate to courses page", async ({ page }) => {
    await page.click('[data-testid="nav-cursos"]');
    await expect(page).toHaveURL(/\/courses/);
  });

  test("navigate to leaderboard", async ({ page }) => {
    await page.click('[data-testid="nav-ranking"]');
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test("navigate to profile", async ({ page }) => {
    await page.click('[data-testid="nav-perfil"]');
    await expect(page).toHaveURL(/\/profile/);
  });

  test("dark mode toggle works", async ({ page }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.click('[data-testid="theme-toggle"]');
    await expect(html).toHaveClass(/dark/);
    await page.click('[data-testid="theme-toggle"]');
    await expect(html).not.toHaveClass(/dark/);
  });
});
