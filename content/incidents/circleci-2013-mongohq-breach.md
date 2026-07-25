---
id: circleci-2013-mongohq-breach
company: CircleCI
title: CircleCI Shuts Down After MongoHQ Database Breach
year: 2013
date: '2013-10-27'
duration: ~10 h
classes:
  - dependency
patterns:
  - third-party-breach
  - shared-credential-blast-radius
  - delayed-vendor-notification
  - cross-provider-token-revocation
  - plaintext-secrets-at-rest
impact: >-
  CircleCI took its entire website and build system offline for all customers
  while it revoked SSH keys, API tokens, and OAuth credentials across GitHub,
  Heroku, and AWS after its database provider MongoHQ was compromised.
trigger: >-
  CircleCI's database provider, MongoHQ, was breached, and an attacker IP tied
  to that intrusion accessed CircleCI's own database late on October 27, 2013.
mechanism: >-
  An IAM key deletion tipped CircleCI off to suspicious activity a day before
  MongoHQ publicly disclosed its own breach; MongoHQ initially told CircleCI
  there was no evidence of unauthorized DB access, but hours later confirmed
  CircleCI's database had in fact been reached by an intruder IP, which forced
  CircleCI to shut down its site and builds and race to revoke every SSH key and
  API token it held on behalf of customers before they could be misused against
  GitHub, Heroku, or AWS accounts.
lesson: >-
  If your service stores customers' third-party credentials (SSH keys, API
  tokens) in your own database, a breach at your infrastructure provider becomes
  your breach too — keep a rehearsed, cross-vendor mass-revocation runbook ready
  rather than building one during the incident.
interview: >-
  When asked about designing a CI/CD platform that holds customer secrets like
  SSH keys and deploy tokens, discuss minimizing stored plaintext credentials,
  encrypting them at rest, and pre-establishing rapid revocation channels with
  every integrated third party (GitHub, cloud IAM, PaaS providers).
source: >-
  https://web.archive.org/web/20180121023549/http://circleci.com/blog/mongohq-security-incident-response/
sourceLabel: CircleCI blog (Wayback Machine)
source_quote: >-
  At 5:03pm, we learned from MongoHQ that our database was accessed by one of
  the IPs responsible for the intrusion.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
