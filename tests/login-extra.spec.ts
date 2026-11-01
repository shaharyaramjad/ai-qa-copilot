import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// spec: specs/login-plan-approved.md
// seed: tests/seed.spec.ts

test.describe('Login (Extra)', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('TC-LOGIN-07 invalid username shows an error', async ({ page }) => {
    // 1. Open `/`
    // 2. Enter `invalid_user` and `secret_sauce`, click Login
    await login.login('invalid_user', 'secret_sauce');
    await login.expectError('Epic sadface: Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC-LOGIN-08 performance glitch user can still log in', async ({ page }) => {
    // 1. Open `/`
    // 2. Enter `performance_glitch_user` and `secret_sauce`, click Login
    await login.login('performance_glitch_user', 'secret_sauce');
    // The performance glitch user takes a long time to log in, so increase timeout for inventory page
    const inventory = new InventoryPage(page);
    await expect(page).toHaveURL(/inventory\.html/, { timeout: 10000 });
    await inventory.expectLoaded();
  });

  test('TC-LOGIN-09 inventory cannot be opened without logging in', async ({ page }) => {
    // 1. Open `/inventory.html` directly without logging in
    await page.goto('/inventory.html');
    await login.expectError("Epic sadface: You can only access '/inventory.html' when you are logged in.");
    await expect(page).toHaveURL('/');
  });
});
