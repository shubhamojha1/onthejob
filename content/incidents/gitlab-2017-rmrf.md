---
id: gitlab-2017-rmrf
company: GitLab
title: "rm -rf on the wrong database"
year: 2017
date: "2017-01-31"
duration: "~18h + permanent loss"
classes:
  - data-loss
  - automation-misfire
patterns:
  - operator-error
  - untested-backups
  - manual-step
impact: "~300GB of production database gone; six hours of issues, merge requests and users lost for good."
trigger: "An engineer fighting spam-induced replication lag ran a directory removal against what turned out to be the primary, not the replica."
mechanism: "The data vanished in seconds. Then the gut-punch: five of five backup and replication methods were broken or untested. A six-hour-old LVM snapshot, taken by luck, was the only thing that saved most of the data."
lesson: "Backups you've never restored are not backups. The deletion is the famous part; the broken recovery path is the real lesson."
interview: "Disaster recovery: define RPO/RTO and, above all, prove your restores actually work."
source: "https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/"
sourceLabel: "GitLab blog"
source_quote: ""
archive_url: ""
date_added: "2026-06-23"
verified: false
---
