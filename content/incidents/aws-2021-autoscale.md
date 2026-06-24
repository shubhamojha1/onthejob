---
id: aws-2021-autoscale
company: AWS
title: "The autoscaler that fought the network"
year: 2021
date: "2021-12-07"
duration: "~5h"
classes:
  - automation-misfire
  - cascade
patterns:
  - feedback-loop
  - retry-storm
  - monitoring-shared-fate
impact: "A major us-east-1 disruption affecting a long list of AWS services and the customers built on them."
trigger: "Automated scaling activity on the main AWS network provoked unexpected behavior from a large number of internal clients."
mechanism: "A surge of connection activity overwhelmed networking devices between the internal and main networks. Retries plus the impaired network created a congestion-collapse feedback loop — and monitoring rode the same impaired path, blinding responders."
lesson: "Feedback loops between automated clients and the network they depend on cause congestion collapse. Monitoring must not share fate with the thing it monitors."
interview: "Congestion collapse, backoff/jitter on retries, and observability that survives the outage it's reporting on."
source: "https://aws.amazon.com/message/12721/"
sourceLabel: "AWS post-event summary"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
