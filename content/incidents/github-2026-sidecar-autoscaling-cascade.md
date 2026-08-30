---
id: github-2026-sidecar-autoscaling-cascade
company: GitHub
title: Sidecar autoscaling failure cascades across GitHub
year: 2026
date: '2026-08-17'
duration: 7 h 47 min
classes:
  - resource-exhaustion
  - cascade
  - thundering-herd
patterns:
  - slow-autoscaling
  - retry-amplification
impact: >-
  During a worldwide disruption of GitHub's collaboration, automation, and
  authentication services, roughly one in five web or API requests failed at
  peak, along with about half of archive and raw-file downloads.
trigger: >-
  A new traffic peak saturated Central US load balancers after an Istio sidecar
  hit its concurrency limit and an autoscaling policy failed to react to the
  sidecar's capacity.
mechanism: >-
  Sidecar saturation spread until four HAProxy nodes exhausted their flow
  limits, slowing the shared authentication path and disrupting many GitHub
  services; optimistic gateway retries increased load, while a latent VS Code
  retry loop amplified Copilot token traffic by roughly tenfold and prolonged
  recovery.
lesson: >-
  Autoscaling and capacity monitoring must cover service-mesh sidecars and other
  infrastructure limits, while every retry path needs a bounded budget and
  backoff so recovery traffic cannot become a second outage.
interview: >-
  Scale on every constrained layer, not just the application process. Cap
  retries with budgets and backoff so partial failures do not multiply load.
source: 'https://www.githubstatus.com/incidents/zkxwbgr0cnmx'
sourceLabel: GitHub Status Page
source_quote: >-
  The immediate cause of the failure was network saturation on load balancers
  in Central US due to a new peak in traffic.
archive_url: ''
date_added: '2026-08-26'
last_verified: '2026-08-26'
verified: true
---
