import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
  type Address,
  type Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
export const chain = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "Test OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon"] } },
});
export const publicClient = createPublicClient({
  chain,
  transport: http(chain.rpcUrls.default.http[0], {
    timeout: 30000,
    retryCount: 2,
  }),
});
export function localAccounts() {
  const { keys } = JSON.parse(
    readFileSync(".local/testnet-wallets.json", "utf8"),
  );
  return (keys as Hex[]).map((key) => privateKeyToAccount(key));
}
export function signingClient(index = 0) {
  return createWalletClient({
    account: localAccounts()[index],
    chain,
    transport: http(chain.rpcUrls.default.http[0], { timeout: 30000 }),
  });
}
export function artifact(name: string): {
  abi: Abi;
  evm: { bytecode: { object: string } };
} {
  return JSON.parse(readFileSync(`artifacts/${name}.json`, "utf8"));
}
export function writePublic(path: string, data: unknown) {
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    path + ".tmp",
    JSON.stringify(
      data,
      (_, value) => (typeof value === "bigint" ? String(value) : value),
      2,
    ) + "\n",
  );
  renameSync(path + ".tmp", path);
}
export async function included(hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 240000,
  });
  if (receipt.status !== "success")
    throw new Error(`Transaction reverted: ${hash}`);
  return receipt;
}
export async function codeHash(address: Address) {
  const { keccak256 } = await import("viem");
  const code = await publicClient.getCode({ address });
  if (!code) throw new Error("Contract code is absent.");
  return keccak256(code);
}
