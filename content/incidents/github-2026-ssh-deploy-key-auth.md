---
id: github-2026-ssh-deploy-key-auth
company: GitHub
title: Code Change Breaks SSH Public-Key Authentication
year: 2026
date: '2026-07-21'
duration: 4h 16m
classes:
  - bad-deploy
patterns:
  - auth-regression
  - no-staged-rollout
  - delayed-detection
  - narrow-edge-case-untested
impact: >-
  GitHub's SSH authentication service was degraded globally for about four
  hours, with an average of 12.2% and a peak of 15.7% of SSH authentication
  attempts failing, affecting both user RSA keys and deploy keys used to access
  repositories.
trigger: >-
  A code change altered how GitHub's SSH service handled one specific public-key
  authentication method.
mechanism: >-
  The change caused authentication attempts using that public-key method to be
  incorrectly rejected as invalid, intermittently failing SSH connections for
  both interactive users and automated deploy-key clients; engineers traced the
  failures to the recent change and reverted it, which restored normal
  authentication.
lesson: >-
  Authentication code paths need test coverage across every supported key type
  and method individually, since a regression confined to one method can
  silently degrade a meaningful share of production traffic before it's noticed.
interview: >-
  When asked about safely deploying changes to authentication systems, discuss
  per-method success-rate monitoring and staged rollouts so a regression in one
  key type or auth method is caught before it reaches all traffic.
source: 'https://www.githubstatus.com/incidents/g40zcbvchny4'
sourceLabel: GitHub Status incident report
source_quote: >-
  This was due to a change in how our SSH service handled one public-key
  authentication method that caused the affected authentication attempts to be
  rejected as invalid.
archive_url: ''
date_added: '2026-08-01'
last_verified: '2026-08-01'
verified: false
---
