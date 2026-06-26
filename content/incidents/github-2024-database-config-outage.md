---
id: github-2024-database-config-outage
company: GitHub
title: Config change silenced database health checks for 36 minutes
year: 2024
date: '2024-08-14'
duration: 36 min
classes:
  - config-change
  - automation-misfire
patterns:
  - health-check-misconfiguration
  - no-staged-config-rollout
  - slow-manual-rollback
  - routing-layer-over-trust
impact: >-
  All GitHub.com services were fully inaccessible for all users worldwide for 36
  minutes on the evening of August 14, 2024.
trigger: >-
  An erroneous configuration change pushed to GitHub.com databases at 22:59 UTC
  caused the databases to stop responding to health check pings from the routing
  service.
mechanism: >-
  The bad config caused database hosts to fail health checks → the routing
  service automatically marked them unhealthy → the production read-only
  database endpoint was removed from the pool → the application lost access to
  critical data for read operations → all GitHub.com services went down at 23:02
  UTC; recovery required manually reverting the config change.
lesson: >-
  Database configuration changes need staged rollout and automated fast-rollback
  — a single bad config push that breaks health check responses can cause the
  routing layer to simultaneously drop all database hosts, producing a total
  outage with no code change involved.
interview: >-
  How would you design a database configuration change pipeline so that a single
  erroneous push cannot simultaneously make all hosts appear unhealthy to the
  routing layer?
source: >-
  https://github.blog/news-insights/company-news/github-availability-report-august-2024/
sourceLabel: GitHub Blog — Availability Report August 2024
source_quote: >-
  an erroneous configuration change rolled out to GitHub.com databases that
  impacted the ability of the database to respond to health check pings from the
  routing service
archive_url: ''
date_added: '2026-06-26'
last_verified: '2026-06-26'
verified: false
---
