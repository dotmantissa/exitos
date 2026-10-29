import { bytesToHex, hexToBytes, keccak256, type Hex } from 'viem'

type Gate = readonly [number, number]
export const POLICY_GATES: readonly Gate[] = [[2, 3], [2, 4], [3, 4], [6, 7], [9, 9], [10, 8], [11, 5], [12, 12]]

export function encodeCircuit(gates: readonly Gate[]): Hex {
  const bytes = new Uint8Array(gates.length * 7)
  gates.forEach(([a, b], i) => {
    if (![a, b].every(v => Number.isInteger(v) && v >= 0 && v < 6 + i)) throw new Error('Circuit references an unavailable signal.')
    for (const [value, offset] of [[a, 1], [b, 4]]) {
      bytes[i * 7 + offset] = value >>> 16
      bytes[i * 7 + offset + 1] = value >>> 8
      bytes[i * 7 + offset + 2] = value
    }
  })
  return bytesToHex(bytes)
}

export function evaluateCircuit(netlist: Hex, input: number): number {
  const bytes = hexToBytes(netlist)
  if (!bytes.length || bytes.length % 7 || bytes.length > 7 * 128) throw new Error('Invalid circuit length.')
  if (!Number.isInteger(input) || input < 0 || input > 15) throw new Error('Invalid circuit input.')
  const signals = [0, 1, ...Array.from({ length: 4 }, (_, i) => (input >> i) & 1)]
  for (let i = 0; i < bytes.length; i += 7) {
    if (bytes[i] !== 0) throw new Error('Unsupported circuit operation.')
    const a = (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]
    const b = (bytes[i + 4] << 16) | (bytes[i + 5] << 8) | bytes[i + 6]
    if (a >= signals.length || b >= signals.length) throw new Error('Circuit references an unavailable signal.')
    signals.push(1 - (signals[a] & signals[b]))
  }
  return signals.at(-1)!
}

export const POLICY_NETLIST = encodeCircuit(POLICY_GATES)
export const POLICY_HASH = keccak256(POLICY_NETLIST)
