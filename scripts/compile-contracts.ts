import solc from "solc";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const sources = Object.fromEntries(
  readdirSync("contracts")
    .filter((file) => file.endsWith(".sol"))
    .map((file) => [
      file,
      { content: readFileSync(`contracts/${file}`, "utf8") },
    ]),
);
const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": [
          "abi",
          "evm.bytecode.object",
          "evm.deployedBytecode.object",
          "metadata",
        ],
      },
    },
  },
};
const output = JSON.parse(
  solc.compile(JSON.stringify(input), {
    import: (file: string) => {
      try {
        return {
          contents: readFileSync(path.join("node_modules", file), "utf8"),
        };
      } catch {
        return { error: `Import unavailable: ${file}` };
      }
    },
  }),
);
const errors = (output.errors ?? []).filter(
  (error: { severity: string }) => error.severity === "error",
);
if (errors.length)
  throw new Error(
    errors
      .map((error: { formattedMessage: string }) => error.formattedMessage)
      .join("\n"),
  );
mkdirSync("artifacts", { recursive: true });
for (const [file, contracts] of Object.entries(output.contracts) as [
  string,
  Record<string, object>,
][]) {
  if (file.startsWith("@")) continue;
  for (const [name, artifact] of Object.entries(contracts))
    writeFileSync(
      `artifacts/${name}.json`,
      JSON.stringify(artifact, null, 2) + "\n",
    );
}
writeFileSync(
  "artifacts/compiler-input.json",
  JSON.stringify(input, null, 2) + "\n",
);
console.log(
  "Compiled testnet token, vault, processor, bundle store and release registry.",
);
