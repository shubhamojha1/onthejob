---
id: anthropic-2025-context-window-routing
company: Anthropic
title: "Claude requests routed to the wrong context servers"
year: 2025
date: "2025-08-05"
duration: "44 days to final rollout"
classes:
  - bad-deploy
  - config-change
patterns:
  - routing-change
  - sticky-routing
  - missing-production-quality-monitoring
impact: "Degraded Sonnet 4 responses initially affected 0.8% of requests, reached 16% in the worst hour, and touched about 30% of active Claude Code users at least once."
trigger: "A routing bug introduced on August 5 sent short-context requests to servers configured for a forthcoming one-million-token context window; a routine August 29 load-balancing change then increased the share of traffic taking that path."
mechanism: "Wrong-pool selection combined with sticky routing, so later messages often stayed on the same incorrect configuration. The degradation varied by platform, route, and conversation history. Overlapping inference bugs produced contradictory reports, evaluations were too noisy, and privacy controls limited inspection of conversations not submitted as feedback, delaying correlation with the load-balancer change."
lesson: "Treat model-serving equivalence as a production SLO. Run sensitive quality evaluations continuously on the real serving matrix, segment signals by model, hardware, route, and context configuration, and connect feedback spikes to recent infrastructure changes while preserving user privacy."
interview: "A successful request does not mean the model answered well. Test every serving path and record the route without storing user content."
source: "https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues"
sourceLabel: "Anthropic engineering postmortem"
source_quote: "We relied too heavily on noisy evaluations."
archive_url: ""
date_added: "2026-08-08"
last_verified: "2026-08-08"
verified: true
---
