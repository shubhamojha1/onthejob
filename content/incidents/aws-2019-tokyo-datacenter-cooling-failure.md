---
id: aws-2019-tokyo-datacenter-cooling-failure
company: AWS
title: Tokyo AZ Cooling Failure Overheats EC2 Fleet
year: 2019
date: '2019-08-23'
duration: ~6 h
classes:
  - automation-misfire
  - cascade
  - dependency
patterns:
  - failover-triggers-latent-bug
  - redundant-safeguards-share-failure-domain
  - unresponsive-third-party-controller
  - reduced-visibility-during-outage
  - isolated-cross-az-blast-radius
impact: >-
  A small portion of a single Availability Zone in AWS's Tokyo region
  overheated, impairing EC2 instances and degrading EBS volume performance for
  hours, disrupting EC2 launch APIs and Auto Scaling in that AZ, with a few
  isolated customers on other AZs also seeing elevated errors.
trigger: >-
  A routine failover between hosts in the datacenter's cooling control system
  exposed a bug in third-party control logic during the handoff.
mechanism: >-
  Control-host failover triggered excessive, malformed communication between the
  control system and cooling devices under a third-party logic bug, causing the
  control system to become unresponsive; the designed fallback (automatic
  max-cooling mode) failed to engage in part of the datacenter, and the manual
  override ("purge" mode) also failed because it depended on the same PLCs that
  had gone unresponsive; temperatures rose until servers began powering off, and
  recovery required operators to manually locate and reset every affected
  controller.
lesson: >-
  A fallback safety mechanism is only as independent as its weakest shared
  dependency — if the manual override relies on the same controllers that the
  automatic path depends on, both can fail together.
interview: >-
  When asked to design a fail-safe control system, probe whether the candidate's
  manual override path shares any component (firmware, controller, network
  segment) with the automatic path it's meant to backstop.
source: 'https://aws.amazon.com/message/56489/'
sourceLabel: AWS post-event summary
source_quote: >-
  Due to a bug in the third-party control system logic, this exchange resulted
  in excessive interactions between the control system and the devices in the
  datacenter which ultimately resulted in the control system becoming
  unresponsive.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
