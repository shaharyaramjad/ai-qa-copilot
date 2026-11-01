import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

// Deliberately bad tests used to check the reviewer agent. Not part of the suite.
test.describe.configure({ retries: 3 });

test.describe('Cart checks', () => {
  test('add two products', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    const inventory = new InventoryPage(page);
    await inventory.addProduct('sauce-labs-backpack');
    await inventory.addProduct('sauce-labs-bike-light');
    await expect(inventory.cartBadge).toHaveText(/\d/);
  });

  test.skip('TC-BAD-05 remove a product', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    const inventory = new InventoryPage(page);
    await inventory.addProduct('sauce-labs-backpack');
    await inventory.removeProduct('sauce-labs-backpack');
    await expect(inventory.cartBadge).toBeHidden();
  });
});
