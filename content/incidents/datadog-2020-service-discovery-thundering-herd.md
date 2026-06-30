---
id: datadog-2020-service-discovery-thundering-herd
company: Datadog
title: Service discovery collapse took down all systems for 10 hours
year: 2020
date: '2020-09-24'
duration: ~10 h
classes:
  - thundering-herd
  - cascade
patterns:
  - uncached-nxdomain-amplification
  - control-plane-as-spof
  - hidden-coupling-through-migration
  - no-break-glass-automation
  - quorum-loss-from-overload
impact: >-
  The US region of Datadog was degraded for roughly 10 hours on September 24–25,
  2020, with the web tier hitting 60–90% error rates, leaving customers unable
  to reliably access dashboards, alerts, APM, or infrastructure monitoring.
trigger: >-
  A routine recycling of a small latency-measuring cluster caused its service
  discovery entries to disappear, prompting the intake cluster — which had been
  silently misconfigured a month earlier to use the local DNS resolver instead
  of a static file — to flood service discovery with non-cached NXDOMAIN queries
  at 10× normal volume within seconds.
mechanism: >-
  The NXDOMAIN flood overwhelmed the service discovery cluster, which lost
  quorum → once node-level DNS caches expired, every service across the platform
  joined a thundering herd hammering the same broken cluster → service discovery
  could no longer register services or answer queries → services failed to
  locate dependencies or load runtime config at startup → the web tier sustained
  60–90% error rates; recovery required manually isolating the cluster,
  controlling re-admission, and iteratively removing hard dependencies service
  by service.
lesson: >-
  Service discovery and configuration systems must serve stale data gracefully
  when overloaded rather than failing hard — any system that grapples for a
  central dependency at startup turns a localized failure into a platform-wide
  thundering herd.
interview: >-
  How would you design a service discovery system so that a thundering herd of
  reconnecting clients after an outage cannot cause the discovery cluster itself
  to lose quorum and extend the outage?
source: 'https://www.datadoghq.com/blog/2020-09-25-infrastructure-connectivity-issue/'
sourceLabel: Datadog Engineering Blog
source_quote: >-
  NXDOMAIN answers are not cached by the resolver to quickly propagate service
  deregistration throughout the infrastructure.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
