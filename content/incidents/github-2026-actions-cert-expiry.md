---
id: github-2026-actions-cert-expiry
company: GitHub
title: Expired Certificate Cuts Off Actions Runners
year: 2026
date: '2026-07-19'
duration: 4h 50m
classes:
  - dependency
  - cascade
  - thundering-herd
patterns:
  - certificate-expiration
  - reconnect-storm
  - no-fallback-expiry-monitoring
  - cascading-service-impact
  - runner-connectivity-loss
impact: >-
  Self-hosted and larger GitHub Actions runners worldwide lost connectivity for
  nearly five hours, delaying or failing workflow jobs, while a surge of
  reconnection traffic degraded Issues, API Requests, and Pages for GitHub.com
  and GHEC DR stamps.
trigger: >-
  An SSL certificate on a subset of internal GitHub services expired due to a
  failure in certificate lifecycle management.
mechanism: >-
  The expired certificate broke the connection path used by self-hosted and
  larger Actions runners, so new jobs stalled waiting to acquire a runner and
  in-progress runs failed; as runners kept retrying their connections, the
  resulting reconnection traffic overloaded GitHub's internal APIs, adding 3-4
  seconds of latency and elevated 5xx errors that spilled over into Issues, API
  Requests, and Pages before engineers rotated the certificate and worked
  through the backlog.
lesson: >-
  Certificate renewal should be backed by independent expiry monitoring and
  alerting so a single missed automated rotation can't silently take down a
  critical connectivity path, and reconnect logic needs circuit breakers to stop
  retry storms from cascading into shared APIs.
interview: >-
  When asked about designing a resilient fleet of distributed workers that
  authenticate over TLS, discuss automated certificate rotation with independent
  expiry alerting and circuit-breaker protections to prevent mass-reconnect
  storms from overwhelming shared backend APIs.
source: 'https://www.githubstatus.com/incidents/8vfyvq16hzh9'
sourceLabel: GitHub Status
source_quote: >-
  The incident was caused by a certificate lifecycle management failure in a
  subset of internal services, resulting in an SSL certificate expiration that
  disrupted runner connectivity.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
