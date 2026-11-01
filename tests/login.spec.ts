import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Test cases come from docs/test-cases/login.md (hand-written baseline, Step 1)

test.describe('Login', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('TC-LOGIN-01 valid user lands on inventory', async ({ page }) => {
    await login.login('standard_user', 'secret_sauce');
    await new InventoryPage(page).expectLoaded();
  });

  test('TC-LOGIN-02 wrong password shows an error', async ({ page }) => {
    await login.login('standard_user', 'wrong_password');
    await login.expectError(/do not match/i);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC-LOGIN-03 empty username shows required error', async () => {
    await login.login('', 'secret_sauce');
    await login.expectError('Username is required');
  });

  test('TC-LOGIN-04 empty password shows required error', async () => {
    await login.login('standard_user', '');
    await login.expectError('Password is required');
  });

  test('TC-LOGIN-05 locked out user is rejected', async () => {
    await login.login('locked_out_user', 'secret_sauce');
    await login.expectError(/locked out/i);
  });

  test('TC-LOGIN-06 logout returns to login page', async ({ page }) => {
    await login.login('standard_user', 'secret_sauce');
    const inventory = new InventoryPage(page);
    await inventory.expectLoaded();
    await inventory.logout();
    await expect(login.loginButton).toBeVisible();
  });
});
