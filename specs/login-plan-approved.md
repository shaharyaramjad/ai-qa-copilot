# Login: extra tests (trimmed from specs/login-plan.md)

Only scenarios NOT already covered by tests/login.spec.ts (TC-LOGIN-01..06).
Seed: tests/seed.spec.ts. Target file: tests/login-extra.spec.ts (do not touch tests/login.spec.ts).
Use the page objects in pages/. Verify every message and URL in the live app before asserting it.

### TC-LOGIN-07 invalid username shows an error
1. Open `/`
2. Enter `invalid_user` and `secret_sauce`, click Login
Expected: error contains "Username and password do not match any user in this service"; user stays on the login page.

### TC-LOGIN-08 performance glitch user can still log in
1. Open `/`
2. Enter `performance_glitch_user` and `secret_sauce`, click Login
Expected: inventory page loads (slow login is allowed; use web-first assertions, no fixed waits).

### TC-LOGIN-09 inventory cannot be opened without logging in
1. Open `/inventory.html` directly without logging in
Expected: user ends up on the login page with an error saying login is required (verify the exact text in the app).

Dropped from the AI plan: problem_user, error_user, visual_user logins (same check as TC-LOGIN-01, no extra value yet), duplicate empty-field and wrong-password cases (already TC-LOGIN-02..04).
