---
id: cloudflare-2019-regex
company: Cloudflare
title: "The regex that ate every CPU"
year: 2019
date: "2019-07-02"
duration: "27 min"
classes:
  - config-change
  - resource-exhaustion
patterns:
  - no-staged-rollout
  - removed-safeguard
  - global-blast-radius
impact: "Global 502s across ~10% of the web — Discord, Shopify, and Cloudflare's own dashboard went dark."
trigger: "A new WAF managed rule for XSS detection was pushed to every edge server worldwide in a single deploy."
mechanism: "The rule contained a regex with catastrophic backtracking. On every HTTP request it drove CPU to 100% across all edge cores at once. A CPU guard that would have caught it had been removed in an earlier refactor."
lesson: "Config changes need the same staged rollout as code. \"It's just a rule\" is how a global outage starts."
interview: "When asked about safe deploys, cite canary rollouts plus automatic CPU/latency circuit breakers on rule engines."
source: "https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/"
sourceLabel: "Cloudflare blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: true
---
