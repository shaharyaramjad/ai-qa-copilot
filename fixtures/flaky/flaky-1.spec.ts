import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

// Deliberately flaky test used to check the flaky hunter agent. Not part of the suite.
test('TC-FLAKY-01 user lands on inventory', async ({ page }) => {
  const user = Math.random() < 0.5 ? 'standard_user' : 'locked_out_user';
  console.log(`user=${user}`);
  const login = new LoginPage(page);
  await login.goto();
  await login.login(user, 'secret_sauce');
  await new InventoryPage(page).expectLoaded();
});
