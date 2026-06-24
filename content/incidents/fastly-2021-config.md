---
id: fastly-2021-config
company: Fastly
title: "One customer's config, the whole CDN down"
year: 2021
date: "2021-06-08"
duration: "~1h"
classes:
  - config-change
  - bad-deploy
patterns:
  - latent-bug
  - customer-triggered
  - global-blast-radius
impact: "85% of Fastly's network returned errors within a minute — gov.uk, Reddit, Amazon and major news sites went down together."
trigger: "A valid customer configuration change tripped a latent bug that had been introduced in an earlier software deployment."
mechanism: "The dormant bug only woke when a particular, entirely legitimate customer setting hit it — at which point most of the global network began failing simultaneously."
lesson: "A latent bug can sit quiet until ordinary input you don't control wakes it. That input is part of your test matrix."
interview: "Talk about latent bugs surfaced by input, and why you fuzz/replay real customer configs in staging."
source: "https://www.fastly.com/blog/summary-of-june-8-outage"
sourceLabel: "Fastly blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
