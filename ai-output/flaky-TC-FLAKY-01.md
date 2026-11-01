# Flaky evidence: TC-FLAKY-01

- Spec: fixtures/flaky/flaky-1.spec.ts
- Runs: 10 (asked for 10), workers: 4
- Passed: 7, failed: 3
- Counted result: MIXED (flaky)
- Passed durations: min 822 ms, median 834 ms, max 1144 ms
- Failed durations: min 5793 ms, median 6090 ms, max 6094 ms

## Failure messages (grouped)

3x
```
Error: expect(page).toHaveURL(expected) failed
Expected pattern: /inventory\.html/
Received string:  "https://www.saucedemo.com/"
Timeout: 5000ms
Call log:
  - Expect "toHaveURL" with timeout 5000ms
```

## Every run
| Run | Status | Duration ms | Test output (console.log) |
|---|---|---|---|
| 1 | failed | 6094 | user=locked_out_user |
| 2 | passed | 1144 | user=standard_user |
| 3 | passed | 1126 | user=standard_user |
| 4 | failed | 6090 | user=locked_out_user |
| 5 | passed | 827 | user=standard_user |
| 6 | passed | 822 | user=standard_user |
| 7 | passed | 834 | user=standard_user |
| 8 | passed | 831 | user=standard_user |
| 9 | passed | 879 | user=standard_user |
| 10 | failed | 5793 | user=locked_out_user |
