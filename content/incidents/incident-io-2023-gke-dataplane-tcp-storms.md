---
id: incident-io-2023-gke-dataplane-tcp-storms
company: incident.io
title: GKE Dataplane V2 CPU starvation from concurrent TCP storms
year: 2023
date: '2023-09-19'
duration: ~1 week
classes:
  - cascade
  - resource-exhaustion
patterns:
  - thundering-herd
  - runaway-query
  - infrastructure-migration-surprise
  - wrong-hypothesis-first
  - node-level-noisy-neighbor
impact: >-
  incident.io experienced intermittent Postgres and Memcache connection timeouts
  across production nodes for approximately one week following their migration
  to GKE, affecting API response reliability for all customers.
trigger: >-
  After migrating to GKE, the application's connection pool began opening
  hundreds of new TCP connections per second — a rate high enough to saturate
  GKE Dataplane V2's (anetd) connection-tracking CPU budget and drop packets
  node-wide.
mechanism: >-
  Post-migration connection pool churn (hundreds of new connections/s) → GKE
  Dataplane V2 (anetd) consumed 2–3 vCPUs per node on connection tracking →
  node-level CPU saturation dropped TCP packets → Postgres and Memcache
  connections on that node timed out simultaneously, mimicking unrelated
  failures; a separate runaway query (accidental duplicate joins to an external
  API) later amplified the churn and prevented the residual timeouts from
  resolving even after initial pool fixes.
lesson: >-
  After migrating to a new cloud platform, probe for hidden per-node networking
  behaviors (like Dataplane V2 CPU amplification on connection churn) before
  blaming application-layer connection pools — node-level packet drops can mimic
  dozens of unrelated app failures at once.
interview: >-
  When a distributed system shows simultaneous timeouts to unrelated backends
  (database and cache) on the same node but not others, what host-level and
  network-level signals would you examine to distinguish a bad deployment from a
  platform networking issue?
source: 'https://incident.io/blog/clouds-caches-and-connection-conundrums'
sourceLabel: incident.io Engineering Blog
source_quote: >-
  Thanks to an accidental database join, we'd been making thousands of duplicate
  network calls to an external third party.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
