import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'

mkdirSync('.local', { recursive: true, mode: 0o700 })
const path = '.local/testnet-wallets.json'
if (!existsSync(path)) {
  const keys = Array.from({ length: 5 }, () => generatePrivateKey())
  writeFileSync(path, JSON.stringify({ chainId: 1952, keys }, null, 2), { mode: 0o600, flag: 'wx' })
}
const { keys } = JSON.parse(readFileSync(path, 'utf8'))
console.log(JSON.stringify({ chainId: 1952, deployer: privateKeyToAccount(keys[0]).address, reviewers: keys.slice(1).map((key: `0x${string}`) => privateKeyToAccount(key).address) }, null, 2))
