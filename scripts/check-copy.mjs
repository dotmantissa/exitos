import { readFileSync, readdirSync } from 'node:fs'
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${path}/${entry.name}`):[`${path}/${entry.name}`])}
const targets=[...files('src/app'),...files('public/recovery'),'index.html','README.md','DESIGN.md']
let count=0
for(const path of targets){
  const source=readFileSync(path,'utf8')
  if(/[\u2013\u2014\p{Extended_Pictographic}]/u.test(source)){console.error(`Forbidden copy glyph in ${path}`);count++}
  if(/(?:best-in-class|seamless experience|unlock the power|revolutionize|cutting-edge|leverage)/i.test(source)){console.error(`Generic product copy in ${path}`);count++}
}
if(count)process.exit(1)
console.log('Product copy has no emoji, em dash or generic marketing artifacts. Technical identifiers are retained.')
