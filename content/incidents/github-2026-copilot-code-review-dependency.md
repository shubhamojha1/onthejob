---
id: github-2026-copilot-code-review-dependency
company: GitHub
title: Copilot Code Review Outage From Unpinned Dependency
year: 2026
date: '2026-06-04'
duration: 1h 25m
classes:
  - dependency
  - bad-deploy
patterns:
  - unpinned-dependency
  - automatic-latest-consumption
  - insufficient-compatibility-validation
  - no-staged-rollout
  - slow-timeout-drain
impact: >-
  Global degradation of GitHub Copilot Code Review on GitHub.com for roughly 90
  minutes, with an average 81.6% (peak 93.9%) request failure rate causing about
  36,800 failed code review requests; GitHub Enterprise Cloud with data
  residency was unaffected.
trigger: >-
  The Copilot Code Review processing workflow automatically pulled in a newly
  released version of a dependency.
mechanism: >-
  The new dependency release was incompatible with the runtime environment;
  because the workflow auto-consumed the latest release without sufficient
  compatibility validation, the incompatible version caused review processing to
  fail for most requests, and in-flight runs stalled until timeouts allowed the
  backlog to drain.
lesson: >-
  Pin dependency versions for production workflows and gate upgrades behind
  compatibility checks instead of auto-consuming 'latest' releases.
interview: >-
  When asked about safe dependency management in production pipelines, discuss
  version pinning, staged compatibility validation, and fast-fail behavior over
  silently consuming 'latest'.
source: 'https://www.githubstatus.com/incidents/5h5lmbffp07c'
sourceLabel: GitHub Status incident report
source_quote: >-
  The issue was caused by a newly released dependency used by the Copilot Code
  Review processing workflow.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
