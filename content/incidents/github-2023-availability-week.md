---
id: github-2023-availability-week
company: GitHub
title: Three unrelated failures cascade into a week of outages
year: 2023
date: '2023-05-09'
duration: 3 incidents over 3 days (May 9-11)
classes:
  - cascade
  - config-change
  - dependency
patterns:
  - shared-dependency-blast-radius
  - failed-rollback
  - read-replica-loss-on-failover
  - retry-amplification-from-new-caller
  - low-volume-high-cost-blind-spot
impact: >-
  Three separate incidents on May 9, 10, and 11, 2023 each degraded 6-8 of
  GitHub's 10 core status-page services, disrupting Git reads/writes, pull
  requests, GitHub Actions, Codespaces, and Pages access for developers relying
  on the platform.
trigger: >-
  A config change meant to prevent connection saturation on the Git-data service
  (May 9) caused a cluster failover and a failed rollback; a new caller that
  retried on timeouts hit an inefficient GitHub App token-issuance API (May 10);
  and a Git database crash triggered an automated failover that came up without
  its read replicas attached (May 11).
mechanism: >-
  Each incident began as a narrow infrastructure event but propagated widely
  because Git data and auth-token issuance sit underneath nearly every GitHub
  feature: degraded Git access broke Actions checkouts and PR updates, and
  failed token issuance blocked Actions and Codespaces from authenticating,
  turning isolated backend faults into multi-service outages.
lesson: >-
  Foundational shared services (data stores, token issuance) need their rollout,
  rollback, and failover paths tested as rigorously as the features built on top
  of them, since a failure there fans out across every dependent product.
interview: >-
  When asked how to contain blast radius for a shared internal data or auth
  service, discuss staged config rollouts with fast verified rollback, failover
  automation that confirms replica attachment before declaring recovery, and
  safeguards against a single new caller triggering a retry storm.
source: >-
  https://github.blog/news-insights/company-news/addressing-githubs-recent-availability-issues/
sourceLabel: GitHub blog
source_quote: >-
  The root causes for these incidents were unrelated but in aggregate, they
  negatively impacted the services that organizations and developers trust
  GitHub to deliver.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
