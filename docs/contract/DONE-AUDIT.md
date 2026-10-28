Old reference: `bdf030cca561a4d9e0c78ded585b71768a538a41`.

| Clause | Point | Outcome | Asserting test | Result |
| --- | --- | --- | --- | --- |
| GLOVE-10 | 1 — agent quote preparation | The quote revision records the Agent preparer | `tests/api/flows.test.mjs:192` | asserted |
| GLOVE-10 | 1 — dispatcher decision on dispatch proposal | The dispatcher-decided proposal is approved | `tests/api/flows.test.mjs:202` | asserted |
| GLOVE-10 | 1 — dispatch effect | The booked assignment names the proposal | `tests/api/flows.test.mjs:205` | asserted |
| GLOVE-10 | 1 — decision attribution | Quote and proposal decisions retain the actual named approver | `tests/api/flows.test.mjs:206` | asserted |
| GLOVE-10 | 1 — invoice preparation | An agent prepares an invoice draft | none | none |
| GLOVE-10 | 1 — invoice decision | A person decides that agent-prepared invoice | none | none |
| GLOVE-10 | 1 — invoice attribution | The invoice keeps its agent preparer and actual person decision | none | none |
| GLOVE-10 | 1 — company-policy journey | The held policy decides the exact saved revisions across quote, dispatch and invoice | none | none |
| FIELD-006 | 1 — extracted fields | The first fixture reads make, model, serial and manufacture date | `tests/api/nameplates.test.mjs:43` | asserted |
| FIELD-006 | 1 — held equipment state | The existing equipment fields are unchanged before confirmation | `tests/api/nameplates.test.mjs:59` | asserted |
| FIELD-006 | 4 — selectable standard policy | Company policy chooses automatic field filling or technician confirmation | none | none |
| COMM-007 | 1 — agent logging policy | Agent log calls use the sponsor’s role and grant under the selected company policy | none | none |
| AGENT-003 | 1 — feasible move options | The delayed visit offers the expected two technician/time choices | `tests/api/delays.test.mjs:27` | asserted |
| AGENT-003 | 1 — decided move effect | The approved move has the selected technician, start and retained arrival window | `tests/api/delays.test.mjs:36` | asserted |
| AGENT-003 | 1 — customer reply | The customer’s confirmation reply lands on that visit | none | none |
| AGENT-003 | 5 — selectable move policy | The company selects the disposition for the standard visit move | none | none |
| AGENT-003 | 7 — selectable external policy | The company selects the disposition for the moved-visit customer text | none | none |
| AGENT-005 | 1 — selectable price and send policy | The company chooses the commitment price decision and external send dispositions | none | none |
| AGENT-009 | 1 — grant attribution | The booked assignment records the used grant | `tests/api/grants.test.mjs:29` | asserted |
| AGENT-009 | 1 — grant use record | The grant records precisely that visit as its use | `tests/api/grants.test.mjs:32` | asserted |
| AGENT-009 | 1 — limit refusal | The $250 booking is refused above the grant’s $200 limit | `tests/api/grants.test.mjs:34` | asserted |
| AGENT-009 | 1 — company-policy record | The booking records its computed classes and numbered company-policy decision | none | none |
