import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly title: Locator;
  readonly itemList: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly inventoryItems: Locator;
  readonly inventoryPrices: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.itemList = page.getByTestId('inventory-list');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.inventoryItems = page.getByTestId('inventory-item-name');
    this.inventoryPrices = page.getByTestId('inventory-item-price');
  }

  /** Pass a longer timeout (ms) for slow users such as performance_glitch_user. */
  async expectLoaded(timeout?: number) {
    await expect(this.page).toHaveURL(/inventory\.html/, { timeout });
    await expect(this.title).toHaveText('Products', { timeout });
    await expect(this.itemList).toBeVisible({ timeout });
  }

  async expectSortDropdownVisible() {
    await expect(this.sortDropdown).toBeVisible();
  }

  async getProductNames() {
    return this.inventoryItems.allInnerTexts();
  }

  async getProductPrices() {
    const prices = await this.inventoryPrices.allInnerTexts();
    return prices.map(p => parseFloat(p.replace('$', '')));
  }

  /** options: 'az', 'za', 'lohi', 'hilo' */
  async sortProducts(option: string) {
    await this.sortDropdown.selectOption(option);
  }

  async getSortDropdownOptions() {
    return this.sortDropdown.locator('option').allInnerTexts();
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
