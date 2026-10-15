---
id: github-2012-pacemaker-split-brain
company: GitHub
title: Automated MySQL failover triggers cluster split-brain
year: 2012
date: '2012-09-10'
duration: 1h46m downtime + ~1h degraded (over 2 days)
classes:
  - split-brain
  - automation-misfire
  - cascade
patterns:
  - automated-failover-on-primary-db
  - health-check-flapping
  - cold-cache-after-failover
  - cluster-manager-segfault-partition
  - cross-datastore-id-drift
impact: >-
  GitHub.com suffered two outages in one week — 1h46m of full downtime plus
  about an hour of degraded performance — and 16 private repositories were
  briefly exposed to unauthorized users for seven minutes during a database
  split-brain.
trigger: >-
  A routine, previously-safe zero-downtime schema migration generated unusually
  high database load, causing the cluster manager's health checks against the
  active MySQL node to fail.
mechanism: >-
  Failed health checks triggered an automatic failover to a standby node with a
  cold InnoDB buffer pool, which performed so poorly it failed its own health
  check and failed back, prompting engineers to disable all health checks; that
  disabled state silently blocked the standby from re-establishing replication,
  and the next day, disabling maintenance mode caused the cluster manager to
  segfault and split into two partitions that each independently elected a
  master, one of which was a node with stale data — engineers powered that node
  off to stop the split, taking down all database access and leaving some
  records with mismatched IDs across MySQL and Redis, which briefly misrouted
  private repos to the wrong users.
lesson: >-
  Fully automated failover on a stateful primary database can be more dangerous
  than the outage it's meant to prevent — for systems where consistency matters
  more than uptime, keep a human in the loop before promoting a new master.
interview: >-
  When asked about database high-availability design, discuss why automated
  failover on a primary datastore trades split-brain and data-drift risk for
  faster recovery, and when a human approval gate is the safer default.
source: 'https://github.blog/news-insights/the-library/github-availability-this-week/'
sourceLabel: GitHub blog
source_quote: >-
  The automated failover of our main production database could be described as
  the root cause of both of these downtime events.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
