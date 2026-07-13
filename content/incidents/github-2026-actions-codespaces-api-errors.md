---
id: github-2026-actions-codespaces-api-errors
company: GitHub
title: Underperforming Change Breaks Actions and Codespaces APIs
year: 2026
date: '2026-07-07'
duration: 2h 16m
classes:
  - bad-deploy
patterns:
  - performance-regression-rollout
  - downstream-error-propagation
  - partial-error-rate
  - rollback-mitigation
  - slow-root-cause-identification
impact: >-
  For about two hours and sixteen minutes, GitHub's Actions and Codespaces REST
  APIs returned intermittent 500 errors, peaking at roughly 8% of Actions runner
  API calls and 13% of Codespaces API calls, while in-progress runs and
  codespaces kept working normally.
trigger: >-
  GitHub shipped a change intended to improve performance to a system backing
  the Actions and Codespaces REST APIs.
mechanism: >-
  The change failed to deliver the performance improvement it was meant to
  provide, and under certain conditions this shortfall caused downstream errors
  that surfaced as intermittent 500-class responses on the Actions and
  Codespaces REST APIs; engineers spent roughly ninety minutes investigating
  before identifying the change as the likely cause and rolling it back, which
  resolved the errors.
lesson: >-
  Performance-focused changes deserve the same staged rollout and regression
  safeguards as functional changes, because a change that merely underperforms
  rather than outright fails can still cascade into visible downstream errors.
interview: >-
  When asked how to safely deploy a performance optimization, discuss canary
  metrics on latency and error rate paired with automatic rollback, rather than
  relying on manual investigation to catch a regression after it's already
  degrading production traffic.
source: 'https://www.githubstatus.com/incidents/fz9sdc2q008p'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was due to a recent change that did not deliver the expected performance
  and, under certain conditions, caused downstream errors.
archive_url: ''
date_added: '2026-07-13'
last_verified: '2026-07-13'
verified: false
---
