---
id: github-2026-network-fabric-outage
company: GitHub
title: Data Center Network Fabric Loss Degrades GitHub Services
year: 2026
date: '2026-07-24'
duration: 1h 32m
classes:
  - cascade
  - resource-exhaustion
patterns:
  - network-path-loss
  - capacity-saturation
  - single-az-blast-radius
  - spare-capacity-mitigation
  - multi-service-degradation
impact: >-
  GitHub Actions, Issues, Pull Requests, Copilot, Pages, and API Requests were
  degraded globally for about 90 minutes, with up to 27% of Issues interactions
  timing out and 10% of Actions jobs failing.
trigger: >-
  Network links between one compute cage's spine switches and the aggregation
  layer failed within a single data center availability zone.
mechanism: >-
  The lost links pushed traffic onto the remaining active paths in that AZ's
  leaf-spine fabric, which became saturated and started dropping packets;
  workloads running on compute in the affected cage then experienced
  intermittent errors and timeouts, rippling out to Actions, Issues, Copilot,
  Pull Requests, Pages, and authentication before engineers rerouted traffic
  onto reserve fiber paths originally set aside for future capacity upgrades.
lesson: >-
  Keep spare network capacity provisioned ahead of need, not just for growth
  headroom — it becomes an emergency reroute path when part of the fabric
  saturates.
interview: >-
  When asked about resilient data center network design, discuss leaf-spine
  fabric redundancy, why losing one aggregation link can saturate remaining
  paths, and how pre-allocated spare capacity enables fast failover.
source: 'https://www.githubstatus.com/incidents/yjysg0xrl67m'
sourceLabel: GitHub Status incident report
source_quote: >-
  This resulted in packet loss due to the remaining active paths becoming
  saturated.
archive_url: ''
date_added: '2026-08-01'
last_verified: '2026-08-01'
verified: false
---
