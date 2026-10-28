# Synthetic fieldpulse move-in fixture

Authored synthetic saved API responses, not a real owner export. Field names follow https://help.fieldpulse.com/api-reference/overview. No account or provider acceptance is claimed.

FieldPulse: customers, locations, users, items, jobs with recurring_parent_id and assignments, estimates/invoices with line_items.line_components, job comments. invoice-balances.csv uses the documented #ID, Invoice Total, Amount Due, Invoiced Date, Due Date, Tax and Pre-Tax Subtotal columns from https://help.fieldpulse.com/reporting/raw-data/invoice-reports. IDs are matched explicitly; source amounts are never inferred from a status.

The price book includes both a service and a product/material with distinct sale prices, costs and taxable flags. FieldPulse and Workiz fixtures include two existing source occurrences; the FieldPulse CSV additionally supplies its future definition; Workiz still lacks a documented future definition.

recurring-jobs.csv follows the Recurring Jobs report columns at https://help.fieldpulse.com/reporting/raw-data/job-reports#report-on-recurring-jobs. Its weekly wording follows https://help.fieldpulse.com/jobs/jobs-tasks/recurring-jobs. The last generated occurrence is not the series end; existing jobs may be individually moved exceptions. This fixture additionally proves a retained future definition, one inactive group proposal and explicit guarded activation.

assets.json uses the installed customer asset fields documented at
https://help.fieldpulse.com/api-reference/assets/create-an-asset and the list
response wrapper at https://help.fieldpulse.com/api-reference/assets/retrieve-assets-list.
It includes an explicit customer and location, exact serial and date timestamps,
both warranties and retained source-only model-number and note fields.
