# Pattern vocabulary consolidation — proposal

**Status: not applied. Snapshot: pre-AI seed batch (35 incidents).** No incident
pattern values have been changed. This document preserves the consolidation proposal
for that corpus so the vocabulary can be argued with before any rewrite.

## Why

The `patterns:` field grew one incident at a time with no registry. The result is
127 distinct tags across 35 incidents, 123 of them used exactly once.
That is descriptive prose, not a taxonomy — it cannot back a `/pattern/:tag` route,
because 123 of the pages would show a single incident.

Failure classes stay as they are. Classes answer *what kind of outage was this*;
patterns should answer *what specifically went wrong that you could have prevented*.
Tags that merely restate a class are dropped rather than renamed.

## Proposed vocabulary — 27 patterns

### `latent-bug-at-threshold` — 9 incidents

Code that had always been wrong met the input that exposed it.

Absorbs: `latent-bug`, `latent-bug-at-scale-threshold`, `integer-overflow`, `dead-tuple-index-bloat`, `react-dependency-array-bug`, `read-replica-misrouting`, `unnecessary-transaction-scope`, `unsanitized-api-output-to-zone-file`, `wal-preallocation-surprise`

### `resource-contention` — 8 incidents

One hot resource — table, node, queue, lock — starved everything else.

Absorbs: `contention`, `shared-resource-contention`, `shared-database-contention`, `shared-queue-capacity`, `single-hot-table`, `master-database-hotspot`, `node-level-noisy-neighbor`, `runaway-query`, `control-plane-overload`

### `hidden-dependency` — 7 incidents

A coupling nobody had modelled, found during the incident.

Absorbs: `hidden-coupling-through-migration`, `hidden-third-party-dependency`, `hidden-topology-assumption`, `implicit-guarantee-mismatch`, `infrastructure-migration-surprise`, `migration-breaks-dns`, `provider-automation`

### `retry-amplification` — 6 incidents

Clients retrying turned a small fault into a load problem.

Absorbs: `retry-storm`, `retry-amplification`, `missing-retry-circuit-breaker`, `feedback-loop`, `request-queueing-cascade`, `uncached-nxdomain-amplification`, `async-event-backlog`

### `no-staged-rollout` — 6 incidents

A change reached every host, region, or customer at once.

Absorbs: `no-staged-rollout`, `missing-staged-rollout`, `no-staged-config-rollout`, `config-management-partial-restart`, `partial-deploy`, `routing-change`

### `slow-manual-recovery` — 5 incidents

Coming back required slow human work the runbook did not cover.

Absorbs: `slow-restart`, `recovery-blocked`, `manual-state-repair`, `manual-blocking-required`, `multi-phase-remediation`, `missing-operational-tooling`

### `shared-failure-domain` — 5 incidents

Independent-looking systems sat on one thing that could fail.

Absorbs: `shared-failure-domain`, `shared-internal-dependency`, `single-point-of-failure`, `control-plane-as-spof`, `authorization-service-shared-fate`

### `tooling-shared-fate` — 5 incidents

The tools needed to diagnose, deploy, or communicate went down too.

Absorbs: `internal-tools-down`, `monitoring-shared-fate`, `status-page-dependency`, `status-page-shared-fate`, `deployment-pipeline-dependency`

### `unbounded-blast-radius` — 5 incidents

One fault was allowed to reach far more than it needed to.

Absorbs: `global-blast-radius`, `regional-blast-radius`, `single-site-blast-radius`, `cellular-blast-radius-containment`

### `missing-change-validation` — 5 incidents

Nothing checked the change against reality before it shipped.

Absorbs: `missing-config-validation`, `missing-upgrade-validation`, `no-full-validation-between-deploys`, `no-realistic-load-testing`, `silent-config-downgrade`, `untested-backups`

### `no-kill-switch` — 5 incidents

No fast way to stop the harmful behaviour once it started.

Absorbs: `no-kill-switch`, `no-break-glass-automation`, `removed-safeguard`, `missing-removal-throttle`, `throttle-misfire`

### `missing-observability` — 4 incidents

The data needed to see or diagnose the problem was not there.

Absorbs: `slow-investigation-without-observability`, `whack-a-mole-debugging`, `wrong-hypothesis-first`, `intermittent-hard-to-reproduce`, `undetected-traffic-surge`, `workload-profile-blind-spot`

