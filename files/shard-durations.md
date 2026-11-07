# Measured Verify shard durations

| Run | Shard | Conclusion | Duration |
| --- | --- | --- | --- |
| 42349435219 | shards (api) | success | 8m17s |
| 42349435219 | shards (browser) | success | 12m55s |
| 42349435219 | shards (foundation) | success | 1m56s |
| 42349435219 | shards (portable) | success | 6m16s |
| 42352072080 | shards (${{ matrix.name }}) | skipped | 0m00s |
| 42355219327 | shards (browser) | cancelled | 15m15s |
| 42355219327 | shards (portable) | success | 8m41s |
| 42355219327 | shards (api) | success | 12m32s |
| 42355219327 | shards (foundation) | success | 1m15s |

Longest actually completed shard: browser, 12m55s, run 42349435219.
ceil(12m55s + 4m) = 17 minutes, giving 4m05s margin.
Run 42355219327 browser was cancelled at 15m15s: this is a lower bound for that attempt, not a completed duration.
Run 42352072080 succeeded with shard coverage skipped; it does not establish a browser duration.
Push shard count stays 4 (foundation, api, portable, browser), below the limit of 8.
The explicit nightly reusable-workflow override remains 45 minutes; plan/summary jobs remain 1 minute and light remains 12 minutes.

## Candidate 42357379438

- shards (api): 11m37s, success
- shards (foundation): 2m07s, success
- shards (browser): 14m30s, failure
- shards (portable): 5m54s, success

The candidate browser job failed an assertion within its 17-minute limit. It is not a completed successful browser journey or a timeout cancellation.
