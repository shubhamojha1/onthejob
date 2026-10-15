---
id: github-2021-mysql-schema-migration-deadlock
company: GitHub
title: MySQL Schema Migration Triggers Read Replica Deadlock
year: 2021
date: '2021-11-27'
duration: 2 h 50 min
classes:
  - cascade
  - resource-exhaustion
patterns:
  - cascading-replica-failure
  - crash-recovery-loop
  - unpartitioned-schema-migration
  - insufficient-capacity-buffer
  - availability-over-integrity-tradeoff
impact: >-
  A large-scale MySQL replica deadlock degraded core GitHub services including
  Actions, Codespaces, API Requests, Git Operations, Issues, Packages, Pages,
  Pull Requests, and Webhooks for nearly three hours.
trigger: >-
  The final rename step of a routine schema migration on a large MySQL table
  caused a significant portion of read replicas to enter a semaphore deadlock.
mechanism: >-
  Deadlocked replicas dropped into a crash-recovery state, shifting their
  traffic onto the remaining healthy replicas; the added load left too few
  functioning replicas to serve production reads, and replicas that briefly
  recovered would crash again under the redirected load, forming a
  self-sustaining failure loop until engineers pulled broken replicas from
  rotation and let them finish the migration in isolation.
lesson: >-
  Large schema migrations should be canaried on a single shard of a functionally
  partitioned cluster rather than run cluster-wide, and clusters should carry
  enough spare replica capacity to absorb a partial replica outage without
  cascading.
interview: >-
  When asked how to safely run schema changes on a large sharded database,
  discuss functional partitioning for canary migrations, replica
  over-provisioning, and prioritizing data integrity over availability when
  replicas enter a crash-recovery loop.
source: 'https://github.blog/2021-12-01-github-availability-report-november-2021/'
sourceLabel: GitHub Availability Report (blog)
source_quote: >-
  During the final step of this migration a significant portion of our MySQL
  read replicas entered a semaphore deadlock.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
