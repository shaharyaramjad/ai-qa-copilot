# Test cases: Checkout (hand-written baseline)

All start with: log in, add Sauce Labs Backpack, open cart, click Checkout.

| ID | Title | Steps | Expected result | Priority |
|---|---|---|---|---|
| TC-CHK-01 | Complete an order | 1. Enter first name, last name, postal code 2. Continue 3. Finish | "Thank you for your order!" | High |
| TC-CHK-02 | First name is required | 1. Leave first name empty, fill the rest 2. Continue | Error "First Name is required" | High |
| TC-CHK-03 | Last name is required | 1. Leave last name empty, fill the rest 2. Continue | Error "Last Name is required" | Medium |
| TC-CHK-04 | Postal code is required | 1. Leave postal code empty, fill the rest 2. Continue | Error "Postal Code is required" | Medium |
| TC-CHK-05 | Overview totals add up | 1. Add Bike Light too 2. Fill the form 3. Continue | Item total is 39.98 and total = item total + tax | High |
| TC-CHK-06 | Cancel returns to the cart | 1. Click Cancel on the information page | Cart page opens | Low |
| TC-CHK-07 | Cart is empty after an order | 1. Complete an order 2. Click Back Home | Cart icon shows no count | Medium |
