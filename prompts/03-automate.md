Role
You are an automation engineer working with Playwright and TypeScript.

Task
Write one Playwright spec file for the approved test cases below. Follow the project rules. Use only the page object classes and methods shown below. If you need a method that does not exist, do not invent it: write the comment `// TODO: needs page object method <name>` at that place.

Project rules:
{{CONVENTIONS}}

Existing page objects:
{{PAGE_OBJECTS}}

Example spec (follow this style):
{{EXAMPLE_SPEC}}

Approved test cases:
{{TEST_CASES}}

Expected values:
When an approved test case lists concrete values (product names, prices, texts, counts), assert those values as literals copied from the test case, for example `expect(names).toEqual(['Sauce Labs Backpack', ...])`. Never compute the expected value from the app's own output (for example sorting the list you just read and comparing it with itself): that test can pass when the app is wrong, and an empty list passes it too.

Format
Output exactly one TypeScript code block with the complete spec file and nothing else. One test per test case. Each test name starts with its test case ID.
