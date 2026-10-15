---
id: github-2012-mlag-fileserver-outage
company: GitHub
title: Aggregation Switch Upgrade Triggers Fileserver Split-Brain Race
year: 2012
date: '2012-12-22'
duration: ~8 h
classes:
  - cascade
  - config-change
  - automation-misfire
patterns:
  - network-dependent-ha-cluster
  - heartbeat-false-positive
  - mlag-failover-race
  - no-staged-rollout
  - fencing-command-drop
impact: >-
  GitHub.com was placed in full maintenance mode and unavailable to all users
  for roughly eight hours after a core-network failover cascaded into a
  split-brain protection race across a large fraction of its active/passive
  fileserver pairs.
trigger: >-
  During a scheduled maintenance window to upgrade aggregation switch software,
  engineers terminated a diagnostic agent on one switch to capture forensic
  state, and the switch's inability to reset its links in time caused the peer
  to detect a lost heartbeat while the link stayed up.
mechanism: >-
  That link-state ambiguity caused the peer switch to perform the more
  disruptive of its two failover paths, forcing a network-wide spanning-tree
  reconvergence that blocked switch-to-switch traffic for about ninety seconds;
  that blackout exceeded heartbeat timeouts on many
  DRBD/Pacemaker/Heartbeat-managed fileserver pairs spread across racks, so
  multiple pairs independently issued STONITH commands to seize control from
  their partner, but the still-recovering network dropped some of those
  commands, leaving pairs where both nodes believed they were now active, which
  triggered a fencing race that shut down both nodes on a large number of pairs
  and required a slow, log-by-log manual determination of the last-active node
  before recovery could begin.
lesson: >-
  High-availability clusters whose heartbeat and fencing traffic share the same
  network as the systems they protect can turn a sub-two-minute network blip
  into a multi-hour, manually-recovered outage, so HA control planes should be
  quiesced before any planned network-layer change, however routine it seems.
interview: >-
  When asked to design fencing/failover for an active-passive storage cluster,
  discuss how to make STONITH and heartbeat timeouts resilient to shared-network
  partitions, and why control-plane heartbeat traffic should be isolated from
  the data-path network it is meant to protect.
source: 'https://github.blog/news-insights/the-library/downtime-last-saturday/'
sourceLabel: GitHub blog
source_quote: >-
  When the network froze, many of our fileservers which are intentionally
  located in different racks for redundancy, exceeded their heartbeat timeouts
  and decided that they needed to take control of the fileserver resources.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
