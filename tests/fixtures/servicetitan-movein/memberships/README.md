# Membership qualification fixture

Synthetic ServiceTitan V2 saved resource responses for MOVE-009. These use the same documented resource fields as the parent fixture; the official reference is https://developer.servicetitan.io/api-details/. No account export or live reconciliation is claimed.

Membership 18 has a fixed term and annual billing template 17. Membership 38 has an ongoing term and monthly billing template 37. Each covers locations 4 and 25 through its recurring services. Every site has its own included invoice template with a service SKU and material SKU, explicit quantities and zero included prices. Completed, Dismissed and NotAttempted events are enumerated independently in the HTTP journey, including dates that are exceptions to the future rule.

Recurring services 19 and 26 use a monthly one-day rule. Services 39 and 46 use a weekly one-weekday rule matching their Monday anchor. Service 49 has a mismatched weekday; service 50 has an unsupported two-day monthly rule. Those two definitions intentionally remain named and inactive. No invoice, saved method, payment or customer charge authorization is supplied.
