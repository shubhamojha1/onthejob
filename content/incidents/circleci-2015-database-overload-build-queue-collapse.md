---
id: circleci-2015-database-overload-build-queue-collapse
company: CircleCI
title: Database contention triggers day-long build queue collapse
year: 2015
date: '2015-10-14'
duration: ~17 h
classes:
  - cascade
  - resource-exhaustion
patterns:
  - shared-database-contention
  - missing-operational-tooling
  - throttle-misfire
  - manual-state-repair
impact: >-
  Linux builds were backed up or completely halted for roughly 17 hours across
  two days, affecting nearly all CircleCI customers' CI/CD pipelines during peak
  usage.
trigger: >-
  Rising build demand at peak traffic exposed database contention that prevented
  builds from being dequeued, and the standard scaling tools had no effect on
  the growing backlog.
mechanism: >-
  Queued database operations backed up faster than mitigation attempts could
  isolate the cause, forcing a failover to a new primary to kill stuck
  operations; once builds were flowing again, a separate bug blocked builds from
  ever reaching the runnable state, and the built-in failure-backoff throttles
  misfired and slowed recovery further, requiring engineers to build ad hoc
  tooling live to manually push builds through in batches.
lesson: >-
  Investing in architecture to reduce a known failure mode isn't enough — also
  build and rehearse the operational tooling needed to intervene quickly when
  that failure mode recurs at larger scale.
interview: >-
  When asked how to prevent a shared database from becoming a single point of
  contention under load, discuss splitting hot datasets into isolated stores and
  building dedicated incident-response tooling ahead of time, not during the
  outage.
source: 'https://status.circleci.com/incidents/8rklh3qqckp1'
sourceLabel: CircleCI Status
source_quote: >-
  In July we had a similar issue with increasing load on the DB turning into
  queued operations to the point of a catastrophic failure.
archive_url: ''
date_added: '2026-07-04'
last_verified: '2026-07-04'
verified: false
---
