import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';

// Test cases come from docs/test-cases/checkout.md (hand-written baseline, Step 1)
// Every test starts on the checkout information page with the Backpack in the cart.

const BACKPACK = 'sauce-labs-backpack';
const BIKE_LIGHT = 'sauce-labs-bike-light';

test.describe('Checkout', () => {
  let inventory: InventoryPage;
  let cart: CartPage;
  let info: CheckoutInfoPage;
  let overview: CheckoutOverviewPage;
  let complete: CheckoutCompletePage;

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    info = new CheckoutInfoPage(page);
    overview = new CheckoutOverviewPage(page);
    complete = new CheckoutCompletePage(page);

    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    await inventory.expectLoaded();
    await inventory.addProduct(BACKPACK);
    await inventory.openCart();
    await cart.expectLoaded();
    await cart.checkout();
    await info.expectLoaded();
  });

  test('TC-CHK-01 complete an order', async () => {
    await info.fillAndContinue('Test', 'User', '12345');
    await overview.expectLoaded();
    await overview.finish();
    await complete.expectOrderComplete();
  });

  test('TC-CHK-02 first name is required', async () => {
    await info.fillAndContinue('', 'User', '12345');
    await info.expectError('First Name is required');
  });

  test('TC-CHK-03 last name is required', async () => {
    await info.fillAndContinue('Test', '', '12345');
    await info.expectError('Last Name is required');
  });

  test('TC-CHK-04 postal code is required', async () => {
    await info.fillAndContinue('Test', 'User', '');
    await info.expectError('Postal Code is required');
  });

  test('TC-CHK-05 overview totals add up', async ({ page }) => {
    // add a second product, then come back to checkout
    await info.cancel();
    await cart.expectLoaded();
    await cart.continueShopping();
    await inventory.addProduct(BIKE_LIGHT);
    await inventory.openCart();
    await cart.checkout();
    await info.fillAndContinue('Test', 'User', '12345');
    await overview.expectLoaded();

    const { subtotal, tax, total } = await overview.amounts();
    expect(subtotal).toBeCloseTo(29.99 + 9.99, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);
    await expect(page).toHaveURL(/checkout-step-two\.html/);
  });

  test('TC-CHK-06 cancel returns to the cart', async () => {
    await info.cancel();
    await cart.expectLoaded();
  });

  test('TC-CHK-07 cart is empty after an order', async () => {
    await info.fillAndContinue('Test', 'User', '12345');
    await overview.finish();
    await complete.expectOrderComplete();
    await complete.backHome();
    await inventory.expectLoaded();
    await expect(inventory.cartBadge).toBeHidden();
  });
});
