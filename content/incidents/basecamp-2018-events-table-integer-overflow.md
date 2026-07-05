---
id: basecamp-2018-events-table-integer-overflow
company: Basecamp
title: Primary key overflow on events table forces read-only mode
year: 2018
date: '2018-11-09'
duration: ~5 h
classes:
  - resource-exhaustion
patterns:
  - integer-overflow
  - known-fix-not-applied-in-time
  - single-hot-table
impact: >-
  Basecamp 3 was fully read-only for almost five hours, blocking all writes
  across the product — no new messages, todos, files, or edits — while reads
  continued to work.
trigger: >-
  The primary key on Basecamp's shared events table, which logs nearly every
  user action, hit the 32-bit integer ceiling of 2,147,483,647 and could no
  longer accept new rows.
mechanism: >-
  A single high-traffic events table tracking nearly all product activity used a
  32-bit integer primary key; the team was already mid-migration to widen it but
  ran out of headroom before finishing, and once the ceiling was hit every
  write-path action in the app failed simultaneously because it depended on
  writing to that table.
lesson: >-
  When a hot, shared table nears a known integer key ceiling, treat the
  migration as urgent and monitor actual headroom, not just awareness that a fix
  is 'in progress.'
interview: >-
  When asked about scaling a high-write table, discuss choosing 64-bit primary
  keys upfront and monitoring key-space headroom as a first-class production
  metric.
source: >-
  https://web.archive.org/web/20220529044310/https://m.signalvnoise.com/postmortem-on-the-read-only-outage-of-basecamp-on-november-9th-2018/
sourceLabel: 'Signal v. Noise (Basecamp blog, archived)'
source_quote: >-
  The root cause was that our database hit the ceiling of 2,147,483,647 on our
  very busy events table.
archive_url: ''
date_added: '2026-07-04'
last_verified: '2026-07-04'
verified: false
---
