# Incident extraction prompt

You are extracting structured data from a public engineering postmortem for onthejob.dev —
a curated index of real-world incidents organised by failure class.

## Task

Read the postmortem text below and output a **single JSON object**. No markdown, no code
fences, no explanation — the response must be parseable by `JSON.parse()` with nothing stripped.

## Output schema

```
{
  "id":          "<company>-<year>-<shortdesc>",
  "company":     "<Company name as it would appear on the site>",
  "title":       "<Short, memorable incident title — 4–10 words>",
  "year":        <4-digit integer — year the incident occurred>,
  "date":        "<YYYY-MM-DD — incident start date>",
  "duration":    "<Human string, e.g. '27 min' or '~4 h' or '18 h'>",
  "classes":     ["<class>"],
  "patterns":    ["<pattern>"],
  "impact":      "<One sentence on blast radius — what broke, who was affected, rough scale>",
  "trigger":     "<The immediate event that initiated the incident>",
  "mechanism":   "<How the failure propagated — cause → effect → effect>",
  "lesson":      "<The single most transferable engineering insight from this incident>",
  "interview":   "<The system design interview question this incident would generate>",
  "source":      "<canonical URL — use the URL provided, do not change it>",
  "sourceLabel": "<Human-readable label, e.g. 'Cloudflare blog' or 'AWS post-event summary'>",
  "source_quote": "<One sentence quoted verbatim from the postmortem that grounds the extraction>",
  "tweet":       "<Standalone tweet, <=280 chars, announcing this incident writeup>",
  "confidence":  "high" | "medium" | "low"
}
```

### Field rules

**id** — lowercase kebab-case, format `<company>-<year>-<shortdesc>`. Example: `github-2024-mysql-failover`.

**classes[]** — 1 to 3 values. MUST be chosen ONLY from this exact list — no other values are valid:

- `split-brain` — A partition leaves two nodes both acting as primary; writes diverge.
- `cascade` — One component's failure overloads its neighbors until the system folds.
- `thundering-herd` — A synchronized surge (retries, reconnects, cache stampede) buries a resource.
- `config-change` — A configuration or rule push, not a code bug, takes production down.
- `resource-exhaustion` — CPU, memory, connections, file descriptors, or disk run dry.
- `bad-deploy` — A rollout, flag flip, or migration that wasn't safely staged.
- `data-loss` — Accidental deletion or replica divergence destroys or strands data.
- `dns-bgp` — Name resolution or route withdrawal makes systems unreachable.
- `dependency` — An upstream or downstream service (internal or third-party) gives out.
- `automation-misfire` — A failover, autoscaler, or cleanup job does the wrong thing, confidently.

**patterns[]** — 1 to 5 lowercase kebab-case strings naming recurring failure patterns visible
in this incident. Examples: `no-staged-rollout`, `cascading-retry`, `global-blast-radius`,
`untested-backups`, `health-check-flapping`. Invent patterns that are specific and reusable
across incidents.

**impact** — one sentence, no longer. Focus on scope (global / regional / partial), what was
unavailable, and rough magnitude (% of users, dollar figure, duration mentioned in lede).

**trigger** — the proximate cause: the specific action or event that kicked things off.

**mechanism** — the causal chain: how the trigger propagated into a full incident.

**lesson** — one sentence. The most transferable insight. Should be actionable for an engineer
who was not involved.

**interview** — one sentence framing a system design interview question this incident exemplifies.
Example: "When asked about safe deploys, discuss canary rollouts and automatic CPU circuit
breakers on rule engines."

**source_quote** — exactly one sentence, verbatim from the postmortem text. Choose a sentence
that best proves the root cause was correctly identified.

**tweet** — a single standalone tweet (<=280 characters, own words, no source URL, no
hashtags unless one is genuinely apt) that would make an engineer stop scrolling. Lead with
the company and what broke, land on the one interesting mechanism or lesson. Plain text only.

**confidence** scoring:
- `high` — date, duration, root cause, and impact are all explicitly stated in the postmortem.
- `medium` — one or two fields required inference or were ambiguous.
- `low` — significant details missing, heavily inferred, or the page was sparse/paywalled.

## Copyright rule — NON-NEGOTIABLE

Every field except `source`, `sourceLabel`, and `source_quote` MUST be written entirely in
your own words. Do not copy sentences from the article. `source_quote` is the only field
that may reproduce text from the source, and it must be one sentence only. Rewrite,
summarise, and synthesise. Never reproduce article paragraphs.

## If this is not a postmortem

If the page:
- is not actually a postmortem (marketing content, general blog post, news article)
- returned an error or is behind a paywall with no readable content
- lacks enough information to determine company, year, and a plausible root cause

Output exactly: `{"error": "<brief reason>"}`

---

SOURCE URL: {{SOURCE_URL}}

POSTMORTEM TEXT:
{{TEXT}}
