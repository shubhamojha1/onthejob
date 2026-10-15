---
id: github-2026-copilot-invalid-config
company: GitHub
title: Invalid Config Push Drops Copilot's Chat Models
year: 2026
date: '2026-06-17'
duration: 69 min
classes:
  - config-change
patterns:
  - no-staged-rollout
  - insufficient-config-validation
  - no-drop-alerting
  - self-healing-on-revert
impact: >-
  Global degradation of GitHub Copilot's chat and agent models across web,
  editor, and CLI for roughly an hour, with most frontier models unavailable,
  though off-peak timing limited the number of customers affected.
trigger: >-
  A configuration change was pushed to Copilot's model-serving system that
  GitHub's production system subsequently deemed invalid.
mechanism: >-
  The invalid configuration caused affected chat and agent models to vanish from
  the model picker or return a 'model not available' error across all regions;
  engineers reverted the configuration change, and the service automatically
  reloaded the previous valid configuration, restoring the models without
  further intervention.
lesson: >-
  Configuration pushes need the same staged rollout, validation, and anomaly
  alerting as code deploys, since a bad config can take down capacity just as
  fast as a bad binary.
interview: >-
  When asked about safe configuration rollouts, discuss gradual config
  propagation with validation gates, alerting on sudden drops in available
  capacity, and automatic rollback when those alerts fire.
source: 'https://www.githubstatus.com/incidents/rfmjwng33vjf'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was due to a configuration change that our production system deemed
  invalid.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
