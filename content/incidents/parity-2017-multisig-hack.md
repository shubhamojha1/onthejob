---
id: parity-2017-multisig-hack
company: Parity Technologies
title: Parity Multi-Sig Wallet Ownership-Reset Exploit
year: 2017
date: '2017-07-19'
duration: ~3 h
classes:
  - bad-deploy
patterns:
  - missing-access-modifier
  - misclassified-change-severity
  - single-reviewer-merge
  - shared-library-contract-blast-radius
  - unaudited-refactor
impact: >-
  An attacker drained three Parity multi-sig wallets holding large ETH balances
  before a white-hat group raced to lock down the remaining 593 vulnerable
  wallets by exploiting the same bug first.
trigger: >-
  An attacker called an unprotected function in the shared multi-sig wallet
  library contract, which should only have been callable during initial wallet
  creation.
mechanism: >-
  A gas-saving refactor split the original, well-audited multi-sig code into a
  lightweight per-wallet stub plus a single shared library holding the real
  logic; during that restructuring the ownership-initialization function lost
  its access guard, so any caller could invoke it on an already-deployed wallet
  and reassign ownership, then drain funds. Because the change landed inside a
  large 4,000-line UI overhaul PR, it was mistagged as UI-only and got just one
  review instead of the stricter process required for contract code, and a later
  Solidity audit also missed it.
lesson: >-
  Classify code changes by what they touch (e.g. any diff to a .sol file), not
  by the size or label of the surrounding PR, so sensitive contract logic always
  gets specialist review regardless of what feature it's bundled into.
interview: >-
  When asked about safe smart-contract deployment, discuss why access-control
  changes need dedicated domain-expert review triggers independent of how a PR
  is otherwise categorized, and why shared library contracts concentrate blast
  radius across all their callers.
source: >-
  https://web.archive.org/web/20180830181639/https://paritytech.io/the-multi-sig-hack-a-postmortem/
sourceLabel: Parity Technologies blog
source_quote: >-
  However, they were entirely unguarded, which allowed the attacker to reset the
  ownership and usage parameters of existing wallets arbitrarily.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
