---
id: aws-s3-2017-typo
company: AWS
title: "A typo took out us-east-1"
year: 2017
date: "2017-02-28"
duration: "~4h"
classes:
  - config-change
  - cascade
patterns:
  - operator-error
  - slow-restart
  - status-page-dependency
impact: "S3 in us-east-1 down for hours; thousands of dependent sites and services degraded — including AWS's own status dashboard."
trigger: "While debugging a billing-system slowdown, an engineer ran a playbook command with a mistyped parameter, removing far more capacity than intended."
mechanism: "Two core S3 subsystems (indexing and placement) required a full restart. They hadn't been fully restarted in years and took hours to come back; everything depending on S3 in the region degraded with them."
lesson: "Tooling should refuse to remove capacity below safe thresholds. And your status page must never depend on the thing that's down."
interview: "Blast-radius control: guardrails on destructive ops, plus out-of-band status reporting."
source: "https://aws.amazon.com/message/41926/"
sourceLabel: "AWS post-event summary"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
