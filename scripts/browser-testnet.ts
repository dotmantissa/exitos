import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { decodeFunctionData, type Address, type Hex } from "viem";
import { signingClient, publicClient } from "./network";
import { deployment, assetAbi, vaultAbi } from "../src/chain/config";
if (!deployment)
  throw new Error(
    "Deploy and verify actual testnet contracts before browser signing checks.",
  );
const config = deployment,
  signer = signingClient(),
  account = signer.account.address;
const browserTemp = resolve(".local/browser-tmp");
mkdirSync(browserTemp, { recursive: true, mode: 0o700 });
const browser = await chromium.launch({
    env: { ...process.env, TMPDIR: browserTemp },
  }),
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const baseUrl = new URL(
  process.env.EXITOS_BROWSER_URL || "http://127.0.0.1:5175/",
);
if (
  baseUrl.origin !== "http://127.0.0.1:5175" &&
  baseUrl.origin !== "https://exitos.vercel.app"
)
  throw new Error("Unsupported browser verification origin.");
const hosted = baseUrl.protocol === "https:";
const hashes: Hex[] = [],
  errors: string[] = [];
page.setDefaultTimeout(120000);
page.on("pageerror", (error) => errors.push(error.message));
// The browser receives a controlled transport, never a private key. Every
// write is constrained here and sent by the actual testnet signing client.
await page.exposeBinding(
  "exitTestnetRequest",
  async (_source, request: { method: string; params?: unknown[] }) => {
    if (
      request.method === "eth_requestAccounts" ||
      request.method === "eth_accounts"
    )
      return [account];
    if (request.method === "eth_chainId")
      return `0x${(await publicClient.getChainId()).toString(16)}`;
    if (request.method === "eth_sendTransaction") {
      const tx = request.params?.[0] as {
        from: Address;
        to: Address;
        data: Hex;
        value?: Hex;
        gas?: Hex;
      };
      if (
        tx.from.toLowerCase() !== account.toLowerCase() ||
        BigInt(tx.value || "0x0") !== 0n
      )
        throw new Error("Signing transport rejected account or value.");
      if (tx.to.toLowerCase() === config.vault.toLowerCase()) {
        const decoded = decodeFunctionData({ abi: vaultAbi, data: tx.data });
        if (decoded.functionName === "deposit") {
          if (decoded.args[1].toLowerCase() !== account.toLowerCase())
            throw new Error("Unexpected deposit receiver.");
        } else if (decoded.functionName === "withdraw") {
          if (
            decoded.args[1].toLowerCase() !== account.toLowerCase() ||
            decoded.args[2].toLowerCase() !== account.toLowerCase()
          )
            throw new Error("Unexpected recovery recipient.");
        } else throw new Error("Unknown vault selector.");
      } else if (tx.to.toLowerCase() === config.asset.toLowerCase()) {
        const decoded = decodeFunctionData({ abi: assetAbi, data: tx.data });
        if (decoded.functionName === "approve") {
          if (
            decoded.args[0].toLowerCase() !== config.vault.toLowerCase() ||
            decoded.args[1] > 100n * 10n ** 18n
          )
            throw new Error("Unexpected approval scope.");
        } else if (decoded.functionName !== "claim")
          throw new Error("Unknown asset selector.");
      } else throw new Error("Unknown transaction target.");
      const hash = await signer.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: 0n,
        ...(tx.gas ? { gas: BigInt(tx.gas) } : {}),
      });
      hashes.push(hash);
      writeFileSync(
        ".local/browser-signing-last-run.json",
        JSON.stringify(
          {
            origin: baseUrl.origin,
            releaseId: config.releaseId,
            account,
            hashes,
            updatedAt: new Date().toISOString(),
          },
          null,
          2,
        ) + "\n",
      );
      return hash;
    }
    throw new Error(
      `Unsupported controlled transport method: ${request.method}`,
    );
  },
);
// Use literal browser JavaScript. Serializing a TSX-transformed callback can
// retain Node-only function naming helpers and prevent provider injection.
await page.addInitScript(`
  window.ethereum = {
    request: function(value) { return window.exitTestnetRequest(value); },
    on: function() {},
    removeListener: function() {}
  };
`);
async function click(name: string) {
  await page
    .getByRole("button", { name, exact: true })
    .click({ timeout: 120000 });
  console.log(`Browser action: ${name}`);
}
async function untilDone() {
  await page
    .getByRole("heading", {
      name: /Approval confirmed\.|Deposit confirmed\.|Withdrawal confirmed\.|Test tokens received\./,
    })
    .waitFor({ timeout: 240000 });
}
try {
  await page.goto(baseUrl.href);
  if (
    !(await page.evaluate(() => typeof window.ethereum?.request === "function"))
  )
    throw new Error("The actual signing transport did not initialize.");
  await page
    .getByRole("button", { name: "Try the test vault", exact: true })
    .first()
    .click();
  await click("Connect wallet");
  await page
    .getByRole("button", { name: "Disconnect wallet", exact: true })
    .waitFor({ timeout: 30000 });
  await page
    .getByText("Release verified", { exact: true })
    .waitFor({ timeout: 120000 });
  const balance = await publicClient.readContract({
    address: config.asset,
    abi: assetAbi,
    functionName: "balanceOf",
    args: [account],
  });
  if (balance < 7n * 10n ** 18n) {
    await click("Claim 1,000 XUSD");
    await click("Confirm in wallet");
    await untilDone();
    await click("Back to your position");
  }
  const startingAssets = await publicClient.readContract({
    address: config.asset,
    abi: assetAbi,
    functionName: "balanceOf",
    args: [account],
  });
  const startingShares = await publicClient.readContract({
    address: config.vault,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: [account],
  });
  await click("Deposit XUSD");
  await page.getByLabel("Amount in XUSD").fill("7");
  await click("Review deposit");
  await page
    .getByRole("button", { name: "Confirm in wallet", exact: true })
    .waitFor({ timeout: 120000 });
  await page.screenshot({
    path: "qa-artifacts/actual-review.png",
    fullPage: true,
  });
  const dialog = page.getByRole("dialog");
  await page.keyboard.press("Tab");
  if (!(await dialog.evaluate((el) => el.contains(document.activeElement))))
    throw new Error("Dialog focus escaped.");
  await click("Confirm in wallet");
  await untilDone();
  if (
    await page
      .getByRole("button", { name: "Continue to deposit", exact: true })
      .count()
  ) {
    await click("Continue to deposit");
    await click("Review deposit");
    await page
      .getByRole("button", { name: "Confirm in wallet", exact: true })
      .waitFor({ timeout: 120000 });
    await click("Confirm in wallet");
    await untilDone();
  }
  await click("Back to your position");
  await click("Withdraw");
  await page
    .getByRole("button", { name: "Withdraw to wallet", exact: true })
    .waitFor();
  await click("Withdraw to wallet");
  await page.getByLabel("Amount in XUSD").fill("1e2");
  await click("Review withdrawal");
  await page
    .getByRole("alert")
    .filter({ hasText: "Enter an amount" })
    .waitFor();
  await page.getByLabel("Amount in XUSD").fill("4");
  await click("Review withdrawal");
  await page
    .getByRole("button", { name: "Confirm in wallet", exact: true })
    .waitFor({ timeout: 120000 });
  await click("Confirm in wallet");
  await untilDone();
  await click("Back to your position");
  // The standalone page is loaded first, then all application-origin requests
  // are blocked. Its remaining reads and withdrawal go to the actual testnet.
  await page.goto(new URL("recovery-kit.html", baseUrl).href);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .waitFor({ timeout: 120000 });
  await page.route(baseUrl.origin + "/**", (route) => route.abort());
  await click("Connect wallet");
  await page
    .getByLabel("Amount to withdraw")
    .waitFor({ state: "visible", timeout: 120000 });
  await page.getByLabel("Amount to withdraw").fill("3");
  await click("Review withdrawal");
  await click("Confirm in wallet");
  await page
    .getByRole("status")
    .filter({ hasText: "Withdrawal confirmed." })
    .waitFor({ timeout: 240000 });
  await page.screenshot({
    path: "qa-artifacts/actual-standalone-recovery.png",
    fullPage: true,
  });
  if (errors.length) throw new Error("Browser reported runtime errors.");
  const transactions = await Promise.all(
    hashes.map(async (hash) => {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      if (receipt.status !== "success")
        throw new Error("Browser transaction reverted.");
      return {
        hash,
        status: receipt.status,
        block: String(receipt.blockNumber),
      };
    }),
  );
  const finalReceipt = await publicClient.getTransactionReceipt({
    hash: hashes[hashes.length - 1],
  });
  const [endingAssets, endingShares] = await Promise.all([
    publicClient.readContract({
      address: config.asset,
      abi: assetAbi,
      functionName: "balanceOf",
      args: [account],
      blockNumber: finalReceipt.blockNumber,
    }),
    publicClient.readContract({
      address: config.vault,
      abi: vaultAbi,
      functionName: "balanceOf",
      args: [account],
      blockNumber: finalReceipt.blockNumber,
    }),
  ]);
  if (startingAssets !== endingAssets || startingShares !== endingShares)
    throw new Error("Actual browser recovery balances did not reconcile.");
  writeFileSync(
    hosted
      ? "evidence/testnet-browser-hosted.json"
      : "evidence/testnet-browser.json",
    JSON.stringify(
      {
        chainId: 1952,
        verifiedAt: new Date().toISOString(),
        account,
        origin: baseUrl.origin,
        startingAssets: String(startingAssets),
        endingAssets: String(endingAssets),
        startingShares: String(startingShares),
        endingShares: String(endingShares),
        transport:
          "Controlled node signing transport using actual testnet transactions; no private key in browser",
        transactions,
        checks: [
          "actual allowance and deposit",
          "dialog focus containment",
          "invalid amount rejection",
          "app withdrawal",
          "exact token and share balance reconciliation",
          "standalone withdrawal with application origin blocked",
        ],
        teamControlledWallet: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${transactions.length} actual browser transactions verified, including standalone recovery.`,
  );
} catch (error) {
  console.error("Browser runtime errors:", errors);
  console.error(
    "Browser verification alerts:",
    await page.getByRole("alert").allTextContents(),
  );
  await page
    .screenshot({
      path: "qa-artifacts/actual-browser-failure.png",
      fullPage: true,
    })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
