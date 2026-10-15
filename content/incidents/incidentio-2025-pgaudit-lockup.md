---
id: incidentio-2025-pgaudit-lockup
company: incident.io
title: PGAudit lock-up stalls database after Postgres 17 upgrade
year: 2025
date: '2025-04-09'
duration: 11 min (incl. 2 min hard outage)
classes:
  - cascade
  - resource-exhaustion
  - config-change
patterns:
  - lock-contention
  - unkillable-process
  - post-upgrade-extension-regression
  - forced-restart-mitigation
  - cross-surface-slowness
impact: >-
  incident.io's dashboard, mobile app, Slack app, and API experienced
  intermittent slowness for about 11 minutes, ending in a 2-minute full database
  outage, though on-call alerting stayed operational throughout.
trigger: >-
  A routine database migration to create an empty table and add an index
  triggered an unexpected interaction with the PGAudit extension, which had been
  re-enabled after a Postgres 17 upgrade the prior weekend.
mechanism: >-
  PGAudit became unresponsive while holding critical database locks; engineers
  tried killing the offending processes but they ignored timeout signals, so the
  locks never released; the held locks blocked other database operations,
  cascading into intermittent slowness across all client-facing surfaces; when
  kill attempts kept failing and timeouts kept climbing, engineers forced a
  database restart, which cleared the stuck process but caused about two minutes
  of hard downtime.
lesson: >-
  When a process holds critical locks and refuses to respond to termination
  signals, don't keep retrying graceful kills — escalate quickly to a decisive,
  if disruptive, recovery action like a full restart.
interview: >-
  When asked about safe extension or major-version database upgrades, discuss
  how re-enabling auxiliary extensions like audit logging can silently introduce
  lock-holding regressions, and how to design fast escalation paths when a stuck
  process won't release locks.
source: 'https://status.incident.io/incidents/01JRDFKAGE07YYDY0KZR137BX3/write-up'
sourceLabel: incident.io status page write-up
source_quote: >-
  On Wednesday afternoon at 14:16 UTC, a routine database migration (to create
  an empty table and add an index) triggered an unexpected interaction with
  PGAudit causing the extension to become unresponsive while holding critical
  database locks.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
