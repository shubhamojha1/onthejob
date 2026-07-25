---
id: aws-2013-sa-east-1-generator-cascade
company: AWS
title: Cascading Generator Failures Take Down São Paulo AZ
year: 2013
date: '2013-12-17'
duration: >-
  several hours (exact duration not stated; 20 min network degradation
  explicitly noted)
classes:
  - cascade
  - resource-exhaustion
  - config-change
patterns:
  - cascading-power-failure
  - correlated-redundancy-failure
  - automated-control-system-malfunction
  - manual-recovery-misconfiguration
  - cross-az-blast-radius
impact: >-
  A single Availability Zone in AWS's South America Region (SA-EAST-1, São
  Paulo) lost power entirely and all hosted instances went down for an extended
  period, and a subsequent recovery misstep caused roughly 20 minutes of
  degraded internet connectivity across both Availability Zones in the region.
trigger: >-
  A fault at the local utility's substation caused the Availability Zone to lose
  grid power, triggering an automatic failover to onsite backup generators.
mechanism: >-
  Utility power loss triggered automatic generator failover, but a breaker on
  one generator tripped open during the transition, and a second generator
  independently failed from a mechanical issue; the combined loss of two
  generators left more load than the remaining units could carry, so those also
  shut down, killing power to the facility entirely. The facility's automated
  system for aggregating power across generators then malfunctioned, forcing
  staff to bypass it and manually bring generators online, which slowed
  recovery. Once power was restored, a technician manually brought a network
  device back up and introduced a misconfiguration that advertised an invalid
  route, degrading connectivity for both Availability Zones in the region until
  the device was pulled from service.
lesson: >-
  Physical redundancy (multiple generators) can still fail correlated ways under
  real load, so recovery procedures need their own safeguards — including for
  manual/automation-bypass steps — since human error during recovery can extend
  an incident's blast radius even after the original failure is contained.
interview: >-
  When asked about datacenter power resiliency, discuss N+1/N+2 generator
  redundancy, automated power-aggregation control systems, and why manual
  recovery steps (like reconfiguring network devices) need review gates to avoid
  introducing secondary outages.
source: 'https://aws.amazon.com/message/656481/'
sourceLabel: AWS post-event summary
source_quote: >-
  During that failover a breaker in front of one of the generators opened,
  rendering that generator unavailable.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
