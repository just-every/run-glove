# Distinct behavior-removal checks

Candidate source: 0fbef999d60de59a2f2ca77c044b0014770baf71. The unmodified candidate passes all seven agreement checks. Each mutation below was applied alone, ran the existing public-door journey, returned nonzero, and was restored in a finally block. Git diff is empty afterward. No mutation was committed or pushed.

## R1: Remove text reply from the accepted human-answer methods

Source: `src/glove/agreements.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 10769.678135
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    {"ok":false,"error":{"code":"INPUT","message":"method must be one of: phone, email reply, in person.","details":{"field":"method"}}}
    
    400 !== 200
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 200
  actual: 400
  operator: 'strictEqual'
  stack: |-
    Object.command [as run] (file:///workspace/run-glove/tests/api/harness.mjs:181:14)
    process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    async recordedDeclineAnswers (file:///workspace/run-glove/tests/api/agreements.test.mjs:817:24)
    async TestContext.<anonymous> (file:///workspace/run-glove/tests/api/agreements.test.mjs:257:3)
    async Test.run (node:internal/test_runner/test:1054:7)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 12022.232571

```

## R2: Manufacture a decline when the agreement ends

Source: `src/glove/agreements.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 3119.780527
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    38 !== 39
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 39
  actual: 38
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (file:///workspace/run-glove/tests/api/agreements.test.mjs:164:10)
    process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    async Test.run (node:internal/test_runner/test:1054:7)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4040.477622

```

## R3: Permit a decline while the included visit has a live booking

Source: `src/glove/agreements.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 3105.786974
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    {"ok":true,"result":{"id":"0ad21a92-1454-4cbc-a689-67e2df2e312b","version":2,"createdAt":"2026-11-05T22:33:37.140Z","customerId":"e5fa175e-e796-4387-a0db-62de5ad404ab","siteId":"04b4df1d-254d-4732-afab-a4381236412a","planId":"1f092b2e-43a3-4c24-a3f3-9e37b506134e","plan":{"name":"Comfort Club","price":"228.00","termMonths":12,"includedVisits":2,"visitServiceId":"2283cc9a-fe2e-4927-b4db-65413b65e690","visitServiceName":"Seasonal tune-up","repairDiscountPercent":"15","priorityBooking":true,"formIds":[]},"startDate":"2026-04-05","endDate":"2027-04-04","soldOn":"2026-11-05","via":"phone","quoteId":null,"soldBy":{"id":"1bc1d2d7-e2f9-4f99-9b38-a1fa212f1c0d","name":"Olivia Owner","role":"owner"},"soldByTechnicianId":null,"endedAt":null,"endedOn":null,"endReason":null,"declines":[{"index":0,"due":"2026-04-05","method":"phone","customerName":"Club member 6","reason":"Replacing the system this year","at":"2026-11-05T22:33:38.376Z","recordedBy":{"id":"1fa8b2c0-890f-4fb6-83dc-cf03ecc3870f","name":"Front Office Due","role":"office"}}]},"version":132}
    
    true !== false
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: false
  actual: true
  operator: 'strictEqual'
  stack: |-
    command (file:///workspace/run-glove/tests/api/harness.mjs:180:32)
    process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    async TestContext.<anonymous> (file:///workspace/run-glove/tests/api/agreements.test.mjs:181:3)
    async Test.run (node:internal/test_ru
```

## R4: Replace the earlier answer instead of appending

Source: `src/glove/agreements.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 9923.101229
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    a second and every later answer append, preserving every earlier field and append order
    + actual - expected
    
      [
        {
    -     at: '2031-01-01T06:20:00.000Z',
    -     customerName: 'synthetic-glove-answer-customer-1',
    -     due: '2030-07-01',
    -     index: 3,
    -     method: 'phone',
    -     reason: 'Customer explicitly skips inspection 4 after a phone answer',
    -     recordedBy: {
    -       id: '34206131-ea84-423a-92e9-81ea6e30e9bc',
    -       name: 'Olivia Owner',
    -       role: 'owner'
    -     }
    -   },
    -   {
          at: '2031-01-01T06:21:00.000Z',
          customerName: 'synthetic-glove-answer-customer-1',
          due: '2030-01-01',
          index: 0,
          method: 'email reply',
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
    0:
      index: 3
      due: '2030-07-01'
      method: 'phone'
      customerName: 'synthetic-glove-answer-customer-1'
      reason: 'Customer explicitly skips inspection 4 after a phone answer'
      at: '2031-01-01T06:20:00.000Z'
      recordedBy:
        id: '34206131-ea84-423a-92e9-81ea6e30e9bc'
        name: 'Olivia Owner'
        role: 'owner'
    1:
      index: 0
      due: '2030-01-01'
      method: 'email reply'
      customerName: 'synthetic-glove-answer-customer-1'
      reason: 'Customer explicitly skips inspection 1 after a email reply answer'
      at: '2031-01-01T06:21:00.000Z'
      recordedBy:
        id: '34206131-ea84-423a-92e9-81ea6e30e9bc'

```

