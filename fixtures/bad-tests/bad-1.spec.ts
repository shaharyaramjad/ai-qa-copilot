import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

// Deliberately bad test used to check the reviewer agent. Not part of the suite.
test('TC-BAD-01 add backpack to cart', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('standard_user', 'secret_sauce');
  const inventory = new InventoryPage(page);
  await inventory.addProduct('sauce-labs-backpack');
  await inventory.openCart();
});
