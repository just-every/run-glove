# Security boundary investigation and review

The first independent read-only investigation traced the returned PO problem from recurringBillingDue into result.missed, then through saved to the HTTP response. Before the fix, saved checked top-level record identities and batch results but omitted billing missed entries. Current Office permission remained valid, while branchState had removed the referenced job and invoice. The response returned before inBranch could execute.

The narrow enforcement boundary is saved in ./src/glove/storage.ts. It is used by both initial replay and replay recovered after an optimistic commit race in ./src/glove/api.ts. Fresh commands and GET review already use current branch scope. Existing saved-batch behavior refuses the entire inaccessible outcome with NOT_FOUND. Recomputing billing or editing the durable result would break historical replay semantics.

The candidate checks the job root and optional invoice root of every retained billing missed entry against the current scoped records, before projection. Job-only missing-price diagnostics and linked PO draft refusals are both covered. Other saved-command representations and provider deduplication retain their prior behavior.

A second fresh read-only reviewer found no concrete surviving bypass or legitimate replay regression within gate B. The reviewer checked initial and race-recovery callers, current role checks, branch inheritance, empty review results, retained invoices after approval, restored branch access and privacy-erased outcomes. The reviewer ran git diff --check successfully and made no edits or test claims.
