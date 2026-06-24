---
id: cloudflare-2022-backbone
company: Cloudflare
title: "A backbone change crushed 19 data centers"
year: 2022
date: "2022-06-21"
duration: "~1.5h"
classes:
  - config-change
  - bad-deploy
patterns:
  - routing-change
  - no-staged-rollout
impact: "19 of Cloudflare's busiest data centers dropped offline at once, hitting a large share of global traffic."
trigger: "A routing-policy change made during a long-running project to increase backbone resilience."
mechanism: "An incorrect change to how traffic was routed withdrew routes and concentrated load, taking the busiest sites down together — ironically, during resilience work."
lesson: "Network and routing changes deserve the same staged rollout and review as application code. The \"resilience project\" is itself a risk window."
interview: "Change management for network config; why infra changes need canaries too."
source: "https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/"
sourceLabel: "Cloudflare blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: true
---
