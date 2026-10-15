---
id: circleci-2023-kube-proxy-iptables
company: CircleCI
title: Kubernetes upgrade corrupts kube-proxy iptables rules
year: 2023
date: '2023-03-14'
duration: '~7.5 h (plus two follow-on RabbitMQ incidents through 13:15 UTC the next day)'
classes:
  - bad-deploy
  - cascade
  - dependency
patterns:
  - version-skew-rollback
  - iptables-corruption
  - misdiagnosis-before-root-cause
  - blind-restart-mitigation
  - cascading-follow-on-incidents
impact: >-
  All CircleCI customers experienced job start delays or failures across Docker,
  Mac, Machine, and Windows jobs, plus UI and Runner impact, for roughly 7.5
  hours, followed by two additional RabbitMQ-related incidents that delayed
  pipelines and GitHub checks over the next several hours.
trigger: >-
  During an in-progress Kubernetes cluster upgrade, a prior partial rollback of
  kube-proxy left it running a version mismatched with the rest of the cluster's
  components.
mechanism: >-
  The version mismatch caused kube-proxy's iptables-restore sync operations to
  intermittently fail; when the upgrade resumed and pods/Endpoints churned
  heavily, sync failures spiked and left iptables rulesets corrupted on multiple
  nodes, breaking service-to-service networking cluster-wide; engineers
  initially suspected DNS and made things briefly worse by restarting CoreDNS
  and node-local-dns-cache before isolating kube-proxy as the cause and
  restoring service via a full node-by-node restart, which in turn exposed a
  RabbitMQ logging gap and corrupted queues that triggered two subsequent
  incidents.
lesson: >-
  Mixed-version states introduced by partial rollbacks during multi-stage
  infrastructure upgrades can silently corrupt low-level node state even when
  service-level health metrics look fine, so upgrades need explicit
  compatibility checks and metrics for foundational components like kube-proxy,
  not just application-level monitoring.
interview: >-
  When asked to design a safe Kubernetes cluster upgrade process, discuss
  enforcing strict version compatibility between control-plane and per-node
  components, staged canary rollouts with automated rollback on sync-error
  metrics, and avoiding partial rollbacks that leave the cluster in an
  undetected mixed-version state.
source: 'https://status.circleci.com/incidents/dcqb3fykhgvg'
sourceLabel: CircleCI status page postmortem
source_quote: >-
  Between the two Kubernetes versions we were working with, the handling and
  format of kube-proxy's rulesets changed.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
