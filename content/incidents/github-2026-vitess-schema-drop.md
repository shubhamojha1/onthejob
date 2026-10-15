---
id: github-2026-vitess-schema-drop
company: GitHub
title: Vitess backfill cancellation drops Pull Requests table
year: 2026
date: '2026-07-24'
duration: 45 min
classes:
  - automation-misfire
  - data-loss
patterns:
  - unsafe-cancellation-codepath
  - schema-change-without-staging
  - missing-preflight-validation
  - insufficient-lower-env-testing
  - silent-destructive-cleanup
impact: >-
  For 45 minutes, pull request creation failed for over 50,000 GitHub users
  across roughly 114,000 attempts, with error rates up to 2.25%, while existing
  PRs and other GitHub features remained unaffected.
trigger: >-
  A backfill workflow migrating Pull Request data into a Vitess keyspace was
  canceled after encountering errors and rising replication lag.
mechanism: >-
  The cancellation triggered a Vitess codepath that engineers hadn't fully
  understood, which dropped the backing table in the target keyspace instead of
  cleanly aborting; the leftover vschema reference pointed to a now-nonexistent
  table, causing pull request creation requests to fail until GitHub manually
  dropped the stale vschema reference.
lesson: >-
  Cancellation and rollback paths in schema-migration tooling need the same
  scrutiny as the forward migration itself, since a canceled operation can be
  more destructive than the change it was undoing.
interview: >-
  When asked about safe schema migrations, discuss why cancel/abort codepaths in
  migration tooling must be tested as rigorously as the forward path, and how
  vschema/backfill validation can prevent unintended table drops.
source: 'https://www.githubstatus.com/incidents/jxd617hfwfq8'
sourceLabel: GitHub Status
source_quote: >-
  The cancellation executed a misunderstood Vitess codepath that dropped the
  backing table to the target keyspace, leaving a non-existent reference that
  resulted in errors creating Pull Requests.
archive_url: ''
date_added: '2026-08-01'
last_verified: '2026-08-01'
verified: false
---
