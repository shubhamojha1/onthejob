---
id: github-2020-proxysql-file-descriptor-exhaustion
company: GitHub
title: ProxySQL file descriptor limit silently capped by system process manager
year: 2020
date: '2020-02-19'
duration: 8h 14min total across 4 events (Feb 19–27)
classes:
  - resource-exhaustion
  - config-change
patterns:
  - silent-config-downgrade
  - connection-pool-overload
  - master-database-hotspot
  - read-replica-misrouting
  - no-realistic-load-testing
impact: >-
  GitHub.com experienced degraded service for a combined 8 hours 14 minutes
  across four events in late February 2020, with stalled writes on the mysql1
  cluster affecting all authentication and core services that depended on it.
trigger: >-
  An unexpectedly resource-intensive query was routed to the mysql1 master
  instead of the read replica pool, spiking load on ProxySQL beyond its
  effective connection limit — a limit far lower than the team realized.
mechanism: >-
  Four distinct events, each with a different proximate trigger, all converged
  on the same bottleneck: ProxySQL breaking under connection load because its
  file descriptor limit was silently reduced from 1,073,741,824 to 65,536 by
  the system process manager. Event 1 (Feb 19): resource-heavy query misrouted
  to master overloaded ProxySQL. Event 2 (Feb 20): planned master promotion
  caused unexpected load spike. Event 3 (Feb 25): connections crossed the
  65,536 ceiling and the silent capping was finally discovered. Event 4 (Feb
  27): application query changes spiked master load again before the fix was
  fully in place.
lesson: >-
  Your process manager may silently cap OS resource limits like LimitNOFILE to a
  value orders of magnitude below what you configured — always check the actual
  ulimits live in production processes, not just the config files.
interview: >-
  You find ProxySQL failing under load but your config sets LimitNOFILE to 1
  billion — where would you look to find what the actual running file descriptor
  limit is, and how would you reliably verify it won't silently change after a
  restart?
source: >-
  https://github.blog/news-insights/company-news/february-service-disruptions-post-incident-analysis/
sourceLabel: GitHub Blog
source_quote: >-
  Because of a system-level limit of 1048576, our process manager silently
  reduced our LimitNOFILE setting from 1073741824 to 65536.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
