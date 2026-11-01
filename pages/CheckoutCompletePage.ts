import { Page, Locator, expect } from '@playwright/test';

export class CheckoutCompletePage {
  readonly title: Locator;
  readonly header: Locator;
  readonly backHomeButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.header = page.getByTestId('complete-header');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async expectOrderComplete() {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.title).toHaveText('Checkout: Complete!');
    await expect(this.header).toHaveText('Thank you for your order!');
  }

  async backHome() {
    await this.backHomeButton.click();
  }
}
