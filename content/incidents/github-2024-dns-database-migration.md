---
id: github-2024-dns-database-migration
company: GitHub
title: Database Migration Cascades Into Site-Wide DNS Outage
year: 2024
date: '2024-10-11'
duration: 19 h 12 min
classes:
  - dns-bgp
  - cascade
  - bad-deploy
patterns:
  - migration-breaks-dns
  - mitigation-creates-new-failure
  - single-site-blast-radius
  - multi-phase-remediation
  - partial-service-degradation
impact: >-
  A single-site DNS outage degraded IDE code completions for 4% of Copilot
  users, delayed 25% of Actions workflows by over 5 minutes, and caused a
  complete code search outage for roughly 4 hours.
trigger: >-
  A database migration at one of GitHub's sites caused the local DNS
  infrastructure to stop resolving lookups.
mechanism: >-
  Engineers' attempts to recover the affected database triggered cascading
  failures in the site's DNS systems; a first mitigation that repointed the
  degraded site's DNS to a healthy site restored local resolution but broke
  return connectivity from healthy sites back to the degraded one, forcing the
  team to devise and deploy a second, temporary DNS resolution mechanism before
  full recovery.
lesson: >-
  A quick mitigation for a localized infra failure can silently break cross-site
  connectivity elsewhere, so any DNS or routing fix should be validated for its
  effect on the broader topology before being treated as the resolution.
interview: >-
  When asked to design multi-site DNS infrastructure, discuss how to isolate a
  single site's DNS failure from database maintenance and how to validate that
  failover mitigations don't break connectivity between sites.
source: >-
  https://github.blog/news-insights/company-news/github-availability-report-october-2024/
sourceLabel: 'GitHub Availability Report, October 2024'
source_quote: >-
  On October 11, 2024, starting at 05:59 UTC, the DNS infrastructure in one of
  our sites started failing to resolve lookups following a database migration.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
