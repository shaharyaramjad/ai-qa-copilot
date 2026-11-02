import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.error = page.getByTestId('error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }

  async expectError(text: string | RegExp) {
    await expect(this.error).toBeVisible();
    await expect(this.error).toContainText(text);
  }

  async expectOnLoginPage() {
    await expect(this.page).not.toHaveURL(/inventory/);
    await expect(this.loginButton).toBeVisible();
  }
}
