---
id: github-2026-copilot-config-outage
company: GitHub
title: Bad Config Push Pulls Copilot's Chat Models Offline
year: 2026
date: '2026-06-17'
duration: 69 min
classes:
  - config-change
patterns:
  - unvalidated-config-push
  - no-staged-rollout
  - silent-picker-degradation
  - auto-recovery-on-revert
  - off-peak-timing-limited-blast-radius
impact: >-
  Across all regions, most of GitHub Copilot's frontier chat and agent models
  became unavailable or errored out for roughly 69 minutes; customers could
  still use Copilot via remaining available models, and the off-peak timing
  limited the number of affected users.
trigger: >-
  A configuration change was pushed to production and was subsequently deemed
  invalid by the serving system.
mechanism: >-
  The invalid configuration caused most frontier chat models to disappear from
  the model picker or return 'model not available' errors across web, editor,
  and CLI clients; engineers reverted the change, and the affected models
  automatically returned once the service reloaded the prior valid
  configuration.
lesson: >-
  Configuration pushes that control which models or features are live need the
  same gradual rollout, validation, and automatic rollback safeguards as code
  deploys, since a bad config can silently remove options from production just
  as effectively as a bad build.
interview: >-
  When asked about safe rollout strategies for multi-model AI services, discuss
  staged configuration rollouts, pre-push validation, and automatic rollback
  triggered by sudden drops in available-model counts.
source: 'https://www.githubstatus.com/incidents/rfmjwng33vjf'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was due to a configuration change that our production system deemed
  invalid.
archive_url: ''
date_added: '2026-07-13'
last_verified: '2026-07-13'
verified: false
---
