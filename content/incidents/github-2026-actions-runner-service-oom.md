---
id: github-2026-actions-runner-service-oom
company: GitHub
title: 'Under-provisioned Actions service OOMs, stalls one site'
year: 2026
date: '2026-07-29'
duration: 37 min
classes:
  - resource-exhaustion
  - cascade
patterns:
  - synchronous-dependency-blocking
  - single-site-capacity-limit
  - no-autoscaling
  - memory-exhaustion
impact: >-
  GitHub Actions customers routed through one infrastructure site saw REST API
  timeouts, runner registration failures, and delayed workflow starts, affecting
  roughly 2% of workflows globally.
trigger: >-
  A spike in load hit an internal runner-administration service that had
  insufficient memory capacity provisioned in a single infrastructure site.
mechanism: >-
  The under-provisioned service's instances exhausted memory and stopped
  responding; because Actions API requests block synchronously on that service,
  every request routed through the affected site queued up and timed out,
  delaying runner registration and workflow starts for the subset of traffic
  served by that site while other sites remained healthy.
lesson: >-
  Any service on a synchronous request path needs proactive memory-saturation
  alerting and horizontal autoscaling, not just reactive manual scale-out, since
  a single under-capacity dependency can stall an entire regional slice of
  traffic.
interview: >-
  When asked to design a globally distributed job-scheduling API, discuss how
  synchronous dependencies on a per-site backing service create localized single
  points of failure and why autoscaling plus memory alerting on those backing
  services matters.
source: 'https://www.githubstatus.com/incidents/75g5xmzptjqb'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was caused by an under-provisioned internal Actions service in that site:
  under increased load its instances ran out of memory and became unresponsive,
  and because Actions API requests wait synchronously on that service, requests
  routed through the affected site stalled and timed out.
archive_url: ''
date_added: '2026-08-01'
last_verified: '2026-08-01'
verified: false
---
