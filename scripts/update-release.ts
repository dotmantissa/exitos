import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  bytesToHex,
  encodeDeployData,
  encodeFunctionData,
  getContractAddress,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import {
  artifact,
  included,
  localAccounts,
  publicClient,
  signingClient,
  writePublic,
} from "./network";
import { deployment, registryAbi } from "../src/chain/config";
import { canonicalize, sha256 } from "../src/lib/manifest";
import { verifyRelease } from "../src/chain/verification";

const { values } = parseArgs({
  options: { version: { type: "string" }, label: { type: "string" } },
});
const releaseVersion = values.version,
  releaseLabel = values.label;
if (!releaseVersion || !/^\d+\.\d+\.\d+$/.test(releaseVersion))
  throw new Error("Supply --version with a numeric release version.");
if (!releaseLabel || !/^[a-z][a-z0-9-]*$/.test(releaseLabel))
  throw new Error("Supply --label with a lowercase release name.");

if (!deployment) throw new Error("An existing testnet deployment is required.");
const config = deployment,
  signer = signingClient(),
  accounts = localAccounts();
if ((await publicClient.getChainId()) !== 1952) throw new Error("Wrong chain.");
if (
  accounts
    .slice(1)
    .some(
      (account, index) =>
        account.address.toLowerCase() !== config.reviewers[index].toLowerCase(),
    )
)
  throw new Error("Reviewer identities do not match the existing deployment.");
const module = readFileSync("public/recovery/recovery.js", "utf8");
const moduleBytes = new TextEncoder().encode(module);
const moduleHash = await sha256(moduleBytes);
const journalPath = `.local/${releaseLabel}-release.json`;
type Journal = {
  moduleHash: Hex;
  previous: typeof config;
  manifest: Record<string, unknown>;
  root: Hex;
  store: Address;
  releaseId: number;
  expiry: string;
  transactions: Record<string, Hex>;
  raw: Record<string, Hex>;
};
let state: Journal;
if (existsSync(journalPath)) {
  state = JSON.parse(readFileSync(journalPath, "utf8"));
  if (state.moduleHash !== moduleHash)
    throw new Error(
      "Recovery source changed after the release journal was created.",
    );
  if (state.manifest.version !== releaseVersion)
    throw new Error("Release version differs from the existing journal.");
} else {
  await verifyRelease(config);
  const nonce = await publicClient.getTransactionCount({
    address: signer.account.address,
    blockTag: "pending",
  });
  const store = getContractAddress({
    from: signer.account.address,
    nonce: BigInt(nonce),
  });
  const registryNonce = await publicClient.readContract({
    address: config.registry,
    abi: registryAbi,
    functionName: "nextNonce",
  });
  const manifest = {
    schema: 1,
    chainId: 1952,
    project: "exitos",
    version: releaseVersion,
    asset: config.asset,
    vault: config.vault,
    processor: config.processor,
    registry: config.registry,
    store,
    circuitHash: config.circuitHash,
    assetCodeHash: config.assetCodeHash,
    vaultCodeHash: config.vaultCodeHash,
    files: [
      { path: "recovery.js", sha256: moduleHash, size: moduleBytes.length },
    ],
  };
  const root = await sha256(new TextEncoder().encode(canonicalize(manifest)));
  state = {
    moduleHash,
    previous: config,
    manifest,
    root,
    store,
    releaseId: Number(registryNonce + 1n),
    expiry: String((await publicClient.getBlock()).timestamp + 86400n),
    transactions: {},
    raw: {},
  };
}
function checkpoint() {
  writeFileSync(journalPath + ".tmp", JSON.stringify(state, null, 2) + "\n", {
    mode: 0o600,
  });
  renameSync(journalPath + ".tmp", journalPath);
}
checkpoint();
async function send(name: string, tx: { to?: Address; data: Hex }) {
  let hash = state.transactions[name];
  if (!hash) {
    const request = await signer.prepareTransactionRequest(tx);
    const raw = await signer.signTransaction(request);
    hash = keccak256(raw);
    state.transactions[name] = hash;
    state.raw[name] = raw;
    checkpoint();
  }
  let known = false;
  try {
    await publicClient.getTransaction({ hash });
    known = true;
  } catch {}
  if (!known) {
    try {
      await signer.sendRawTransaction({
        serializedTransaction: state.raw[name],
      });
    } catch {
      try {
        await publicClient.getTransaction({ hash });
      } catch {
        throw new Error(
          `Unconfirmed release broadcast: ${name}. Resume the journal.`,
        );
      }
    }
  }
  return included(hash);
}
const bundle = new TextEncoder().encode(
  canonicalize({ manifest: state.manifest, files: { "recovery.js": module } }),
);
if (bundle.length > 20000)
  throw new Error("Recovery bundle exceeds its size limit.");
