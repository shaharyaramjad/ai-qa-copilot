import { Given, When, Then } from './fixtures';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

Given('I am logged in as {string} with password {string}', async ({ loginPage, inventoryPage }, user: string, pass: string) => {
  await loginPage.login(user, pass);
  await inventoryPage.expectLoaded();
});

When('I log in as {string} with password {string}', async ({ loginPage }, user: string, pass: string) => {
  await loginPage.login(user, pass);
});

When('I log out from the menu', async ({ inventoryPage }) => {
  await inventoryPage.logout();
});

Then('I see the products page', async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});

Then('I see the error {string}', async ({ loginPage }, text: string) => {
  await loginPage.expectError(text);
});

Then('I am still on the login page', async ({ loginPage }) => {
  await loginPage.expectOnLoginPage();
});

Then('I see the login page', async ({ loginPage }) => {
  await loginPage.expectOnLoginPage();
});
