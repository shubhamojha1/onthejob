---
id: meta-2021-bgp
company: Meta
title: "The day Facebook deleted itself from the internet"
year: 2021
date: "2021-10-04"
duration: "~6h"
classes:
  - dns-bgp
  - dependency
patterns:
  - bgp-withdrawal
  - circular-dependency
  - internal-tools-down
impact: "Facebook, Instagram, WhatsApp gone globally for ~6 hours. Internal tools, badge access and conference systems were down too, slowing recovery."
trigger: "A routine backbone-maintenance command, meant to assess capacity, accidentally severed all backbone connections between data centers."
mechanism: "Meta's DNS servers withdrew their BGP routes when they lost backbone reachability — a designed safety reflex. With DNS unreachable, every property vanished, and the very tools needed to fix it were on the network that was down."
lesson: "A safety mechanism reacting to a bigger failure can amplify it. Watch for circular dependencies where the tools to fix an outage are taken out by it."
interview: "Discuss BGP/DNS as a hard dependency and the danger of recovery tooling sharing fate with production."
source: "https://engineering.fb.com/2021/10/04/networking-traffic/outage/"
sourceLabel: "Engineering at Meta"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
