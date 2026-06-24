---
id: chef-2014-healthcheck
company: Chef
title: "Health checks too impatient to live"
year: 2014
date: "2014-07-10"
duration: "hours"
classes:
  - cascade
  - thundering-herd
patterns:
  - health-check-flapping
  - aggressive-timeout
impact: "The Supermarket community site crashed two hours after launch with intermittent unresponsiveness."
trigger: "Launch-day load caused intermittent latency spikes."
mechanism: "Health-check timeouts were set so low that a brief latency blip made healthy nodes look dead. They were pulled from rotation, concentrating load on the rest, causing more latency — a self-reinforcing removal spiral."
lesson: "Aggressive health checks turn a latency blip into an outage. Set timeouts comfortably above your real tail latency."
interview: "Why health-check thresholds must account for p99 latency, not just the mean."
source: "https://www.chef.io/blog/2014/07/10/supermarket-intermittent-unresponsiveness-postmortem"
sourceLabel: "Chef blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
