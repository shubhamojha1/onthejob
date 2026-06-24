---
id: slack-2021-herd
company: Slack
title: "The first-Monday thundering herd"
year: 2021
date: "2021-01-04"
duration: "~5h"
classes:
  - thundering-herd
  - cascade
patterns:
  - retry-amplification
  - health-check-flapping
  - slow-autoscaling
impact: "Widespread connection failures on the first work-Monday of the year, exactly when everyone logged on at once."
trigger: "A return-from-holiday traffic spike hit while Slack's AWS Transit Gateways were still scaling up."
mechanism: "Network saturation caused packet loss; that tripped health checks, which pulled servers from rotation, concentrating load on fewer machines — a downward spiral. Autoscaling lagged partly because the provisioning service itself was starved."
lesson: "Demand can outrun autoscaling. Pre-scale for known surges and make health checks resilient to transient loss so they don't amplify the failure."
interview: "Health-check design under load, pre-warming for predictable spikes, and avoiding retry amplification."
source: "https://slack.engineering/slacks-outage-on-january-4th-2021/"
sourceLabel: "Slack Engineering"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
