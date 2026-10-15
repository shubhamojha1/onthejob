---
id: github-2026-actions-autoscaling-config
company: GitHub
title: Autoscaling misconfig breaks Actions job starts
year: 2026
date: '2026-07-13'
duration: 42 min
classes:
  - config-change
  - resource-exhaustion
patterns:
  - stale-config-values
  - no-input-validation
  - dependency-cascade
  - capacity-below-baseline
impact: >-
  A 42-minute incident caused roughly 30% of GitHub Actions jobs to fail to
  start (with 2% delayed over 5 minutes), also disrupting Copilot cloud agent
  sessions and GitHub Pages builds that depend on Actions.
trigger: >-
  A configuration push to an internal autoscaling component carried outdated
  capacity threshold values.
mechanism: >-
  Stale thresholds in the autoscaler config caused a critical Actions service to
  scale down below its required baseline capacity, starving workflow processing
  and building a job backlog; downstream systems that depend on Actions,
  including Copilot cloud agents and Pages builds, failed in turn until the
  change was rolled back and the backlog drained.
lesson: >-
  Autoscaling configuration deserves the same freshness and validation checks as
  a code deploy, since a stale threshold value can cut capacity just as
  effectively as a bad code push.
interview: >-
  When asked about safe autoscaling changes, discuss validating that scaling
  inputs are current and detecting drift between planned and live scaling state
  before applying changes.
source: 'https://www.githubstatus.com/incidents/q27ttsnp0x4g'
sourceLabel: GitHub Status incident report
source_quote: >-
  The incident was triggered by a configuration change in an internal
  autoscaling component that contained outdated capacity threshold values.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
