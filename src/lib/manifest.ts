import { z } from 'zod'
import { bytesToHex, type Hex } from 'viem'

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
const hash = z.string().regex(/^0x[a-fA-F0-9]{64}$/)
export const manifestSchema = z.object({
  schema: z.literal(1), chainId: z.literal(1952), project: z.literal('exitos'), version: z.string().max(32),
  vault: address, asset: address, processor: address, registry: address, store: address,
  circuitHash: hash, vaultCodeHash: hash, assetCodeHash: hash,
  files: z.array(z.object({ path: z.string().max(200).refine(v => /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(v) && !v.includes('..')), sha256: hash, size: z.number().int().positive().max(200_000) }).strict()).min(1).max(20)
}).strict().superRefine((value, context) => {
  if (new Set(value.files.map(file => file.path)).size !== value.files.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate bundle paths.' })
})
export type RecoveryManifest = z.infer<typeof manifestSchema>

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`
}
export async function sha256(bytes: Uint8Array): Promise<Hex> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)))
}
export async function verifyFile(bytes: Uint8Array, expected: Hex, size: number): Promise<void> {
  if (bytes.byteLength !== size || await sha256(bytes) !== expected) throw new Error('The recovery file does not match its approved release.')
}
