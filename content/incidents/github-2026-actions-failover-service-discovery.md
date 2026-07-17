---
id: github-2026-actions-failover-service-discovery
company: GitHub
title: Actions Outage from Failed Service Discovery Update
year: 2026
date: '2026-05-15'
duration: ~65 min
classes:
  - automation-misfire
  - cascade
  - dependency
patterns:
  - failover-without-preflight-check
  - service-discovery-propagation-failure
  - downstream-cascading-failure
  - core-dependency-timeout-cascade
  - manual-intervention-required
impact: >-
  A roughly 65-minute degradation caused an estimated 42% of GitHub Actions
  workflow runs to fail or start late at peak, with downstream disruption
  spreading to GitHub Pages and Copilot cloud services including Coding Agent
  and Code Review Agent.
trigger: >-
  A planned failover of the infrastructure supporting GitHub Actions kicked off
  an automated service discovery update that failed to propagate correctly.
mechanism: >-
  The stalled service discovery update caused traffic to be routed to incorrect
  endpoints, driving up request timeouts against a core dependency used for
  workflow orchestration; as Actions runs failed or stalled, downstream
  consumers of Actions workflow execution such as Pages builds and Copilot cloud
  services began failing in turn, until engineers manually corrected the routing
  roughly 30 minutes after the incident began.
lesson: >-
  A failover operation should validate that its automated state changes, like
  service discovery propagation, have actually completed before the operation is
  treated as finished, rather than assuming success and moving on.
interview: >-
  When asked to design a safe infrastructure failover mechanism, discuss
  pre-flight and post-flight verification of shared state like service
  discovery, plus containment strategies to stop a single dependency's timeouts
  from cascading into unrelated downstream products.
source: 'https://www.githubstatus.com/incidents/ctf7nxpq5jzn'
sourceLabel: GitHub Status incident report
source_quote: >-
  During that operation, an automated service discovery update did not propagate
  correctly, which caused traffic to be routed incorrectly and increased request
  timeouts in a core dependency for workflow orchestration.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
