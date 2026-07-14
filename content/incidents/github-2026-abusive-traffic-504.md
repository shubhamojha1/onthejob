---
id: github-2026-abusive-traffic-504
company: GitHub
title: Public endpoints overwhelmed by abusive traffic
year: 2026
date: '2026-06-08'
duration: ~2 hours
classes:
  - thundering-herd
patterns:
  - undetected-traffic-surge
  - shared-resource-contention
  - request-queueing-cascade
  - manual-blocking-required
impact: >-
  Signed-out users experienced 504 errors (peaking at 34% error rate) for pull
  requests, issues, and releases across GitHub.com for two hours; authenticated
  users were unaffected.
trigger: >-
  A significant surge in abusive traffic targeting specific GitHub.com endpoints
  used by unauthenticated users.
mechanism: >-
  Abusive traffic to public endpoints overwhelmed request processing capacity,
  causing legitimate requests to queue beyond timeout thresholds and return
  gateway timeout errors, degrading service availability for signed-out users
  across multiple GitHub services.
lesson: >-
  Isolate unauthenticated traffic to separate backend resources or rate-limit
  public endpoints independently to prevent malicious traffic surges from
  degrading service for authenticated users.
interview: >-
  How would you architect public and private request paths to ensure that a
  traffic surge targeting public endpoints cannot degrade service for
  authenticated users?
source: 'https://www.githubstatus.com/incidents/m7n7sm0sr1pz'
sourceLabel: GitHub Status Page
source_quote: >-
  This degraded our ability to respond to unauthenticated requests, causing
  requests to queue beyond timeout thresholds and return gateway timeout errors.
archive_url: ''
date_added: '2026-07-14'
last_verified: '2026-07-14'
verified: false
---
