---
id: incident-io-2025-aws-outage-cascade
company: incident.io
title: AWS us-east-1 outage cascaded through four hidden third-party dependencies
year: 2025
date: '2025-10-20'
duration: '~10h 30min (07:11–17:37 UTC, multiple services)'
classes:
  - dependency
  - cascade
patterns:
  - hidden-third-party-dependency
  - shared-queue-capacity
  - deployment-pipeline-dependency
  - dead-tuple-index-bloat
  - compounding-failures
impact: >-
  incident.io's on-call notifications were delayed for over two hours, SAML
  authentication was intermittently unavailable, Scribe's AI note-taker was
  offline for ~5 hours, and the deployment pipeline was blocked — all driven by
  AWS us-east-1 dependency propagation through their telecom provider, auth
  provider, transcription provider, and Docker Hub.
trigger: >-
  AWS us-east-1 experienced a major outage at 07:11 UTC, taking down the telecom
  provider incident.io relied on for SMS and phone call delivery of on-call
  notifications.
mechanism: >-
  Telecom provider failure → SMS/phone notification requests started timing out
  after retries → notifications shared queue capacity with Email, Slack, and
  push channels, so all delivery types backed up → team tried to deploy code
  fixes but their build pipeline implicitly depended on Docker Hub, which runs
  on AWS and was also down → deployment blocked; in parallel, the escalation
  worker's Postgres index filled with dead tuples from the burst of activity,
  making more workers counterproductive rather than helpful.
lesson: >-
  Third-party provider risk runs much deeper than your direct dependencies —
  audit not just which services you integrate with but which cloud provider each
  one runs on, and verify that your deployment pipeline itself has no implicit
  dependencies on the same failing infrastructure you need to fix.
interview: >-
  Design an on-call notification system that remains operable when both your
  telecom provider and your deployment pipeline are simultaneously unavailable —
  what redundancy and pre-baked fallback mechanisms would you build in?
source: 'https://incident.io/blog/service-disruption-october-20th-2025'
sourceLabel: incident.io Engineering Blog
source_quote: >-
  It was immediately clear the failing telecom requests, combined with our
  client retry mechanisms were resulting in notification jobs taking up to 30s
  to process.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
