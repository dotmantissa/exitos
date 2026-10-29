# Research: what to learn from winners

Research date: 29 October 2026. Placements below are supported by organizer award pages or organizer-hosted showcases. Project descriptions explain what teams said they built; they are not independent audits or proof of commercial traction.

**The recurring useful pattern is a specific user problem, one visible end-to-end journey and infrastructure that has an indispensable role.** This is an inference from the examined submissions, not a published explanation of why judges selected them. Selection bias applies: studying winners alone does not tell us which features caused a win.

## Comparison method

Pain severity is an analytical judgment based on impact, frequency, existing alternatives and buyer proximity. Event fit measures how directly a project exercised the event's technical priorities. High event fit does not establish high market demand. TapeOut gate netlists are not cryptographic zero-knowledge circuits; do not transfer privacy or proof guarantees from ZK projects onto TapeOut.

Three grand-prize precedents establish product direction; category winners establish specific integration patterns; finalists establish interesting implementations but are not described as overall champions.

| Project and verified placement | Pain and relative severity | Event relevance | Transfer to Build X |
|---|---|---|---|
| **YieldCoin**, Chromion 2025 grand prize, $35,000 | Fragmented stablecoin yield management; recurring financial inefficiency with substantial operational complexity | High: CCIP, Automation and Functions contribute to one allocation workflow | Combine infrastructure around one measurable outcome; do not copy financial custody and strategy risk |
| **TokenIQ**, Chromion 2025 best DeFi, first | DAO treasury administration; recurring coordination, execution and governance burden | High: AI plus Chainlink services supports treasury operations | Name the operator who buys; keep human governance visible |
| **HTTPayer**, Chromion 2025 cross-chain, first | Charging for APIs/SaaS through crypto; recurring billing and integration friction | High: payment orchestration explicitly uses cross-chain services | Sell a service someone already purchases; isolate external-service complexity |
| **Unwallet.me**, Constellation 2023 grand prize, $25,000 | Seed phrases, funding gas and wallet onboarding; frequent abandonment barrier | High: infrastructure translates into accessible user actions | Remove avoidable setup steps from the demo; do not require users to import keys |
| **The Future of France**, Block Magic 2024 grand prize, $50,000 | Web3 onboarding and learning; common friction, lower immediate financial severity | High: task-based game provides a tangible introduction to onchain actions | Judges should experience the product, not just hear architecture claims |
| **MCPay.fun**, Prague 2025 finalist | Pay-per-use APIs and MCP tools lack simple payment orchestration | High in agent/API context; identifiable developer buyer | A paid-service fallback must offer more than a generic x402 wrapper |
| **Kyma Pay**, New York 2025 finalist | Merchant stablecoin checkout, wallets and payment coordination; repeated operational pain | High: wallet and payment infrastructure is visible in checkout | A buyer-facing workflow and clear receipt are stronger than a toolbox |
| **zkx402**, Buenos Aires 2025 finalist | Buying/verifying data while exposing only required information; specialized but consequential | High: privacy, provenance and payment form one journey | Merge compatible capabilities at the workflow level; avoid a menu of disconnected products |
| **OpenPayAI**, ETHOnline 2025 finalist | Content providers struggle to monetize AI access; recurring economic pain | High: payment infrastructure connects access to monetization | Start with a specific provider and evidence of willingness to pay |
| **Aegis402**, Open Agents 2026 finalist | Unsafe agent payment execution; high impact when agents control money | High: directly agent-related and demonstrable through safe/unsafe hooks | Show a concrete rejected action beside the allowed action |
| **Aegis Protocol V5**, Convergence 2026 Top 12 | Execution safety for automated onchain activity; high impact, existing competition | High: execution workflow and checks address an agent ecosystem concern | A strong demonstration requires enforceable checks, not only warnings |
| **NoNet**, New Delhi 2025 finalist; Hedera EVM/cross-chain first | Financial access during outages or poor connectivity; severe episodically, location-dependent | High: signed transaction relay makes resilience observable | Intentionally disable a dependency and show the surviving user journey |
| **Build3r**, HackFS finalist | Packaging and connecting Web3 functionality for non-specialist builders; recurring engineering friction | High: reusable modules, wallet actions and IPFS deployment form a builder workflow | Turn adapters and release tooling into a repeatable integration product |
| **PrivacyLinks**, Cannes 2025 finalist; Chainlink CCIP/CCT award | Linkable wallet activity and privacy complexity; consequential, uneven buyer demand | High: wallet extension and cross-chain funding | Make dependency failures explicit; disclose mocked components |

