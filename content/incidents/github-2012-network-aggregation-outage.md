---
id: github-2012-network-aggregation-outage
company: GitHub
title: Switch migration bug causes day-long network saturation
year: 2012
date: '2012-11-30'
duration: 18 min hard down; ~1 day degraded
classes:
  - config-change
  - cascade
  - resource-exhaustion
patterns:
  - untested-topology-migration
  - vendor-firmware-bug
  - redundancy-defeated-by-misconfig
  - tunnel-vision-during-incident-response
  - no-staging-environment
impact: >-
  GitHub suffered 18 minutes of full site unavailability plus intermittent slow
  responses and errors across all users for the rest of the day, with one
  fileserver pair also going offline and affecting a small percentage of
  repositories.
trigger: >-
  During a planned migration to a new tree-shaped aggregation network topology,
  reconnecting the final redundant switch pair triggered a misconfigured
  bridge-loop protection that disabled links.
mechanism: >-
  The bridge loop was resolved quickly, but a separate watchdog misconfiguration
  meant disconnecting one link in a redundant pair caused the whole pair to
  disable, briefly eliminating failover and causing an 18-minute total outage
  during troubleshooting; deeper investigation then revealed a vendor firmware
  bug in the new aggregation switches that prevented them from learning MAC
  addresses, forcing them to flood traffic to every port and saturating all
  access-to-aggregation links for hours.
lesson: >-
  Redundancy and failover mechanisms must be tested against real failure
  injection, not just assumed to work, since a single misconfigured watchdog
  setting or vendor firmware bug can silently defeat them exactly when they're
  needed.
interview: >-
  When asked about safely rolling out network topology changes, discuss building
  a duplicate staging network to test failure injection and vendor firmware
  behavior before touching production redundancy pairs.
source: 'https://github.blog/news-insights/the-library/network-problems-last-friday/'
sourceLabel: GitHub blog (The Library)
source_quote: >-
  In the course of our troubleshooting we discovered that our aggregation
  switches were missing a number of MAC addresses from their tables, and thus
  were flooding any traffic that was sent to those devices across all of their
  ports.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
