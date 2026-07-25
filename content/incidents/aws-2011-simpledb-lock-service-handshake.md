---
id: aws-2011-simpledb-lock-service-handshake
company: Amazon Web Services
title: SimpleDB outage from lock service handshake storm
year: 2011
date: '2011-06-13'
duration: ~4 h 14 min
classes:
  - cascade
  - dependency
patterns:
  - synchronized-failure-detection
  - aggressive-timeout-self-eviction
  - circular-recovery-dependency
  - undersized-safety-margin
impact: >-
  Amazon SimpleDB in the US East Region was fully unavailable for nearly all API
  calls for two hours, with degraded CreateDomain/DeleteDomain performance for a
  further two-plus hours as recovery was throttled.
trigger: >-
  A power loss in a single data center took multiple SimpleDB storage nodes
  offline simultaneously.
mechanism: >-
  The simultaneous node loss forced the shared lock service to rapidly
  de-register many replicas at once, which spiked handshake latency; healthy
  storage and metadata nodes then breached an overly aggressive handshake
  timeout and voluntarily evicted themselves from the cluster, and because the
  metadata nodes needed to re-authorize storage nodes were themselves down from
  the same timeout issue, the cluster could not self-heal until engineers
  manually raised the timeout and restarted metadata nodes.
lesson: >-
  Aggressive failure-detection timeouts can turn a contained hardware failure
  into a full outage when the nodes that would recover the system are themselves
  subject to the same timeout and take themselves offline.
interview: >-
  When asked to design a distributed lock or coordination service, discuss how
  timeout tuning trades off fast failure detection against cascading
  self-eviction, and why recovery paths must not depend on the same component
  that is failing.
source: 'https://aws.amazon.com/message/65649/'
sourceLabel: AWS post-event summary
source_quote: >-
  This simultaneous volume resulted in elevated handshake latencies between
  healthy SimpleDB nodes and the lock service, and the nodes were not able to
  complete their handshakes prior to exceeding a set “handshake timeout” value.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
