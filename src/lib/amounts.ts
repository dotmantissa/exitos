import { formatUnits, parseUnits } from "viem";

export function parseAmount(
  value: string,
  decimals: number,
  maximum?: bigint,
): bigint {
  if (!/^\d+(\.\d+)?$/.test(value))
    throw new Error("Enter an amount using numbers and a decimal point.");
  if ((value.split(".")[1]?.length ?? 0) > decimals)
    throw new Error(`Use no more than ${decimals} decimal places.`);
  const amount = parseUnits(value, decimals);
  if (amount <= 0n) throw new Error("Choose an amount greater than zero.");
  if (maximum !== undefined && amount > maximum)
    throw new Error("That is more than your available balance.");
  return amount;
}

export function displayAmount(
  value: bigint,
  decimals = 18,
  places = 4,
): string {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = fraction.slice(0, places).replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
