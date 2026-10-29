import { mkdirSync, writeFileSync } from "node:fs";
import {
  POLICY_NETLIST,
  POLICY_HASH,
  evaluateCircuit,
} from "../src/lib/circuit";

const vectors = Array.from({ length: 16 }, (_, input) => ({
  input,
  output: evaluateCircuit(POLICY_NETLIST, input),
}));
for (const { input, output } of vectors) {
  const quorum = (input & 1) + ((input >> 1) & 1) + ((input >> 2) & 1) >= 2;
  if (output !== Number(quorum && Boolean(input & 8)))
    throw new Error("Policy truth table mismatch.");
}
mkdirSync("circuits", { recursive: true });
writeFileSync(
  "circuits/release-policy.json",
  JSON.stringify(
    {
      nIn: 4,
      nOut: 1,
      nState: 0,
      gates: 8,
      netlist: POLICY_NETLIST,
      keccak256: POLICY_HASH,
      vectors,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Release circuit generated. All 16 inputs agree with the approval policy.",
);
