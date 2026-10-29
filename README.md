# ExitOS

A clear way out when the usual website is unavailable.

Open [ExitOS](https://exitos.vercel.app).

ExitOS prepares a verified recovery route for a supported vault. You keep your wallet and your keys. A withdrawal goes directly from the vault back to you.

The interface uses a position ledger and a single arched doorway. Olive, parchment, IBM Plex Sans and Roboto Slab give it a calm, practical character. Light and dark themes follow your preference. Fonts, the original logo and interface icons are bundled locally.

## Current build

The source implements real X Layer testnet claims, exact token allowances, vault deposits, withdrawals and receipt tracking. It contains no fabricated balances, practice wallet or simulated transaction success.

Five contracts are deployed on X Layer testnet, chain 1952. Source verification matches their creation transactions to the compiled contracts. The release verifier checks the approved code and contract identities before transactions become available.

The recorded testnet drill claimed test credit, approved exactly 50 XUSD, deposited it and withdrew it to the same wallet. Token balances and vault shares reconciled exactly. Unauthorized admission and replay both reverted. Thirteen authorization and revocation cases passed on a separate registry. The browser also completed a 7 XUSD deposit, a 4 XUSD withdrawal and a 3 XUSD withdrawal from the standalone route with the application origin blocked. Its token and share balances reconciled exactly. The same four transactions also passed on the public Vercel site. Public addresses and receipt hashes are recorded in [deployment evidence](evidence/testnet-deployment.json), [verification evidence](evidence/testnet-verification.json) and [transaction evidence](evidence/testnet-e2e.json).

The first supported protocol is an actual OpenZeppelin ERC4626 test vault using XUSD, a faucet token with no monetary value. The release policy uses eight NAND gates with TapeOut TAP 02 encoding. Two of three publishers and the safety reviewer must approve a release. Signatures bind the chain, registry, operation, nonce, release, root, storage address and expiry.

The independently deployed processor is TapeOut compatible. It is not registered in the official TapeOut factory. The immutable bundle store is not official DeWEB. Official ecosystem integration and event eligibility remain launch gates described in the architecture.

## Run locally

Use Node 20 or later.

```sh
npm ci
npm run kit
npm run dev
```

Open the local URL printed by Vite. The development server uses port 5175.

```sh
npm test
npm run check
npm run compile
npm run build
npm run browser
```

Install the browser with `npx playwright install chromium`. Browser checks need its operating system libraries. They inspect the real disconnected application without manufacturing wallet balances. Actual signing checks are separate and require a funded testnet account.

## Deploy and verify

Generate a local deployer and reviewer accounts. This prints their public addresses only. Secret keys stay in an ignored local file with restricted permissions.

```sh
npm run deployer
npm run circuit
npm run compile
```

Fund the deployer with test OKB on X Layer testnet, chain 1952, using the [official faucet](https://web3.okx.com/xlayer/faucet/xlayerfaucet). Keep this wallet separate from accounts holding assets with monetary value.

```sh
npm run deploy
npm run verify
npm run testnet
npm run security
npm run kit
npm run browser:testnet
npm run build
```

Deployment writes actual contract addresses and receipt hashes to the public configuration. Interrupted deployments resume from a local journal. Verification checks contract bytecode, release authority, the circuit, stored bytes and manifest commitments. The testnet drill performs actual transactions and reconciles the wallet and vault balances. It also sends replayed and unauthorized admissions and requires reverted receipts.

The security suite uses a separate registry and saves signed transaction checkpoints before broadcasting. A resumed run sends the same transaction bytes. The application release stays available during those checks.

Only recorded evidence belongs in the submission. A passing local build does not certify a deployed product.

## The recovery kit

The downloaded HTML file contains the trusted bootstrap, public deployment pins and fonts. It reads the approved module from the chain, checks every executable byte, and then mounts the withdrawal interface. It can operate without application asset requests. The browser also saves a copy through a Service Worker.

Wallet injection depends on the browser. Use a compatible wallet browser or extension. A downloaded file must still be able to reach the RPC, and some wallets do not inject into local files. The hosted standalone route shares the application's origin. Test the chosen delivery method before relying on it.

The bootstrap remains trusted software. The current testnet configuration reads one OKX operated RPC. Stronger independent node checks, official DeWEB delivery and an independently pinned bootstrap are separate production gates.

## Scope and trust

ExitOS handles a website outage for the supported vault while its chain and contracts remain available. It does not reverse contract exploits, recover lost keys or promise access during a chain outage. L2 inclusion is shown separately from Ethereum settlement.

No API secret belongs in a Vite variable. The optional environment file contains only a public RPC URL. Wallet keys never enter the application bundle. Recovery has no account registration, billing dependency or custody layer.

The business hypothesis is a paid readiness service for protocol maintainers: reviewed releases, availability checks and recorded recovery drills. Recovery itself stays available to users. Pricing, customers and willingness to pay require validation; this repository does not invent them.

## Read the plan

[Architecture](ARCHITECTURE.md) defines implementation steps, data contracts, security boundaries and acceptance checks. [Design direction](DESIGN.md) records the five independent design rolls made before interface code.

[Research](docs/research/RESEARCH.md) compares verified hackathon precedents and competing products. [OnchainOS notes](docs/research/ONCHAINOS.md) record API capabilities, limits and integration decisions. [Evidence](docs/research/EVIDENCE.md) separates published facts, chain checks and product hypotheses.

ExitOS is being built for X Layer TapeOut Accelerate. The goal is a useful recovery product with a defensible demo and honest evidence.

## Hosting

The Vercel project is `exitos`. It installs locked dependencies with `npm ci`, builds the standalone kit and serves the Vite output from `dist`. Navigation uses URL hashes, so missing files return a real 404. Security headers restrict browser connections to the public testnet nodes and keep the interface out of frames.

Local wallets, environment credentials, research caches and task notes are excluded from the upload. The generated recovery kit is rebuilt in Vercel from the committed public contract pins. No server secret is needed by the application.

```sh
vercel link --project exitos --yes
vercel deploy --prod --yes
vercel alias set <deployment_url> exitos.vercel.app --scope mantissas-projects
```

The exact address is assigned with the alias command after each production deployment. Vercel accepted this assignment for the verified live build. Automatic project domain registration returned a conflict, so keep the explicit alias step in the release process.
