---
id: github-2026-push-connection-pool
company: GitHub
title: Git Push Failures From Primary DB Connection Pool Exhaustion
year: 2026
date: '2026-05-25'
duration: 9 min
classes:
  - resource-exhaustion
  - bad-deploy
patterns:
  - unstaged-feature-flag-rollout
  - expensive-query-on-primary
  - connection-pool-exhaustion
  - self-resolving-in-flight-drain
  - missing-replica-read-routing
impact: >-
  Git push operations over HTTPS and SSH on GitHub.com degraded for about 9
  minutes, with an average of 31% and a peak of 43% of push requests failing
  during the window.
trigger: >-
  A recently enabled feature flag turned on a code path that issued an
  unexpectedly expensive query directly against a primary database.
mechanism: >-
  The expensive query from the newly flagged-on code path saturated the primary
  database's connection pool, starving other operations of connections and
  causing a sustained spike in push failures across both HTTPS and SSH until
  engineers disabled the flag and remaining in-flight work drained.
lesson: >-
  Default new or infrequently exercised read paths to replica databases rather
  than the primary, since a single expensive query behind a feature flag can
  exhaust a shared connection pool and take down an unrelated production
  workload.
interview: >-
  When asked about safely introducing new database-backed code paths, discuss
  staged feature-flag rollouts, load-testing expensive queries before they touch
  a primary database, and defaulting reads to replicas to protect shared
  connection pools.
source: 'https://www.githubstatus.com/incidents/tm84vy58jq0h'
sourceLabel: GitHub Status incident report
source_quote: >-
  The incident was caused by a recently enabled code path that issued an
  unexpectedly expensive database query against a primary database.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
