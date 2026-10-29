import { writeFileSync } from "node:fs";
import { deployment, client, processorAbi } from "../src/chain/config";
import { verifyRelease } from "../src/chain/verification";
import { bytesToHex, encodeDeployData, keccak256, stringToHex } from "viem";
import { artifact } from "./network";
import { storeAbi } from "../src/chain/config";
import {
  evaluateCircuit,
  POLICY_NETLIST,
  POLICY_HASH,
} from "../src/lib/circuit";
if (!deployment) throw new Error("No actual deployment is configured.");
const report = await verifyRelease(deployment);
const bundle = await client.readContract({
  address: deployment.store,
  abi: storeAbi,
  functionName: "read",
  blockNumber: report.block,
});
const contracts = [
  ["ExitUSD", deployment.asset, []],
  ["ExitVault", deployment.vault, [deployment.asset]],
  ["ReleaseProcessor", deployment.processor, [POLICY_NETLIST]],
  [
    "ReleaseRegistry",
    deployment.registry,
    [
      keccak256(stringToHex("exitos")),
      deployment.processor,
      POLICY_HASH,
      deployment.reviewers,
    ],
  ],
  ["BundleStore", deployment.store, [bundle]],
] as const;
const sourceChecks = [];
for (const [name, address, args] of contracts) {
  const compiled = artifact(name),
    hash = deployment.transactions[name];
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash }),
    client.getTransactionReceipt({ hash }),
  ]);
  const expected = encodeDeployData({
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
    args,
  });
  if (
    tx.input !== expected ||
    tx.to !== null ||
    tx.value !== 0n ||
    receipt.status !== "success" ||
    receipt.contractAddress?.toLowerCase() !== address.toLowerCase()
  )
    throw new Error(`Deployment does not match compiled source: ${name}`);
  sourceChecks.push({
    name,
    address,
    hash,
    block: String(receipt.blockNumber),
    creationInputMatches: true,
  });
}

const vectors = [];
for (let input = 0; input < 16; input++) {
  const actual = await client.readContract({
    address: deployment.processor,
    abi: processorAbi,
    functionName: "eval",
    args: [1n, bytesToHex(new Uint8Array([input]))],
    blockNumber: report.block,
  });
  const expected = bytesToHex(
    new Uint8Array([evaluateCircuit(POLICY_NETLIST, input)]),
  );
  if (actual !== expected)
    throw new Error(`Circuit mismatch for input${input}`);
  vectors.push({ input, actual, expected });
}
const output = {
  chainId: 1952,
  verifiedAt: new Date().toISOString(),
  block: String(report.block),
  blockHash: report.blockHash,
  release: report.version,
  root: report.root,
  checks: [
    "five runtime code hashes",
    "registry identity and reviewer roles",
    "current admission and revocation",
    "circuit netlist and dimensions",
    "vault asset",
    "canonical manifest root",
    "stored bundle commitment",
    "executable file hash and size",
  ],
  vectors,
  operator: "OKX single RPC operator",
  officialFactoryRegistration: false,
  sourceChecks,
};
writeFileSync(
  "evidence/testnet-verification.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `Release and sixteen actual circuit calls verified at block ${report.block}.`,
);
