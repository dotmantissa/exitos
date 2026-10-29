import { describe, it, expect } from 'vitest'
import { parseAmount } from '../src/lib/amounts'
import { evaluateCircuit, POLICY_NETLIST } from '../src/lib/circuit'
import { canonicalize, manifestSchema, sha256, verifyFile } from '../src/lib/manifest'

describe('exact token amounts', () => {
  it('retains values beyond the safe integer limit and smallest units', () => {
    expect(parseAmount('9007199254740993.000000000000000001', 18)).toBe(9007199254740993000000000000000001n)
    expect(parseAmount('0.000000000000000001', 18)).toBe(1n)
  })
  it.each(['1e3', '-2', '1,000', '0', ' 1 ', '1.0000001'])('rejects unsafe input %s', value => expect(() => parseAmount(value, 6)).toThrow())
  it('rejects an amount above the actual limit', () => expect(() => parseAmount('2', 6, 1000000n)).toThrow())
})
describe('release policy', () => {
  it('agrees with the independent quorum predicate for every input', () => {
    for (let i = 0; i < 16; i++) expect(evaluateCircuit(POLICY_NETLIST, i)).toBe(Number(((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1)) >= 2 && Boolean(i & 8)))
  })
  it('rejects truncated circuits and forward references', () => {
    expect(() => evaluateCircuit('0x00', 0)).toThrow()
    expect(() => evaluateCircuit('0x000000ff000000', 0)).toThrow()
  })
})
describe('approved bytes', () => {
  it('canonicalizes object keys while preserving array order', () => expect(canonicalize({ z: [2, 1], a: { y: 2, x: 1 } })).toBe(canonicalize({ a: { x: 1, y: 2 }, z: [2, 1] })))
  it('rejects altered bytes and mismatched size', async () => {
    const original = new TextEncoder().encode('approved source')
    const hash = await sha256(original)
    await expect(verifyFile(original, hash, original.length)).resolves.toBeUndefined()
    await expect(verifyFile(new TextEncoder().encode('modified source'), hash, original.length)).rejects.toThrow()
    await expect(verifyFile(original, hash, 1)).rejects.toThrow()
  })
  it('rejects unknown or incomplete manifests', () => expect(manifestSchema.safeParse({ schema: 1, chainId: 196, project: 'exitos' }).success).toBe(false))
})
