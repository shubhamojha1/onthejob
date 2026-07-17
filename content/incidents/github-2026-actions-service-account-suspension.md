---
id: github-2026-actions-service-account-suspension
company: GitHub
title: Automated Account Review Suspends Actions Auth Service Account
year: 2026
date: '2026-05-26'
duration: 2h 16m
classes:
  - automation-misfire
  - cascade
  - dependency
patterns:
  - automated-moderation-overreach
  - no-service-account-allowlist
  - cache-propagation-delay
  - shared-auth-single-point-of-failure
  - cascading-service-dependency
impact: >-
  GitHub Actions was globally degraded for over two hours, blocking all newly
  queued workflow runs for the first ~1h36m and action-download-dependent runs
  for another 40 minutes, with knock-on failures in Pages, Copilot Code Review,
  Copilot coding agent, Octoshift, and GitHub Enterprise Importer, plus brief
  automatic hiding of some Issues, PRs, Comments, and Discussions.
trigger: >-
  GitHub's automated account review system incorrectly suspended the internal
  service account that Actions uses to authenticate workflow runs and download
  actions.
mechanism: >-
  The suspended service account broke authentication for Actions, so every newly
  queued run failed to start; restoring the account resolved most runs, but a
  dependent service kept serving stale cached account state, so runs that needed
  to download actions kept failing until that service was redeployed to flush
  the cache; because Pages, Copilot Code Review, Copilot coding agent,
  Octoshift, and GitHub Enterprise Importer all depend on Actions, the outage
  propagated to each of them, and the account suspension itself also caused some
  content to be auto-hidden.
lesson: >-
  Automated trust-and-safety or account-review systems need an explicit
  allowlist for infrastructure-critical service accounts, since a single
  false-positive suspension on a shared auth identity can cascade through every
  product built on top of it.
interview: >-
  When asked about limiting blast radius for automated account-moderation or
  anti-abuse systems, discuss allowlisting critical service identities and
  designing fast cache-invalidation paths so a credential fix propagates
  immediately instead of lingering in stale caches.
source: 'https://www.githubstatus.com/incidents/gnftqj9htp0g'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was caused by our automated account review system incorrectly suspending
  the service account used by GitHub Actions to authenticate workflow runs and
  download actions.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
