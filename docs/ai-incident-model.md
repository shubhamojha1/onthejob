# AI production-incident model

AI, generative AI, and recommendation systems extend the archive's subject matter; they do
not replace its causal model. Classify them under the existing failure topics and use
`patterns` for reusable control gaps. Put model type, serving surface, and observable harm in
the incident narrative where readers can see the evidence and context.

For example, a retrieval-backed assistant that ships a stale index can still be a
`bad-deploy`. Its trigger, mechanism, impact, and lesson should explain the retrieval and
quality details without creating a parallel AI taxonomy.

## Eligibility

Include a case only when all of these are true:

1. It happened in a production or production-adjacent system—not merely in a benchmark,
   paper, red-team demonstration, or hypothetical threat model.
2. The source documents observable user, business, safety, security, or operational impact.
3. There is enough evidence to state a trigger, causal mechanism, and transferable lesson.
4. The catalogued source is public, attributable, and primary: an operator postmortem,
   operator status report, engineering report, or regulator filing. Secondary reporting may
   help discovery, but it is not sufficient as the incident's source.

Availability is not required. A model or recommender that stayed online while producing
materially wrong, unsafe, private, unfair, or unexpectedly expensive output can still be a
production incident.

## Pattern discipline

Do not create patterns such as `ai-failure`, `hallucination`, or `recommendation-incident`:
they identify a technology or symptom, not a reusable control gap. Prefer causal terms such as
`training-serving-skew`, `stale-retrieval-index`, `unbounded-feedback-loop`,
`missing-online-evaluation`, `provider-fallback-mismatch`, `model-version-drift`,
`prompt-tool-boundary-failure`, or `token-cost-runaway` when the evidence supports them.

Before promoting a new pattern into the canonical vocabulary, check whether an existing
generic pattern already describes the mechanism. Model-provider failure may simply be a
dependency failure; an unsafe global model rollout may still be `no-staged-rollout`.

## Current catalog rule

AI incidents use the same schema, topic filters, cards, search, and related-incident logic as
every other incident. Add a new field only after the source corpus demonstrates a user-facing
need that the existing narrative and topic model cannot serve.
