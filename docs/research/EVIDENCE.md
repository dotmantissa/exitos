# Evidence, verification and open questions

Research date: **29 October 2026**. This package combines official documentation, organizer award evidence, project disclosures and limited read-only chain checks. None of these establishes a guaranteed award, commercial traction or an audited product.

## Source hierarchy

1. Official event and its linked form establish published rules. Recheck them before submission because the deadline is provisional.
2. Organizer award announcements and ETHGlobal showcases establish the stated placements. Finalist, category winner and overall grand prize remain distinct.
3. TapeOut's repository/specification and OKX documentation establish documented behavior at the reviewed revision/date. Draft proposals are not final adopted standards.
4. Competitor READMEs are author disclosures. Their claimed tests, adoption and deployments were not generally executed or audited here.
5. Public RPC responses establish what the queried node returned at a block. They do not provide independent consensus verification or source-code audit.
6. Rankings, pricing, workload, adoption targets and product fit are explicit planning inferences.

## Official event and form

- [Event page](https://web3.okx.com/xlayer/build-x-series).
- [Linked submission form](https://docs.google.com/forms/d/e/1FAIpQLScyVnDmyzxRyBxszLUWbwV5kVbpmZJ3JS6oyOxqjALRvhR1kg/viewform).
- [Official linked support channel](https://t.me/%2B-7ouB60aYig2MmM1).

The form was read but not submitted. Important additions: maximum four members, maximum three-minute video, early registration/updates and livestream feedback. Offline Demo Day logistics and final prize-payment milestones remain unknown. No separate scored tracks were found.

## Source revisions

| Source | Reviewed revision | Limit |
|---|---|---|
| [TapeKit](https://github.com/TapeOutProtocol/TapeKit) | `37c617e7e332787c8a32a81e4d7d05a28a06c156` | Later commits may change addresses/behavior |
| [TAPs](https://github.com/TapeOutProtocol/TAPs) | `075dd834a72c4c5b251d97f183cac9d42d8ccd66` | Reviewed proposals are Draft; TAP-02 historical chain comparison is BNB-specific |
| [Aave X Layer address book](https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3XLayer.sol) | Public main-branch snapshot downloaded 29 Oct | Relevant provider/pool/implementation independently read below; pin a source commit during build |

Read-only clones and raw page caches remain under Git-ignored `research-cache/`. The following selected evidence is durable outside that cache.

## X Layer/TapeOut checks

Mainnet RPC reported chain ID **196**. `eth_getCode` returned nonempty bytecode for the factory, opener, site registry, factory implementation and USDC. Both successfully checked default RPC domains are OKX-operated. The dRPC endpoint returned HTTP 403 here; its availability elsewhere and browser CORS were not established.

| Contract | Checked address |
|---|---|
| TapeOut factory | `0x1f09daefa827f02cbb40967cc91b259763760761` |
| Factory implementation | `0xb41c1e7602eb5734be2430b72178ccb814a5293d` |
| Container opener | `0x536add8f30f03b69f6fbf29d425a816a0dc50106` |
| Site registry | `0xd6efb7adcc9c83dc4924ad56f6a8e4e969b9adb6` |
| Circuit beacon | `0xf70d1ed4f62cf3780157b0b421b7e2f45bd0991c` |
| Circuit implementation | `0x977f217887e085d298cb3819cdad5a0ee35f29b2` |

Factory `isSealed()` returned **false** and owner returned `0xb3d85b42a045c1a88d800cad0f55d2566a4d3138`. The circuit beacon's owner returned the zero address and its implementation matched current TapeKit constants. A renounced circuit beacon does not establish that the factory, site registry, binding or container identity/control is immutable. [Raw responses](../../evidence/live-seals-and-circuit.json).

### Circuit evaluation

An independent Python NAND decoder/evaluator compared the live TapeSafe circuit at processor `0xe10931e0cfb42c76ced25b4712e7553f24a3d9e9`, circuit ID **1**, at block **74,512,054**. Metadata: **19 inputs, 1 output, no state bits, 74 gates**; decoded netlist: 518 bytes.

**32/32 sampled input vectors matched local and live `eval` results.** Samples include zero/all-one, single-bit and deterministic random patterns. This supports combinational evaluation feasibility on X Layer. It does not verify all 524,288 possible inputs, TapeSafe's business policy, signature authentication, security, REF/LATCH behavior or independent RPC agreement. [Recorded vectors](../../evidence/circuit-evaluation-check.json), [reproduction script](../../scripts/verify-circuit.py).

Reproduce with `python3 scripts/verify-circuit.py`. This performs read-only JSON-RPC requests and writes fresh evidence; it has no wallet keys, transaction signing or broadcasting. Node access/retention/rate limits can cause failure. The script intentionally handles only this NAND-only circuit.

The proposed ExitOS four-input approval formula was also checked locally against its eight-NAND construction across all sixteen combinations. Four combinations allow admission. This is design validation only; no ExitOS circuit or registry is deployed. [Design vectors](../../evidence/exit-policy-design.json).

### Aave demonstrator

The checked provider is `0xdff435bccf782f11187d3a4454d96702ed78e092`; pool is `0xe3f3caefdd7180f884c01e57f65df979af84f116`. Bytecode lengths were 6,907 and 1,841 bytes respectively. Provider `getPool()` returned that pool; the pool's ERC-1967 implementation slot returned `0x5bc7204274230a8f4778a35a58b776d16cf104b4`, matching the downloaded address book. [Raw check](../../evidence/aave-pilot-check.json).

This checks addresses/pointers only. No reserve liquidity, chosen user's position, withdrawal simulation, wallet signing or live supply/withdrawal was validated. Aave has not agreed to a pilot, partnership or endorsement.

## Remaining decisions and checks

| Question | Why it matters | Next evidence |
|---|---|---|
| Actual team skills/hours and budget? | Determines achievable scope | User constraints, then revise schedule |
| Independent RPC operators from browser? | Verification and continuity assumption | Successful fixed-block reads, CORS and documented operator identity |
| Wallet-compatible DeWEB loader with approved-root checks? | Required product boundary | Actual-browser demo with tampered executable assets rejected |
| Usable no-debt Aave asset/position? | Concrete core transaction | Reviewed ABI/versions and pinned fork scenario |
| Maintainers will pay beyond existing IPFS backup? | Weakest market assumption | Interviews, demonstrated current fallback and accepted pilot quote |
| Current DeWEB activation/upload fees and capacity? | Hosting economics and expiry | Live fee reads and bundle-size quote |
| OnchainOS regional/account/module access? | Optional analytics and payment viability | Authorized developer-account spikes |
| Final deadline, Demo Day logistics and payout milestones? | Submission and post-award planning | Official updates and later organizer terms |

No funds moved, deployments made, forms submitted, external people contacted or user accounts accessed in this planning task. All product outcomes, pilots and revenues remain future work.
