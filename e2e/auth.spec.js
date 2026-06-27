import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = "Test1234!";

test.describe("Auth flow", () => {
  test("register a new student account", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="name"]', "Test Student");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@eduquest.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpass");
    await page.click('[data-testid="login-submit"]');
    await expect(page.locator("text=Credenciales inválidas")).toBeVisible({ timeout: 5000 });
  });

  test("logout redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@eduquest.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await page.click('[data-testid="nav-logout-btn"]');
    await expect(page).toHaveURL(/\/login/);
  });
});
