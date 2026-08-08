---
id: github-2026-actions-invalid-job-assignment
company: GitHub
title: GitHub Actions Runners Stuck Retrying Invalid Jobs
year: 2026
date: '2026-08-06'
duration: 10 h 42 min
classes:
  - cascade
  - automation-misfire
  - thundering-herd
patterns:
  - stale-job-assignment
  - retry-storm
  - recovery-throttling
  - multi-service-blast-radius
  - manual-pod-recovery-required
impact: >-
  A global, roughly 10.5-hour outage degraded GitHub Actions, Pages, Copilot
  code review, Copilot coding agent, webhook delivery, and Enterprise Importer
  migrations, with workflow success rates dropping to as low as 30-40% at the
  worst point.
trigger: >-
  GitHub-hosted and self-hosted Actions runners began being assigned jobs that
  were no longer valid.
mechanism: >-
  Runners picked up stale job assignments and got stuck retrying work that no
  longer existed, which backed up global and per-customer job queues; to protect
  recovery capacity, GitHub throttled webhook deliveries down to roughly 15% of
  normal volume, which in turn stopped many push and pull-request events from
  triggering new workflow runs; the strain also degraded dependent services
  (Pages, Copilot code review, Copilot coding agent) and forced GitHub to pause
  Enterprise Importer migrations; engineers shipped sequential fixes for the
  invalid job assignment, then for self-hosted runners that still weren't
  picking up jobs, before gradually restoring webhook throughput and draining
  the backlog.
lesson: >-
  When workers can be assigned stale or invalid work after a partial failure,
  the safe fix is often to throttle the intake pipeline to protect recovery —
  but that tradeoff has its own blast radius, so job assignment should use
  fencing/generation tokens to prevent stale-job pickup in the first place, and
  triggering events should be durably queued or replayable rather than silently
  dropped.
interview: >-
  When discussing distributed job queues, bring up fencing tokens or generation
  numbers on job assignment to stop workers from executing stale work after a
  rebalance, and separately discuss making event-driven triggers (like webhooks)
  replayable so throttling them for stability doesn't cause silent data loss.
source: 'https://www.githubstatus.com/incidents/qcvjkzcs7j74'
sourceLabel: GitHub Status incident report
source_quote: >-
  We identified runners being assigned jobs that are no longer valid and are
  deploying a change to address this issue.
archive_url: ''
date_added: '2026-08-08'
last_verified: '2026-08-08'
verified: false
---
