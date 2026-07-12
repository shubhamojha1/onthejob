---
id: circleci-2021-backwards-incompatible-schema-change
company: CircleCI
title: Backwards-incompatible schema change stalls all job execution
year: 2021
date: '2021-11-08'
duration: 53 min
classes:
  - bad-deploy
  - cascade
patterns:
  - backwards-incompatible-migration
  - rollback-makes-it-worse
  - thundering-herd-on-recovery
  - slow-node-provisioning
impact: >-
  All job executors were blocked from running customer jobs for roughly 53
  minutes, with elevated queue times continuing for machine executors for over
  an hour longer, affecting all CircleCI customers.
trigger: >-
  A deploy changed a field type in the distribution service's database schema,
  and work written before the deploy became unreadable to the new code.
mechanism: >-
  The schema change made pre-deploy data fail distribution, so the team rolled
  back — but the rollback then made post-deploy data unreadable instead, keeping
  errors flowing; a hotfix let the distributor ignore the field, and manual
  compute scaling to absorb the resulting thundering herd was slowed because new
  nodes provisioned too slowly, got marked unhealthy, and were terminated before
  they could help.
lesson: >-
  A rollback is not automatically safe when a schema or format change has
  already been written to storage in the new shape — verify backward AND forward
  read compatibility before treating rollback as the safe default.
interview: >-
  When asked about safe database migrations, discuss why a schema change must be
  readable by both old and new code during the rollout window, including during
  a rollback.
source: >-
  https://discuss.circleci.com/t/incident-report-november-8-2021-jobs-stuck-in-a-not-running-state/41890
sourceLabel: CircleCI Discuss
source_quote: >-
  Customer jobs were blocked in a "not running" state from approximately 18:50
  UTC to 19:43 UTC on Monday, November 8, 2021, due to a database schema change
  that was not backwards compatible.
archive_url: ''
date_added: '2026-07-04'
last_verified: '2026-07-04'
verified: false
---
