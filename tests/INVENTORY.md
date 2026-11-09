# Test inventory

Run from the checkout root:

```sh
node tests/inventory.mjs
node tests/inventory.mjs --limit 190
node tests/inventory.mjs --json
```

The seed cap remains 200. The optional lower limit lets consolidation work
reserve room for concurrent rounds; it cannot raise the cap.

The counter parses Node and Playwright registrations under `tests/`, including
nested `t.test()` registrations. Literal loops around registrations count every
generated case. Loops *inside* a registration do not create extra registrations.
Unknown generated loops and `.each` require enumeration rather than silently
reporting an incomplete budget. The four bare assertion scripts selected by
`verification.json` count once each; the browser runner dispatches the
Playwright registrations already counted.

`fixtures/scenario.mjs` labels successive steps of one behavior without creating
subtests. It runs every callback and propagates assertion failures. Independent
scenarios keep their own installation and run their registered cleanup before
the next scenario starts. Ordered journeys that already share an installation
keep that shared setup, their original order, and their original test cleanup.

Keep cited test names as registrations. Fold related edge cases into those
tests, preserving all assertions, refusal expectations and provider cases.
Do not combine unrelated behaviors solely to reduce the inventory.
