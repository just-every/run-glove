# sx-glove-c-f191 — COST-007 provider payroll files

Candidate: b7637133f4cac50e561b59c3a3d2da114af5b595 on cloud/sx-glove-c-f191 in just-every/run-glove.
Base main: c270566732b115a5514cdab4b9f22cbc9f12fe4a. PR: none; push is the existing Verify entry point.
Product changes: one focused API registration and its generated source-lock entry. No production repair, contract edit, deleted assertion, new browser registration or workflow edit.

COST-007 is claimed DONE for native points 1–5, subject to the independent exact-head Verify and guarded landing. Status cells remain PARTIAL as required. Actual counts before and after: 31 DONE, 203 PARTIAL, 29 MISSING. Proposed landing judgment: 32 DONE, 202 PARTIAL, 29 MISSING. Separately qualified outcomes: 0 → 5. Suite: 191 → 192 of 200; one added registration, no removed or narrowed tests.

The full plan is in PLAN.md. All five steps execute within tests/api/payroll-files.test.mjs test "COST-007 payroll files qualify provider rows, approved workweeks, privacy and export authority". The existing combined payroll registration remains intact and passed alongside it.

| Rubric | Acceptance sentence or inherited outcome and proof | Result |
| --- | --- | --- |
| R1 | Point 1: native shifts and job timers, Owner approval; independently parsed ADP version row and eleven columns; every person and earnings-code row; regular 8.00, overtime 4.00 and double time 1.02 from 61 whole minutes; default REG, OTP, DBL and Owner REGOWN, OTOWN, DTOWN; company, dates, payroll IDs, blanks, check and rate fields. tests/api/payroll-files.test.mjs lines 63–108. | PASS locally |
| R2 | Point 1 unsafe paths: missing setup gives PAYROLL_SETUP 409; eleven-character and nonalphanumeric company codes and unsupported frequency give INPUT; state and business export remain identical. Missing payroll ID is named in payroll JSON. tests/api/payroll-files.test.mjs lines 79–107. | PASS locally |
| R3 | Point 2: exact Gusto header and complete values, first-word first names, remaining last names including quoted comma, Gusto employee ID and weekly hours. tests/api/payroll-files.test.mjs lines 111–117. Timesheets labels simply offer Gusto hours CSV; operating rules lines 1180–1190 explicitly disclaim a confirmed provider layout and live upload. | PASS runtime; provider boundary INSPECTED |
| R4 | Point 3: two people each receive exactly two rows in a three-week period; each row has its own date range and hours; only Priya's second week has 4.00 overtime. The third empty week remains unapproved and creates no row. A separate person with actual unapproved third-week time is excluded for the whole period and named with the reason, preserving COST-006 point 4. tests/api/payroll-files.test.mjs lines 120–146. | PASS locally |
| R5 | Point 3 unsafe periods: zero weeks, seven weeks and a non-workweek ending are refused on all three file routes without state or business-export changes. tests/api/payroll-files.test.mjs lines 147–156. | PASS locally |
| R6 | Point 4: offered ssn input is absent from the command result, state, complete business export and all three files; no SSN column. tests/api/payroll-files.test.mjs lines 160–171. Technician inputs in src/ui/team.tsx lines 88–118 and payroll-ID control in src/ui/timesheets.tsx lines 106–115 offer no SSN field. | PASS runtime; existing input surface INSPECTED |
| R7 | Point 5: complete QuickBooks header and every local-date pay item line, including all three hour buckets, two employees, quoted name, MM/DD/YYYY dates, hours and blank amount. tests/api/payroll-files.test.mjs lines 175–181. Operating rules line 1186 describes Owner mapping, not Intuit confirmation. | PASS runtime; provider boundary INSPECTED |
| R8 | Shared export authority: Owner and Office read all three files; Dispatcher, Technician, a custom report reader without export, signed-out requests and a dispatcher integration token are refused. Refusal leaves business state and export unchanged. First token authentication occurs before the snapshots because legitimate credential-use metadata is recorded independently of export authority. tests/api/payroll-files.test.mjs lines 183–201. | PASS locally |
| R9 | Subcontractor appears in no file and is named as excluded; actual Worker disposal and restart retain byte-identical Owner and Office downloads. tests/api/payroll-files.test.mjs lines 66–77, 104–107 and 189–206. | PASS locally |
| R10 | Six downloads through actual Timesheets links at 1440 and 390, with native local Owner and Technician sessions, real dev Worker and D1, no request interception. Each download matches its report endpoint byte for byte. Screenshots and browser-receipt.json retain filenames and hashes. | PASS |
| R11 | Inherited owning capabilities: COST-002 workweek calculations and COST-006 approval eligibility remain unchanged. TEAM-003 and TEAM-006 commission proof in tests/api/payroll.test.mjs remains intact and passes. PAY-002 tip qualification, genuine provider imports and other held duties are not claimed by this file-layout round. | INSPECTED; preserved payroll journey PASS |

