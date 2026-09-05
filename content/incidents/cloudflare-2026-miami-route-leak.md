---
id: cloudflare-2026-miami-route-leak
company: Cloudflare
title: Miami Automation Leaks Cloudflare's Internal IPv6 Routes
year: 2026
date: '2026-01-22'
duration: 25 min
classes:
  - config-change
  - automation-misfire
  - dns-bgp
patterns:
  - fail-open-policy-term
  - overbroad-route-type-match
  - diff-hides-net-effect
impact: >-
  A 25-minute IPv6-only route leak out of Cloudflare's Miami site degraded
  throughput and latency for some Cloudflare customers on the Miami-Atlanta
  backbone and caused roughly 12Gbps of misdirected third-party traffic to be
  dropped by Miami router firewall filters.
trigger: >-
  An automated routing-policy push to a single Miami edge router, intended only
  to stop routing IPv6 traffic toward the Bogotá site, instead left an export
  policy term with no site-specific scoping.
mechanism: >-
  Deleting the last site-specific prefix-list reference from the export term
  left it matching only on route-type internal, which on JunOS matches any
  non-external route including internal BGP routes, so the policy treated nearly
  all of Cloudflare's internally redistributed IPv6 prefixes as exportable and
  re-advertised them to Miami peers and transit providers, producing a route
  leak that pulled outside traffic into Miami and congested the Miami-Atlanta
  backbone link.
lesson: >-
  A policy diff that shows only deletions can still leave the surviving match
  clause dangerously unscoped, so review the resulting effective policy rather
  than just the removed lines.
interview: >-
  Judge policy safety by what the leftover matching logic actually accepts, not
  by what a diff removed. Add automated policy linting that rejects export terms
  with no source-specific match before they reach production routers.
source: 'https://blog.cloudflare.com/route-leak-incident-january-22-2026/'
sourceLabel: Cloudflare blog
source_quote: >-
  This is an issue because the “route-type internal” match in JunOS or JunOS EVO
  (the operating systems used by HPE Juniper Networks devices) will match any
  non-external route type, such as Internal BGP (IBGP) routes, which is what
  happened here.
archive_url: ''
date_added: '2026-09-05'
last_verified: '2026-09-05'
verified: false
---
