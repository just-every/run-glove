## CONTRACT.md — COST-001

#### COST-001 — Clock-ins and job timers

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason. The [operating rules](docs/service-work-rules.md#cost-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.
2. A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.
3. Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).
4. An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.
5. The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.
6. Technicians read only their own entries.
7. The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.


## CONTRACT.md — GLOVE-06

#### GLOVE-06 — Field capture through a connectivity interruption

**Requirement.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job. The [operating rules](docs/service-work-rules.md#glove-06-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times.
2. A resend after a lost response returns the recorded outcome and produces one copy of each capture.
3. Original photo bytes remain readable by the assigned technician and unavailable to an unrelated technician.


## CONTRACT.md — REPORT-001

#### REPORT-001 — Owner dashboard

*Tier:* Core

**Requirement.** The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due. The [operating rules](docs/service-work-rules.md#report-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.


## ACCEPTANCE.md — COST-001

#### COST-001 — Clock-ins and job timers

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason. The [operating rules](docs/service-work-rules.md#cost-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.
2. A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.
3. Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).
4. An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.
5. The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.
6. Technicians read only their own entries.
7. The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

**Evidence.** `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`, `src/ui/technician.tsx`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the REPORT-001 on-the-clock tile lists exactly the technicians clocked in at each step.; point 2 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.; point 3 — Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (GLOVE-06).; point 4 — An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.; point 5 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.; point 6 — Technicians read only their own entries.; point 7 — The REPORT-001 on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running. See docs/contract/DONE-AUDIT.md for each named outcome.


## ACCEPTANCE.md — GLOVE-06

#### GLOVE-06 — Field capture through a connectivity interruption

Core · published · **partial** · Cites BASE-INPUT-003

**Requirement.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job. The [operating rules](docs/service-work-rules.md#glove-06-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times.
2. A resend after a lost response returns the recorded outcome and produces one copy of each capture.
3. Original photo bytes remain readable by the assigned technician and unavailable to an unrelated technician.

**Evidence.** `tests/api/flows.test.mjs`, `src/ui/outbox.ts`
**Gap.** The audit records 3 separately asserted outcome(s). Complete proof is not located for point 1 — The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times. See docs/contract/DONE-AUDIT.md for each named outcome.


## ACCEPTANCE.md — REPORT-001

#### REPORT-001 — Owner dashboard

Core · target · **partial**

**Requirement.** The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due. The [operating rules](docs/service-work-rules.md#report-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).; point 2 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis. See docs/contract/DONE-AUDIT.md for each named outcome.

