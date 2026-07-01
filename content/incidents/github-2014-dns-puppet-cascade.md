---
id: github-2014-dns-puppet-cascade
company: GitHub
title: Puppet bug corrupted DNS and cascaded into fileserver exhaustion
year: 2014
date: '2014-01-08'
duration: 42 min full outage + 1 h 35 min partial
classes:
  - dns-bgp
  - cascade
  - bad-deploy
patterns:
  - config-management-partial-restart
  - circular-dns-dependency
  - unsanitized-api-output-to-zone-file
  - resource-exhaustion-backpressure
  - no-full-validation-between-deploys
impact: >-
  GitHub.com was fully unavailable for 42 minutes on January 8, 2014, with an
  additional 95 minutes of degraded access for a subset of repositories while
  fileservers were triaged and restored.
trigger: >-
  A Puppet manifest bug caused only the authoritative name server to restart
  after a firewall and DNS config change, leaving the caching name server
  querying an IP that was no longer serving DNS.
mechanism: >-
  Caching name server timed out on DNS queries → a triggered deployment
  attempted to rebuild the zone file via an API call that itself required
  working DNS → the broken DNS caused the API to return partial data → the zone
  file was generated with records stripped → mass NXDOMAIN responses;
  simultaneously the DNS outage caused a process storm on fileservers → memory
  exhaustion → routing layer back-pressure blocked access to healthy fileservers
  too.
lesson: >-
  Deployment systems that regenerate critical infrastructure config (like DNS
  zone files) must validate API responses for completeness before applying them
  — and must never depend on the very service they are rebuilding.
interview: >-
  How would you design a DNS zone file generation pipeline to be safe when the
  DNS infrastructure it depends on is partially degraded?
source: 'https://github.blog/news-insights/the-library/dns-outage-post-mortem/'
sourceLabel: GitHub Blog
source_quote: >-
  Both name servers received the appropriate configuration changes, but only the
  authoritative name server was restarted due to a bug in our Puppet manifests.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
