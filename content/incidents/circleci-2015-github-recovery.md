---
id: circleci-github-recovery
company: CircleCI
title: "When GitHub came back, the queue fell over"
year: 2015
date: "2015-01-01"
duration: "hours"
classes:
  - thundering-herd
  - resource-exhaustion
patterns:
  - recovery-surge
  - queue-collapse
  - upstream-recovery
impact: "Build throughput collapsed to roughly one transaction per minute; the backlog couldn't drain."
trigger: "GitHub recovered from its own outage, and all the backed-up webhooks and builds hit CircleCI at once."
mechanism: "The recovery surge pushed CircleCI's queue subsystem into a pathological slow state. With throughput near zero, the flood of queued work had nowhere to go."
lesson: "Recovery is a traffic event. The herd that hits you when an upstream comes back can be worse than its going down."
interview: "Designing for upstream-recovery surges: backpressure, rate limits, and draining strategies."
source: "https://circleci.statuspage.io/incidents/hr0mm9xmm3x6"
sourceLabel: "CircleCI status"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
