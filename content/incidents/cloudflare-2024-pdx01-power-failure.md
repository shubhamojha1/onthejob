---
id: cloudflare-2024-pdx01-power-failure
company: Cloudflare
title: Second PDX01 Power Failure Tests Cloudflare's Fixes
year: 2024
date: '2024-03-26'
duration: ~10 h
classes:
  - dependency
  - cascade
patterns:
  - shared-failure-domain
  - single-facility-dependency
  - latent-misconfiguration
impact: >-
  Loss of primary and backup power at Cloudflare's PDX01 data center knocked out
  its Analytics and Logging pipeline for hours, while automated failover kept
  the control plane, API, dashboard, and edge traffic largely unaffected for
  customers worldwide.
trigger: >-
  Four Flexential-operated Circuit Switch Boards serving all of Cloudflare's
  cages failed near-simultaneously, cutting both primary and redundant power
  feeds to the PDX01 data center.
mechanism: >-
  Breaker trip settings on the CSBs were set too low for the downstream
  provisioned power capacity, so when one breaker tripped it set off a cascading
  failure across the remaining CSBs, killing primary and backup power paths at
  once; over 100 databases across 20-plus clusters failed out of PDX01
  automatically, restoring the control plane in about seven minutes, but the
  Analytics pipeline, still dependent solely on PDX01, stayed down for hours
  until manually recovered.
lesson: >-
  Redundant power paths that route through shared protective equipment aren't
  truly redundant, and each dependent system recovers only as fast as the work
  already done to move it off that single point of failure.
interview: >-
  Test failover for real, not just on paper, and make sure a 'backup' path
  doesn't share the same breaker, switchboard, or facility as the primary. Run
  scheduled cut-tests so latent misconfigurations surface before a real outage
  does.
source: >-
  https://blog.cloudflare.com/major-data-center-power-failure-again-cloudflare-code-orange-tested/
sourceLabel: Cloudflare blog
source_quote: >-
  Initial assessment of the root cause of Flexential's CSB failures points to
  incorrectly set breaker coordination settings within the four CSBs as one
  contributing factor.
archive_url: ''
date_added: '2026-09-05'
last_verified: '2026-09-05'
verified: false
---
