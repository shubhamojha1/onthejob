---
id: allegro-2018-scaling
company: Allegro
title: "A marketing campaign DDoSed itself"
year: 2018
date: "2018-08-01"
duration: "hours"
classes:
  - config-change
  - thundering-herd
patterns:
  - scaling-misconfig
  - known-traffic-event
impact: "Poland's largest e-commerce site went down at the moment a campaign was driving peak traffic."
trigger: "A marketing push caused a sudden traffic spike."
mechanism: "A misconfiguration in cluster resource management stopped new service instances from starting — so even with free hardware available, the platform couldn't scale to meet demand and fell over."
lesson: "Capacity you can't actually schedule isn't capacity. Test that autoscaling can really claim idle resources under real load."
interview: "Capacity planning for known traffic events; verifying the scheduler can place instances under pressure."
source: "https://allegro.tech/2018/08/postmortem-why-allegro-went-down.html"
sourceLabel: "allegro.tech"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: true
---
