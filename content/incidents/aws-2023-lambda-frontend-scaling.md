---
id: aws-2023-lambda-frontend-scaling
company: AWS
title: Lambda Frontend Scaling Bug Breaks US-EAST-1
year: 2023
date: '2023-06-13'
duration: 3h 48m
classes:
  - cascade
  - resource-exhaustion
  - dependency
patterns:
  - latent-bug-at-scale-threshold
  - cellular-blast-radius-containment
  - downstream-service-cascade
  - async-event-backlog
impact: >-
  A latent bug in Lambda's Frontend scaling logic degraded function invocations
  in one cell of US-EAST-1 for nearly four hours, causing elevated errors and
  latency across STS, Management Console, EKS cluster provisioning, Connect, and
  EventBridge.
trigger: >-
  The Lambda Frontend fleet auto-scaled past a capacity threshold in a single
  cell that had never been reached before, exposing a dormant software defect.
mechanism: >-
  Crossing the new threshold caused execution environments to be allocated but
  never actually put to use by the Frontend, so no usable capacity existed to
  serve incoming invocations; synchronous calls errored out while asynchronous
  and streaming events piled up in a backlog, and dependent AWS services
  degraded in turn until engineers scaled the fleet back below the threshold.
lesson: >-
  Autoscaling systems can hide defects that only trigger past capacity levels
  never previously exercised in production, so scaling logic must be tested well
  beyond historical peak, not just up to it.
interview: >-
  When asked about safe autoscaling design, discuss why untested scale
  thresholds are as risky as untested code paths, and how cellular architectures
  contain blast radius when a cell fails.
source: 'https://aws.amazon.com/message/061323/'
sourceLabel: AWS post-event summary
source_quote: >-
  At 11:49 AM PDT, the Lambda Frontend fleet, while adding additional compute
  capacity to handle the increase in service traffic, crossed a capacity
  threshold that had previously never been reached within a single cell.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
