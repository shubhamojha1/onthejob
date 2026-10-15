---
id: circleci-2019-mongodb-workflow-delays
company: CircleCI
title: MongoDB Lock Contention Stalls Workflows for Two Weeks
year: 2019
date: '2019-03-26'
duration: ~2 weeks (recurring incidents through Apr 10)
classes:
  - resource-exhaustion
  - cascade
  - dependency
patterns:
  - idempotent-assumed-free
  - connection-pool-misconfig
  - lock-contention
  - ticket-starvation
  - concurrent-change-confounding
impact: >-
  Recurring platform-wide instability across CircleCI's job/workflow queue and
  public API over more than two weeks, delaying builds for the entire customer
  base and causing API containers to crash with out-of-memory errors.
trigger: >-
  A MongoDB replica set backing CircleCI's build queue began exhibiting slow
  query response times on March 26, 2019.
mechanism: >-
  Every service instance re-declared all MongoDB indexes on startup, assuming
  the idempotent create-if-not-exists call was free; at fleet scale this
  repeatedly acquired database-level locks that starved WiredTiger's fixed pool
  of read/write concurrency 'tickets,' stalling queries. A concurrent, unrelated
  JVM minor-version upgrade shrank thread and connection pools fleet-wide, and
  memory pressure from failed cache evictions further degraded the primary,
  together producing recurring stalls that backed up job/workflow queues and
  crashed API containers under OOM conditions.
lesson: >-
  An operation that is logically idempotent (a no-op create-if-exists check) is
  not necessarily cheap — at fleet scale it can still acquire real locks and
  starve shared concurrency resources, so treat every database call issued on
  every instance boot as production load worth measuring.
interview: >-
  When asked to diagnose a cascading database slowdown with multiple
  simultaneous suspects, discuss how to isolate concurrent confounding changes
  (a JVM upgrade vs. a schema operation) and why low-level DB internals like
  lock wait time and concurrency-ticket saturation need dedicated observability
  rather than relying on application-level assumptions about op cost.
source: >-
  https://discuss.circleci.com/t/postmortem-march-26-april-10-workflow-delay-incidents/30060
sourceLabel: CircleCI Discuss postmortem
source_quote: >-
  It turned out that checking the index requires a database level lock which,
  while only held for a short period, can cause significant contention.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
