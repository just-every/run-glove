BOOK-014 candidate report — sx-glove-c-f197

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f197
Candidate: b73ef129faba4fb90d2a84962f00490b7d2d76c9
Base main: 592be9edd6258ffb39bed635bb28a1506494ae7d
PR: none; push Verify is the repository's existing branch entry point.

Result and plan

BOOK-014 point 1 is qualified by one focused public-door sanity journey. The reproduced product defect was Yelp's postal-code substitution: a recorded ZIP-only Yelp lead created a site and linked it to the request. The repair changes only yelp() in src/glove/leads.ts: address is empty for this postal-code-only provider record, so land() creates no invented service site. Matching and other provider parsers remain unchanged.

The complete executed plan was: read BOOK-014's full acceptance and copied family Gap; map the existing combined pipeline scenario; reproduce the Yelp ZIP-only site; add one focused registration using the existing scenario steps, production Worker harness and recorded provider fixtures; enumerate independently expected identity and duplicate-review outcomes; run touched API journeys, typecheck, build, first-party check, contract generation and inventory; fetch main and rebase before the first product commit; restore generated views, regenerate the source lock last and check it; inspect all candidate identities and messages; push the named branch using the fleet guard; record exact-candidate proof, publish the report packet separately and hand off to the guarded lander. No further unblocked target touching these files is provided by this extract; BOOK-016 has its own concurrent campaign.

The previous combined pipeline proof only exercised an Angi email match. Missing focused assertions were formatted phone matching, case-insensitive email, short phone, conflicting identities, multiple customers sharing a phone, erased and merged identities, exact duplicate sets, address versus ZIP-only site creation, all-provider identity decisions, replay and restart stability, and attributable business facts. All are now reached by the new journey.

The focused scenario enumerates 13 provider records: 6 match existing live customers and 7 create distinct new customers. It records 13 requests and exactly 6 addressed sites. Google, Reserve and ZIP-only Yelp have no request site. New-customer review independently expects short-phone, conflicting phone and email, two shared-phone candidates, normalized-address resemblance, or no candidates. Each public duplicate read compares the complete candidate set and reason set.

Files and retained scope

- src/glove/leads.ts:57–58 repairs the reproduced ZIP-only Yelp defect.
- tests/api/lead-matching.test.mjs:13 registers the focused journey.
- sources.lock.json is generated with the edition-authoring lock command.
- Existing tests/api/harness.mjs, tests/fixtures/leads.mjs, tests/api/merge.test.mjs and tests/api/pipeline.test.mjs are unchanged. No old assertion was removed or narrowed. No permanent test was deleted.
- No UI changed. Browser widths, text and tooltip audits are inapplicable to this API-only change.
- No dependency, Base pin, workflow, migration, homepage or contract text was changed.

Counts and judgments

Before and after committed contract counts: 35 DONE, 199 PARTIAL, 29 MISSING; 263 Status rows. BOOK-014 remains PARTIAL in the source table because builders do not edit judgments. Requested landing claim: BOOK-014 PARTIAL to DONE, point 1. If accepted, the lander's count change is +1 DONE and -1 PARTIAL, resulting in 36 DONE, 198 PARTIAL, 29 MISSING. Test inventory increases from 194 to 195 out of the existing 200 cap. The sole plan-row proposal is BOOK-014: ready, point 1 qualified, copied BOOK-004 family hold belongs to BOOK-004; plan files were not edited.

CLAIM BOOK-014 DONE points=1 tests=tests/api/lead-matching.test.mjs#BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart

Acceptance and frozen proof rubric

Every line below refers to that single registration and the candidate above. Verify event and conclusion are recorded in receipt.json; landing remains independent.

| Item | Outcome and public door | Proof lines | Result |
| --- | --- | --- | --- |
| BOOK-014 acceptance sentence 1 | Provider-source request and ID, exactly one live identity, otherwise a new customer with addressed site and resemblance review | tests/api/lead-matching.test.mjs:14–158 | PASS locally; exact-SHA CI in receipt |
| R1 | All five providers retain source, provider ID, matched value and exact customer; Basic callback, desk command and cron | lines 63–154 | PASS |
| R2 | +1, punctuation and spaces compare last ten digits; email ignores case | lines 42–45, 64–67, 73, 76, 126–130 | PASS |
| R3 | Short phone, different phone and email owners, and two shared-phone customers create new identities | lines 46–50, 68–70, 130–144 | PASS |
| R4 | Erased and merged-away people never match; survivor carrying chosen merge email does match | lines 51–61, 71–73, 126–135 | PASS |
| R5 | Explicit lead addresses and ZIPs create exact sites; Google, Reserve and ZIP-only Yelp create none | lines 14–24, 146–154 | PASS |
| R6 | Every new customer has exactly the independently listed CUST-005 resemblance candidates and reasons through GET duplicate review | lines 68–75, 137–144 | PASS |
| R7 | One request per provider lead ID across callback retries, desk and scheduled Google reads, command replay and actual Worker restart | lines 101–125, 156–174 | PASS |
| R8 | DATA-002 inherited flow: each lead.received has actual actor, time, command, subject and effect in Activity and business export; request facts are exported | lines 182–196 | PASS |
| R9 | BASE-SECRET-001 and BASE-DATA-004 cited duties: current owner connects, Basic credentials checked, rejected input changes nothing, keys and passwords absent from business facts | lines 35–39, 115–119, 175–180, 198–202 | PASS |
| R10 | Erasure and replay do not recreate a person or site after a second actual Worker restart | lines 203–212 | PASS |

