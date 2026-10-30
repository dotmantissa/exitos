# ExitOS validation record

Updated after actual installed-wallet verification on 2026-10-30T10:06:03.508Z.

## Verified locally

- TypeScript checks pass for the application and deployment scripts.
- Thirteen domain tests pass, covering exact amounts, circuit policy and manifest integrity.
- Sixteen Chromium browser checks pass across 360, 768 and 1440 pixels in both themes, including the introduction, navigation, theme persistence, wallet absence, verification gating and protection of local wallet files.
- Mobile and desktop screenshots were inspected in both themes.
- Solidity 0.8.28 compilation passes with optimization enabled, 200 runs and the Paris target. OpenZeppelin Contracts is pinned to 5.4.0.
- The production build and standalone kit generation pass.
- npm audit reports zero vulnerabilities for the pinned dependency tree.
- Product copy and credential scans pass. The local wallet file is ignored and has mode 0600. The development server refuses that path with HTTP 403.

The browser runner uses patched Playwright 1.55.1 and Chromium 140. Its temporary profiles are stored in the ignored project directory because the shared temporary filesystem is nearly full.

## Actual testnet evidence

The faucet funded the deployer with 0.2 test OKB. Five contracts were deployed and the release was admitted on X Layer testnet, chain 1952.

- All five creation transactions match the compiled source and constructor arguments. The verifier checks runtime code hashes, reviewer roles, the current admission, revocation, manifest commitments and stored executable bytes. All sixteen actual circuit calls match the expected outputs at block 44842908 after admitting recovery version 0.3.0.
- A real 50 XUSD drill claimed test credit, approved the exact amount, deposited it and withdrew it to the same wallet. The wallet returned to 1,000 XUSD and the vault shares returned to zero. Unauthorized admission and replay each produced a reverted receipt.
- Thirteen actual authorization and revocation cases passed on a separate registry. Eleven were expected reverts. A valid admission and authorized revocation succeeded. The application registry was preserved.
- The security runner persists signed transaction bytes before broadcast and resumes the same hashes. A transient latest state read after deployment was resolved by checking code at the actual receipt block.
- Four actual browser transactions passed: exact allowance, 7 XUSD deposit, 4 XUSD app withdrawal and 3 XUSD standalone withdrawal after blocking every request to the application origin. Wallet tokens and vault shares returned exactly to their initial balances. Dialog focus containment and invalid amount rejection also passed.
- The disconnected browser checks passed at all three viewport sizes in both themes. The saved route check now waits for actual release verification and a visible wallet connection control.

The browser signing transport keeps the key in Node and sends constrained actual testnet transactions. It does not substitute fabricated balances or receipts. The later installed MetaMask check below independently verifies the recorded delivery route.

Public records: [deployment](../evidence/testnet-deployment.json), [source and release verification](../evidence/testnet-verification.json), [transaction drill](../evidence/testnet-e2e.json) [authorization cases](../evidence/testnet-security.json) and [browser signing](../evidence/testnet-browser.json).

## Official ecosystem gate

The testnet NAND processor is independently deployed compatible code. It is not registered in the official TapeOut factory. The bundle store is not official DeWEB. Resolve genuine ecosystem registration and delivery before representing the project as an eligible, complete hackathon submission.

## Test runner environment

The local Node runner uses `NODE_OPTIONS='--dns-result-order=ipv4first --no-network-family-autoselection'` for reliable TCP connections in this environment. The browser still reads the actual public RPC. This setting changes routing, not chain responses.

Browser signing uses a literal JavaScript provider bridge. TSX function serialization initially prevented injection; the runner now asserts provider initialization and actual wallet connection before proceeding. Failed attempts did not submit transactions or produce success evidence.

## Published application

