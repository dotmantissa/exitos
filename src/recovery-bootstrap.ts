import { verifyRelease } from "./chain/verification";
import { connectWallet, getProvider, wallet, humanError } from "./chain/wallet";
import { readPosition, prepareTransaction } from "./chain/position";
import { parseAmount, displayAmount } from "./lib/amounts";
import { formatUnits, parseEventLogs, type Address, type Hex } from "viem";
import { client, deployment, explorer, vaultAbi } from "./chain/config";
const root = document.getElementById("recovery-root")!;
async function boot() {
  const approved = await verifyRelease();
  const url = URL.createObjectURL(
    new Blob([approved.module as Uint8Array<ArrayBuffer>], {
      type: "text/javascript",
    }),
  );
  try {
    const code = await import(/* @vite-ignore */ url);
    if (typeof code.mount !== "function")
      throw new Error("The approved bundle has no recovery interface.");
    code.mount(root, {
      version: approved.version,
      connect: async () => {
        const result = await connectWallet();
        if (result.chainId !== 1952)
          throw new Error(
            "Switch your wallet to X Layer testnet, chain1952, then connect again.",
          );
        return result.account;
      },
      position: readPosition,
      format: (amount: bigint) => displayAmount(amount),
      units: (amount: bigint) => formatUnits(amount, 18),
      parse: (value: string, max: bigint) => parseAmount(value, 18, max),
      error: humanError,
      explorer,
      withdraw: async (
        amount: bigint,
        account: Address,
        progress: (stage: string, hash?: Hex) => void,
      ) => {
        const prepared = await prepareTransaction("withdraw", amount, account);
        if (prepared.release.root !== approved.root)
          throw new Error(
            "The approved release changed. Reopen the kit before continuing.",
          );
        const provider = getProvider();
        if (!provider) throw new Error("Your wallet is unavailable.");
        const accounts = (await provider.request({
          method: "eth_accounts",
        })) as Address[];
        if (
          accounts[0]?.toLowerCase() !== account.toLowerCase() ||
          Number(await provider.request({ method: "eth_chainId" })) !== 1952
        )
          throw new Error(
            "Your wallet or network changed. Reconnect and review again.",
          );
        progress("wallet");
        const hash = await wallet(provider).sendTransaction({
          account,
          ...prepared.tx,
          gas: prepared.gas,
        });
        progress("pending", hash);
        let receipt;
        try {
          receipt = await client.waitForTransactionReceipt({
            hash,
            timeout: 180000,
          });
        } catch {
          throw new Error(
            "The transaction is still pending. Check the transaction link before trying again.",
          );
        }
        const tx = await client.getTransaction({ hash });
        if (
          receipt.status !== "success" ||
          tx.from.toLowerCase() !== account.toLowerCase() ||
          tx.input !== prepared.tx.data ||
          tx.to?.toLowerCase() !== deployment!.vault.toLowerCase() ||
          tx.value !== 0n
        )
          throw new Error(
            "The receipt does not confirm the reviewed withdrawal.",
          );
        if (
          !parseEventLogs({
            abi: vaultAbi,
            logs: receipt.logs,
            eventName: "Withdraw",
          }).some(
            (log) =>
              log.address.toLowerCase() === deployment!.vault.toLowerCase() &&
              log.args.owner.toLowerCase() === account.toLowerCase() &&
              log.args.receiver.toLowerCase() === account.toLowerCase() &&
              log.args.assets === amount,
          )
        )
          throw new Error("The expected withdrawal event was not found.");
      },
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
boot().catch((error) => {
  root.textContent =
    "The recovery route could not be verified. " + humanError(error);
});
