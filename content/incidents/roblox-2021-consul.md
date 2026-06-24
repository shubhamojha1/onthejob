---
id: roblox-2021-consul
company: Roblox
title: "73 hours down via one coordination layer"
year: 2021
date: "2021-10-28"
duration: "73h"
classes:
  - resource-exhaustion
  - cascade
patterns:
  - single-point-of-failure
  - contention
  - recovery-blocked
impact: "A near three-day full platform outage over Halloween weekend."
trigger: "A new streaming feature on the HashiCorp Consul cluster, combined with an unusual load pattern, triggered heavy contention in Consul's write path."
mechanism: "Consul underpinned service discovery and health for everything. Under contention its performance collapsed; a separate Consul bug then blocked recovery. Because so many services depended on it, the whole platform stayed down for days."
lesson: "When one coordination layer underpins everything, its failure is total. Know the failure modes of your service-discovery/consensus substrate before you scale onto it."
interview: "Single-points-of-failure in the control plane; why service discovery deserves its own blast-radius analysis."
source: "https://blog.roblox.com/2022/01/roblox-return-to-service-10-28-10-31-2021/"
sourceLabel: "Roblox blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
