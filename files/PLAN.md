# sx-glove-c-f107 plan

Scope is gate B only: prevent a saved recurring-billing command response from disclosing an invoice identity or PO diagnostic after Office access is restricted to another branch. The FIX override excludes all other PLAN-012 work. PLAN-012 remains partial; its remaining Gap and all existing holds remain binding.

1. Read the pinned contract, current authorization and replay implementations, callers, related branch tests and recurring-billing journeys. Independently investigate the security boundary without edits.
2. Extend the existing recurring-billing public-door journey with the reported trigger. Run it against the refused source to record a real failure.
3. Enforce current branch access at the shared saved-command boundary, using existing generic refusal behavior. Cover both job-only missing-price diagnostics and linked invoice refusals, restart persistence, unchanged state and positive replay under current permitted access. Add no test registrations and remove no assertions.
4. Rebase the two unpublished inherited product changes onto current main. Retain main's clause judgments and all Status rows. Regenerate contract views for validation, restore main's generated views, and regenerate the source lock last.
5. Run the narrow typecheck, affected recurring-billing and branch API journeys, existing recurring-billing browser journey and first-party check. Record the browser screens at 1440 and 390 pixels. Conduct one independent read-only bypass and compatibility review.
6. Commit only product changes, preserve fleet identity and hooks, inspect every candidate commit and trailer, and push only the named product branch through the cloud guard. Inspect exact-SHA Verify via REST within the stated call and polling budgets. Publish explicitly selected actual reports and receipts only on the dedicated evidence ref. Leave landing, publication scanning and main-only Run site to the fleet.