The public application is available at [exitos.vercel.app](https://exitos.vercel.app). Vercel deployment `dpl_866f7xKRGCfMQShexdghEtrrbpSU` completed its locked install and production build. The exact requested alias was assigned explicitly. The project authentication gate was removed so visitors can open the dapp directly.

The live headers match the configured content policy, frame restrictions, referrer privacy and content type protection. Live JavaScript, CSS, logo, recovery kit and Service Worker bytes match the locally validated build. Eight private, source and missing paths return 404, including the local wallet file, environment credentials and Git configuration.

Four additional actual transactions passed through the live domain: an exact allowance, 7 XUSD deposit, 4 XUSD app withdrawal and 3 XUSD standalone withdrawal after blocking the app origin. Token and share balances returned exactly to their initial values. The live content policy allowed the verified recovery module to execute without application asset requests.

[Hosted signing evidence](../evidence/testnet-browser-hosted.json) records the actual receipts and balances. [Hosting evidence](../evidence/vercel-hosting.json) records the domain, headers, asset hashes and private path responses.

Project domain registration returned 409 because Vercel reports an existing project assignment. The explicit alias operation succeeded and public checks passed on the requested domain. Future release commands must assign that alias explicitly. No other project was removed or reconfigured.

## First visit clarity revision

The default homepage explains ExitOS as a backup withdrawal page for DeFi vaults, shows the website and saved kit as two paths to the same vault, states the current testnet scope and leads into the actual test vault. It makes no initial RPC requests.

Sixteen Chromium checks passed across 360, 768 and 1440 pixels in both themes. They cover the explanation, app navigation, actual next action guidance, browser history, keyboard access, theme persistence, approved standalone code and protection of local wallet files. Screenshots were inspected. An unwanted initial heading focus outline was fixed before the final checks.

Recovery version 0.2.0 was stored in a new immutable bundle and admitted through real reviewer signatures. The asset, vault, circuit and registry were preserved. Creation input and code/release identity checks passed, including 16 actual circuit calls. The signed release journal supports resuming the exact transaction hashes and keeps prior public evidence.

The revised browser flow completed four real testnet transactions: exact allowance, 7 XUSD deposit, 4 XUSD app withdrawal and 3 XUSD standalone withdrawal with all app origin requests blocked. Token and share balances reconciled exactly. No simulated balance or receipt was used.

[Clarity release evidence](../evidence/testnet-clarity-release.json) records the storage and admission hashes. [Browser signing evidence](../evidence/testnet-browser.json) records actual receipts. Older prototype recovery files carry their original pins; download the current kit for this new release.

Seven introduction checks also passed against the exact public domain across all three viewport sizes in both themes. The public homepage loads without a wallet or an initial RPC request, explains the outage scenario and keeps navigation and browser history usable. The deployed assets match the final validated production build.

The revised live application completed four additional genuine testnet transactions on the public domain. Its exact allowance, 7 XUSD deposit, 4 XUSD app withdrawal and 3 XUSD standalone withdrawal all confirmed. The final withdrawal succeeded with all application origin requests blocked, and wallet tokens and vault shares returned exactly to their starting values. The hosted evidence now records this production revision.

## Replacement palette

The app, logo, browser theme metadata and generated kit use cream `#FEF8F5`, sage `#729877`, forest `#53745F` and charcoal `#231F20`. Light and dark surfaces, dividers and highlights derive from these four colours. Previous interface palette values are absent from the active source.

Sixteen local Chromium checks pass after the palette revision. Eight additional rendered checks cover both application themes and the approved recovery page at 360, 768 and 1440 pixels in both themes. They verify secondary copy, action labels, responsive width, theme switching and browser theme metadata. The lowest tested app text ratio is 4.61:1; primary button labels measure 4.95:1 in light mode and 5.02:1 in dark mode. Mobile and desktop screenshots were inspected.

Recovery version 0.3.0 was published in a new immutable store and admitted with actual reviewer signatures. The local module hash matches the published executable hash. All five source creation inputs and the current release commitments match; all sixteen circuit calls pass at the recorded verification block. Previous release pins remain in the release history.

The local transaction drill confirmed exact allowance, a 7 XUSD deposit and a 4 XUSD app withdrawal. The saved page connection exceeded the original runner wait before its final withdrawal. The recovery runner reconstructed those three receipts from bounded on-chain event queries and completed the remaining 3 XUSD withdrawal with app-origin requests blocked. All four receipts succeeded and wallet tokens and vault shares returned exactly to their initial values. The runner now allows 120 seconds for asynchronous wallet and chain reads and checkpoints public transaction hashes in the ignored local directory.

TypeScript, the 13 domain tests, Solidity compilation, the production build, product copy and credential scans pass. No recovery module bytes changed after publication.

[Palette release](../evidence/testnet-palette-release.json), [local rendered palette checks](../evidence/palette-verification-local.json) and [local actual receipts](../evidence/testnet-browser.json) record this revision.

The replacement palette is published on the exact public domain. The hosted asset hashes match the validated production build, and all eight private or source paths return 404. Seven first-visit browser checks passed across 360, 768 and 1440 pixels in both themes. Eight hosted rendered palette checks also passed for both app themes and all six responsive approved recovery views. Their lowest tested text ratio is 4.61:1. The hosted phone and desktop screenshots were inspected.

[Hosted palette checks](../evidence/palette-verification-hosted.json) and [hosting evidence](../evidence/vercel-hosting.json) record the published palette.

The palette revision also completed four genuine transactions through the exact public domain: an exact allowance, a 7 XUSD deposit, a 4 XUSD app withdrawal and a 3 XUSD withdrawal from approved recovery version 0.3.0 with every application origin request blocked. All four receipts succeeded, and the wallet returned exactly to 1,000 XUSD with zero vault shares. [Hosted signing evidence](../evidence/testnet-browser-hosted.json) records this verified revision.

## Installed MetaMask demo and wallet event fix

Repeated account and chain notifications from the installed wallet invalidated balance reads and left the loader running. Commit `89e45fd` ignores identical notifications and clears loading when wallet state genuinely changes. Application/script types, product copy, 13 domain tests, 16 browser checks, the production build and credential scans passed. The fix is deployed on the exact public domain, and hosted assets, headers and private path checks passed. Recovery module 0.3.0 was unchanged.

A new isolated test account received 0.02 test OKB. Official MetaMask 13.55.0 signed five actual transactions on chain 1952: claim 1,000 XUSD, approve exactly 10, deposit 10, withdraw 4 through the app and withdraw the remaining 6 from the downloaded HTML file. All five receipts succeeded. The read-only verifier decoded each transaction, checked its signer, recipient, function and amount, required the corresponding contract events, compared the downloaded kit with the deployed build, and reconciled the final balance to 1,000 XUSD, zero shares and zero allowance.

Every request to the application origin was blocked during the saved-file withdrawal. Browser navigation to the website failed while the genuine downloaded page read approved code and signed directly through the installed wallet. Website access was restored only after the withdrawal was confirmed, for the final app balance shot.

MetaMask flagged the application domain; its cause remains unresolved and the warning is retained in the demo. Reconnecting wallet permissions resolved an initial 4100 transaction authorization failure. Local-file provider communication also required extension file URL permission and `--allow-file-access-from-files` in the isolated Chromium browser. These browser settings and testnet-only scope are disclosed. No wallet provider, balance or RPC response was fabricated. No keys, passwords or browser profiles are included in exported media or public evidence.

[Installed-wallet evidence](../evidence/demo-installed-wallet.json) contains the five hashes, decoded functions, successful blocks, kit checksum and exact reconciliation. Earlier browser signing evidence remains available with its original scope.
