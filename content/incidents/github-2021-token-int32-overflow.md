---
id: github-2021-token-int32-overflow
company: GitHub
title: Scoped token foreign key hits INT32 ceiling
year: 2021
date: '2021-05-16'
duration: 9 h 48 min
classes:
  - resource-exhaustion
  - cascade
patterns:
  - int32-key-exhaustion
  - legacy-column-missed-by-linting
  - live-schema-widening
  - stale-cache-invalidation-lag
  - partial-authz-bypass
impact: >-
  A single database column overflow degraded GitHub Actions and GitHub Pages
  with high failure rates for nearly 10 hours, disrupted API calls and git
  push/pull using scoped tokens, and briefly granted one GitHub Action in one
  repository unintended access.
trigger: >-
  A foreign key column tied to scoped tokens grew past the maximum value
  representable by a 32-bit integer.
mechanism: >-
  The scoped-token foreign key silently exceeded INT32 capacity, corrupting
  token-to-resource associations and causing widespread failures across services
  that depend on scoped tokens — Actions, Pages, the API, and low-level git
  operations. Engineers ran a long, live schema migration to widen the column to
  INT64, but recovery wasn't immediate: a large set of now-invalid token records
  remained in the cache layer, so failures persisted until those stale entries
  were purged and fresh tokens could populate the cache correctly.
lesson: >-
  Automated overflow linting only protects columns created after the linting
  existed — legacy schema needs a manual audit for undersized integer key types,
  since a single missed INT32 column can take down multiple dependent services
  at once.
interview: >-
  When asked how you'd scale a relational schema's key space under sustained
  write growth, discuss proactively auditing legacy tables for INT32 exhaustion
  risk and designing zero-downtime strategies to widen primary/foreign key types
  before they overflow.
source: >-
  https://github.blog/news-insights/company-news/github-availability-report-may-2021/
sourceLabel: GitHub Availability Report (blog)
source_quote: >-
  This incident was caused when a foreign key for scoped tokens exceeded max
  INT32, which resulted in high failure rates for GitHub Actions and GitHub
  Pages.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
