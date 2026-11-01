import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly title: Locator;
  readonly itemList: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.itemList = page.getByTestId('inventory-list');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  /** Pass a longer timeout (ms) for slow users such as performance_glitch_user. */
  async expectLoaded(timeout?: number) {
    await expect(this.page).toHaveURL(/inventory\.html/, { timeout });
    await expect(this.title).toHaveText('Products', { timeout });
    await expect(this.itemList).toBeVisible({ timeout });
  }

  /** slug example: 'sauce-labs-backpack' */
  async addProduct(slug: string) {
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  async removeProduct(slug: string) {
    await this.page.getByTestId(`remove-${slug}`).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
