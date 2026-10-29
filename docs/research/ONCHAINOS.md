# OnchainOS: build-relevant findings

Reviewed on 29 October 2026, starting from the user-supplied [documentation entry](https://web3.okx.com/onchainos/dev-docs), which resolves to the overview. All major navigation areas were traversed: Overview, OKX.AI, Wallet, Payment, Trade, Market, Exchange OS and X Layer. Relevant reference pages and implementation examples were inspected. This is a capability/dependency review, not a test of every endpoint; authenticated APIs were not called.

**Decision for ExitOS:** use direct X Layer RPC and an existing user wallet for the recovery path. Use OnchainOS selectively for ordinary operations, analytics and billing. An unavailable API account, facilitator or product backend must not prevent a prepared withdrawal.

## Capability map

| Area | Available/documented capability | Build decision and constraint |
|---|---|---|
| [Overview](https://web3.okx.com/onchainos/dev-docs/home/what-is-onchainos) | Skills/MCP and programmatic Open API integration | Infrastructure and convenience layers; neither independently satisfies TapeOut eligibility |
| [Authentication](https://web3.okx.com/onchainos/dev-docs/home/api-access-and-usage) | Signed API requests | Backend only; exact request serialization matters |
| [Developer portal](https://web3.okx.com/onchainos/dev-docs/home/developer-portal) | API projects, keys, permissions and account management | Wallet/email/phone and regional access checks precede dependent features |
| [Agentic Wallet](https://web3.okx.com/onchainos/dev-docs/wallet/agentic-wallet) | TEE-backed generation/signing, email/social login and agent operations | Adds a hosted signing/identity dependency; defer for emergency user access |
| [Wallet API](https://web3.okx.com/onchainos/dev-docs/wallet/onchain-gateway-api-overview) | Balances, transaction history, gas estimation and broadcasting facilities | Useful for a normal dashboard; signing still needs a wallet or signer |
| [DApp connection](https://web3.okx.com/onchainos/dev-docs/wallet/dapp-connect/okx-wallet-integration-introduction) | Extension and app-wallet connections | Core desktop flow first; test injected provider and origin isolation |
| [Mobile EVM connection](https://web3.okx.com/onchainos/dev-docs/wallet/dapp-connect/app-connect-evm) | App connection/deep-link flow | Needs separate mobile and DeWEB network-policy validation |
| [DeFi API](https://web3.okx.com/onchainos/dev-docs/wallet/defi-api-overview) | Product discovery, deposit/borrow, withdraw/repay, rewards and holdings | Helpful for normal discovery, but X Layer product coverage is not verified here |
| [Payments](https://web3.okx.com/onchainos/dev-docs/payments/overview) | Paid-service challenge/credential integration | Optional paid integration report or maintenance invoice; select one method |
| [Classic trading](https://web3.okx.com/onchainos/dev-docs/trade/dex-api-reference) | Quote, approval, router/calldata and swap flow | Adds routing, allowance, slippage and liquidity dependencies; exclude from recovery MVP |
| [Intent trading](https://web3.okx.com/onchainos/dev-docs/trade/dex-intent-reference) | Intent-based swap execution and status | Solver/order workflow differs from direct transactions; not an escape mechanism |
| [Market](https://web3.okx.com/onchainos/dev-docs/market/market-api-fee) | Prices, token data, portfolio/onchain data, history and analytics | Optional fiat context; never substitute it for exact onchain balances |
| [OKX.AI](https://web3.okx.com/onchainos/dev-docs/okxai/what-is-okxai) | Agent services/marketplace concepts, including delivery escrow | Product descriptions do not establish public escrow API availability |
| [Exchange OS](https://web3.okx.com/onchainos/dev-docs/exchangeos/introduction) | Infrastructure for exchange/trading products | Broader than this MVP; does not create a separate hackathon track |
| [X Layer](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information) | EVM network configuration, deployment and verification | Use chain-specific addresses and verified network identity |

Support is **module-specific**. A chain appearing in the overview's supported list does not establish support in Payments, DeFi, exact-output swaps, an SDK method or a particular token. Check the relevant module's network endpoint and the actual developer account permissions.

## Authentication and backend design

The API signature uses Base64-encoded HMAC-SHA256 of the timestamp, method, request path including query, and body where applicable. Send the corresponding access key, signature, timestamp and passphrase headers; include project identity when required by the selected API. Keep the secret and passphrase on the backend. A static DeWEB bundle is public and cannot safely contain them. [Authentication](https://web3.okx.com/onchainos/dev-docs/home/api-access-and-usage).

Implement one typed signing wrapper that serializes a request exactly once and sends those exact bytes. Test GET query order/encoding, POST body inclusion, timestamp handling and API error envelopes. Avoid logging credentials or signed payment credentials. Rate-limit and cache ordinary dashboard queries, validate user-supplied parameters, and surface missing permissions as real errors.

For ExitOS, API responses may provide supplementary information. Locally constructed, constrained recovery transactions remain based on approved adapter code and fresh direct RPC reads. Never send a user's private key to the backend.

## Wallet and DeFi integration

The agent wallet's TEE and zero-gas descriptions are provider claims and service-specific capabilities, not proofs that arbitrary X Layer transactions are free or that hosted infrastructure can never fail. Ordinary wallet connection keeps the user in their existing account. [Wallet overview](https://web3.okx.com/onchainos/dev-docs/wallet/product-and-service).

Relevant DeFi endpoint families reviewed:

- `GET /api/v6/defi/product/supported-chains`: query current product coverage; the example does not establish X Layer support. [Reference](https://web3.okx.com/onchainos/dev-docs/wallet/defi-product-supported-chains).
- `GET /api/v6/defi/product/supported-platforms`: protocol IDs and product counts. [Reference](https://web3.okx.com/onchainos/dev-docs/wallet/defi-product-supported-platforms).
- `POST /api/v6/defi/product/detail/prepare`: obtain product/token parameters before constructing product operations. [Reference](https://web3.okx.com/onchainos/dev-docs/wallet/defi-product-prepare).
- Transaction enter/exit and reward-claim references: prepared calldata for protocol operations. A returned transaction still needs validation, wallet signing and settlement tracking. [Transaction reference](https://web3.okx.com/onchainos/dev-docs/wallet/defi-transaction-api-reference), [redemption](https://web3.okx.com/onchainos/dev-docs/wallet/defi-transaction-exit).
- Holdings overview/detail: aggregated positions. Aggregation is not a real-time authorization guarantee. [Holdings](https://web3.okx.com/onchainos/dev-docs/wallet/defi-user-asset-overview).

We have not created an API account or confirmed a specific X Layer investment ID. ExitOS should not rely on these endpoints to construct emergency calldata. Aave's official address book and direct protocol reads provide a more bounded starting point.

## Payments: useful options and what not to assume

| Method | Documented behavior | Practical implication |
|---|---|---|
| [One-time](https://web3.okx.com/onchainos/dev-docs/payments/methods-onetime) | `exact`, split `charge` with up to ten recipients; `upto` appears in implementation documentation | Start with fixed-price payment; test SDK/account support before claiming cap-based billing |
| [Batch](https://web3.okx.com/onchainos/dev-docs/payments/methods-batch) | Session-key credentials, TEE aggregation and deferred settlement | Requires Agentic Wallet; do not display a credential as settled payment |
| [Pay-as-you-go](https://web3.okx.com/onchainos/dev-docs/payments/pay-as-you-go) | Channel deposit, cumulative signed vouchers, later settlement/close | A payment channel, with funding and close/refund lifecycle to implement |
| [Subscription](https://web3.okx.com/onchainos/dev-docs/payments/subscription) | Fixed signed terms and seller-triggered recurring charges | Requires billing operation, cancellation and insufficient-funds handling; past charges are not automatically refunded |
| Task-delivery escrow | Navigation and core documentation mark it under development | Do not base a hackathon MVP on a future public escrow integration |

The existing PAYG escrow contract locks channel funds; task-delivery escrow concerns acceptance/dispute/arbitration for work. Those are separate mechanisms. The core concept page marks `upto` coming soon, while one-time implementation docs describe support in some bindings. Treat this inconsistency as a required spike, not permission to advertise a universally available feature. [Core concepts](https://web3.okx.com/onchainos/dev-docs/payments/core-concept).

Node and Rust have the most complete documented paths among the reviewed bindings. A seller integration should use durable payment IDs, bind paid requests to the expected resource/body, reject expired or replayed credentials, and separate authorization, broker acknowledgement and chain settlement. Retry the same operation idempotently rather than charging again. [Seller quickstart](https://web3.okx.com/onchainos/dev-docs/payments/service-seller).

Current payment network table lists **X Layer, chain 196**, and these tokens:

| Asset | X Layer contract |
|---|---|
| USDG | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` |
| USDC | `0xb6ceceab302e2e4948951ee7843fc24e92933061` |
| USD₮0 | `0x779ded0c9e1022225f8e0630b35a9b54be713736` |

The zero-gas payment offer is explicitly limited-time. Token symbols alone are insufficient: bind chain, contract, decimals and amount, and verify supported signing standards. Payment support does not establish that each token works with every payment scheme. [Payment networks](https://web3.okx.com/onchainos/dev-docs/payments/supported-networks).

## Costs and rate limits

| Service | Published terms relevant to planning | Consequence |
|---|---|---|
| Trade trial | 60 days from key creation; 1 RPS default, up to 5 after approval | Avoid chatty frontend quote loops and approve access early |
| Trade economics | Positive-slippage rules apply; Start-up partner-fee revenue normally has 20% infrastructure share | A swap fee is not pure margin; terms depend on tier |
| Market Basic | 100,000 free calls/month, then $0.0001/call | Cache routine analytics |
| Market Premium | 100,000 free calls/month, then $0.0002/call | Holder/advanced data needs a separate budget |
| Market paid plans | Starter $99, Growth $199, Scale $399, Pro $599/month; differing quotas | Recheck quotas and renewal terms before choosing |
| Public X Layer RPC | Published limit: 100 requests/second/IP | Public RPC and API limits are different; provider restrictions still apply |

Sources: [Trade pricing](https://web3.okx.com/onchainos/dev-docs/trade/api-fee), [Market pricing](https://web3.okx.com/onchainos/dev-docs/market/market-api-fee), [RPC endpoints](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/rpc-endpoints/rpc-endpoints). Prices and allowances are current documentation, not an executed contract with the team. Free Market endpoint categories also exist; check each endpoint's tier instead of assuming all calls are metered.

## X Layer configuration and finality

| Item | Mainnet | Testnet |
|---|---|---|
| Chain ID | **196**, `0xc4` | **1952**, `0x7a0` |
| Gas | OKB | Test OKB |
| RPC | `https://rpc.xlayer.tech` or `https://xlayerrpc.okx.com` | `https://testrpc.xlayer.tech/terigon` or `https://xlayertestrpc.okx.com/terigon` |

Both listed mainnet endpoints are OKX-operated. TapeKit's configuration conservatively also counts thirdweb's X Layer endpoint under OKX; a different hostname is not independent infrastructure. The public dRPC endpoint returned HTTP 403 in this environment. This does not establish a global dRPC outage. Dedicated providers listed in the official RPC documentation are candidates for a build spike, not verified independent quorum members.

Flashblocks describes approximately 200 ms preconfirmation. That is not Ethereum settlement finality. A Flashblocks example uses chain ID 195, conflicting with network documentation and the live mainnet check; use verified IDs. Show submitted, included and safe/finalized status distinctly. [Flashblocks](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/flashblocks/overview).

The user's architecture excerpt combines optimistic-rollup challenge-period language and AggLayer settlement descriptions. It is insufficient to infer that all withdrawals settle instantly or that all trust/censorship assumptions disappear. A same-chain withdrawal demo avoids requiring a bridge/finality claim that has not been validated.

Builder Codes use ERC-8021 calldata attribution. Potential rewards are not guaranteed, and current docs exclude ERC-4337 support. If used, test the suffix with every supported target; do not assume arbitrary targets accept trailing bytes merely because the overview says no contract changes are required. Defer attribution if it complicates recovery validation. [Builder Codes](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/builder-codes/overview).

## Sample-code traps

The DApp quickstart is an Ethereum swap example, not a production X Layer recovery template. It marks simulation as whitelist-only. Its displayed `getHeaders` helper accepts query data but omits a body parameter even though POST examples pass a fifth body argument. One gas-estimation snippet also redeclares `const gasLimit`. Address/token placeholders and local private-key signing must be replaced with the intended chain configuration and wallet flow. These are source-reading findings, not a reproduced SDK bug report. [Quickstart](https://web3.okx.com/onchainos/dev-docs/home/run-your-first-dapp).

Classic and intent swap support includes X Layer in relevant lists, but the exact-output feature's support list excludes it. Do not equate general swap support with exact-output availability. [Classic swap](https://web3.okx.com/onchainos/dev-docs/trade/dex-swap), [intent networks](https://web3.okx.com/onchainos/dev-docs/trade/dex-intent-supported-chains).

## Required implementation spikes

Before dependent feature work, verify developer-account regional availability and permissions, module-specific chain support, one Node fixed-price seller/buyer flow, response/error envelopes and rate-limit behavior. Separately test wallet connections from the actual DeWEB origin, browser CORS for independent RPC operators, and operation without the OnchainOS/backend services. These checks are build tasks; this research did not execute authenticated APIs or payment transactions.
