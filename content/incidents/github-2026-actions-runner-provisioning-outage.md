---
id: github-2026-actions-runner-provisioning-outage
company: GitHub
title: Backend data service outage delays Actions runners
year: 2026
date: '2026-07-09'
duration: ~10 h
classes:
  - dependency
  - cascade
patterns:
  - backlog-buildup
  - cascading-impact-across-services
  - concurrency-limit-exhaustion
  - shared-provisioning-single-point-of-failure
  - slow-multi-stage-mitigation
impact: >-
  Global, hours-long degradation of GitHub Actions hosted runners, GitHub Pages
  builds, Copilot Cloud Agent, and Copilot Code Review, peaking with roughly 96%
  of Actions runs failing to start during a 20-minute window.
trigger: >-
  A backend data service responsible for provisioning GitHub-hosted Actions
  runners entered an unhealthy state.
mechanism: >-
  The unhealthy provisioning data service blocked runner acquisition for a
  subset of workloads, causing run starts to delay and then fail as retries were
  exhausted; as the backend degraded further the failure rate climbed toward
  total, some customers exceeded their hosted compute concurrency limits, and
  the impact spread to Pages builds, Copilot Cloud Agent, and Copilot Code
  Review before the underlying data replication system was repaired and the
  accumulated job backlog drained.
lesson: >-
  A provisioning layer that gates access to shared compute is a single point of
  failure for every product built on top of it, so its own health and data
  replication resiliency need the same investment as the compute pool itself.
interview: >-
  When asked to design a runner or job-provisioning system for shared compute,
  discuss how to prevent a degraded provisioning backend from cascading into
  concurrency exhaustion and cross-product backlog buildup.
source: 'https://www.githubstatus.com/incidents/cstx3v63mklm'
sourceLabel: GitHub Status incident report
source_quote: >-
  The incident was caused by an unhealthy state in a backend data service
  responsible for provisioning hosted runners, preventing runner acquisition for
  a subset of workloads.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
