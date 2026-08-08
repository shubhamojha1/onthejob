/**
 * Regenerates content/patterns-proposal.md from the mapping below.
 * Read-only with respect to content/incidents/ — this proposes a vocabulary,
 * it does not apply one. Run: npx tsx scripts/patterns-proposal.ts
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadIncidentCorpus } from './lib/incidents.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const incidents = loadIncidentCorpus()

const GROUPS: Record<string, { desc: string; tags: string[] }> = {
  'no-staged-rollout': {
    desc: 'A change reached every host, region, or customer at once.',
    tags: ['no-staged-rollout', 'missing-staged-rollout', 'no-staged-config-rollout',
      'config-management-partial-restart', 'partial-deploy', 'routing-change'],
  },
  'missing-change-validation': {
    desc: 'Nothing checked the change against reality before it shipped.',
    tags: ['missing-config-validation', 'missing-upgrade-validation', 'no-full-validation-between-deploys',
      'no-realistic-load-testing', 'silent-config-downgrade', 'untested-backups'],
  },
  'rollback-blocked': {
    desc: 'Undoing the change was slow, impossible, or one-way.',
    tags: ['backwards-incompatible-migration', 'slow-manual-rollback'],
  },
  'no-kill-switch': {
    desc: 'No fast way to stop the harmful behaviour once it started.',
    tags: ['no-kill-switch', 'no-break-glass-automation', 'removed-safeguard',
      'missing-removal-throttle', 'throttle-misfire'],
  },
  'unbounded-blast-radius': {
    desc: 'One fault was allowed to reach far more than it needed to.',
    tags: ['global-blast-radius', 'regional-blast-radius', 'single-site-blast-radius',
      'cellular-blast-radius-containment'],
  },
  'shared-failure-domain': {
    desc: 'Independent-looking systems sat on one thing that could fail.',
    tags: ['shared-failure-domain', 'shared-internal-dependency', 'single-point-of-failure',
      'control-plane-as-spof', 'authorization-service-shared-fate'],
  },
  'circular-dependency': {
    desc: 'Recovery required the very system that was down.',
    tags: ['circular-dependency', 'circular-dns-dependency'],
  },
  'hidden-dependency': {
    desc: 'A coupling nobody had modelled, found during the incident.',
    tags: ['hidden-coupling-through-migration', 'hidden-third-party-dependency',
      'hidden-topology-assumption', 'implicit-guarantee-mismatch',
      'infrastructure-migration-surprise', 'migration-breaks-dns', 'provider-automation'],
  },
  'tooling-shared-fate': {
    desc: 'The tools needed to diagnose, deploy, or communicate went down too.',
    tags: ['internal-tools-down', 'monitoring-shared-fate', 'status-page-dependency',
      'status-page-shared-fate', 'deployment-pipeline-dependency'],
  },
  'retry-amplification': {
    desc: 'Clients retrying turned a small fault into a load problem.',
    tags: ['retry-storm', 'retry-amplification', 'missing-retry-circuit-breaker', 'feedback-loop',
      'request-queueing-cascade', 'uncached-nxdomain-amplification', 'async-event-backlog'],
  },
  'recovery-stampede': {
    desc: 'Everything came back at once and knocked the system over again.',
    tags: ['thundering-herd-on-recovery', 'thundering-herd-on-restart', 'reconnect-storm',
      'recovery-surge', 'upstream-recovery', 'queue-collapse'],
  },
  'resource-contention': {
    desc: 'One hot resource — table, node, queue, lock — starved everything else.',
    tags: ['contention', 'shared-resource-contention', 'shared-database-contention',
      'shared-queue-capacity', 'single-hot-table', 'master-database-hotspot',
      'node-level-noisy-neighbor', 'runaway-query', 'control-plane-overload'],
  },
  'capacity-too-slow-to-scale': {
    desc: 'Capacity existed but could not arrive fast enough to matter.',
    tags: ['slow-autoscaling', 'slow-node-provisioning', 'scaling-misconfig',
      'no-minimum-capacity-guardrail'],
  },
  'pool-exhaustion': {
    desc: 'A bounded pool of connections or descriptors ran out.',
    tags: ['connection-pool-overload', 'connection-pool-starvation'],
  },
  'health-check-misjudgment': {
    desc: 'The health signal was wrong, and the routing layer believed it.',
    tags: ['health-check-flapping', 'health-check-false-positive', 'health-check-misconfiguration',
      'aggressive-timeout', 'routing-layer-over-trust'],
  },
  'failover-harm': {
    desc: 'The failover mechanism caused or deepened the outage.',
    tags: ['automated-failover', 'failover-bug', 'quorum-loss', 'quorum-loss-from-overload'],
  },
  'state-divergence': {
    desc: 'Replicas or counters disagreed, and the disagreement escaped.',
    tags: ['async-replication', 'cross-region', 'follower-promotion-state-divergence',
      'user-visible-internal-counter'],
  },
  'latent-bug-at-threshold': {
    desc: 'Code that had always been wrong met the input that exposed it.',
    tags: ['latent-bug', 'latent-bug-at-scale-threshold', 'integer-overflow', 'dead-tuple-index-bloat',
      'react-dependency-array-bug', 'read-replica-misrouting', 'unnecessary-transaction-scope',
      'unsanitized-api-output-to-zone-file', 'wal-preallocation-surprise'],
  },
  'dead-code-reactivated': {
    desc: 'Retired code or a reused flag came back to life in production.',
    tags: ['dead-code', 'reused-flag'],
  },
  'expiry-not-tracked': {
    desc: 'Something with an expiry date expired unnoticed.',
    tags: ['cert-expiry-outage', 'insufficient-expiry-alerting'],
  },
  'external-traffic-event': {
    desc: 'Load or hostility originating outside the system.',
    tags: ['known-traffic-event', 'customer-triggered', 'no-ddos-mitigation-vendor'],
  },
  'known-risk-not-actioned': {
    desc: 'The team knew about the risk and the fix did not land in time.',
    tags: ['known-fix-not-applied-in-time'],
  },
  'operator-error': {
    desc: 'A human action with no guardrail between it and production.',
    tags: ['operator-error', 'manual-step'],
  },
  'missing-observability': {
    desc: 'The data needed to see or diagnose the problem was not there.',
    tags: ['slow-investigation-without-observability', 'whack-a-mole-debugging', 'wrong-hypothesis-first',
      'intermittent-hard-to-reproduce', 'undetected-traffic-surge', 'workload-profile-blind-spot'],
  },
  'mitigation-made-it-worse': {
    desc: 'The action taken during the incident caused new damage.',
    tags: ['mitigation-creates-new-failure', 'bad-patch-during-incident', 'rollback-makes-it-worse'],
  },
  'slow-manual-recovery': {
    desc: 'Coming back required slow human work the runbook did not cover.',
    tags: ['slow-restart', 'recovery-blocked', 'manual-state-repair', 'manual-blocking-required',
      'multi-phase-remediation', 'missing-operational-tooling'],
  },
  'slow-incident-communication': {
    desc: 'Users learned what was happening far later than they should have.',
    tags: ['slow-incident-communication'],
  },
}

// Tags that restate a failure class, or describe impact/remedy rather than pattern.
const DROP: Record<string, string> = {
  'cascade': 'restates the cascade failure class',
  'compounding-failures': 'restates the cascade failure class',
  'downstream-service-cascade': 'restates the cascade failure class',
  'cascading-latency-to-adjacent-services': 'restates the cascade failure class',
  'thundering-herd': 'restates the thundering-herd failure class',
  'resource-exhaustion-backpressure': 'restates the resource-exhaustion failure class',
  'bgp-withdrawal': 'restates the dns-bgp failure class',
  'partial-service-degradation': 'describes impact, not a pattern',
  'load-shedding-as-mitigation': 'describes the remedy, not the failure',
}

// ── Invert and verify ────────────────────────────────────────────────────
const toNew = new Map<string, string>()
for (const [target, { tags }] of Object.entries(GROUPS)) {
  for (const t of tags) {
    if (toNew.has(t)) throw new Error(`${t} assigned twice: ${toNew.get(t)} and ${target}`)
    toNew.set(t, target)
  }
}

const oldTags = new Set(incidents.flatMap(i => i.patterns))
const unassigned = [...oldTags].filter(t => !toNew.has(t) && !(t in DROP))
const phantom = [...toNew.keys(), ...Object.keys(DROP)].filter(t => !oldTags.has(t))

const newPatterns = new Map<string, string[]>()
const orphanIncidents: string[] = []
for (const i of incidents) {
  const mapped = [...new Set(i.patterns.map(p => toNew.get(p)).filter(Boolean) as string[])]
  if (mapped.length === 0) orphanIncidents.push(i.id)
  for (const p of mapped) newPatterns.set(p, [...(newPatterns.get(p) ?? []), i.id])
}

console.log(`old tags:        ${oldTags.size}`)
console.log(`new vocabulary:  ${Object.keys(GROUPS).length}`)
console.log(`dropped:         ${Object.keys(DROP).length}`)
console.log(`unassigned:      ${unassigned.length}${unassigned.length ? ' → ' + unassigned.join(', ') : ''}`)
console.log(`phantom (not in corpus): ${phantom.length}${phantom.length ? ' → ' + phantom.join(', ') : ''}`)
console.log(`incidents left with 0 patterns: ${orphanIncidents.length}${orphanIncidents.length ? ' → ' + orphanIncidents.join(', ') : ''}`)

const sizes = [...newPatterns].sort((a, b) => b[1].length - a[1].length)
const singles = sizes.filter(([, ids]) => ids.length === 1)
console.log(`new tags with 1 incident: ${singles.length} → ${singles.map(s => s[0]).join(', ')}`)
console.log(`patterns per incident: min ${Math.min(...incidents.map(i => new Set(i.patterns.map(p => toNew.get(p)).filter(Boolean)).size))} max ${Math.max(...incidents.map(i => new Set(i.patterns.map(p => toNew.get(p)).filter(Boolean)).size))}`)

// ── Emit the proposal ────────────────────────────────────────────────────
const rows = [...oldTags].sort().map(t => {
  const target = toNew.get(t)
  return `| \`${t}\` | ${target ? `\`${target}\`` : '— *dropped*'} | ${target ? '' : DROP[t]} |`
})

const vocab = sizes.map(([tag, ids]) =>
  `### \`${tag}\` — ${ids.length} incident${ids.length === 1 ? '' : 's'}\n\n${GROUPS[tag].desc}\n\nAbsorbs: ${GROUPS[tag].tags.map(t => `\`${t}\``).join(', ')}\n`,
).join('\n')

writeFileSync(join(ROOT, 'content', 'patterns-proposal.md'), `# Pattern vocabulary consolidation — proposal

**Status: not applied.** No incident pattern values have been changed. This
document exists so the vocabulary can be argued with before ${incidents.length} files are rewritten.

## Why

The \`patterns:\` field grew one incident at a time with no registry. The result is
${oldTags.size} distinct tags across ${incidents.length} incidents, ${[...oldTags].filter(t => incidents.filter(i => i.patterns.includes(t)).length === 1).length} of them used exactly once.
That is descriptive prose, not a taxonomy — it cannot back a \`/pattern/:tag\` route,
because ${[...oldTags].filter(t => incidents.filter(i => i.patterns.includes(t)).length === 1).length} of the pages would show a single incident.

Failure classes stay as they are. Classes answer *what kind of outage was this*;
patterns should answer *what specifically went wrong that you could have prevented*.
Tags that merely restate a class are dropped rather than renamed.

## Proposed vocabulary — ${Object.keys(GROUPS).length} patterns

${vocab}
## Dropped tags

${Object.entries(DROP).map(([t, why]) => `- \`${t}\` — ${why}`).join('\n')}

## Full mapping (${oldTags.size} tags)

| Current tag | Proposed | Note |
| --- | --- | --- |
${rows.join('\n')}

## Verification

- Every current tag is accounted for: ${unassigned.length === 0 ? 'yes' : 'NO — ' + unassigned.join(', ')}
- Incidents left with zero patterns: ${orphanIncidents.length}
- Patterns per incident after mapping: min ${Math.min(...incidents.map(i => new Set(i.patterns.map(p => toNew.get(p)).filter(Boolean)).size))}, max ${Math.max(...incidents.map(i => new Set(i.patterns.map(p => toNew.get(p)).filter(Boolean)).size))}
- Proposed tags backing only one incident: ${singles.length}${singles.length ? ' (' + singles.map(s => `\`${s[0]}\``).join(', ') + ')' : ''}

## Judgment calls worth challenging

- \`untested-backups\` folded into \`missing-change-validation\`. Defensible — an
  untested restore path is an unvalidated change — but it loses a distinct and
  well-known failure mode. Splitting it back out costs one singleton.
- \`cellular-blast-radius-containment\` describes containment working, not failing,
  and sits under \`unbounded-blast-radius\` awkwardly.
- \`external-traffic-event\` mixes benign load spikes with deliberate attacks.
  Splitting gives \`traffic-spike\` and \`malicious-traffic\`, both small.
- ${singles.length} proposed tags still back a single incident. They are honest
  categories that the archive has not yet filled; folding them further would make
  the vocabulary vaguer, not better.
`)
console.log('\n→ content/patterns-proposal.md')
