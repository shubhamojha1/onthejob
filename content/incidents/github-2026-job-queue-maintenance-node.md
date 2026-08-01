---
id: github-2026-job-queue-maintenance-node
company: GitHub
title: Stuck maintenance node backs up GitHub's job queue
year: 2026
date: '2026-07-23'
duration: 2 h 31 min
classes:
  - automation-misfire
  - cascade
  - dependency
patterns:
  - unverified-host-rejoin
  - queue-backlog-cascade
  - shared-job-queue-spof
  - silent-node-degradation
  - multi-service-fanout
impact: >-
  A ~2.5 hour incident degraded Actions, Issues, Pull Requests, Webhooks, and
  several other GitHub services, delaying 8% of Actions workflow runs by roughly
  10 minutes and pushing 5% of webhook deliveries past SLO.
trigger: >-
  A node in GitHub's background job processing system failed to properly rejoin
  the cluster after undergoing scheduled host maintenance.
mechanism: >-
  The maintained node came back in an unhealthy state that automation didn't
  detect, leaving its shard serving jobs incorrectly; work destined for that
  shard piled up into a backlog, and because many core services depend on the
  shared job queue, the backlog manifested as rising latency across Actions,
  Issues, Pull Requests, Webhooks, and related features until engineers found
  the bad shard, restored it, and let the backlog drain.
lesson: >-
  Automation that reboots or maintains cluster nodes must positively verify the
  node has rejoined in a healthy state before marking the operation complete,
  since a silently degraded node in a shared queue can quietly accumulate
  backlog that later fans out into a multi-service incident.
interview: >-
  When designing a sharded background job processing system, discuss how to
  detect a shard whose owning node is unhealthy after a maintenance operation
  and how to quarantine it before its backlog impacts every downstream service.
source: 'https://www.githubstatus.com/incidents/zq3c1jst2vkq'
sourceLabel: GitHub Status incident report
source_quote: >-
  The root cause of the incident was a node of our background job processing
  system which did not recover after entering scheduled host maintenance.
archive_url: ''
date_added: '2026-08-01'
last_verified: '2026-08-01'
verified: false
---
