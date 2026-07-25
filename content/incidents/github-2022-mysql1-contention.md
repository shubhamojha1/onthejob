---
id: github-2022-mysql1-contention
company: GitHub
title: Repeated MySQL Cluster Overload Triggers Four GitHub Outages
year: 2022
date: '2022-03-16'
duration: '4 incidents over 8 days, 2h28m–5h36m each'
classes:
  - resource-exhaustion
  - cascade
  - dependency
patterns:
  - shared-database-single-point-of-failure
  - connection-pool-saturation-at-peak
  - proactive-failover-backfires
  - recurring-incident-same-root-cause
  - mitigation-via-traffic-throttling
impact: >-
  Over an 8-day span GitHub suffered four separate outages (totaling over 13
  hours) in which write operations across git, webhooks, pull requests, API
  requests, Issues, Packages, Codespaces, Actions, and Pages were degraded or
  unavailable platform-wide.
trigger: >-
  Peak-hour traffic on the shared mysql1 database cluster drove the database
  proxy layer to its maximum connection limit.
mechanism: >-
  Heavy read/write load on a single shared primary-replica MySQL cluster
  combined with slow-performing queries exhausted the proxy's connection pool,
  blocking all writes; the team recovered by failing over to a healthy replica,
  but the next day's pre-emptive failover (meant to avoid a repeat) introduced a
  new connectivity fault on the newly promoted primary, and the same load
  pattern recurred twice more in the following days, eventually requiring
  webhook traffic to be throttled as a stopgap.
lesson: >-
  A single shared database cluster serving many services is a systemic
  bottleneck that ad hoc failovers can only patch temporarily — durable
  resilience requires sharding, load isolation, and profiling query performance
  under real peak conditions before the next surge.
interview: >-
  When asked how to scale a primary-replica database serving many services,
  discuss connection-pool limits under peak load, safe failover procedures, and
  why sharding beats repeated manual failovers as a long-term fix.
source: 'https://github.blog/2022-03-23-an-update-on-recent-service-disruptions/'
sourceLabel: GitHub Blog
source_quote: >-
  At this time, GitHub saw an increased load during peak hours on our mysql1
  database, causing our database proxying technology to reach its maximum number
  of connections.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
