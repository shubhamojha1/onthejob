---
id: circleci-2025-waf-misconfiguration
company: CircleCI
title: Manual Off-Pipeline WAF Change Blocks All Traffic
year: 2025
date: '2025-04-04'
duration: 1 h 33 min
classes:
  - config-change
patterns:
  - iac-bypass-via-iam-gap
  - assumed-read-only-action-writes
  - drift-detection-lag
  - concurrent-incident-misattribution
  - pipeline-trust-blind-spot
impact: >-
  For roughly 90 minutes, all CircleCI customers lost access to the web UI and
  could not trigger new builds, halting CI/CD pipelines platform-wide.
trigger: >-
  An operator, during routine security monitoring, manually altered a WAF rule
  outside the Terraform pipeline while believing the action was read-only.
mechanism: >-
  The off-pipeline WAF edit began silently blocking legitimate traffic to
  api.circleci.com and circleci.com, producing frontend-backend connectivity
  failures and CORS errors; because engineers assumed all WAF changes went
  through Terraform, they discounted the WAF as a cause and chased other leads
  (further muddied by a just-resolved unrelated incident) until scheduled
  Terraform drift detection surfaced the configuration mismatch about 80 minutes
  in, enabling a quick revert.
lesson: >-
  An IaC pipeline is only as trustworthy as the IAM boundary around it — if any
  role can bypass it, responders will eventually rule out the real cause because
  'that always goes through Terraform,' so drift detection needs to be
  near-real-time, not just present.
interview: >-
  When asked how to keep infrastructure-as-code authoritative, discuss enforcing
  IAM restrictions against out-of-band writes and running continuous rather than
  periodic drift detection.
source: >-
  https://discuss.circleci.com/t/post-incident-report-april-4-2025-circleci-ui-loading-build-triggering-issues/53208
sourceLabel: CircleCI Discuss (post-incident report)
source_quote: >-
  As a result, while investigating routine security monitoring, an operator
  manually modified WAF configuration, believing they were taking read-only
  actions.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
