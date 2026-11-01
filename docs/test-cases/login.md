# Test cases: Login (hand-written baseline)

| ID | Title | Steps | Expected result | Priority |
|---|---|---|---|---|
| TC-LOGIN-01 | Valid user lands on inventory | 1. Open `/` 2. Enter `standard_user` / `secret_sauce` 3. Click Login | Inventory page opens, title "Products" | High |
| TC-LOGIN-02 | Wrong password shows an error | 1. Open `/` 2. Enter `standard_user` / wrong password 3. Click Login | Error "do not match" shown, stays on login | High |
| TC-LOGIN-03 | Empty username shows required error | 1. Open `/` 2. Leave username empty, enter password 3. Click Login | Error "Username is required" | Medium |
| TC-LOGIN-04 | Empty password shows required error | 1. Open `/` 2. Enter username, leave password empty 3. Click Login | Error "Password is required" | Medium |
| TC-LOGIN-05 | Locked out user is rejected | 1. Open `/` 2. Enter `locked_out_user` / `secret_sauce` 3. Click Login | Error says the user is locked out | High |
| TC-LOGIN-06 | Logout returns to login page | 1. Log in as `standard_user` 2. Open menu 3. Click Logout | Login page is shown | Medium |
