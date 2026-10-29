import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  getContractAddress,
  keccak256,
  stringToHex,
  bytesToHex,
  type Address,
  type Hex,
} from "viem";
import {
  localAccounts,
  publicClient,
  signingClient,
  artifact,
  included,
  codeHash,
} from "./network";
import { canonicalize, sha256 } from "../src/lib/manifest";
import { POLICY_HASH, POLICY_NETLIST } from "../src/lib/circuit";
import { registryAbi } from "../src/chain/config";
const signer = signingClient(),
  accounts = localAccounts();
if ((await publicClient.getChainId()) !== 1952)
  throw new Error("Wrong network.");
if ((await publicClient.getBalance({ address: accounts[0].address })) === 0n)
  throw new Error(
    `Fund deployer ${accounts[0].address} with test OKB on chain1952 before deployment.`,
  );
const statePath = ".local/deployment-state.json";
type State = {
  addresses: Record<string, Address>;
  transactions: Record<string, Hex>;
  root?: Hex;
  manifest?: unknown;
  releaseId?: number;
};
const state: State = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, "utf8"))
  : { addresses: {}, transactions: {} };
const checkpoint = () =>
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", {
    mode: 0o600,
  });
async function deploy(name: string, args: readonly unknown[] = []) {
  if (state.addresses[name]) {
    if (!(await publicClient.getCode({ address: state.addresses[name] })))
      throw new Error("Checkpoint contract missing.");
    return state.addresses[name];
  }
  let hash = state.transactions[name];
  if (!hash) {
    const compiled = artifact(name);
    hash = await signer.deployContract({
      abi: compiled.abi,
      bytecode: `0x${compiled.evm.bytecode.object}`,
      args,
    });
    state.transactions[name] = hash;
    checkpoint();
  }
  const receipt = await included(hash);
  if (!receipt.contractAddress) throw new Error("Deployment address missing.");
  state.addresses[name] = receipt.contractAddress;
  checkpoint();
  console.log(
    `${name}: ${receipt.contractAddress} at block ${receipt.blockNumber}`,
  );
  return receipt.contractAddress;
}
const asset = await deploy("ExitUSD"),
  vault = await deploy("ExitVault", [asset]),
  processor = await deploy("ReleaseProcessor", [POLICY_NETLIST]);
const reviewers = accounts.slice(1).map((account) => account.address);
const registry = await deploy("ReleaseRegistry", [
  keccak256(stringToHex("exitos")),
  processor,
  POLICY_HASH,
  reviewers,
]);
const assetCodeHash = await codeHash(asset),
  vaultCodeHash = await codeHash(vault);
let store = state.addresses.BundleStore;
if (!store) {
  const nonce = await publicClient.getTransactionCount({
    address: accounts[0].address,
    blockTag: "pending",
  });
  const predicted = state.transactions.BundleStore
    ? (state.manifest as { store: Address }).store
    : getContractAddress({ from: accounts[0].address, nonce: BigInt(nonce) });
  const module = readFileSync("public/recovery/recovery.js", "utf8"),
    moduleBytes = new TextEncoder().encode(module);
  const manifest = {
    schema: 1,
    chainId: 1952,
    project: "exitos",
    version: "0.1.0",
    asset,
    vault,
    processor,
    registry,
    store: predicted,
    circuitHash: POLICY_HASH,
    assetCodeHash,
    vaultCodeHash,
    files: [
      {
        path: "recovery.js",
        sha256: await sha256(moduleBytes),
        size: moduleBytes.length,
      },
    ],
  };
  const root = await sha256(new TextEncoder().encode(canonicalize(manifest)));
  const bundle = new TextEncoder().encode(
    canonicalize({ manifest, files: { "recovery.js": module } }),
  );
  if (bundle.length > 20000) throw new Error("Bundle exceeds store limit.");
  state.root = root;
  state.manifest = manifest;
  checkpoint();
  store = await deploy("BundleStore", [bytesToHex(bundle)]);
  if (store.toLowerCase() !== predicted.toLowerCase())
    throw new Error(
      "Store address prediction changed. Stop and review the nonce.",
    );
}
const root = state.root!;
if (!state.transactions.Admission) {
  const nonce = await publicClient.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "nextNonce",
  });
  const releaseId = nonce + 1n,
    expiresAt = (await publicClient.getBlock()).timestamp + 86400n;
  const types = {
    Approval: [
      { name: "project", type: "bytes32" },
      { name: "operation", type: "uint8" },
      { name: "nonce", type: "uint256" },
      { name: "releaseId", type: "uint256" },
      { name: "root", type: "bytes32" },
      { name: "store", type: "address" },
      { name: "expiresAt", type: "uint64" },
    ],
  } as const;
  const signatures = await Promise.all(
    [accounts[1], accounts[2], accounts[4]].map((account) =>
      account.signTypedData({
        domain: {
          name: "ExitOS Release Registry",
          version: "1",
          chainId: 1952,
          verifyingContract: registry,
        },
        types,
        primaryType: "Approval",
        message: {
          project: keccak256(stringToHex("exitos")),
          operation: 0,
          nonce,
          releaseId,
          root,
          store,
          expiresAt,
        },
      }),
    ),
  );
  state.transactions.Admission = await signer.writeContract({
    address: registry,
    abi: registryAbi,
    functionName: "admit",
    args: [root, store, expiresAt, signatures],
  });
  state.releaseId = Number(releaseId);
  checkpoint();
}
const receipt = await included(state.transactions.Admission);
const deployment = {
  status: "deployed",
  chainId: 1952,
  deployedAt: new Date().toISOString(),
  asset,
  vault,
  processor,
  registry,
  store,
  assetCodeHash,
  vaultCodeHash,
  processorCodeHash: await codeHash(processor),
  registryCodeHash: await codeHash(registry),
  storeCodeHash: await codeHash(store),
  circuitHash: POLICY_HASH,
  root,
  releaseId: state.releaseId,
  reviewers,
  transactions: state.transactions,
  block: String(receipt.blockNumber),
  provenance: "TAP-02 compatible testnet deployment",
};
writeFileSync(
  "src/data/deployment.json",
  JSON.stringify(deployment, null, 2) + "\n",
);
writeFileSync(
  "evidence/testnet-deployment.json",
  JSON.stringify(deployment, null, 2) + "\n",
);
console.log(
  "Contracts deployed and release admitted. Run npm run verify before enabling the route.",
);
