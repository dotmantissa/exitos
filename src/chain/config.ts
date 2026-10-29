import {
  defineChain,
  createPublicClient,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { z } from "zod";
import rawDeployment from "../data/deployment.json";

export const RPC =
  import.meta.env?.VITE_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon";
export const chain = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "Test OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer-test" },
  },
});
export const client = createPublicClient({
  chain,
  transport: http(RPC, { timeout: 15000, retryCount: 1 }),
});
const address = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((v) => v as Address);
const hash = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/)
  .transform((v) => v as Hex);
export const deploymentSchema = z
  .object({
    status: z.literal("deployed"),
    chainId: z.literal(1952),
    deployedAt: z.string(),
    asset: address,
    vault: address,
    processor: address,
    registry: address,
    store: address,
    assetCodeHash: hash,
    vaultCodeHash: hash,
    processorCodeHash: hash,
    registryCodeHash: hash,
    storeCodeHash: hash,
    circuitHash: hash,
    root: hash,
    releaseId: z.number().int().positive(),
    reviewers: z.array(address).length(4),
    transactions: z.record(z.string(), hash),
    block: z.string(),
    provenance: z.literal("TAP-02 compatible testnet deployment"),
  })
  .strict();
export type Deployment = z.infer<typeof deploymentSchema>;
const parsed = deploymentSchema.safeParse(rawDeployment);
export const deployment = parsed.success ? parsed.data : null;
export const assetAbi = parseAbi([
  "function claim()",
  "function nextClaimAt(address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);
export const vaultAbi = parseAbi([
  "function asset() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
  "function maxWithdraw(address) view returns (uint256)",
  "function previewWithdraw(uint256) view returns (uint256)",
  "function deposit(uint256,address) returns (uint256)",
  "function withdraw(uint256,address,address) returns (uint256)",
  "event Deposit(address indexed sender,address indexed owner,uint256 assets,uint256 shares)",
  "event Withdraw(address indexed sender,address indexed receiver,address indexed owner,uint256 assets,uint256 shares)",
]);
export const processorAbi = parseAbi([
  "function circuitHash() view returns (bytes32)",
  "function netlist(uint256) view returns (bytes)",
  "function circuitInfo(uint256) view returns (uint32,uint32,uint32,uint32)",
  "function eval(uint256,bytes) view returns (bytes)",
]);
export const registryAbi = parseAbi([
  "function project() view returns (bytes32)",
  "function processor() view returns (address)",
  "function processorCodeHash() view returns (bytes32)",
  "function circuitHash() view returns (bytes32)",
  "function currentRelease() view returns (uint256)",
  "function nextNonce() view returns (uint256)",
  "function reviewers(uint256) view returns (address)",
  "function releases(uint256) view returns (bytes32 root,address store,uint64 admittedAt,bool revoked)",
  "function admit(bytes32,address,uint64,bytes[]) returns (uint256)",
  "function revoke(uint256,uint64,bytes[])",
]);
export const storeAbi = parseAbi([
  "function read() view returns (bytes)",
  "function contentHash() view returns (bytes32)",
]);
export function explorer(hash: Hex | Address, type: "tx" | "address" = "tx") {
  return `${chain.blockExplorers.default.url}/${type}/${hash}`;
}
