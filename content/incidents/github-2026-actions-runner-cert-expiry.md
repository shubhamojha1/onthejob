---
id: github-2026-actions-runner-cert-expiry
company: GitHub
title: Expired internal SSL cert breaks Actions runner connectivity
year: 2026
date: '2026-07-19'
duration: 4 h 50 min
classes:
  - dependency
  - thundering-herd
  - cascade
patterns:
  - cert-expiry-outage
  - reconnect-storm
  - cascading-latency-to-adjacent-services
  - insufficient-expiry-alerting
  - missing-retry-circuit-breaker
impact: >-
  Self-hosted and larger GitHub Actions runners worldwide could not connect for
  nearly 5 hours, delaying or failing workflow jobs, while the resulting
  reconnection surge briefly degraded API Requests, Issues, and Pages with added
  latency and elevated error rates.
trigger: >-
  An SSL certificate used by a subset of internal services responsible for
  runner connectivity expired because of a lapse in certificate lifecycle
  management.
mechanism: >-
  The expired certificate blocked self-hosted and larger runners from
  establishing connections to GitHub, causing queued and failing workflow jobs;
  as runners repeatedly retried connecting, the surge in reconnection traffic
  added several seconds of latency and elevated 5xx errors on GitHub's APIs,
  which in turn produced knock-on degradation in Issues and Pages before
  engineers rotated the certificate and the backlog drained.
lesson: >-
  Certificate expiration is a fully predictable failure mode, so renewal must be
  automated with independent expiry monitoring, and reconnect paths need circuit
  breakers so a recovering fleet of clients doesn't stampede shared APIs on its
  way back up.
interview: "Renew certificates automatically and alert before they expire. Slow reconnection attempts so one expiry does not overload shared APIs."
source: 'https://www.githubstatus.com/incidents/8vfyvq16hzh9'
sourceLabel: GitHub Status incident report
source_quote: >-
  The incident was caused by a certificate lifecycle management failure in a
  subset of internal services, resulting in an SSL certificate expiration that
  disrupted runner connectivity.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
