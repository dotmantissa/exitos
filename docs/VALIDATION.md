# ExitOS validation record

Checked on 2026-10-29T15:25:50.695438+00:00.

## Verified locally

- TypeScript checks pass for the application and deployment scripts.
- Thirteen domain tests pass, covering exact amounts, circuit policy and manifest integrity.
- Nine Chromium browser checks pass across 360, 768 and 1440 pixels in both themes, including navigation, theme persistence, wallet absence, verification gating and protection of local wallet files.
- Mobile and desktop screenshots were inspected in both themes.
- Solidity 0.8.28 compilation passes with optimization enabled, 200 runs and the Paris target. OpenZeppelin Contracts is pinned to 5.4.0.
- The production build and standalone kit generation pass.
- npm audit reports zero vulnerabilities for the pinned dependency tree.
- Product copy and credential scans pass. The local wallet file is ignored and has mode 0600. The development server refuses that path with HTTP 403.

The browser runner uses patched Playwright 1.55.1 and Chromium 140. Its temporary profiles are stored in the ignored project directory because the shared temporary filesystem is nearly full.

## Pending actual chain certification

The node returns chain 1952. The generated deployer currently has zero test OKB. The deploy command exits before broadcasting, and the public deployment configuration remains undeployed.

No actual ExitOS deployment, admission, deposit, withdrawal or security receipt has been recorded. No live end to end certification is claimed.

Once gas arrives, run the compiler, deployment, source and release verifier, actual transaction drill, separate registry security suite, kit generation and browser signing transport. Record the actual transaction hashes, receipt blocks and balance reconciliation. Then rebuild, revise this record and the README, and push the evidence.

The browser signing transport keeps the key in Node and sends constrained actual testnet transactions. It does not substitute fabricated balances or receipts. A separate check with an installed user wallet remains a release gate.

## Official ecosystem gate

The testnet NAND processor is independently deployed compatible code. It is not registered in the official TapeOut factory. The bundle store is not official DeWEB. Resolve genuine ecosystem registration and delivery before representing the project as an eligible, complete hackathon submission.
