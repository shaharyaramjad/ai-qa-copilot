import { test, expect } from '@playwright/test';

// Deliberately bad test used to check the reviewer agent. Not part of the suite.
test('TC-BAD-02 login with valid user', async ({ page }) => {
  await page.goto('/');
  await page.locator('#user-name').fill('standard_user');
  await page.locator('#password').fill('secret_sauce');
  await page.locator('//input[@id="login-button"]').click();
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/inventory/);
});