### `recovery-stampede` — 4 incidents

Everything came back at once and knocked the system over again.

Absorbs: `thundering-herd-on-recovery`, `thundering-herd-on-restart`, `reconnect-storm`, `recovery-surge`, `upstream-recovery`, `queue-collapse`

### `health-check-misjudgment` — 4 incidents

The health signal was wrong, and the routing layer believed it.

Absorbs: `health-check-flapping`, `health-check-false-positive`, `health-check-misconfiguration`, `aggressive-timeout`, `routing-layer-over-trust`

### `capacity-too-slow-to-scale` — 4 incidents

Capacity existed but could not arrive fast enough to matter.

Absorbs: `slow-autoscaling`, `slow-node-provisioning`, `scaling-misconfig`, `no-minimum-capacity-guardrail`

### `failover-harm` — 4 incidents

The failover mechanism caused or deepened the outage.

Absorbs: `automated-failover`, `failover-bug`, `quorum-loss`, `quorum-loss-from-overload`

### `mitigation-made-it-worse` — 3 incidents

The action taken during the incident caused new damage.

Absorbs: `mitigation-creates-new-failure`, `bad-patch-during-incident`, `rollback-makes-it-worse`

### `external-traffic-event` — 3 incidents

Load or hostility originating outside the system.

Absorbs: `known-traffic-event`, `customer-triggered`, `no-ddos-mitigation-vendor`

### `rollback-blocked` — 2 incidents

Undoing the change was slow, impossible, or one-way.

Absorbs: `backwards-incompatible-migration`, `slow-manual-rollback`

### `pool-exhaustion` — 2 incidents

A bounded pool of connections or descriptors ran out.

Absorbs: `connection-pool-overload`, `connection-pool-starvation`

### `state-divergence` — 2 incidents

Replicas or counters disagreed, and the disagreement escaped.

Absorbs: `async-replication`, `cross-region`, `follower-promotion-state-divergence`, `user-visible-internal-counter`

### `circular-dependency` — 2 incidents

Recovery required the very system that was down.

Absorbs: `circular-dependency`, `circular-dns-dependency`

### `operator-error` — 2 incidents

A human action with no guardrail between it and production.

Absorbs: `operator-error`, `manual-step`

### `expiry-not-tracked` — 1 incident

Something with an expiry date expired unnoticed.

Absorbs: `cert-expiry-outage`, `insufficient-expiry-alerting`

### `known-risk-not-actioned` — 1 incident

The team knew about the risk and the fix did not land in time.

Absorbs: `known-fix-not-applied-in-time`

### `slow-incident-communication` — 1 incident

Users learned what was happening far later than they should have.

Absorbs: `slow-incident-communication`

### `dead-code-reactivated` — 1 incident

Retired code or a reused flag came back to life in production.

Absorbs: `dead-code`, `reused-flag`

## Dropped tags

- `cascade` — restates the cascade failure class
- `compounding-failures` — restates the cascade failure class
- `downstream-service-cascade` — restates the cascade failure class
- `cascading-latency-to-adjacent-services` — restates the cascade failure class
- `thundering-herd` — restates the thundering-herd failure class
- `resource-exhaustion-backpressure` — restates the resource-exhaustion failure class
- `bgp-withdrawal` — restates the dns-bgp failure class
- `partial-service-degradation` — describes impact, not a pattern
- `load-shedding-as-mitigation` — describes the remedy, not the failure

## Full mapping (127 tags)

