---
id: circleci-2025-stale-db-statistics
company: CircleCI
title: Blue/Green Database Upgrade Stales Query Stats
year: 2025
date: '2025-04-04'
duration: ~1h 45m
classes:
  - bad-deploy
  - resource-exhaustion
  - cascade
patterns:
  - premature-statistics-rebuild
  - chained-major-version-migration
  - retry-exhaustion
  - blue-green-cutover-gap
  - emergency-failback
impact: >-
  CircleCI customers globally experienced roughly 1h45m of delayed and failing
  workflow/job starts, with some jobs dropped after exhausting retries and
  degraded visibility into workflows in the UI.
trigger: >-
  A scheduled blue/green upgrade of the database backing the workflows service,
  which bundled two major version upgrades into a single deployment window.
mechanism: >-
  The statistics-rebuild (analyze) step ran once early in the deployment, but a
  second major version upgrade that followed invalidated those statistics; the
  query planner on the new primary began favoring full disk scans over indexes,
  latency climbed, and jobs started failing as their 10-minute retry windows
  expired. Scaling the service down to let the database recover and rebuild
  statistics didn't restore performance in time, so the team reinstated the old
  database as primary to restore service, then let the queue drain back to
  normal.
lesson: >-
  When a deployment chains multiple schema or version upgrades together,
  maintenance steps like statistics/index rebuilds must be re-run after every
  version change, not just once at the start, or the query planner will silently
  degrade until production load exposes it.
interview: >-
  When asked about safe database migrations, discuss why post-upgrade
  maintenance like ANALYZE needs to be sequenced per version bump in multi-step
  migrations, and how blue/green cutovers need automated checkpoints to catch
  stale planner statistics before they hit customer traffic.
source: >-
  https://discuss.circleci.com/t/post-incident-report-april-4-2025-delays-in-starting-workflows/53113
sourceLabel: CircleCI Discuss (official post-incident report)
source_quote: >-
  The root cause was determined to be that the analyze operation to rebuild the
  database's statistics table, which is used for indexes, had been executed too
  early in the operation and was made stale by a second major version upgrade
  within the same deployment.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
