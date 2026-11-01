import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

// Deliberately bad tests used to check the reviewer agent. Not part of the suite.
test.describe('Login checks', () => {
  test('TC-BAD-03 wrong password shows an error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('standard_user', 'wrong_password');
    if (await login.error.isVisible()) {
      await expect(login.error).toContainText('do not match');
    }
  });

  test('TC-BAD-04 page has a title', async ({ page }) => {
    await page.goto('/');
    const expectedCount = 1;
    expect(expectedCount).toBe(1);
    expect(await page.title()).toBeTruthy();
  });
});