const compiled = artifact("BundleStore");
const storageReceipt = await send("BundleStore", {
  data: encodeDeployData({
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
    args: [bytesToHex(bundle)],
  }),
});
if (storageReceipt.contractAddress?.toLowerCase() !== state.store.toLowerCase())
  throw new Error("Unexpected store address.");
console.log("New recovery code stored on testnet:", state.store);
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
  [1, 2, 4].map((index) =>
    accounts[index].signTypedData({
      domain: {
        name: "ExitOS Release Registry",
        version: "1",
        chainId: 1952,
        verifyingContract: config.registry,
      },
      types,
      primaryType: "Approval",
      message: {
        project: keccak256(stringToHex("exitos")),
        operation: 0,
        nonce: BigInt(state.releaseId - 1),
        releaseId: BigInt(state.releaseId),
        root: state.root,
        store: state.store,
        expiresAt: BigInt(state.expiry),
      },
    }),
  ),
);
const admission = await send("Admission", {
  to: config.registry,
  data: encodeFunctionData({
    abi: registryAbi,
    functionName: "admit",
    args: [state.root, state.store, BigInt(state.expiry), signatures],
  }),
});
const code = await publicClient.getCode({
  address: state.store,
  blockNumber: admission.blockNumber,
});
if (!code) throw new Error("The admitted store has no code.");
const updated = {
  ...state.previous,
  store: state.store,
  storeCodeHash: keccak256(code),
  root: state.root,
  releaseId: state.releaseId,
  block: String(admission.blockNumber),
  transactions: { ...state.previous.transactions, ...state.transactions },
};
await verifyRelease(updated);
writePublic(
  `evidence/releases/release-${state.previous.releaseId}.json`,
  state.previous,
);
writePublic("src/data/deployment.json", updated);
writePublic("evidence/testnet-deployment.json", updated);
writePublic(`evidence/testnet-${releaseLabel}-release.json`, {
  version: releaseVersion,
  chainId: 1952,
  verifiedAt: new Date().toISOString(),
  previousRelease: state.previous.releaseId,
  releaseId: state.releaseId,
  vault: updated.vault,
  registry: updated.registry,
  store: updated.store,
  root: updated.root,
  moduleHash,
  storageTransaction: state.transactions.BundleStore,
  admissionTransaction: state.transactions.Admission,
  block: String(admission.blockNumber),
});
// Keep initial deployment recovery consistent with the now-current public pins.
const initialPath = ".local/deployment-state.json";
if (existsSync(initialPath)) {
  const initial = JSON.parse(readFileSync(initialPath, "utf8"));
  initial.addresses.BundleStore = state.store;
  initial.transactions = updated.transactions;
  initial.root = state.root;
  initial.manifest = state.manifest;
  initial.releaseId = state.releaseId;
  writeFileSync(initialPath, JSON.stringify(initial, null, 2) + "\n", {
    mode: 0o600,
  });
}
console.log(
  `Recovery release ${releaseVersion} admitted and verified. Existing vault and token addresses are preserved.`,
);