DONE-RIDERS

| Row | Result | Evidence and limitation |
| --- | --- | --- |
| 1 | PASS locally; exact-SHA Verify in receipt | Acceptance sentence 1 covered by lines 14–212, every provider exercised |
| 2 | PASS | Independently named customers, explicit expected customer IDs, full duplicate sets, record and site totals, refusal snapshots; runtime fixtures contain real persisted data |
| 3 | Exact-SHA CI in receipt | Existing push Verify discovers every API test file; scripts/verify-app.mjs:9,24–28. No env flag or nightly-only registration |
| 4 | PASS | Final focused test and preserved pipeline and merge journeys run on the committed candidate; receipt carries head and exits |
| 5 | PASS INSPECTED and runtime proof | BOOK-014 already cites BASE-DATA-004 and BASE-SECRET-001; its own sentence names CUST-005. Attribution and secret exclusion are exercised, no new inheritance is claimed |
| 6 | PASS mechanical; judgment handoff | Contract write and check pass; generated views restored whole. Status, Gap and Evidence cells intentionally unchanged for the lander |
| 7 | PASS INSPECTED | CONTRACT.md has zero diff; no acceptance rewrite or coverage-map change |
| 8 | PASS | Non-owner connection and viewer pull refused; wrong and replaced provider credentials write nothing, lines 35,115–119,175–180 |
| 9 | PASS boundary | Fakes exist only at documented provider edges. No real provider acceptance, response-window compliance, account eligibility or legal claim is made |
| 10 | PASS INSPECTED | No policy default or new authority was adopted |
| 11 | PENDING guarded lander | Candidate is branch-only. Main equality, publication scan and resulting Run site are the lander's duties; their absence is not a product blocker |

Pre-ready self-check

1. Each named behavior is checked through a public door using nonempty independent data; the ZIP-only assertion failed before the repair. Exact-SHA Verify status is in receipt.json.
2. No existing assertion was removed, narrowed, skipped or moved behind a condition.
3. Wrong and replaced credentials cannot write; erased and merged-away customers are excluded; an erased lead replay after restart changes nothing.
4. Screens inapplicable: no UI files changed.
5. Source lock check passes and no new email-shaped literal appears in the focused test. Cloud publication scan is not available and was not claimed. Exact-SHA Verify, main equality and Run site are separately and honestly recorded.

PROBE BOOK-014 1: owner lead.connect then Basic authenticated recorded provider posts, desk lead.pull and scheduled handler -> 13 uniquely sourced requests, 6 existing and 7 new customers, exact duplicate sets, 6 addressed sites, no ZIP-only Yelp site, identical persisted decisions after retries and Worker restart; erased replay and replaced credentials change nothing.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses BOOK-014 then check exit=0, generated views restored; ledger=none exit=0 (no migration).

Publication scan: commit=b73ef129faba4fb90d2a84962f00490b7d2d76c9; complete=NOT RUN in cloud; historyScanned=unestablished; findings=unestablished. Full clone history is present. The guarded lander must run the COMPLETE scan with zero findings before landing. No scan success is implied by the push or evidence transfer.

Held boundaries and blockers

No BOOK-014 point remains unproved locally. BOOK-004 retains its provider replies, Yelp response-time duties and Reserve booking-server obligations; BOOK-015, BOOK-016 and BOOK-017 retain their own duties. No reply, booking, spend, live-provider acceptance, production activation or release is authorized or claimed here. No product blocker is known. Exact-SHA CI and final landing provenance are in receipt.json, and remain pending where explicitly stated there.

Evidence return

The explicit packet contains this report, actual test logs, the original failed reproduction, product push result and the actual receipt. It contains no credentials, environment dump, private held-out material or symlink. It is published only to evidence/sx-glove-c-f197. Product commits and evidence custody are separate.

Recorded branch CI: push Verify 42581126681, exact candidate b73ef129faba4fb90d2a84962f00490b7d2d76c9, in progress at the latest allowed poll. Main baseline Verify 42577457957 and Run site 42577457916 completed successfully. No workflow was dispatched or rerun.
