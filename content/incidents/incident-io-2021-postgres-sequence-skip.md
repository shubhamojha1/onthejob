---
id: incident-io-2021-postgres-sequence-skip
company: incident.io
title: Database upgrade made incident IDs skip 32 numbers
year: 2021
date: '2021-07-12'
duration: < 1 day (investigation and fix)
classes:
  - bad-deploy
  - automation-misfire
patterns:
  - follower-promotion-state-divergence
  - wal-preallocation-surprise
  - user-visible-internal-counter
  - missing-upgrade-validation
  - implicit-guarantee-mismatch
impact: >-
  Multiple customer organizations saw their incident identifiers jump by up to
  32 (e.g. from #INC-20 to #INC-52), eroding trust in the numbering system,
  though no data was lost or misattributed.
trigger: >-
  A routine database upgrade that spun up a follower node and promoted it to
  primary — the follower was carrying Postgres sequence values up to 32 ahead of
  the old primary, because Postgres pre-allocates 32 sequence values before
  writing them to the WAL.
mechanism: >-
  Postgres pre-logs 32 sequence values in advance to avoid logging every single
  increment → follower nodes always track a state up to 32 ahead of the current
  committed value → promoting the follower as the new primary during the upgrade
  made all per-organization incident sequences jump by up to 32 → customers saw
  large unexpected gaps in their incident numbering.
lesson: >-
  Never expose raw Postgres sequences as meaningful user-facing identifiers —
  sequences do not guarantee gap-free increments and any failover, crash, or
  upgrade can silently advance them by up to 32; use an explicit MAX+1 approach
  instead.
interview: >-
  How would you implement a per-organization counter that guarantees sequential,
  gap-free identifiers even across database failovers, follower promotions, and
  transaction rollbacks?
source: 'https://incident.io/blog/one-two-skip-a-few'
sourceLabel: incident.io Engineering Blog
source_quote: >-
  We don't want to log each fetching of a value from a sequence, so we pre-log a
  few fetches in advance. In the event of crash we can lose (skip over) as many
  values as we pre-logged.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
