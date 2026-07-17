---
id: github-2026-pr-thread-int-overflow
company: GitHub
title: 32-bit ID Overflow Breaks PR Threads
year: 2026
date: '2026-05-06'
duration: 3h 50m
classes:
  - resource-exhaustion
  - bad-deploy
patterns:
  - partial-schema-migration
  - integer-overflow
  - inconsistent-schema-across-tables
  - missing-capacity-monitoring
  - multi-shard-schema-rollout
impact: >-
  For nearly 4 hours, creation of new pull request review threads (including
  line and file comments) failed at a near-100% rate across GitHub.com, while
  existing PRs, previously created comments, top-level PR comments, merges, and
  Actions remained functional.
trigger: >-
  A 32-bit integer primary key in a Vitess lookup table used during PR review
  thread creation reached its maximum value.
mechanism: >-
  GitHub had migrated the primary PR-thread table to a 64-bit integer key, but a
  dependent Vitess lookup table used in the thread-creation path was left on a
  32-bit key; once IDs generated from the upgraded primary table exceeded the
  lookup table's 32-bit capacity, every new thread-creation write began failing,
  and full recovery required rolling out a schema change to widen the lookup
  table's key across all shards.
lesson: >-
  When widening a primary key's integer type, inventory and migrate every
  dependent lookup or index table in the same change — a single table left on
  the old width can silently cap your ID space long after the source table
  appears fully upgraded.
interview: >-
  When asked about scaling primary keys, discuss how to audit all dependent
  tables (not just the primary) for key-width consistency and how to monitor
  column value ranges against their type limits to catch exhaustion before it
  causes write failures.
source: 'https://www.githubstatus.com/incidents/f5pb5d5mr9yh'
sourceLabel: GitHub Status incident report
source_quote: >-
  This incident was caused by a 32-bit integer key reaching its maximum value in
  a Vitess lookup table used during PR thread creation.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
