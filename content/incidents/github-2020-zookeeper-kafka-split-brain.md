---
id: github-2020-zookeeper-kafka-split-brain
company: GitHub
title: ZooKeeper Split-Brain Cascades Into Dueling Kafka Clusters
year: 2020
date: '2020-10-09'
duration: 2 h 32 min
classes:
  - split-brain
  - cascade
patterns:
  - split-brain-during-maintenance
  - leader-election-race
  - cross-system-cascade
  - redundancy-absorbed-backlog
  - unthrottled-node-provisioning
impact: >-
  Degraded availability for issues, pull requests, webhooks, GitHub Actions, and
  GitHub Pages, with roughly 10% of writes to GitHub's internal background job
  service failing for over two and a half hours.
trigger: >-
  During a routine ZooKeeper upgrade, new hosts were reprovisioned too quickly,
  triggering the election of a second ZooKeeper leader and forming a logically
  separate second cluster.
mechanism: >-
  The unintended second ZooKeeper cluster caused a Kafka broker in the
  background-job pipeline to connect to it and elect itself controller,
  producing two Kafka clusters that gave clients conflicting state; this led to
  write failures for about 10% of background job requests, which backed up
  queues while traffic and workers were shifted to a secondary job-processing
  system.
lesson: >-
  Coordination-service maintenance (adding nodes to a quorum system like
  ZooKeeper) needs rate-limited, automated rollout controls, since manual pacing
  can trigger split-brain leader elections that silently fork dependent systems
  downstream.
interview: >-
  When asked about safe operation of quorum-based coordination systems, discuss
  why node provisioning rate limits and leader-election safeguards matter, and
  how dependent systems (like a Kafka cluster) can inherit a split-brain state.
source: >-
  https://github.blog/news-insights/company-news/github-availability-report-october-2020/
sourceLabel: GitHub Availability Report
source_quote: >-
  While reprovisioning ZooKeeper nodes as a part of routine upgrades, new hosts
  were introduced too quickly, which resulted in the election of a second
  leader, effectively introducing a logically distinct second ZooKeeper cluster
  where there should have been only one.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
