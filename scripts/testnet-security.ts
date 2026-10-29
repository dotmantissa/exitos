import { writeFileSync } from "node:fs";
import {
  encodeFunctionData,
  keccak256,
  stringToHex,
  zeroAddress,
  type Hex,
} from "viem";
import {
  localAccounts,
  signingClient,
  publicClient,
  artifact,
  included,
} from "./network";
import { deployment, registryAbi } from "../src/chain/config";
import { POLICY_HASH } from "../src/lib/circuit";
if (!deployment) throw new Error("An actual verified deployment is required.");
const signer = signingClient(),
  accounts = localAccounts(),
  compiled = artifact("ReleaseRegistry"),
  project = keccak256(stringToHex("exitos"));
const deploymentHash = await signer.deployContract({
  abi: compiled.abi,
  bytecode: `0x${compiled.evm.bytecode.object}`,
  args: [
    project,
    deployment.processor,
    POLICY_HASH,
    accounts.slice(1).map((account) => account.address),
  ],
});
const registry = (await included(deploymentHash)).contractAddress!;
const cases: { name: string; hash: Hex; status: string; block: string }[] = [];
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
async function signatures(
  indices: number[],
  message: {
    operation: number;
    nonce: bigint;
    releaseId: bigint;
    root: Hex;
    store: `0x${string}`;
    expiresAt: bigint;
  },
  chainId = 1952,
) {
  return Promise.all(
    indices.map((index) =>
      accounts[index].signTypedData({
        domain: {
          name: "ExitOS Release Registry",
          version: "1",
          chainId,
          verifyingContract: registry,
        },
        types,
        primaryType: "Approval",
        message: { project, ...message },
      }),
    ),
  );
}
async function transact(
  name: string,
  data: Hex,
  expected: "success" | "reverted",
) {
  const hash = await signer.sendTransaction({
    to: registry,
    data,
    gas: 700000n,
  });
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 180000,
  });
  if (receipt.status !== expected)
    throw new Error(`Actual security check failed: ${name}`);
  cases.push({
    name,
    hash,
    status: receipt.status,
    block: String(receipt.blockNumber),
  });
}
const expiry = (await publicClient.getBlock()).timestamp + 7200n;
const message = {
  operation: 0,
  nonce: 0n,
  releaseId: 1n,
  root: deployment.root,
  store: deployment.store,
  expiresAt: expiry,
};
const encodeAdmission = (
  sigs: Hex[],
  root = message.root,
  store = message.store,
  expiresAt = expiry,
) =>
  encodeFunctionData({
    abi: registryAbi,
    functionName: "admit",
    args: [root, store, expiresAt, sigs],
  });
await transact(
  "publishers without reviewer",
  encodeAdmission(await signatures([1, 2, 3], message)),
  "reverted",
);
await transact(
  "one publisher and reviewer",
  encodeAdmission(await signatures([1, 4], message)),
  "reverted",
);
await transact(
  "duplicate reviewer",
  encodeAdmission(await signatures([1, 1, 4], message)),
  "reverted",
);
await transact(
  "unknown signer",
  encodeAdmission(await signatures([0, 1, 4], message)),
  "reverted",
);
await transact(
  "wrong network signature",
  encodeAdmission(await signatures([1, 2, 4], message, 196)),
  "reverted",
);
await transact(
  "changed manifest root",
  encodeAdmission(
    await signatures([1, 2, 4], message),
    keccak256(stringToHex("changed")),
  ),
  "reverted",
);
await transact(
  "expired approval",
  encodeAdmission(
    await signatures([1, 2, 4], { ...message, expiresAt: 1n }),
    message.root,
    message.store,
    1n,
  ),
  "reverted",
);
await transact(
  "empty storage address",
  encodeAdmission(
    await signatures([1, 2, 4], { ...message, store: zeroAddress }),
    message.root,
    zeroAddress,
  ),
  "reverted",
);
const admitted = encodeAdmission(await signatures([1, 2, 4], message));
await transact("valid publisher quorum and reviewer", admitted, "success");
await transact("consumed admission nonce replay", admitted, "reverted");
const record = await publicClient.readContract({
  address: registry,
  abi: registryAbi,
  functionName: "releases",
  args: [1n],
});
if (record[0] !== deployment.root || record[3])
  throw new Error("Actual admitted release record is incorrect.");
const revokeMessage = { ...message, operation: 1, nonce: 1n, releaseId: 1n };
const revoke = encodeFunctionData({
  abi: registryAbi,
  functionName: "revoke",
  args: [1n, expiry, await signatures([1, 2, 4], revokeMessage)],
});
await transact(
  "admission signatures cannot revoke",
  encodeFunctionData({
    abi: registryAbi,
    functionName: "revoke",
    args: [1n, expiry, await signatures([1, 2, 4], message)],
  }),
  "reverted",
);
await transact("authorized revocation", revoke, "success");
await transact("revocation replay", revoke, "reverted");
const revoked = await publicClient.readContract({
  address: registry,
  abi: registryAbi,
  functionName: "releases",
  args: [1n],
});
if (!revoked[3]) throw new Error("Revocation flag is missing.");
writeFileSync(
  "evidence/testnet-security.json",
  JSON.stringify(
    {
      chainId: 1952,
      verifiedAt: new Date().toISOString(),
      registry,
      deploymentHash,
      appRegistryUnaffected: deployment.registry,
      cases,
      teamControlledReviewers: true,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${cases.length} actual authorization and revocation transactions verified on a separate testnet registry.`,
);
