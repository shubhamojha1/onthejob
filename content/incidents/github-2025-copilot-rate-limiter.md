---
id: github-2025-copilot-rate-limiter
company: GitHub
title: "A feature flag blocked every Copilot request"
year: 2025
date: "2025-09-15"
duration: "25 min"
classes:
  - config-change
  - bad-deploy
patterns:
  - partial-deploy
  - missing-config-validation
  - global-blast-radius
impact: "Most GitHub Copilot features were degraded for 25 minutes, from 17:55 to 18:20 UTC, as the global rate limiter returned HTTP 403 responses for every request affected by the invalid configuration."
trigger: "A flag intended to reduce rate limiting for a subset of users was partially deployed to Copilot's global limiter, creating a configuration combination that preproduction tests had missed."
mechanism: "An edge case interpreted the intermediate flag state as an invalid global configuration. Instead of relaxing limits for the intended cohort, the shared control point rejected 100% of affected requests. Reverting the flag removed the bad state and produced immediate recovery."
lesson: "Treat feature flags as production deploys with a state space. Validate partial and mixed-version combinations, canary global control points, and stop on sudden authorization anomalies. GitHub added traffic-anomaly monitors and expanded rate-limit scaling tests for the missed edge case."
interview: "Design a safe global limiter: version configuration atomically, reject invalid states before activation, stage by traffic slice, monitor rejection ratios by reason code, and maintain a separately tested rollback path."
source: "https://github.blog/news-insights/company-news/github-availability-report-september-2025/"
sourceLabel: "GitHub availability report"
source_quote: "The flag triggered behavior that unintentionally limited 100% of requests."
archive_url: ""
date_added: "2026-08-08"
last_verified: "2026-08-08"
verified: true
---
