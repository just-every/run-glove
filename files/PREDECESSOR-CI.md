# Previous candidate failure

Predecessor head: 85f8648ffc8b09754bc939fc080580194f233c4e
Verify push run: 42530051626; conclusion failure.
Failed job: 128882211270, shards (api-1).
Log command used once: gh run view 42530051626 --repo just-every/run-glove --job 128882211270 --log-failed
Failed outcome: customer quote concrete disclosure, middle-option and add-on selection, revision request and immutable signed copy.
Failure: `Body is unusable: Body has already been read` in `verifyCopies`, `tests/api/customer-quotes.test.mjs:418:50`.

No repair of this unrelated test was attempted, and no assertion was changed. This continuation replays the unfinished route proof onto main 5fc3e002ef52aef13409cc8e93786fd74afb6c6a, whose Verify push runs 42531560842 and 42530376948 and Run site push run 42531560830 completed successfully. Those main runs are context, never a substitute for candidate Verify. The candidate run is recorded separately in CI.json. No unreproduced failure on the candidate is being claimed repaired or green.
