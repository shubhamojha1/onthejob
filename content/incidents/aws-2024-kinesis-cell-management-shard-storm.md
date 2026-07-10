---
id: aws-2024-kinesis-cell-management-shard-storm
company: AWS
title: Kinesis cell manager mistakes healthy hosts for dead
year: 2024
date: '2024-07-30'
duration: ~7 h
classes:
  - automation-misfire
  - cascade
  - resource-exhaustion
patterns:
  - health-check-false-positive
  - workload-profile-blind-spot
  - control-plane-overload
  - shared-internal-dependency
  - load-shedding-as-mitigation
impact: >-
  For nearly seven hours in US-EAST-1, an internal Kinesis Data Streams cell
  degraded, raising latencies and error rates across CloudWatch Logs, S3 event
  delivery, Data Firehose, ECS, Lambda, Redshift, and Glue, with log backlogs
  taking until the next day to clear.
trigger: >-
  A routine single-AZ deployment cycled hosts in and out of service on a
  recently migrated Kinesis cell whose workload — a huge number of very
  low-throughput shards — the new cell management system had never balanced
  before.
mechanism: >-
  The cell manager balanced shards by throughput, so it packed the many
  low-throughput shards onto a few hosts; those hosts' periodic status messages
  grew so large they could not be processed in time, the manager falsely
  declared healthy hosts unhealthy and mass-redistributed their shards, and the
  redistribution spike overloaded the subsystem that provisions secure
  data-plane connections, impairing the whole cell.
lesson: >-
  An automated placement or failover system validated against typical workloads
  can still misbehave on a skewed profile — test cluster-management automation
  against shard-count extremes, not just throughput extremes, and cap its
  reaction rate so a false health signal cannot trigger a redistribution storm.
interview: >-
  When asked to design a health-checking control plane for a sharded data
  service, discuss how oversized or delayed heartbeats can masquerade as host
  failure and why remediation actions need rate limits and blast-radius caps.
source: 'https://aws.amazon.com/message/073024/'
sourceLabel: AWS post-event summary
source_quote: >-
  When the cell management system did not receive status messages in a timely
  fashion, the cell management system incorrectly determined that the healthy
  hosts were unhealthy and began redistributing shards that those hosts had been
  processing to other hosts.
archive_url: ''
date_added: '2026-07-10'
last_verified: '2026-07-10'
verified: false
---
