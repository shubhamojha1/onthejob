---
id: aws-2018-seoul-dns-resolver
company: AWS
title: Config change killed Seoul region DNS for 84 minutes
year: 2018
date: '2018-11-22'
duration: 1 h 24 min
classes:
  - config-change
  - dns-bgp
patterns:
  - missing-config-validation
  - no-minimum-capacity-guardrail
  - missing-removal-throttle
  - regional-blast-radius
impact: >-
  EC2 instances in the AWS AP-NORTHEAST-2 (Seoul) region were unable to resolve
  DNS for 84 minutes, affecting all customers running workloads in that region.
trigger: >-
  A configuration update to the EC2 DNS resolver fleet incorrectly removed the
  setting specifying the minimum number of healthy hosts, causing the system to
  fall back to a dangerously low default value.
mechanism: >-
  With the minimum healthy hosts threshold effectively zeroed out, the fleet
  shed healthy hosts below the capacity needed to serve queries → DNS resolution
  from within EC2 instances began failing across the entire Seoul region;
  recovery required manually stopping further host removal and then restoring
  fleet capacity to prior levels.
lesson: >-
  Configuration parameters that control minimum capacity thresholds must have
  semantic validation — silently defaulting to zero when a floor setting is
  removed is a single config push away from a regional outage.
interview: >-
  How would you design a configuration management system for a critical DNS
  resolver fleet so that removing or zeroing a minimum-capacity setting requires
  explicit confirmation rather than silently adopting a dangerous default?
source: 'https://aws.amazon.com/message/74876-2/'
sourceLabel: AWS Post-Event Summary
source_quote: >-
  The root cause of DNS resolution issues was a configuration update which
  incorrectly removed the setting that specifies the minimum healthy hosts for
  the EC2 DNS resolver fleet in the AP-NORTHEAST-2 Region.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
