import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

// Test cases come from docs/test-cases/cart.md (hand-written baseline, Step 1)

const BACKPACK = 'sauce-labs-backpack';
const BIKE_LIGHT = 'sauce-labs-bike-light';

test.describe('Cart', () => {
  let inventory: InventoryPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    await inventory.expectLoaded();
  });

  test('TC-CART-01 add one product', async () => {
    await inventory.addProduct(BACKPACK);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('TC-CART-02 add two products', async () => {
    await inventory.addProduct(BACKPACK);
    await inventory.addProduct(BIKE_LIGHT);
    await expect(inventory.cartBadge).toHaveText('2');
  });

  test('TC-CART-03 remove a product from the product list', async () => {
    await inventory.addProduct(BACKPACK);
    await expect(inventory.cartBadge).toHaveText('1');
    await inventory.removeProduct(BACKPACK);
    await expect(inventory.cartBadge).toBeHidden();
  });

  test('TC-CART-04 empty cart shows no count', async () => {
    await expect(inventory.cartLink).toBeVisible();
    await expect(inventory.cartBadge).toBeHidden();
  });

  test('TC-CART-05 cart lists the added product', async () => {
    await inventory.addProduct(BACKPACK);
    await inventory.openCart();
    await cart.expectLoaded();
    await expect(cart.items).toHaveCount(1);
    await expect(cart.itemNames).toHaveText('Sauce Labs Backpack');
    await expect(cart.itemPrices).toHaveText('$29.99');
  });

  test('TC-CART-06 remove a product on the cart page', async () => {
    await inventory.addProduct(BACKPACK);
    await inventory.openCart();
    await cart.expectLoaded();
    await cart.removeProduct(BACKPACK);
    await expect(cart.items).toHaveCount(0);
  });

  test('TC-CART-07 continue shopping returns to products', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
    await cart.continueShopping();
    await inventory.expectLoaded();
  });
});
