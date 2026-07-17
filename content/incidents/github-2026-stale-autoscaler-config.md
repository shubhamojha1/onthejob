---
id: github-2026-stale-autoscaler-config
company: GitHub
title: Stale Autoscaler Thresholds Choke Actions Capacity
year: 2026
date: '2026-07-13'
duration: 42 min
classes:
  - config-change
  - resource-exhaustion
  - dependency
patterns:
  - stale-config-values
  - no-drift-detection
  - downstream-dependency-cascade
  - queued-backlog-drain
  - untested-config-push
impact: >-
  For about 42 minutes, a subset of GitHub customers saw up to 30% of Actions
  workflow jobs fail to start, with knock-on failures in Copilot cloud agent
  sessions and GitHub Pages builds that depend on Actions.
trigger: >-
  An internal autoscaling component was pushed a configuration change containing
  outdated capacity threshold values.
mechanism: >-
  The stale thresholds caused a critical Actions service to scale below the
  capacity baseline it needed, leaving too few workers to process incoming
  workflow jobs; the shortage cascaded into Pages builds and Copilot cloud agent
  sessions since both depend on Actions capacity, and full recovery required
  rolling back the config and draining the queued job backlog.
lesson: >-
  Configuration pushes to autoscalers deserve the same validation rigor as code
  deploys — stale or drifted threshold values can silently starve a service of
  capacity with no code change involved.
interview: >-
  When asked about safe autoscaling architecture, discuss validating scaling
  config against live system state and adding drift detection before
  configuration changes take effect.
source: 'https://www.githubstatus.com/incidents/q27ttsnp0x4g'
sourceLabel: GitHub Status incident report
source_quote: >-
  The incident was triggered by a configuration change in an internal
  autoscaling component that contained outdated capacity threshold values.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
