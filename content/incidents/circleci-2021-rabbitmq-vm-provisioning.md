---
id: circleci-2021-rabbitmq-vm-provisioning
company: CircleCI
title: RabbitMQ Upgrade Silently Starves VM Cleanup Queue
year: 2021
date: '2021-05-21'
duration: ~11h 48m
classes:
  - dependency
  - resource-exhaustion
  - cascade
patterns:
  - undocumented-changelog-behavior
  - misconfigured-threshold-alert
  - retry-storm-worsens-quota-exhaustion
  - tight-coupling-between-services
  - burst-credit-exhaustion
impact: >-
  CircleCI customers running Docker, Machine executor (Windows, Mac, Arm, GPU),
  and remote Docker jobs experienced delayed or fully blocked pipelines
  platform-wide for nearly 12 hours.
trigger: >-
  A routine RabbitMQ upgrade from 3.8.9 to 3.8.16 introduced a new consumer
  acknowledgment timeout that, contrary to the documented changelog, applied to
  all queue types rather than just quorum queues.
mechanism: >-
  Consumers on the VM-destroyer queue silently timed out and had their channels
  closed, so consumers dropped to zero and old VMs stopped being cleaned up in
  one region; this exhausted GCP CPU quotas, which blocked new VM provisioning,
  and automated retries against the GCP API made the quota exhaustion worse;
  tight coupling between the VM service and Docker executors spread the slowdown
  to Docker jobs, and the resulting load spike exhausted RDS burst balance,
  causing database connection timeouts that required manual database scaling,
  load-shedding (blocking remote-docker jobs, canceling workflows), and a
  staged, component-by-component recovery to break the create/destroy VM
  deadlock.
lesson: >-
  Don't trust a vendor's changelog description of scope for a dependency upgrade
  — verify behavior-changing releases against actual source code or a canary
  environment, especially for infrastructure components with broad blast radius
  like message queues.
interview: >-
  When asked about resilient VM provisioning pipelines, discuss decoupling
  provisioning from cleanup queues, guarding against retry storms hitting cloud
  API rate limits, and monitoring consumer counts as a leading indicator rather
  than just queue depth.
source: >-
  https://discuss.circleci.com/t/postmortem-may-21-2021-delay-in-starting-docker-jobs-machine-remote-docker-environments-blocked/40274
sourceLabel: CircleCI Discuss postmortem
source_quote: >-
  On reviewing the GitHub issue and the code involved, we learned the change
  affected all queue types, not just quorum queues.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