Exact-head Verify: push run 42568552290, currently in progress, conclusion not yet observed. Its API test glob automatically selects the focused registration. Main's baseline Verify 42566672074 and Run site 42566672055 succeeded on c270566732b115a5514cdab4b9f22cbc9f12fe4a. No dispatch or rerun was requested.

## DONE-RIDERS

| Rider | Candidate result and evidence |
| --- | --- |
| 1 | Native acceptance outcomes PASS in the five scenario steps; exact-head CI remains pending. R1–R10 above map every sentence. |
| 2 | PASS: populated native records, literal expected rows, supported downloads and unsafe setup, period and permission refusals with unchanged business data. |
| 3 | PENDING: recorded exact-head push Verify 42568552290 includes the focused test through the existing glob. No green conclusion is claimed. |
| 4 | PASS: focused and preserved tests rerun on b7637133f4cac50e561b59c3a3d2da114af5b595. Browser proof and build used d509c2e03bac64e12bd970ff96436044d391a1aa; the only later change is the generated source-lock entry, with no byte change under source or tests. |
| 5 | INSPECTED: no inherited duty was added or newly claimed; owning capability boundaries remain in COST-007. |
| 6 | PASS mechanical: generator write and check exit 0, zero generated documents changed; generated views restored and not committed. Contract judgments remain for the lander. |
| 7 | PASS: no acceptance text, Status, Gap, Evidence, coverage map or clause ID changed. |
| 8 | PASS: all three routes serve Owner and Office and refuse the named excluded identities; business state and export are unchanged by refusals. |
| 9 | PASS boundary: R-15, R-16 and R-17 remain unclaimed; Gusto and QuickBooks layouts are not reported provider-confirmed; no payment or filing occurs. |
| 10 | NOT APPLICABLE: no policy default or new authority introduced. |
| 11 | PENDING guarded landing: main equality, complete publication scan and main Run site are not cloud receipts. |

## Probes and checks

PROBE COST-007 1: ADP RUN report after native 13 h 1 min shift and Owner approval -> exact version, eleven columns, four expected hour rows; missing setup 409; invalid settings INPUT with unchanged business.
PROBE COST-007 2: Gusto report for two multiword employee names -> exact header, first word and employee ID with independently expected hours.
PROBE COST-007 3: Gusto report over three workweeks -> four rows, second-week-only overtime, empty unapproved week omitted and person with unapproved time withheld; invalid ranges 400.
PROBE COST-007 4: technician.save with offered ssn -> value absent from returned technician, state, business export and every payroll file.
PROBE COST-007 5: QuickBooks report -> exact daily pay items; every file allows Owner and Office and refuses excluded roles and token; actual Worker restart preserves bytes.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0.

Touched and preserved payroll registrations: 2 passed, 0 failed on exact candidate. Typecheck, first-party checks, build, inventory and diff checks passed. receipt.json, payroll-tests.tap and the other selected outputs contain the actual results. Source lock check returned ok=true. No assertions were removed, skipped or narrowed.

Pre-READY: runtime outcomes and refusals are covered; no production authority, erasure or replay path changed; no screen source changed; existing Timesheets has labeled download controls and its screenshots were inspected at both widths. No email-shaped literal or provider-shaped key was added to the focused fixture. No product blocker was found. Browser proof initially used lowercase approved while the existing Badge capitalizes Approved; correcting the evidence locator resolved that timeout without a product edit.

Publication scan: commit=b7637133f4cac50e561b59c3a3d2da114af5b595; complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. Not run in cloud under the explicit branch-only cloud route. No zero-findings or main equality claim is made. Guarded fleet landing must obtain those results and exact-head Verify and Run site.

Plan rows proposed: COST-007 only, native points 1–5 qualified. No on-disk lane plan was edited. Other same-file commission, approval and tip candidates remain with their owning clauses. Actual provider upload and import acceptance R-15, R-16 and R-17 and all existing provider, Base, account and release holds remain unchanged. Glove pays no one and files nothing.

CLAIM COST-007 DONE points=1,2,3,4,5 tests=tests/api/payroll-files.test.mjs#COST-007 payroll files qualify provider rows, approved workweeks, privacy and export authority
