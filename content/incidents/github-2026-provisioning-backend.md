---
id: github-2026-provisioning-backend
company: GitHub
title: Actions Provisioning Backend Outage
year: 2026
date: '2026-07-09'
duration: ~10 h
classes:
  - dependency
patterns:
  - unhealthy-dependency
  - retry-exhaustion
  - slow-escalation
  - cascading-backlog
  - slow-recovery
impact: >-
  GitHub Actions runs on hosted runners experienced start delays and failures
  affecting up to 30% of workflows; GitHub Pages and Copilot services were also
  temporarily affected for approximately 10 hours.
trigger: >-
  A backend data replication service responsible for runner provisioning entered
  an unhealthy state.
mechanism: >-
  The backend data replication service became unhealthy, preventing runner
  acquisition for new workflow jobs. Delayed jobs exhausted retries and failed;
  accumulated backlog of queued runs created load spikes that cascaded to Pages
  and Copilot services. Recovery required restoring the backend's health, which
  allowed provisioning to resume and the backlog to drain.
lesson: >-
  Critical provisioning backends need fast unhealthy-state detection and
  automatic isolation before cascading to customer services; recovery time
  amplifies when backlog drains under sustained load.
interview: >-
  Design a resilient runner provisioning system that detects and survives
  backend data service degradation without cascading failures to workflow
  scheduling.
source: 'https://www.githubstatus.com/incidents/cstx3v63mklm'
sourceLabel: GitHub Status Page
source_quote: >-
  The incident was caused by an unhealthy state in a backend data service
  responsible for provisioning hosted runners, preventing runner acquisition for
  a subset of workloads.
archive_url: ''
date_added: '2026-07-14'
last_verified: '2026-07-14'
verified: false
---
