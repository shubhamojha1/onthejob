---
id: github-2018-splitbrain
company: GitHub
title: "43 seconds that cost 24 hours"
year: 2018
date: "2018-10-21"
duration: "24h 11m"
classes:
  - split-brain
  - automation-misfire
patterns:
  - automated-failover
  - cross-region
  - async-replication
impact: "A day of stale, read-only metadata; webhooks and Pages builds frozen; manual write reconciliation afterward."
trigger: "A 43-second network partition between the US-East hub and the primary data center during optical-equipment maintenance."
mechanism: "Orchestrator (Raft-based MySQL failover) promoted West-Coast primaries. When the link healed, East and West had each accepted writes the other lacked — divergence. Cross-country latency then made the app unusable."
lesson: "Automated failover that reacts faster than your network heals can manufacture split-brain. Tune failover to application topology, not just node liveness."
interview: "The canonical CAP-in-practice story: consistency vs availability under partition, plus async-replication data-loss risk."
source: "https://github.blog/news-insights/company-news/oct21-post-incident-analysis/"
sourceLabel: "The GitHub Blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: true
---
