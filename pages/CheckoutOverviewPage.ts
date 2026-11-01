import { Page, Locator, expect } from '@playwright/test';

export class CheckoutOverviewPage {
  readonly title: Locator;
  readonly finishButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.finishButton = page.getByTestId('finish');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.title).toHaveText('Checkout: Overview');
  }

  /** Reads item total, tax and total from the page as numbers. */
  async amounts() {
    const read = async (testId: string) => {
      const text = await this.page.getByTestId(testId).innerText();
      const match = text.match(/\$([\d.,]+)/);
      if (!match) throw new Error(`No amount found in "${text}"`);
      return Number(match[1].replace(',', ''));
    };
    return {
      subtotal: await read('subtotal-label'),
      tax: await read('tax-label'),
      total: await read('total-label'),
    };
  }

  async finish() {
    await this.finishButton.click();
  }
}
