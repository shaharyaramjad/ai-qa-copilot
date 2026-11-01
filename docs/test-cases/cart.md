# Test cases: Cart (hand-written baseline)

| ID | Title | Steps | Expected result | Priority |
|---|---|---|---|---|
| TC-CART-01 | Add one product | 1. Log in 2. Click Add to cart on Sauce Labs Backpack | Cart icon shows 1 | High |
| TC-CART-02 | Add two products | 1. Log in 2. Add Backpack 3. Add Bike Light | Cart icon shows 2 | High |
| TC-CART-03 | Remove a product from the product list | 1. Log in 2. Add Backpack 3. Click Remove | Cart icon shows no count | Medium |
| TC-CART-04 | Empty cart shows no count | 1. Log in | Cart icon shows no count | Medium |
| TC-CART-05 | Cart lists the added product | 1. Log in 2. Add Backpack 3. Open cart | Cart page shows 1 item: Sauce Labs Backpack, $29.99 | High |
| TC-CART-06 | Remove a product on the cart page | 1. Log in 2. Add Backpack 3. Open cart 4. Click Remove | Cart has 0 items | Medium |
| TC-CART-07 | Continue shopping returns to products | 1. Log in 2. Open cart 3. Click Continue Shopping | Product list opens | Low |
