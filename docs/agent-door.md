# Company agent door

Glove serves the copied Base door at `/mcp`, `/agents`, the named approval pages,
`/api/rer/agent-policy` and canonical protected-resource metadata. MCP supports
2026-07-28 and 2025-11-25. A signed company policy decides whether an admitted
operation proceeds, waits for review or approval, or refuses. A missing policy
never grants authority. Native sessions retain their Origin and CSRF checks.

## Current service-coordinator scope

The current registry is deliberately limited to internal price-book work:

| Tool | Native service | Class | Clauses |
| --- | --- | --- | --- |
| `glove.pricebook.read` | Current role-filtered service catalogue | standard | MONEY-003, BASE-AGENT-002, BASE-AGENT-005 |
| `glove.pricebook.update` | `service.save` for an existing item | standard | MONEY-003, FIELD-002, BASE-AGENT-002, BASE-AGENT-006, BASE-AGENT-012 |
| `glove.pricebook.category` | `pricebook.category` | standard | MONEY-003, BASE-AGENT-002, BASE-AGENT-006, BASE-AGENT-012 |
| `glove.pricebook.adjust` | `pricebook.adjust` | standard | MONEY-003, BASE-AGENT-002, BASE-AGENT-006, BASE-AGENT-012 |
| `glove.events.list` | Base's built-in retained-door events | standard | BASE-AGENT-010 |

The price-book records are `glove://services/{id}` and
`glove://pricebook/catalogue`. Every read uses the current native role and cost
visibility. Missing and restricted records have the same resource refusal.
Descriptions are untrusted evidence, never instructions. Price changes do not
change a customer's frozen quote, invoice, agreement or decision. There are no
payment, outbound-provider, spend, native Undo or queue-continuation tools.
No provider network edge is declared because these tools make no provider call.

Mutations require native Owner authority without branch limits. They use the
same native handlers, permission checker and atomic storage guard as the desk.
They retain the native record revision, once-only command outcome, timeline and
`<agent> for <person>` attribution. `expected_revision` refuses stale work;
reusing an idempotency key with changed arguments conflicts. Every write fences
current operator, role, branch, policy snapshot and both Pause controls within
its native transaction. The door never flushes unrelated native provider queues
or rolls unrelated recurring work forward during a price-book action.

## People and approvals

Signed Business `owner_id` binds to the native setup owner's immutable operator
id. Signed team ids bind to existing native accounts in `bs_team`. A signed
roster neither creates an account nor accepts an invitation nor widens its
Glove role. Existing native roles, custom permissions, cost visibility and
branch limits remain authoritative. A changed email cannot move a saved binding.
Unknown, inactive, natively inadmissible and allow-list-excluded people cannot
sponsor a call. Business owner is the policy owner, team admin is an editor,
and team member has no policy role. A native promotion alone creates no Business
editor role. Glove's integration tokens remain on their existing API door with
their original purpose and restrictions; they are not converted into a person's
Business token.

Base retains exact approval summaries and names the deciding person. An agent
prepares work; its confirmation is never a person's decision. Native price-book
history retains agent and sponsor separately, plus named company approvers when
present. No native approval or reversal is fabricated by an adapter.

## Remaining coordinator work

This is a partial adoption, not the full coordinator surface. Customer, request,
quote, job, dispatch, field evidence, invoice, payment, agreement, conversation,
privacy, payroll and provider-bearing work remains outside this registry. The
existing native doors keep their own authority; their existence is not MCP
support. The ct surface's broader tool names, classes, resource graph and seeded
service-week journey are not claimed here.

Base's adoption contract requires a client-custody mapping and an agreed
redaction and atomic erasure fence before retaining client-bearing arguments,
results, summaries, audit and replay content. It supplies no generic client
custody adapter at this runtime revision. Those tools must remain closed until
the custody integration preserves DATA-001's native erasure obligations.
Events/subscriptions, multi-sponsor conformance, resource refresh, provider mail
and spend enforcement are undeclared optional families. The pinned Base runtime
unconditionally installs `glove.events.list`; this compatibility entry is not a
claim that Glove's full service-work event graph or subscriptions are adopted.

The conformance declaration is `agent-surface.json`; its initializer drives the
real setup-token POST at `/auth/bootstrap`, then native business and service
commands. The runtime's signed `/auth/owner-claim` endpoint remains separate:
verification never sends a raw setup token there. Test tooling has no production
route, authority adapter or direct SQL account writer.
