@login
Feature: Login
  As a shopper I want to log in so that I can use the shop.
  Source of truth: docs/ac/login.md and docs/test-cases/login.md (IDs in the tags).

  Background:
    Given I am on the login page

  @TC-LOGIN-01
  Scenario: Valid user lands on the products page
    When I log in as "standard_user" with password "secret_sauce"
    Then I see the products page

  @TC-LOGIN-02
  Scenario: Wrong password shows an error
    When I log in as "standard_user" with password "wrong_password"
    Then I see the error "do not match"
    And I am still on the login page

  @TC-LOGIN-03
  Scenario: Empty username shows a required error
    When I log in as "" with password "secret_sauce"
    Then I see the error "Username is required"

  @TC-LOGIN-04
  Scenario: Empty password shows a required error
    When I log in as "standard_user" with password ""
    Then I see the error "Password is required"

  @TC-LOGIN-05
  Scenario: Locked out user is rejected
    When I log in as "locked_out_user" with password "secret_sauce"
    Then I see the error "locked out"

  @TC-LOGIN-06
  Scenario: Logout returns to the login page
    Given I am logged in as "standard_user" with password "secret_sauce"
    When I log out from the menu
    Then I see the login page
