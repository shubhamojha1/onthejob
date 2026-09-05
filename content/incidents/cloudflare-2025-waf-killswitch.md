---
id: cloudflare-2025-waf-killswitch
company: Cloudflare
title: WAF Killswitch Bug Crashes Cloudflare's FL1 Proxy
year: 2025
date: '2025-12-05'
duration: ~25 min
classes:
  - config-change
  - bad-deploy
patterns:
  - instant-global-propagation
  - untested-code-path
  - missing-nil-check
  - hard-fail-on-error
impact: >-
  A configuration killswitch caused Cloudflare's older FL1 proxy to return HTTP
  500 errors for roughly 25 minutes, affecting sites using the Cloudflare
  Managed Ruleset and accounting for about 28% of all HTTP traffic Cloudflare
  serves, while its China network and newer FL2 proxy were unaffected.
trigger: >-
  An engineer applied a killswitch, via Cloudflare's instant global
  configuration system, to disable an internal WAF test ruleset that used an
  'execute' action — a killswitch type never applied to an execute rule before.
mechanism: >-
  Skipping the execute action left the rule_result.execute object unset, but
  downstream ruleset-result code still tried to index into it whenever action
  equaled 'execute', triggering a Lua nil-index error on every request through
  Cloudflare's FL1 proxy; any site with the Managed Ruleset on FL1 returned HTTP
  500 until the config change was reverted 25 minutes later. Cloudflare's newer
  Rust-based FL2 proxy was unaffected because its type system rules out this
  class of nil-reference bug.
lesson: >-
  Emergency config toggles (killswitches) are themselves risky changes and need
  the same staged rollout, testing, and rollback safeguards as normal deploys,
  and strongly-typed code catches nil-reference bugs that untyped scripting
  languages let through.
interview: >-
  An emergency off-switch is still a change, not a neutral action, so it can
  break things too. Roll new kinds of killswitches out gradually with automatic
  health checks instead of pushing them instantly to every server at once.
source: 'https://blog.cloudflare.com/5-december-2025-outage/'
sourceLabel: Cloudflare blog
source_quote: >-
  However, because the rule had been skipped, the rule_result.execute object did
  not exist, and Lua returned an error due to attempting to look up a value in a
  nil value.
archive_url: ''
date_added: '2026-09-05'
last_verified: '2026-09-05'
verified: false
---
