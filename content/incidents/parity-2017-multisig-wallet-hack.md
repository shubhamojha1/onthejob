---
id: parity-2017-multisig-wallet-hack
company: Parity Technologies
title: Parity Multisig Wallet Library Hijack
year: 2017
date: '2017-07-19'
duration: ~3 h
classes:
  - dependency
  - bad-deploy
patterns:
  - shared-library-attack-surface
  - delegatecall-storage-collision
  - implicit-fallback-forwarding
  - default-public-visibility
  - unguarded-reinitialization
impact: >-
  An attacker took ownership of and drained three Ethereum multisig wallets
  (Edgeless Casino, Swarm City, æternity) for 153,037 ETH worth over $30
  million, prompting a white-hat team to proactively drain and later return
  roughly $150 million from remaining vulnerable wallets.
trigger: >-
  An attacker sent a transaction to a Parity multisig Wallet contract carrying
  the function selector for WalletLibrary's initWallet function, a call the
  Wallet contract itself did not expose.
mechanism: >-
  Wallet contracts saved gas by delegatecalling a shared WalletLibrary contract,
  and any unmatched call fell through to a fallback function that blindly
  forwarded all call data to that library via delegatecall. Because delegatecall
  executes library code against the caller's own storage, the forwarded call let
  the attacker trigger WalletLibrary's public, unguarded initWallet function
  inside the context of an already-initialized Wallet, overwriting its owner
  variable to their own address and giving them full withdrawal rights.
lesson: >-
  When contracts (or services) delegate execution to shared library code, every
  function reachable through that library becomes part of your own attack
  surface — visibility, initialization guards, and reachability must be
  explicitly enforced and tested, never assumed from context.
interview: >-
  When asked about designing upgradeable or library-based smart contracts,
  discuss how delegatecall merges storage and code execution contexts, and why
  default-public visibility plus implicit fallback forwarding can expose
  'internal' library functions to direct outside calls.
source: >-
  https://web.archive.org/web/20221226010429/https://hackingdistributed.com/2017/07/22/deep-dive-parity-bug/
sourceLabel: 'Hacking, Distributed blog'
source_quote: >-
  When WalletLibrary receives the call data, it finds that its initWallet
  function matches the function selector and runs initWallet(attacker) in the
  context of Wallet, setting Wallet’s owner variable to attacker.
archive_url: ''
date_added: '2026-07-25'
last_verified: '2026-07-25'
verified: false
---