| Current tag | Proposed | Note |
| --- | --- | --- |
| `aggressive-timeout` | `health-check-misjudgment` |  |
| `async-event-backlog` | `retry-amplification` |  |
| `async-replication` | `state-divergence` |  |
| `authorization-service-shared-fate` | `shared-failure-domain` |  |
| `automated-failover` | `failover-harm` |  |
| `backwards-incompatible-migration` | `rollback-blocked` |  |
| `bad-patch-during-incident` | `mitigation-made-it-worse` |  |
| `bgp-withdrawal` | — *dropped* | restates the dns-bgp failure class |
| `cascade` | — *dropped* | restates the cascade failure class |
| `cascading-latency-to-adjacent-services` | — *dropped* | restates the cascade failure class |
| `cellular-blast-radius-containment` | `unbounded-blast-radius` |  |
| `cert-expiry-outage` | `expiry-not-tracked` |  |
| `circular-dependency` | `circular-dependency` |  |
| `circular-dns-dependency` | `circular-dependency` |  |
| `compounding-failures` | — *dropped* | restates the cascade failure class |
| `config-management-partial-restart` | `no-staged-rollout` |  |
| `connection-pool-overload` | `pool-exhaustion` |  |
| `connection-pool-starvation` | `pool-exhaustion` |  |
| `contention` | `resource-contention` |  |
| `control-plane-as-spof` | `shared-failure-domain` |  |
| `control-plane-overload` | `resource-contention` |  |
| `cross-region` | `state-divergence` |  |
| `customer-triggered` | `external-traffic-event` |  |
| `dead-code` | `dead-code-reactivated` |  |
| `dead-tuple-index-bloat` | `latent-bug-at-threshold` |  |
| `deployment-pipeline-dependency` | `tooling-shared-fate` |  |
| `downstream-service-cascade` | — *dropped* | restates the cascade failure class |
| `failover-bug` | `failover-harm` |  |
| `feedback-loop` | `retry-amplification` |  |
| `follower-promotion-state-divergence` | `state-divergence` |  |
| `global-blast-radius` | `unbounded-blast-radius` |  |
| `health-check-false-positive` | `health-check-misjudgment` |  |
| `health-check-flapping` | `health-check-misjudgment` |  |
| `health-check-misconfiguration` | `health-check-misjudgment` |  |
| `hidden-coupling-through-migration` | `hidden-dependency` |  |
| `hidden-third-party-dependency` | `hidden-dependency` |  |
| `hidden-topology-assumption` | `hidden-dependency` |  |
| `implicit-guarantee-mismatch` | `hidden-dependency` |  |
| `infrastructure-migration-surprise` | `hidden-dependency` |  |
| `insufficient-expiry-alerting` | `expiry-not-tracked` |  |
| `integer-overflow` | `latent-bug-at-threshold` |  |
| `intermittent-hard-to-reproduce` | `missing-observability` |  |
| `internal-tools-down` | `tooling-shared-fate` |  |
| `known-fix-not-applied-in-time` | `known-risk-not-actioned` |  |
| `known-traffic-event` | `external-traffic-event` |  |
| `latent-bug` | `latent-bug-at-threshold` |  |
| `latent-bug-at-scale-threshold` | `latent-bug-at-threshold` |  |
| `load-shedding-as-mitigation` | — *dropped* | describes the remedy, not the failure |
| `manual-blocking-required` | `slow-manual-recovery` |  |
| `manual-state-repair` | `slow-manual-recovery` |  |
| `manual-step` | `operator-error` |  |
| `master-database-hotspot` | `resource-contention` |  |
| `migration-breaks-dns` | `hidden-dependency` |  |
| `missing-config-validation` | `missing-change-validation` |  |
| `missing-operational-tooling` | `slow-manual-recovery` |  |
| `missing-removal-throttle` | `no-kill-switch` |  |
| `missing-retry-circuit-breaker` | `retry-amplification` |  |
| `missing-staged-rollout` | `no-staged-rollout` |  |
| `missing-upgrade-validation` | `missing-change-validation` |  |
| `mitigation-creates-new-failure` | `mitigation-made-it-worse` |  |
| `monitoring-shared-fate` | `tooling-shared-fate` |  |
| `multi-phase-remediation` | `slow-manual-recovery` |  |
| `no-break-glass-automation` | `no-kill-switch` |  |
| `no-ddos-mitigation-vendor` | `external-traffic-event` |  |
| `no-full-validation-between-deploys` | `missing-change-validation` |  |
| `no-kill-switch` | `no-kill-switch` |  |
| `no-minimum-capacity-guardrail` | `capacity-too-slow-to-scale` |  |
| `no-realistic-load-testing` | `missing-change-validation` |  |
| `no-staged-config-rollout` | `no-staged-rollout` |  |
| `no-staged-rollout` | `no-staged-rollout` |  |
| `node-level-noisy-neighbor` | `resource-contention` |  |
| `operator-error` | `operator-error` |  |
| `partial-deploy` | `no-staged-rollout` |  |
| `partial-service-degradation` | — *dropped* | describes impact, not a pattern |
| `provider-automation` | `hidden-dependency` |  |
| `queue-collapse` | `recovery-stampede` |  |
| `quorum-loss` | `failover-harm` |  |
| `quorum-loss-from-overload` | `failover-harm` |  |
| `react-dependency-array-bug` | `latent-bug-at-threshold` |  |
| `read-replica-misrouting` | `latent-bug-at-threshold` |  |
| `reconnect-storm` | `recovery-stampede` |  |
| `recovery-blocked` | `slow-manual-recovery` |  |
| `recovery-surge` | `recovery-stampede` |  |
| `regional-blast-radius` | `unbounded-blast-radius` |  |
| `removed-safeguard` | `no-kill-switch` |  |
| `request-queueing-cascade` | `retry-amplification` |  |
| `resource-exhaustion-backpressure` | — *dropped* | restates the resource-exhaustion failure class |
| `retry-amplification` | `retry-amplification` |  |
| `retry-storm` | `retry-amplification` |  |
| `reused-flag` | `dead-code-reactivated` |  |
| `rollback-makes-it-worse` | `mitigation-made-it-worse` |  |
| `routing-change` | `no-staged-rollout` |  |
| `routing-layer-over-trust` | `health-check-misjudgment` |  |
| `runaway-query` | `resource-contention` |  |
| `scaling-misconfig` | `capacity-too-slow-to-scale` |  |
| `shared-database-contention` | `resource-contention` |  |
| `shared-failure-domain` | `shared-failure-domain` |  |
| `shared-internal-dependency` | `shared-failure-domain` |  |
| `shared-queue-capacity` | `resource-contention` |  |
| `shared-resource-contention` | `resource-contention` |  |
| `silent-config-downgrade` | `missing-change-validation` |  |
| `single-hot-table` | `resource-contention` |  |
| `single-point-of-failure` | `shared-failure-domain` |  |
| `single-site-blast-radius` | `unbounded-blast-radius` |  |
| `slow-autoscaling` | `capacity-too-slow-to-scale` |  |
| `slow-incident-communication` | `slow-incident-communication` |  |
| `slow-investigation-without-observability` | `missing-observability` |  |
| `slow-manual-rollback` | `rollback-blocked` |  |
| `slow-node-provisioning` | `capacity-too-slow-to-scale` |  |
| `slow-restart` | `slow-manual-recovery` |  |
| `status-page-dependency` | `tooling-shared-fate` |  |
| `status-page-shared-fate` | `tooling-shared-fate` |  |
| `throttle-misfire` | `no-kill-switch` |  |
| `thundering-herd` | — *dropped* | restates the thundering-herd failure class |
| `thundering-herd-on-recovery` | `recovery-stampede` |  |
| `thundering-herd-on-restart` | `recovery-stampede` |  |
| `uncached-nxdomain-amplification` | `retry-amplification` |  |
| `undetected-traffic-surge` | `missing-observability` |  |
| `unnecessary-transaction-scope` | `latent-bug-at-threshold` |  |
| `unsanitized-api-output-to-zone-file` | `latent-bug-at-threshold` |  |
| `untested-backups` | `missing-change-validation` |  |
| `upstream-recovery` | `recovery-stampede` |  |
| `user-visible-internal-counter` | `state-divergence` |  |
| `wal-preallocation-surprise` | `latent-bug-at-threshold` |  |
| `whack-a-mole-debugging` | `missing-observability` |  |
| `workload-profile-blind-spot` | `missing-observability` |  |
| `wrong-hypothesis-first` | `missing-observability` |  |

## Verification

- Every tag in the 35-incident snapshot is accounted for: yes
- Incidents left with zero patterns: 0
- Patterns per incident after mapping: min 1, max 5
- Proposed tags backing only one incident: 4 (`expiry-not-tracked`, `known-risk-not-actioned`, `slow-incident-communication`, `dead-code-reactivated`)

## Judgment calls worth challenging

- `untested-backups` folded into `missing-change-validation`. Defensible — an
  untested restore path is an unvalidated change — but it loses a distinct and
  well-known failure mode. Splitting it back out costs one singleton.
- `cellular-blast-radius-containment` describes containment working, not failing,
  and sits under `unbounded-blast-radius` awkwardly.
- `external-traffic-event` mixes benign load spikes with deliberate attacks.
  Splitting gives `traffic-spike` and `malicious-traffic`, both small.
- 4 proposed tags still back a single incident. They are honest
  categories that the archive has not yet filled; folding them further would make
  the vocabulary vaguer, not better.
