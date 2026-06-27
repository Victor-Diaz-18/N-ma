import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Enseña. Aprende")).toBeVisible();
    await expect(page.locator('[data-testid="landing-login-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-register-btn"]')).toBeVisible();
  });

  test("shows feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Crea cursos ricos")).toBeVisible();
    await expect(page.locator("text=Tareas + Quizzes")).toBeVisible();
    await expect(page.locator("text=Gamifica todo")).toBeVisible();
  });

  test("navigates to login from hero", async ({ page }) => {
    await page.goto("/");
    await page.click('[data-testid="hero-student-cta"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test("navigates to login from nav", async ({ page }) => {
    await page.goto("/");
    await page.click('[data-testid="landing-login-btn"]');
    await expect(page).toHaveURL(/\/login/);
  });
});
