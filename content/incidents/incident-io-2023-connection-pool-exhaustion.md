---
id: incident-io-2023-connection-pool-exhaustion
company: incident.io
title: Unnecessary Slack transactions starved database connection pool
year: 2023
date: '2023-02-01'
duration: ~2 weeks of intermittent timeouts
classes:
  - resource-exhaustion
patterns:
  - connection-pool-starvation
  - unnecessary-transaction-scope
  - slow-investigation-without-observability
  - whack-a-mole-debugging
  - intermittent-hard-to-reproduce
impact: >-
  incident.io's API experienced intermittent 20-second timeouts over two weeks
  in early 2023, causing customers to see request failures whenever connection
  pool slots were fully occupied.
trigger: >-
  Every submission of a Slack modal (the /inc slash command confirmation) was
  silently opening a database transaction for the full duration of the request,
  holding a connection pool slot even when no transactional guarantees were
  needed.
mechanism: >-
  High volumes of concurrent Slack modal submissions each held a connection pool
  slot for their full duration → all available connections were consumed → other
  API requests queued waiting for a connection → requests hit the 20-second
  timeout and failed; the intermittent nature made root cause identification
  difficult across 24 separate fix attempts over two weeks.
lesson: >-
  Instrument your database connection pool with per-operation duration metrics
  before an incident forces you to — connection pool exhaustion from many
  unnecessary short transactions is invisible without that data, and the root
  cause will look like a general slowdown with no obvious culprit.
interview: >-
  How would you design observability for a shared database connection pool to
  identify which endpoints hold connections the longest and set meaningful
  exhaustion alerts?
source: 'https://incident.io/blog/database-performance'
sourceLabel: incident.io Engineering Blog
source_quote: >-
  It was many short transactions that, when added together, caused us some real
  problems.
archive_url: ''
date_added: '2026-06-27'
last_verified: '2026-06-27'
verified: false
---