## R5: Leave declined ordinals in the due projections

Source: `src/glove/agreement-due.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 3186.767657
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    the due list shows exactly the remainder
    + actual - expected
    
      [
    +   '10bdbcf5-5f7f-4e7d-8235-9eb20322a48f:0',
        '3c2c47c4-7762-4c0d-b923-a5a2712fff68:0',
        '4b218eb2-919c-4464-a10b-3d9783ba4e83:0',
    +   '66754be0-b2d7-4380-a3f2-8b61504777f8:0',
        '6dd61e45-43e2-4d94-8af7-3dfd4ca59fc6:0',
        '6ecdfee2-3157-4b9e-ac19-60c1c093eb39:0',
        '74122be7-814f-44e7-8b20-3c93aaf1647f:0',
        '7b2fe00b-5e70-4e00-8d95-66e007ffa172:0',
        '9d420975-ba30-4697-98aa-e96058fa922c:0',
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
    0: '3c2c47c4-7762-4c0d-b923-a5a2712fff68:0'
    1: '4b218eb2-919c-4464-a10b-3d9783ba4e83:0'
    2: '6dd61e45-43e2-4d94-8af7-3dfd4ca59fc6:0'
    3: '6ecdfee2-3157-4b9e-ac19-60c1c093eb39:0'
    4: '74122be7-814f-44e7-8b20-3c93aaf1647f:0'
    5: '7b2fe00b-5e70-4e00-8d95-66e007ffa172:0'
    6: '9d420975-ba30-4697-98aa-e96058fa922c:0'
    7: '9eb3c978-9076-4a84-bbaf-65d32220e3f3:0'
    8: 'ab708425-51e3-4da8-9b05-7c823e4b08f9:0'
    9: 'b1facbb6-c56a-44da-b2ff-1bbc9fc6e8a0:0'
    10: 'bda2307b-40a4-42b4-a843-4bc12d60e4c0:0'
    11: 'c25a4927-a5b8-49d3-a110-af9f032409d0:0'
    12: 'c4556e6b-f476-4ed7-a268-1ec7b542c21a:0'
    13: 'cf5574f6-c2cd-42f7-ab47-ffcdd2f40730:0'
    14: 'e55aace5-ca60-4dfe-b115-4f65fef99f47:0'
    15: 'e6c9998b-34a0-40f4-908e-c282e09be3e0:0'
    16: 'ea732207-d185-4f51-875d-a6836e87ea75:0'
    17: 'f12df919-3579-46bc-a8e4-d1441e305de0:0'
    18: '10bdbcf5-5f7f-4e7d-
```

## R6: Omit the recorded decline from property history

Source: `src/glove/history.ts`. Exit: 1. Killed: True.

Command: `node --test --test-name-pattern=^Forty due entitlements --test-concurrency=1 tests/api/agreements.test.mjs`

Actual failure excerpt:

```text
not ok 1 - Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart
  ---
  duration_ms: 3294.346918
  type: 'test'
  location: '/workspace/run-glove/tests/api/agreements.test.mjs:117:1'
  failureType: 'testCodeFailure'
  error: |-
    CUST-001: the decline is in the property history
    + actual - expected
    
    + []
    - [
    -   [
    -     'declined',
    -     'Comfort Club visit 1 (due 2026-04-05) declined by Club member 18 (phone), recorded by Front Office Due: Replacing the system this year'
    -   ]
    - ]
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
    0:
      0: 'declined'
      1: 'Comfort Club visit 1 (due 2026-04-05) declined by Club member 18 (phone), recorded by Front Office Due: Replacing the system this year'
  actual:
  operator: 'deepStrictEqual'
  stack: |-
    TestContext.<anonymous> (file:///workspace/run-glove/tests/api/agreements.test.mjs:198:10)
    process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    async Test.run (node:internal/test_runner/test:1054:7)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4237.303244

```
