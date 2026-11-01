== fixtures/bad-tests/bad-1.spec.ts
| Test | Verdict | Problem (number and name) | Line | Evidence (quote) | Suggested fix |
|---|---|---|---|---|---|
| TC-BAD-01 | PROBLEM | 1. NO REAL ASSERTION | 6 | `test('TC-BAD-01 add backpack to cart', async ({ page }) => {\n  const login = new LoginPage(page);\n  await login.goto();\n  await login.login('standard_user', 'secret_sauce');\n  const inventory = new InventoryPage(page);\n  await inventory.addProduct('sauce-labs-backpack');\n  await inventory.openCart();\n});` | Add an assertion (e.g. expect on cart contents or cart badge) to verify the app state. |

Summary: 1 of 1 tests have problems.

== fixtures/bad-tests/bad-2.spec.ts
| Test | Verdict | Problem (number and name) | Line | Evidence (quote) | Suggested fix |
|---|---|---|---|---|---|
| TC-BAD-02 login with valid user | PROBLEM | 4. RAW SELECTORS IN SPEC | 6 | `await page.locator('#user-name').fill('standard_user');` | Move selector into a page object and use `page.getByTestId(...)` or role/label |
| TC-BAD-02 login with valid user | PROBLEM | 4. RAW SELECTORS IN SPEC | 7 | `await page.locator('#password').fill('secret_sauce');` | Move selector into a page object and use `page.getByTestId(...)` or role/label |
| TC-BAD-02 login with valid user | PROBLEM | 4. RAW SELECTORS IN SPEC | 8 | `await page.locator('//input[@id="login-button"]').click();` | Move selector into a page object and use `page.getByTestId(...)` or role/label |
| TC-BAD-02 login with valid user | PROBLEM | 5. FIXED WAITS | 9 | `await page.waitForTimeout(3000);` | Remove fixed wait and use web-first assertions |

Summary: 1 of 1 tests have problems.

== fixtures/bad-tests/bad-3.spec.ts
| Test | Verdict | Problem (number and name) | Line | Evidence (quote) | Suggested fix |
|---|---|---|---|---|---|
| TC-BAD-03 wrong password shows an error | PROBLEM | 2. CANNOT FAIL | 10 | `if (await login.error.isVisible()) {` | Remove the conditional `if` wrapper so the assertion runs unconditionally. |
| TC-BAD-04 page has a title | PROBLEM | 1. NO REAL ASSERTION | 17 | `const expectedCount = 1;\n    expect(expectedCount).toBe(1);` | Remove assertion checking a test-set constant and assert on app state instead. |
| TC-BAD-04 page has a title | PROBLEM | 2. CANNOT FAIL | 19 | `expect(await page.title()).toBeTruthy();` | Assert against the actual expected page title string. |

Summary: 2 of 2 tests have problems.

== fixtures/bad-tests/bad-4.spec.ts
| Test | Verdict | Problem (number and name) | Line | Evidence (quote) | Suggested fix |
|---|---|---|---|---|---|
| Global | PROBLEM | 6. HIDING FLAKINESS | 6 | `test.describe.configure({ retries: 3 });` | Remove `retries: 3` unless there's an explicit app bug. |
| add two products | PROBLEM | 7. NAMING | 9 | `test('add two products', async ({ page }) => {` | The test name must start with a test case ID, e.g., TC-CART-01 add two products. |
| add two products | PROBLEM | 3. VAGUE EXPECTED VALUE | 16 | `await expect(inventory.cartBadge).toHaveText(/\d/);` | The assertion `/\d/` is too loose. It should assert the exact number of items, e.g., `toHaveText('2')`. |
| TC-BAD-05 remove a product | PROBLEM | 6. HIDING FLAKINESS | 19 | `test.skip('TC-BAD-05 remove a product', async ({ page }) => {` | Do not use `test.skip` without a stated app bug. |
Summary: 4 of 2 tests have problems.

