---
id: cloudflare-2025-tenant-api-thundering-herd
company: Cloudflare
title: Dashboard bug overwhelmed auth API for 75 minutes
year: 2025
date: '2025-09-12'
duration: ~1 h 15 min (two impact windows)
classes:
  - thundering-herd
  - cascade
patterns:
  - react-dependency-array-bug
  - authorization-service-shared-fate
  - thundering-herd-on-restart
  - bad-patch-during-incident
  - missing-staged-rollout
impact: >-
  Cloudflare's dashboard was fully unavailable and its APIs experienced two
  separate periods of severe degradation for roughly 75 minutes, affecting all
  customers attempting to make configuration changes.
trigger: >-
  A dashboard release containing a React useEffect bug — an object in the
  dependency array was recreated on every render, causing the hook to fire an
  API call on every state change rather than once — was deployed hours before a
  Tenant Service update, and the two changes combined to overwhelm the Tenant
  Service at 17:57 UTC.
mechanism: >-
  The dashboard's runaway useEffect generated a flood of calls to the Tenant
  Service → a simultaneous Tenant Service deployment pushed it past capacity →
  because the Tenant Service gates authorization for all API requests, its
  failure caused all APIs to return 5xx errors and the dashboard to go dark; a
  rushed patch at 18:58 introduced a regression causing a second outage before a
  full revert at 19:12 restored service.
lesson: >-
  Services sitting in the critical authorization path for all API requests need
  staged rollouts with automatic rollback and substantial capacity headroom — a
  single client-side loop bug can generate enough traffic to collapse
  authentication for an entire platform.
interview: >-
  How would you design a client-side data-fetching layer to ensure a runaway
  effect or retry loop cannot saturate a shared backend service that sits in the
  critical path of authorization?
source: >-
  https://blog.cloudflare.com/deep-dive-into-cloudflares-sept-12-dashboard-and-api-outage/
sourceLabel: Cloudflare Blog
source_quote: >-
  Because this object was recreated on every state or prop change, React treated
  it as "always new," causing the useEffect to re-run each time.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
