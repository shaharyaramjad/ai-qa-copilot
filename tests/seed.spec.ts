import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Seed for Playwright's planner/generator agents (Step 4).
// The agents run this first, so they start from a logged-in inventory page.
// It is a setup step, not a test case, so it has no TC- ID.

test('seed: logged in as standard_user', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('standard_user', 'secret_sauce');
  await new InventoryPage(page).expectLoaded();
});
