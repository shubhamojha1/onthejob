---
id: github-2026-memcached-auth-401
company: GitHub
title: GitHub API authentication failures from memcached misconfig
year: 2026
date: '2026-06-10'
duration: ~1h 20m
classes:
  - config-change
  - bad-deploy
patterns:
  - untested-infra-rollout
  - proxy-migration-side-effect
  - auth-cache-dependency
  - silent-config-drift
  - no-canary-rollout
impact: >-
  For roughly 80 minutes, about 9% of GitHub API requests failed authentication
  with erroneous 401 responses, causing app integrations to repeatedly retrigger
  login flows and adding ~800ms of latency to affected calls.
trigger: >-
  A rollout of a new memcached proxy service into GitHub's internal API
  infrastructure.
mechanism: >-
  The memcached proxy rollout caused the authentication service to load an
  incorrect memcached host configuration, which made authentication cache
  lookups intermittently fail; those failures surfaced to clients as erroneous
  401s, which app integrations misread as expired sessions and responded to by
  repeatedly re-triggering authentication flows, compounding latency until
  engineers pushed a corrected memcached host configuration.
lesson: >-
  Infrastructure-level rollouts that change how a critical service discovers
  dependencies like a cache host deserve the same staged verification as code
  deploys, since one wrong config value can silently degrade authentication for
  a meaningful slice of traffic.
interview: >-
  When asked to design a resilient authentication layer, discuss decoupling auth
  correctness from cache/dependency availability and how to safely stage
  infrastructure config rollouts (e.g., proxy migrations) with canaries and fast
  rollback.
source: 'https://www.githubstatus.com/incidents/fcj3088jg1wx'
sourceLabel: GitHub Status incident report
source_quote: >-
  A memcached proxy service rollout to our internal API infrastructure caused
  our authentication service to pick up an incorrect memcached host
  configuration, leading to intermittent authentication lookup failures.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
