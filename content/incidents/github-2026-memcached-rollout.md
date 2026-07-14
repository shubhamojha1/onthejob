---
id: github-2026-memcached-rollout
company: GitHub
title: API authentication failures from memcached rollout
year: 2026
date: '2026-06-10'
duration: 80 min
classes:
  - bad-deploy
  - config-change
patterns:
  - unvetted-rollout
  - config-propagation-failure
  - retry-cascade
impact: >-
  GitHub API services experienced degraded availability for 80 minutes affecting
  approximately 9% of requests. Authentication failures caused app integrations
  to enter retry loops, resulting in intermittent 'logged out' behavior for
  users.
trigger: A rollout of a memcached proxy service to GitHub's internal API infrastructure
mechanism: >-
  The rollout caused the authentication service to load an incorrect memcached
  host configuration. Intermittent lookups failed, returning 401 responses. App
  integrations interpreted these as authentication failures and initiated retry
  flows, amplifying the impact across the platform.
lesson: >-
  Configuration changes during infrastructure rollouts must be validated before
  deployment; incorrect configuration propagation can cascade through retry
  logic in dependent services, amplifying impact.
interview: >-
  Discuss strategies for safe infrastructure rollouts: how configuration
  validation gates, canary deployments, and observability of config changes can
  prevent configuration errors from cascading.
source: 'https://www.githubstatus.com/incidents/fcj3088jg1wx'
sourceLabel: GitHub Status
source_quote: >-
  A memcached proxy service rollout to our internal API infrastructure caused
  our authentication service to pick up an incorrect memcached host
  configuration, leading to intermittent authentication lookup failures.
archive_url: ''
date_added: '2026-07-14'
last_verified: '2026-07-14'
verified: false
---
