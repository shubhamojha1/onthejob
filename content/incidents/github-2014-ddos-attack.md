---
id: github-2014-ddos-attack
company: GitHub
title: GitHub knocked offline by evolving DDoS attack
year: 2014
date: '2014-03-11'
duration: ~2 h
classes:
  - dependency
  - resource-exhaustion
patterns:
  - untuned-mitigation-tooling
  - attack-signature-mismatch
  - multi-vector-escalation
  - manual-countermeasure-deployment
impact: >-
  GitHub.com was largely unreachable worldwide for roughly two hours, with an
  additional ~25 minutes of partial downtime during remediation, affecting all
  users of the site.
trigger: >-
  An attacker began flooding GitHub with several thousand HTTP requests per
  second from thousands of distributed IP addresses, targeting a specific
  crafted URL on the non-SSL port that triggered redirects to HTTPS.
mechanism: >-
  The redirect-triggering requests overwhelmed the load balancing and
  application tiers, but because the attack was high in packets-per-second
  rather than bandwidth, it didn't match GitHub's existing volumetric-attack
  detection signals, delaying recognition. Engineers had no pre-built rule to
  block the crafted URL, so blocking it required an ad hoc emergency change.
  After that fix stabilized traffic, the attacker pivoted to a second vector —
  flooding SSL connections to exhaust SSL processing capacity — which required
  manually tuning the DDoS mitigation platform in real time, causing a second,
  shorter outage before full mitigation.
lesson: >-
  DDoS defenses tuned around one attack signature (e.g., bandwidth volume) can
  blind you to attacks that manifest differently (e.g., packet rate), so
  mitigation playbooks and detection thresholds should be pre-built and tested
  for multiple attack shapes, not just the most commonly observed one.
interview: >-
  When asked how to design DDoS defenses for a public web platform, discuss the
  difference between volumetric and complex/application-layer attacks, and why
  pre-staged, testable mitigation templates matter more than raw capacity alone.
source: 'https://github.blog/news-insights/the-library/denial-of-service-attacks/'
sourceLabel: GitHub Blog
source_quote: >-
  By 22:35 UTC we had blocked the malicious request and the site appeared to be
  operating normally.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
