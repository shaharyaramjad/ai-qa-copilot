# Answers to the AC review questions: Sorting

Only facts checked on the live site go here.

- Sort dropdown options, in order: Name (A to Z), Name (Z to A), Price (low to high), Price (high to low). Its test id is `product-sort-container`.
- Default order: Name (A to Z).
- There are 6 products. Product names have test id `inventory-item-name`, prices have test id `inventory-item-price`.
- Products and prices: Sauce Labs Backpack $29.99, Sauce Labs Bike Light $9.99, Sauce Labs Bolt T-Shirt $15.99, Sauce Labs Fleece Jacket $49.99, Sauce Labs Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99.
- Two products cost $15.99. The AC does not say how they are ordered against each other, so tests must not check the order of those two.
- Selecting the option that is already active changes nothing.
- Out of scope for this feature: keeping the sort after a refresh, special characters in names, an empty product list.
