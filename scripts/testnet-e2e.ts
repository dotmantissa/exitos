import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { encodeFunctionData, parseEther, type Hex, parseEventLogs } from "viem";
import { signingClient, publicClient, included } from "./network";
import {
  deployment,
  assetAbi,
  vaultAbi,
  registryAbi,
} from "../src/chain/config";
import { verifyRelease } from "../src/chain/verification";
if (!deployment) throw new Error("Deploy actual contracts first.");
const signer = signingClient(),
  account = signer.account.address;
const receipts: Record<string, unknown> = {};
const checkpointPath = ".local/e2e-state.json";
const saved: Record<string, Hex> = existsSync(checkpointPath)
  ? JSON.parse(readFileSync(checkpointPath, "utf8"))
  : {};
async function send(name: string, to: `0x${string}`, data: Hex, gas?: bigint) {
  const hash = await signer.sendTransaction({
    to,
    data,
    ...(gas ? { gas } : {}),
  });
  saved[name] = hash;
  writeFileSync(checkpointPath, JSON.stringify(saved, null, 2) + "\n", {
    mode: 0o600,
  });
  const receipt = await included(hash);
  receipts[name] = {
    hash,
    block: String(receipt.blockNumber),
    status: receipt.status,
  };
  return receipt;
}
const before = await publicClient.readContract({
  address: deployment.asset,
  abi: assetAbi,
  functionName: "balanceOf",
  args: [account],
});
const nextClaim = await publicClient.readContract({
  address: deployment.asset,
  abi: assetAbi,
  functionName: "nextClaimAt",
  args: [account],
});
if ((await publicClient.getBlock()).timestamp >= nextClaim)
  await send(
    "claim",
    deployment.asset,
    encodeFunctionData({ abi: assetAbi, functionName: "claim" }),
  );
else
  receipts.claim = {
    previousHash: saved.claim,
    cooldown: String(nextClaim),
    actualBalance: String(before),
  };
const startingAssets = await publicClient.readContract({
  address: deployment.asset,
  abi: assetAbi,
  functionName: "balanceOf",
  args: [account],
});
if (startingAssets < parseEther("50"))
  throw new Error("Insufficient test credit for the actual drill.");
const startingShares = await publicClient.readContract({
  address: deployment.vault,
  abi: vaultAbi,
  functionName: "balanceOf",
  args: [account],
});
await send(
  "approve",
  deployment.asset,
  encodeFunctionData({
    abi: assetAbi,
    functionName: "approve",
    args: [deployment.vault, parseEther("50")],
  }),
);
const deposit = await send(
  "deposit",
  deployment.vault,
  encodeFunctionData({
    abi: vaultAbi,
    functionName: "deposit",
    args: [parseEther("50"), account],
  }),
);
if (
  !parseEventLogs({
    abi: vaultAbi,
    logs: deposit.logs,
    eventName: "Deposit",
  }).some(
    (log) =>
      log.args.assets === parseEther("50") &&
      log.args.owner.toLowerCase() === account.toLowerCase(),
  )
)
  throw new Error("Deposit event missing.");
const depositedAssets = await publicClient.readContract({
  address: deployment.asset,
  abi: assetAbi,
  functionName: "balanceOf",
  args: [account],
  blockNumber: deposit.blockNumber,
});
if (depositedAssets !== startingAssets - parseEther("50"))
  throw new Error("Deposit balance mismatch.");
await verifyRelease(deployment);
const withdrawal = await send(
  "withdraw",
  deployment.vault,
  encodeFunctionData({
    abi: vaultAbi,
    functionName: "withdraw",
    args: [parseEther("50"), account, account],
  }),
);
const [endingAssets, endingShares] = await Promise.all([
  publicClient.readContract({
    address: deployment.asset,
    abi: assetAbi,
    functionName: "balanceOf",
    args: [account],
    blockNumber: withdrawal.blockNumber,
  }),
  publicClient.readContract({
    address: deployment.vault,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: [account],
    blockNumber: withdrawal.blockNumber,
  }),
]);
if (endingAssets !== startingAssets || endingShares !== startingShares)
  throw new Error("Recovery balances did not reconcile.");
if (
  !parseEventLogs({
    abi: vaultAbi,
    logs: withdrawal.logs,
    eventName: "Withdraw",
  }).some(
    (log) =>
      log.args.assets === parseEther("50") &&
      log.args.owner.toLowerCase() === account.toLowerCase() &&
      log.args.receiver.toLowerCase() === account.toLowerCase(),
  )
)
  throw new Error("Withdraw event missing.");
const admission = await publicClient.getTransaction({
  hash: deployment.transactions.Admission,
});
const replayHash = await signer.sendTransaction({
  to: deployment.registry,
  data: admission.input,
  gas: 700000n,
});
const replayReceipt = await publicClient.waitForTransactionReceipt({
  hash: replayHash,
  timeout: 180000,
});
if (replayReceipt.status !== "reverted")
  throw new Error("Admission replay unexpectedly succeeded.");
receipts.replayRejected = {
  hash: replayHash,
  status: replayReceipt.status,
  block: String(replayReceipt.blockNumber),
};
const unauthorizedHash = await signer.sendTransaction({
  to: deployment.registry,
  data: encodeFunctionData({
    abi: registryAbi,
    functionName: "admit",
    args: [
      deployment.root,
      deployment.store,
      (await publicClient.getBlock()).timestamp + 600n,
      [],
    ],
  }),
  gas: 300000n,
});
const unauthorized = await publicClient.waitForTransactionReceipt({
  hash: unauthorizedHash,
  timeout: 180000,
});
if (unauthorized.status !== "reverted")
  throw new Error("Unauthorized admission unexpectedly succeeded.");
receipts.unauthorizedRejected = {
  hash: unauthorizedHash,
  status: unauthorized.status,
  block: String(unauthorized.blockNumber),
};
writeFileSync(
  "evidence/testnet-e2e.json",
  JSON.stringify(
    {
      chainId: 1952,
      verifiedAt: new Date().toISOString(),
      account,
      amount: "50 XUSD",
      startingAssets: String(startingAssets),
      endingAssets: String(endingAssets),
      startingShares: String(startingShares),
      endingShares: String(endingShares),
      receipts,
      teamControlledWallet: true,
      settlement: "L2 inclusion",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Actual claim, allowance, deposit, approved recovery, balance reconciliation and rejected replay verified.",
);
