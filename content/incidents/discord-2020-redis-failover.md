---
id: discord-redis-failover
company: Discord
title: "A cloud live-migration tipped over Redis"
year: 2020
date: "2020-01-01"
duration: "~20 min restart"
classes:
  - cascade
  - automation-misfire
patterns:
  - provider-automation
  - failover-bug
  - cascade
impact: "A real-time outage that forced a full service restart, reconnecting millions of clients over ~20 minutes."
trigger: "Google Cloud automatically live-migrated the VM hosting Discord's primary Redis node."
mechanism: "The node briefly dropped offline; the HA cluster rebalanced and hit known bugs in Discord's Redis-failover handling. The partial outage exposed latent issues elsewhere, cascading through the real-time system until a full restart was required."
lesson: "Your cloud provider's routine automation — like live migration — is an event your failover code must survive. Test failover against real triggers, not just clean kills."
interview: "Failover correctness under provider-initiated events; chaos-testing the real failure triggers."
source: "https://status.discordapp.com/incidents/qk9cdgnqnhcn"
sourceLabel: "Discord status"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
