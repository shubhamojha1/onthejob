---
id: aws-2021-direct-connect-tokyo
company: AWS
title: Latent Network OS Bug Disrupts Tokyo Direct Connect
year: 2021
date: '2021-09-02'
duration: ~6 h 12 min
classes:
  - cascade
  - dependency
patterns:
  - latent-os-defect
  - cascading-device-failures
  - narrow-trigger-condition
  - automation-alerts-not-auto-remediate
  - staged-rollout-missed-edge-case
impact: >-
  Direct Connect customers connecting to AWS's Tokyo (AP-NORTHEAST-1) Region
  experienced intermittent connectivity issues and elevated packet loss for
  about six hours, while inter-AZ traffic, regional internet connectivity, VPN
  backups, and Direct Connect to other regions were unaffected.
trigger: >-
  A subset of network devices in a single layer of the Direct Connect path
  between edge locations and the Tokyo datacenter network began failing to
  correctly forward traffic.
mechanism: >-
  The failing devices weren't auto-removed by the normal remediation process,
  which instead only alerted engineers to an elevated failure rate; engineers
  manually pulled the devices, which offered only temporary relief as more
  devices in the same layer began exhibiting the identical failure, driving
  congestion and packet loss; investigation traced the fault to a
  fail-time-optimization protocol on the network device OS that had run cleanly
  in production for eight months but interacted badly with a rare, specific
  customer traffic pattern, and disabling the protocol region-wide restored
  stable operation.
lesson: >-
  A defect can lie dormant through months of clean production operation and
  thorough staged rollout, so recovery plans need a fast kill switch for newly
  introduced protocols, not just reliance on pre-release testing to catch every
  packet permutation.
interview: >-
  When asked about safely rolling out network-layer protocol changes, discuss
  staged device-by-device deployment with easy fallback, plus the need for a
  rapid disable mechanism when a rare traffic pattern surfaces a latent defect
  months after rollout.
source: 'https://aws.amazon.com/message/17908/'
sourceLabel: AWS post-event summary
source_quote: >-
  We have now confirmed that this event was caused by a latent issue within the
  network device operating system.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
