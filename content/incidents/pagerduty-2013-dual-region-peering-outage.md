---
id: pagerduty-2013-dual-region-peering-outage
company: PagerDuty
title: Dual AWS region outage takes down notification dispatch
year: 2013
date: '2013-04-13'
duration: 18 min
classes:
  - dependency
  - split-brain
patterns:
  - shared-failure-domain
  - quorum-loss
  - hidden-topology-assumption
impact: >-
  Notification dispatch was completely down for 18 minutes after two of
  PagerDuty's three datacenters failed simultaneously; the events-ingestion API
  stayed up throughout.
trigger: >-
  A peering point shared by two AWS regions PagerDuty treated as independent
  datacenters degraded, taking both regions offline at once.
mechanism: >-
  PagerDuty had designed for a single datacenter failure across three sites, but
  two of the three secretly shared a network peering point; when it degraded,
  both went down together, the dispatch cluster couldn't reach quorum under the
  resulting latency, and a coordinator misconfiguration slowed recovery further.
lesson: >-
  Redundancy plans must verify physical and network independence between
  supposedly separate failure domains, not just assume it from provider region
  boundaries.
interview: >-
  When asked to design a highly-available multi-region system, discuss how to
  verify true failure-domain independence between regions rather than trusting
  provider abstractions.
source: >-
  https://web.archive.org/web/20211019062735/https://www.pagerduty.com/blog/outage-post-mortem-april-13-2013/
sourceLabel: PagerDuty blog (archived)
source_quote: >-
  However, we have since learned that two of the datacenters shared a common
  peering point.
archive_url: ''
date_added: '2026-07-04'
last_verified: '2026-07-04'
verified: false
---
