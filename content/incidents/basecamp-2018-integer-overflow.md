---
id: basecamp-2018-integer-overflow
company: Basecamp
title: Basecamp 3 goes read-only after ID column overflow
year: 2018
date: '2018-11-08'
duration: ~5 h
classes:
  - resource-exhaustion
  - thundering-herd
patterns:
  - unbounded-id-space
  - ignored-framework-default-change
  - large-table-live-migration
  - cache-stampede-on-recovery
  - multi-datacenter-verification-delay
impact: >-
  Basecamp 3 was forced into read-only mode for nearly five hours, blocking all
  writes across the product for its full customer base, with a brief second
  outage on recovery when a caching server was overwhelmed.
trigger: >-
  A primary key column on a heavily-used tracking table exhausted the 32-bit
  signed integer range (2,147,483,647), causing inserts to fail.
mechanism: >-
  The column had been left as a standard integer instead of a bigint, a gap the
  team hadn't closed even after their own framework changed its default two
  years earlier; once the counter maxed out, writes to that table failed and the
  app was flipped to read-only; fixing it required migrating the column type to
  bigint on a very large production table, an operation estimated at over an
  hour and a half; after the migration completed, the team had to verify data
  integrity across eight databases split between two datacenters before
  reopening writes; the return of full traffic then overloaded a caching server,
  forcing a second short outage while traffic was rerouted to backup caches.
lesson: >-
  Treat framework-level default changes (like Rails' switch to bigint primary
  keys) as signals to audit existing schemas, not just new tables — silent
  numeric ceilings on high-write tables are a slow-motion outage waiting for a
  deploy date.
interview: >-
  When asked about designing for long-lived, high-write database tables, discuss
  proactively sizing primary key types and monitoring ID-space headroom instead
  of discovering exhaustion in production.
source: >-
  https://web.archive.org/web/20220530044506/https://m.signalvnoise.com/update-on-basecamp-3-being-stuck-in-read-only-as-of-nov-8-922am-cst/
sourceLabel: Signal v. Noise (Basecamp blog)
source_quote: >-
  This was because the column in database was configured as an integer rather
  than a big integer.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
