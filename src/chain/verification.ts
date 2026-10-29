import {
  hexToBytes,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import {
  client,
  deployment,
  processorAbi,
  registryAbi,
  storeAbi,
  vaultAbi,
  type Deployment,
} from "./config";
import { POLICY_HASH, evaluateCircuit } from "../lib/circuit";
import {
  canonicalize,
  manifestSchema,
  sha256,
  verifyFile,
} from "../lib/manifest";

export type VerifiedRelease = {
  version: string;
  root: Hex;
  block: bigint;
  blockHash: Hex;
  admittedAt: number;
  module: Uint8Array;
  manifest: ReturnType<typeof manifestSchema.parse>;
  checkedAt: number;
};
export async function verifyRelease(
  config: Deployment | null = deployment,
): Promise<VerifiedRelease> {
  if (!config) throw new Error("Contracts have not been deployed yet.");
  if ((await client.getChainId()) !== 1952)
    throw new Error("The node returned a different network.");
  const block = await client.getBlock();
  if (Date.now() / 1000 - Number(block.timestamp) > 180)
    throw new Error("The node is behind. Try again once it catches up.");
  const pins: [Address, Hex][] = [
    [config.asset, config.assetCodeHash],
    [config.vault, config.vaultCodeHash],
    [config.processor, config.processorCodeHash],
    [config.registry, config.registryCodeHash],
    [config.store, config.storeCodeHash],
  ];
  await Promise.all(
    pins.map(async ([address, expected]) => {
      const code = await client.getCode({ address, blockNumber: block.number });
      if (!code || keccak256(code) !== expected)
        throw new Error("A contract does not match the saved deployment.");
    }),
  );
  const read = <T>(request: T) =>
    client.readContract({
      ...(request as object),
      blockNumber: block.number,
    } as Parameters<typeof client.readContract>[0]);
  const [
    current,
    release,
    processor,
    circuitHash,
    netlist,
    dimensions,
    asset,
    project,
    processorCodeHash,
    roles,
  ] = await Promise.all([
    read({
      address: config.registry,
      abi: registryAbi,
      functionName: "currentRelease",
    }),
    client.readContract({
      address: config.registry,
      abi: registryAbi,
      functionName: "releases",
      args: [BigInt(config.releaseId)],
      blockNumber: block.number,
    }),
    read({
      address: config.registry,
      abi: registryAbi,
      functionName: "processor",
    }),
    read({
      address: config.registry,
      abi: registryAbi,
      functionName: "circuitHash",
    }),
    client.readContract({
      address: config.processor,
      abi: processorAbi,
      functionName: "netlist",
      args: [1n],
      blockNumber: block.number,
    }),
    client.readContract({
      address: config.processor,
      abi: processorAbi,
      functionName: "circuitInfo",
      args: [1n],
      blockNumber: block.number,
    }),
    client.readContract({
      address: config.vault,
      abi: vaultAbi,
      functionName: "asset",
      blockNumber: block.number,
    }),
    read({
      address: config.registry,
      abi: registryAbi,
      functionName: "project",
    }),
    read({
      address: config.registry,
      abi: registryAbi,
      functionName: "processorCodeHash",
    }),
    Promise.all(
      [0n, 1n, 2n, 3n].map((i) =>
        client.readContract({
          address: config.registry,
          abi: registryAbi,
          functionName: "reviewers",
          args: [i],
          blockNumber: block.number,
        }),
      ),
    ),
  ]);
  if (
    current !== BigInt(config.releaseId) ||
    release[3] ||
    release[2] === 0n ||
    release[0] !== config.root ||
    release[1].toLowerCase() !== config.store.toLowerCase()
  )
    throw new Error("This recovery release is not currently approved.");
  if (
    project !== keccak256(stringToHex("exitos")) ||
    processorCodeHash !== config.processorCodeHash ||
    roles.some(
      (role, i) => role.toLowerCase() !== config.reviewers[i].toLowerCase(),
    )
  )
    throw new Error(
      "The release authority does not match the saved deployment.",
    );
  if (
    String(processor).toLowerCase() !== config.processor.toLowerCase() ||
    circuitHash !== POLICY_HASH ||
    config.circuitHash !== POLICY_HASH ||
    keccak256(netlist) !== POLICY_HASH ||
    dimensions.join(",") !== "4,1,0,8" ||
    asset.toLowerCase() !== config.asset.toLowerCase()
  )
    throw new Error("The recovery policy or asset has changed.");
  for (let i = 0; i < 16; i++)
    if (
      evaluateCircuit(netlist, i) !==
      Number((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1) >= 2 && Boolean(i & 8))
    )
      throw new Error("The release circuit is not the expected policy.");
  const bytes = hexToBytes(
    await client.readContract({
      address: config.store,
      abi: storeAbi,
      functionName: "read",
      blockNumber: block.number,
    }),
  );
  if (bytes.length > 20000)
    throw new Error("The recovery bundle is too large.");
  const commitment = await client.readContract({
    address: config.store,
    abi: storeAbi,
    functionName: "contentHash",
    blockNumber: block.number,
  });
  if ((await sha256(bytes)) !== commitment)
    throw new Error("The stored bundle commitment does not match its bytes.");
  const bundle = JSON.parse(new TextDecoder().decode(bytes));
  const manifest = manifestSchema.parse(bundle.manifest);
  if (
    (await sha256(new TextEncoder().encode(canonicalize(manifest)))) !==
    config.root
  )
    throw new Error("The manifest does not match the approved release.");
  for (const key of [
    "asset",
    "vault",
    "processor",
    "registry",
    "store",
    "circuitHash",
    "assetCodeHash",
    "vaultCodeHash",
  ] as const)
    if (manifest[key].toLowerCase() !== config[key].toLowerCase())
      throw new Error("The manifest points to a different deployment.");
  if (
    manifest.files.length !== 1 ||
    manifest.files[0].path !== "recovery.js" ||
    typeof bundle.files?.["recovery.js"] !== "string" ||
    Object.keys(bundle.files).length !== 1
  )
    throw new Error("The recovery bundle has unexpected files.");
  const module = new TextEncoder().encode(bundle.files["recovery.js"]);
  await verifyFile(
    module,
    manifest.files[0].sha256 as Hex,
    manifest.files[0].size,
  );
  return {
    version: manifest.version,
    root: config.root,
    block: block.number,
    blockHash: block.hash!,
    admittedAt: Number(release[2]),
    module,
    manifest,
    checkedAt: Date.now(),
  };
}