The first three placements and descriptions are corroborated by the [Chromion award announcement](https://chain.link/blog/announcing-the-chainlink-chromion-hackathon-winners). Grand-prize evidence for the next two comes from [Constellation winners](https://chain.link/blog/constellation-hackathon-winners) and [Block Magic winners](https://chain.link/blog/block-magic-winners). The [Convergence winners page](https://chain.link/hackathon/winners) establishes Aegis Protocol V5's Top 12 status; that is not first place.

## Implementation lessons from the submissions

**YieldCoin:** the submission discusses share accounting and invariants, including problems and corrections. This matters because a persuasive financial prototype can still misprice shares or mishandle rebalancing. For ExitOS, spend verification effort on exact amounts, ownership and transaction destinations rather than inventing a new yield vault. [Project](https://devfolio.co/projects/yieldcoin-112a).

**TokenIQ:** cross-chain configuration and failure/retry handling appear in its development account. The useful lesson is operational discipline: provider failure, wrong configuration and interrupted requests must become explicit product states. A recovery interface should never silently replace an unavailable verified result with an unverified success. [Project](https://devfolio.co/projects/tokeniq-240e).

**HTTPayer:** the team reports changing payment orchestration from Python to TypeScript. Prefer the best-supported SDK path when time is limited. In this event, test OnchainOS's Node payment path before selecting a language around incomplete bindings. [Project](https://devfolio.co/projects/httpayer-2357).

**MCPay.fun:** its proxy/payment retry flow connects an ordinary service request to paid access. Copy the complete transaction journey and error handling, not the brand or product. TapeAPI and TapeFlow already occupy much of this space in the TapeOut ecosystem. [Showcase](https://ethglobal.com/showcase/mcpay-fun-y16d3).

**Kyma Pay:** embedded wallets and payment orchestration reduce merchant-facing complexity. Treat its cost/compliance statements as participant claims. For ExitOS, use a prepared recovery link and existing wallet so the user does not learn TapeOut's processor terminology while trying to withdraw. [Showcase](https://ethglobal.com/showcase/kyma-pay-yn65a).

**zkx402:** the team describes bringing three applications into one privacy/provenance/payment workflow. This supports coherent integration, not indiscriminate feature merging. ExitOS's components should all serve approved recovery access. [Showcase](https://ethglobal.com/showcase/zkx402-wxtjf).

**OpenPayAI:** monetization is tied to content access, giving the team a clearer supplier/buyer relationship than a generic AI finance product. For our commercial story, the protocol maintainer buys readiness maintenance; the withdrawing user uses the recovery interface free. [Showcase](https://ethglobal.com/showcase/openpayai-89sbk).

**Aegis402:** safe and vulnerable execution hooks make the failure mode visible. ExitOS can similarly show a modified bundle rejected, then an approved bundle used successfully. That demonstrates only the implemented checks; it does not prove universal attack prevention. [Showcase](https://ethglobal.com/showcase/aegis402-o8x6z).

**NoNet:** transactions are signed locally and relayed over Bluetooth until an internet-connected gateway broadcasts them. Its showcase makes clear that chain submission still needs a gateway. This is the closest resilience precedent: show the exact dependency removed, and identify the remaining ones. ExitOS still needs usable chain access. [Showcase](https://ethglobal.com/showcase/nonet-xyebu).

**Build3r:** modules combine contract interaction, wallet access, data and deployment. The team describes packaging assets with relative paths and transpiling for IPFS compatibility. ExitOS similarly needs a self-contained recovery bundle with no runtime CDN dependencies. [Showcase](https://ethglobal.com/showcase/build3r-awy06).

**PrivacyLinks:** a privacy dependency went offline, so the demo used a simplified mock pool. This is a useful lesson in disclosure and dependency management, not a reason to market mock security as live. ExitOS's primary outage demonstration must use the actual recovery route; forks may cover destructive or unavailable cases with visible labels. [Showcase](https://ethglobal.com/showcase/privacylinks-y30gr).

## Same-organizer evidence and existing competition

The official Build X/Super Nova material lists projects including Ignix, Metagents.AI, Billion live and XTruth. This research did not obtain primary award evidence for the reported Ignix/Metagents placements. Social mirrors and project-directory listings are insufficient to assign a verified first or second prize.

The Genesis Transistor ecosystem directory marks entries, not winners. Its linked event URL returned 404. The directory remains useful for understanding existing implementations. Inclusion does not establish that a project is entering TapeOut Accelerate or that its functionality is independently verified. [Directory](https://github.com/trytotapeout/awesome-tapeout).

| Existing project | What public sources describe | Implication |
|---|---|---|
| [LeoLabs Agent Firewall](https://github.com/runesleo/leolabs-agent-firewall) | Local pre-sign checks and TapeOut ADD8 provenance; no signing/broadcasting | Generic agent safety has direct competition |
| [TapeSafe](https://github.com/kin684660-commits/TapeSafe) | Team-approval circuit live; executor/vault undeployed in reviewed material | Quorum circuits alone are not novel; our registry must actually consume the result |
| [TapeFlow](https://github.com/bingfasamsung-boop/tapeflow-xlayer) | Broad payments/escrow/merchant/budget features and DeWEB mirror | Avoid another general payment suite; readiness claims need separate checks |
| [LAW](https://github.com/hackid02/policy-processor-law) / [Stego](https://github.com/kvzuobai/stego) | Circuit policies and vault rules; LAW clearly separates live circuits from reference contracts | Numeric conditions derived outside a circuit must be identified honestly |
| [SkillPass](https://github.com/IGNIX-IMOO/skillpass) | Agent skill ownership, licensing and quotas | Generic agent commerce/licensing is occupied |
| [TapeAPI](https://github.com/BruceLanLan/tapeapi) | Version 2.4.0 signed AI/MCP receipts live/free; paid channels and bounded agents undeployed/unaudited | Signed receipts are not enough for differentiation |
| [LotGate](https://github.com/haivcon/LoteGate) | Circuit-computed batch auction, computation only; no custody/settlement | Do not mistake computational receipts for authenticated orders or payment evidence |
| [Cerebr](https://github.com/NetLayerLabs/Cerebr) | Neural compiler, circuits, game and autonomous agent; detailed deployment/fork evidence | Circuit showcase breadth is already substantial; compete through a usable customer outcome |
| [TapeKit](https://github.com/TapeOutProtocol/TapeKit) and TapeCode | Verified reading, gateways and application tooling | Extend the ecosystem; do not repackage its basic viewer as the invention |

Only one TapeSafe circuit's metadata, netlist and sampled evaluation were independently checked here. The other readiness descriptions are repository disclosures, not executed test results.

## Pain assessment for ExitOS

The February 2025 Bybit investigation documents compromise of Safe development/cloud access, malicious frontend JavaScript and transaction manipulation. It establishes that frontend supply-chain compromise can have serious financial consequences. It does **not** establish that a DeWEB mirror or ExitOS would have prevented that incident. [Sygnia investigation](https://www.sygnia.co/blog/sygnia-investigation-bybit-hack/).

Aave already publishes interface commits to IPFS and documents security controls and alternative access. That is strong competing evidence: decentralized hosting is an existing solution. ExitOS must earn its place through prepared minimal transaction adapters, release identity established before an incident, version-aware validation and measured recovery drills. [Aave security](https://aave.com/security), [Aave interface](https://github.com/aave/interface).

Working severity judgment: high impact during a relevant incident; irregular frequency; strong existing alternatives for sophisticated teams; plausible but unverified recurring budget among smaller protocol maintainers. TapeOut relevance is high because verified frontend access is a direct use case. Market urgency remains the weakest part of the recommendation.

The first target buyer is a protocol maintainer responsible for user access and release operations. Aave is a public compatibility demonstrator, not a claimed customer. No interviews, commitments, revenue, active users or prevented losses are established by this research.

## Ranked shortlist

These are **our planning weights**, not official judge weights: user/commercial value 35%, innovation 20%, ecosystem integration 20%, readiness 15%, demo 10%. Ratings are 1–5 hypotheses. Score = weighted rating / 5 × 100. No score represents a probability of winning.

| Candidate | Value | Innovation | Ecosystem | Readiness | Demo | Score |
|---|---:|---:|---:|---:|---:|---:|
| **ExitOS**, prepared verified recovery workflow | 3.5 | 4 | 5 | 3 | 5 | **79.5** |
| **ReleaseKit**, verified release maintenance and drills | 3 | 3.5 | 5 | 4 | 4 | **75.0** |
| **EvidenceDesk**, circuit-admitted milestone evidence for one buyer's procurement process | 3.5 | 3.5 | 4 | 3.5 | 4 | **73.0** |
| **MeterKit**, paid service access for one existing API provider | 4 | 2 | 4 | 4 | 4 | **72.0** |
| **Circuit game**, polished game with verifiable rules | 2.5 | 3 | 5 | 3.5 | 5 | **70.0** |
| **Agent firewall**, bounded pre-sign policy | 4 | 1.5 | 3.5 | 4 | 4.5 | **69.0** |

EvidenceDesk would certify authenticated review outcomes, not automatically prove offchain work quality; payment adjudication should remain outside its MVP. MeterKit requires a real provider and recurring payer. Their scores are not supported by customer interviews either.

Sensitivity: if ExitOS lacks a pilot and wallet/RPC feasibility, reduce value to 2.5 and readiness to 2; its score becomes **69.5**. If MeterKit has a paying provider/payer relationship and a defensible niche, value 5 and innovation 2.5 produce **81.0**. Access to real users can change the winner of this analysis more than another integration.

## Decision

Lead with ExitOS, and spend the first three days disproving its weak assumptions. Reuse existing TapeOut infrastructure, keep the recovery path independent of the product backend, and make the demonstration verifiable. Expand into maintenance subscriptions after a pilot confirms the repeated operational need. Do not force mining, swaps, messaging, an agent marketplace and a game into this product.
