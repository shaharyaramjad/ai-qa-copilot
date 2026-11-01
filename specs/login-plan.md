# Test Plan: Login Feature (`tests/login.spec.ts`)

## Overview
Comprehensive test plan for the Login functionality on SauceDemo (`https://www.saucedemo.com`), covering happy paths, edge cases, error validation, locked-out user handling, and various user roles (problem user, performance glitch user, error user, visual user).

---

## Test Suites & Scenarios

### Suite 1: Happy Path Login & Logout
- **Seed File**: `tests/seed.spec.ts`
- **Tests**:
  1. **TC-LOGIN-01: Standard user successfully logs in and lands on inventory**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `standard_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - User is redirected to `/inventory.html`
       - Products inventory header and inventory items are displayed
  2. **TC-LOGIN-02: Logged-in user successfully logs out**
     - **Steps**:
       1. Log in with `standard_user` and `secret_sauce`
       2. Open the sidebar menu by clicking the "Open Menu" button
       3. Click the "Logout" button
     - **Expected**:
       - User is redirected back to the login page (`https://www.saucedemo.com/`)
       - Username and password inputs are empty

---

### Suite 2: Validation & Negative Scenarios
- **Seed File**: `tests/seed.spec.ts`
- **Tests**:
  1. **TC-LOGIN-03: Login fails with empty username and password**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Leave Username and Password empty
       3. Click the Login button
     - **Expected**:
       - Error message is displayed: `Epic sadface: Username is required`
  2. **TC-LOGIN-04: Login fails with empty password**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `standard_user` into the Username field
       3. Leave Password empty
       4. Click the Login button
     - **Expected**:
       - Error message is displayed: `Epic sadface: Password is required`
  3. **TC-LOGIN-05: Login fails with invalid username**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `invalid_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - Error message is displayed: `Epic sadface: Username and password do not match any user in this service`
  4. **TC-LOGIN-06: Login fails with invalid password**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `standard_user` into the Username field
       3. Enter `wrong_password` into the Password field
       4. Click the Login button
     - **Expected**:
       - Error message is displayed: `Epic sadface: Username and password do not match any user in this service`

---

### Suite 3: Special User Roles
- **Seed File**: `tests/seed.spec.ts`
- **Tests**:
  1. **TC-LOGIN-07: Locked out user cannot log in and sees appropriate error message**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `locked_out_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - Error message is displayed: `Epic sadface: Sorry, this user has been locked out.`
       - User remains on the login page
  2. **TC-LOGIN-08: Problem user successfully logs in**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `problem_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - User is redirected to `/inventory.html`
  3. **TC-LOGIN-09: Performance glitch user successfully logs in**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `performance_glitch_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - User is redirected to `/inventory.html` (accounting for performance delay)
  4. **TC-LOGIN-10: Error user successfully logs in**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `error_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - User is redirected to `/inventory.html`
  5. **TC-LOGIN-11: Visual user successfully logs in**
     - **Steps**:
       1. Navigate to `https://www.saucedemo.com/`
       2. Enter `visual_user` into the Username field
       3. Enter `secret_sauce` into the Password field
       4. Click the Login button
     - **Expected**:
       - User is redirected to `/inventory.html`
