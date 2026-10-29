import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
const tracked=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)
function files(path){try{return readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${path}/${entry.name}`):[`${path}/${entry.name}`])}catch{return []}}
const targets=[...tracked,...files('dist')]
const patterns=[/\bgh[pousr]_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{50,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /(?:privateKey|private_key|secretKey)\s*["']?\s*[:=]\s*["']0x[a-fA-F0-9]{64}/, /https:\/\/[^\s/]+:[^\s/]+@github\.com/]
let failed=false
for(const path of targets){
  if(/(^|\/)(TASKS\.md|AGENTS?\.md|\.env|testnet-wallets\.json)$/i.test(path)){console.error(`Private or instruction file is visible to Git: ${path}`);failed=true;continue}
  let source;try{source=readFileSync(path,'utf8')}catch{continue}
  if(patterns.some(pattern=>pattern.test(source))){console.error(`Potential credential found in ${path}; matching value withheld.`);failed=true}
}
if(failed)process.exit(1)
console.log(`Secret scan passed for ${targets.length} source and build files. No credential values printed.`)
