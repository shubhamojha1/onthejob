---
id: github-2026-copilot-agent-replication-lag
company: GitHub
title: Recovery Migration Delays Copilot Agent Starts
year: 2026
date: '2026-05-07'
duration: ~2 h
classes:
  - dependency
  - cascade
patterns:
  - recovery-induced-incident
  - replication-lag-throttling
  - safeguard-side-effect
  - background-job-dependency
  - incident-recovery-blast-radius
impact: >-
  For roughly two hours, Copilot Cloud Agent and Copilot Code Review Agent
  sessions on GitHub pull requests were delayed or failed to start, affecting
  developers relying on automated PR review and agent workflows.
trigger: >-
  A large database migration run as recovery work for a separate, earlier Pull
  Requests incident caused replication delays on several replica hosts.
mechanism: >-
  The recovery migration slowed replication to several replica hosts; even
  though those replicas weren't serving live traffic, an existing safeguard
  correctly read the elevated replication lag as a danger signal and throttled
  writes to the affected database cluster; that throttling delayed pull request
  background processing; that processing is what emits the internal events
  Copilot agents listen for to begin work, so agent sessions stalled until
  replication lag cleared and normal processing resumed.
lesson: >-
  Remediation steps taken to fix one incident, such as a large database
  migration, can themselves trip unrelated safeguards and create a secondary
  incident in loosely coupled downstream systems, so recovery actions deserve
  the same blast-radius scrutiny as normal deploys.
interview: >-
  When asked about safe incident recovery and cascading failures, discuss how
  well-intentioned recovery actions (like large migrations) can trigger
  legitimate safeguards that produce unintended secondary outages in downstream,
  seemingly unrelated services.
source: 'https://www.githubstatus.com/incidents/qp0lxr014sw8'
sourceLabel: GitHub Status incident report
source_quote: >-
  As part of that recovery, we ran a large database migration, which caused
  replication delays on several replica hosts.
archive_url: ''
date_added: '2026-07-17'
last_verified: '2026-07-17'
verified: false
---
