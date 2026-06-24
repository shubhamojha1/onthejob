---
id: knight-2012-powerpeg
company: Knight Capital
title: "$440M in 45 minutes"
year: 2012
date: "2012-08-01"
duration: "45 min"
classes:
  - bad-deploy
  - automation-misfire
patterns:
  - partial-deploy
  - reused-flag
  - dead-code
  - no-kill-switch
impact: "A runaway trading algorithm lost roughly $460M in 45 minutes and effectively ended the firm."
trigger: "New SEC-mandated code was deployed to 8 servers — but one server didn't get the update. A repurposed feature flag reactivated 8-year-old dead code (\"Power Peg\") on that machine."
mechanism: "The revived code began firing millions of unintended orders into the market. With no kill switch and ambiguous alerting, it ran unchecked for ~45 minutes before anyone could stop it."
lesson: "Incomplete deploys are landmines. Don't reuse flags, delete dead code, and keep a tested kill switch for anything that touches money."
interview: "Deployment safety and idempotency: detect partial rollouts; never let one un-updated node run divergent logic."
source: "https://www.sec.gov/litigation/admin/2013/34-70694.pdf"
sourceLabel: "SEC order (34-70694)"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
