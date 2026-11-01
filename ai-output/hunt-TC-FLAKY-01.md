Verdict: FLAKY
Root cause category: RANDOM DATA
Evidence:
*   Run 1 (failed, 6094 ms) used `user=locked_out_user`, as seen in the console output in `ai-output/flaky-TC-FLAKY-01.md` line 25. This user fails to log in.
*   Run 2 (passed, 1144 ms) used `user=standard_user`, as seen in the console output in `ai-output/flaky-TC-FLAKY-01.md` line 26. This user logs in successfully.
*   The spec `fixtures/flaky/flaky-1.spec.ts` line 7, `const user = Math.random() < 0.5 ? 'standard_user' : 'locked_out_user';`, randomly selects the user for each run.
Explanation: The test is flaky because it randomly selects between a valid user and a locked-out user. When the locked-out user is chosen, the login fails, and the test cannot navigate to the inventory page, leading to the URL assertion failure.
Proposed fix (not applied):
```typescript
test('TC-FLAKY-01 user lands on inventory', async ({ page }) => {
  const user = 'standard_user'; // Always use a valid user for this test
  console.log(`user=${user}`);
  const login = new LoginPage(page);
  await login.goto();
  await login.login(user, 'secret_sauce');
  await new InventoryPage(page).expectLoaded();
});
```
Do not do: retries, fixed waits (waitForTimeout), skipping, or weakening an expected value.
