# Original independent judgment scope

Repository: just-every/run-glove. Exact source: c1821c00e4244f7281680893e3d5749e89f89125. Source branch: cloud/sx-glove-c-f106. Tag: ct-judge-glove-disp011-20261106-0425.

The supplied prerequisite completed at 2026-11-06T04:02:50Z, exit 0, GATE PASS, sx-glove-c-f106-gate-1. This report does not substitute that execution for its own runs. The brief states no earlier original whole-clause CT judgment at this exact source. Earlier source106 point1 and Glove103 supply no borrowed acceptance.

## Full original clause

#### DISP-011 — Apply or discard a route proposal

*Tier:* Core · *From:* DISP-003 · *Cites:* BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001

**Requirement.** Apply or discard a route proposal supports the service business with the outcomes below. The operating rules at docs/service-work-rules.md#disp-003-operating-rules retain the record formats and calculations.

**Acceptance.**
1. Route accept action requires a person's reason, fresh live dispatch/branch authority, unchanged day/eligibility dependencies and a fresh provider matrix, then commits every move and assignment history together.
2. Discard, provider refusal, expiration and stale proposals move nothing.
3. Restore retains proposal metadata but requires Google Maps to be reconnected; customer erasure discards affected undecided proposals and redacts their erased references.

## Frozen rubric (no new acceptance bar)

| Item | Public-door proof | Historical mutation or independent refusal |
| --- | --- | --- |
| R1: acceptance point 1 | tests/api/routing.test.mjs, the 12-visit dispatcher acceptance and safe erasure journey; tests/browser/routing.spec.ts, dispatcher discard, provider refusal and explicit acceptance | M1 removes the token fence and fails the individual HTTP-status assertion, actual 200 versus expected 403; missing reason, role and branch withdrawal, changed dependencies and invalid provider legs also execute through actual commands |
| R2: acceptance point 2 | tests/api/routing.test.mjs, stale eligibility, discard and provider refusal journey; the browser journey's explicit discard and 503 refusal | M2 delays lease expiry and fails the individual route-status assertion, actual running versus expected failed |
| R3: acceptance point 3 | tests/portable.mjs, DISP-011 real archive; the 12-visit journey's erasure stage | M3 removes route-scope discovery and fails the individual erased-route assertion, actual running versus expected discarded; actual restore refuses acceptance without Maps and stale acceptance after reconnect |
| R4: BASE-DATA-001 | tests/portable.mjs, actual export and import of exact records, route metadata and later erasure journal; route Activity and business export read doors | Archive, startup and refused acceptance preserve appointments; old sessions are refused and provider authority is absent |
| R5: BASE-DATA-003 | the routing erasure stage and actual later-journal restore in tests/portable.mjs | M3; erased route replay refuses, late provider success cannot resurrect work, and an unrelated customer's exact route and appointments survive |
| R6: BASE-ROLE-001 | all three native route commands in the 12-visit API journey, with live role and branch withdrawal during provider response | M1; signed-out, token and custom-role requests refuse; legitimate dispatcher acceptance succeeds |

M1, M2 and M3 are supplied historical failure-sensitivity evidence only. No mutation is authorized or applied by this judgment. Score only R1–R6. Broader DISP-003 optimization matrices remain separate. Live-account and real-device duties are UNMET-EXTERNAL, never blocking rubric rows. No visual-quality or redesign criterion applies; functional browser readback at 1440 and 390 remains required.

All eleven DONE-RIDERS remain applicable. Product and fleet are read-only: no product commit, push, PR, source-pin transfer, hold release, lifecycle action, CI query, retry, dispatch, provider or production operation, self-submission or paid service. Separate report-only evidence transport is explicitly authorized. Keep full fresh-main status, Gap, Evidence and provenance intact, especially TEAM-001; award no status and sum no parallel proposal. Preserve all source, chain, review, provider and release holds and lifetime FIX counters.
