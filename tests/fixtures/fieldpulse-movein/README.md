# Synthetic fieldpulse move-in fixture

Authored synthetic saved API responses, not a real owner export. Field names follow https://help.fieldpulse.com/api-reference/overview. No account or provider acceptance is claimed.

FieldPulse: customers, locations, users, items, jobs with recurring_parent_id and assignments, estimates/invoices with line_items.line_components, job comments. invoice-balances.csv uses the documented #ID, Invoice Total, Amount Due, Invoiced Date, Due Date, Tax and Pre-Tax Subtotal columns from https://help.fieldpulse.com/reporting/raw-data/invoice-reports. IDs are matched explicitly; source amounts are never inferred from a status.

The price book includes both a service and a product/material with distinct sale prices, costs and taxable flags. FieldPulse and Workiz fixtures include two existing source occurrences; this does not claim the unavailable future recurrence definition was exported.
