---
id: basecamp-2014-ddos-extortion
company: Basecamp
title: Extortion DDoS took Basecamp down for 45 minutes
year: 2014
date: '2014-03-24'
duration: 1 h 40 min (45 min fully down)
classes:
  - resource-exhaustion
  - dependency
patterns:
  - no-ddos-mitigation-vendor
  - slow-incident-communication
  - status-page-shared-fate
impact: >-
  Basecamp and its sibling services were fully unreachable for 45 minutes and
  intermittently degraded for nearly two hours, affecting all customers on a
  Monday morning.
trigger: >-
  Criminals launched a multi-vector DDoS attack exceeding 20Gbps — combining SYN
  flood, DNS reflection, ICMP flooding, and NTP amplification — as part of an
  extortion attempt.
mechanism: >-
  The volumetric attack saturated the network before mitigations were in place;
  filtering was eventually routed through a single provider but the status page,
  hosted off-site, also buckled under the surge of concerned users checking it,
  extending the communication gap.
lesson: >-
  Your status page must be load-tested for outage-level traffic spikes, and
  incident communication must begin within five minutes of detection — not after
  internal triage is complete.
interview: >-
  When designing for availability under external attack, how would you architect
  your status and incident-communication channels so they remain reachable
  precisely when your primary service is not?
source: 'https://signalvnoise.com/posts/3729-basecamp-network-attack-postmortem'
sourceLabel: Signal v. Noise (Basecamp blog)
source_quote: >-
  Although we were successful at posting information to our status site (which
  is hosted off site), the site received more traffic than ever in the past, and
  it too had availability problems.
archive_url: ''
date_added: '2026-06-25'
last_verified: '2026-06-25'
verified: false
---
