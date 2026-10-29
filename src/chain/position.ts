import {
  type Address,
  type Hex,
  encodeFunctionData,
  decodeFunctionData,
} from "viem";
import { client, assetAbi, vaultAbi, deployment } from "./config";
import { verifyRelease } from "./verification";
export type Position = {
  account: Address;
  assets: bigint;
  shares: bigint;
  walletBalance: bigint;
  allowance: bigint;
  gas: bigint;
  maximum: bigint;
  nextClaimAt: bigint;
  block: bigint;
};
export async function readPosition(account: Address): Promise<Position> {
  if (!deployment) throw new Error("Contracts have not been deployed yet.");
  const block = await client.getBlockNumber();
  const [shares, walletBalance, allowance, gas, maximum, nextClaimAt] =
    await Promise.all([
      client.readContract({
        address: deployment.vault,
        abi: vaultAbi,
        functionName: "balanceOf",
        args: [account],
        blockNumber: block,
      }),
      client.readContract({
        address: deployment.asset,
        abi: assetAbi,
        functionName: "balanceOf",
        args: [account],
        blockNumber: block,
      }),
      client.readContract({
        address: deployment.asset,
        abi: assetAbi,
        functionName: "allowance",
        args: [account, deployment.vault],
        blockNumber: block,
      }),
      client.getBalance({ address: account, blockNumber: block }),
      client.readContract({
        address: deployment.vault,
        abi: vaultAbi,
        functionName: "maxWithdraw",
        args: [account],
        blockNumber: block,
      }),
      client.readContract({
        address: deployment.asset,
        abi: assetAbi,
        functionName: "nextClaimAt",
        args: [account],
        blockNumber: block,
      }),
    ]);
  const assets = await client.readContract({
    address: deployment.vault,
    abi: vaultAbi,
    functionName: "convertToAssets",
    args: [shares],
    blockNumber: block,
  });
  return {
    account,
    assets,
    shares,
    walletBalance,
    allowance,
    gas,
    maximum,
    nextClaimAt,
    block,
  };
}
export type Action = "claim" | "approve" | "deposit" | "withdraw";
export function transactionFor(
  action: Action,
  amount: bigint,
  account: Address,
): { to: Address; data: Hex; value: bigint } {
  if (!deployment) throw new Error("Contracts have not been deployed yet.");
  if (action === "claim")
    return {
      to: deployment.asset,
      data: encodeFunctionData({ abi: assetAbi, functionName: "claim" }),
      value: 0n,
    };
  if (amount <= 0n) throw new Error("Choose an amount greater than zero.");
  if (action === "approve")
    return {
      to: deployment.asset,
      data: encodeFunctionData({
        abi: assetAbi,
        functionName: "approve",
        args: [deployment.vault, amount],
      }),
      value: 0n,
    };
  if (action === "deposit")
    return {
      to: deployment.vault,
      data: encodeFunctionData({
        abi: vaultAbi,
        functionName: "deposit",
        args: [amount, account],
      }),
      value: 0n,
    };
  return {
    to: deployment.vault,
    data: encodeFunctionData({
      abi: vaultAbi,
      functionName: "withdraw",
      args: [amount, account, account],
    }),
    value: 0n,
  };
}
export async function prepareTransaction(
  action: Action,
  amount: bigint,
  account: Address,
) {
  const release = await verifyRelease();
  const position = await readPosition(account);
  if (
    action === "deposit" &&
    (amount > position.walletBalance || amount > position.allowance)
  )
    throw new Error(
      "The balance or allowance has changed. Refresh and review again.",
    );
  if (action === "withdraw" && amount > position.maximum)
    throw new Error(
      "Your available amount has changed. Refresh and review again.",
    );
  if (
    action === "claim" &&
    position.nextClaimAt > BigInt(Math.floor(Date.now() / 1000))
  )
    throw new Error("Your next test credit claim is available tomorrow.");
  if (position.gas === 0n)
    throw new Error(
      "Your wallet needs test OKB for gas. The network faucet can help.",
    );
  const tx = transactionFor(action, amount, account);
  if (action === "withdraw") {
    const decoded = decodeFunctionData({ abi: vaultAbi, data: tx.data });
    if (
      decoded.functionName !== "withdraw" ||
      decoded.args[0] !== amount ||
      decoded.args[1].toLowerCase() !== account.toLowerCase() ||
      decoded.args[2].toLowerCase() !== account.toLowerCase()
    )
      throw new Error("The recovery request does not match your review.");
  }
  const estimatedGas = await client.estimateGas({ account, ...tx });
  const gas = estimatedGas + estimatedGas / 5n;
  const price = await client.getGasPrice();
  if (position.gas < gas * price)
    throw new Error("There is not enough test OKB to cover the estimated gas.");
  return { tx, gas, fee: gas * price, position, release };
}
