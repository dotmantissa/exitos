import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
const output = await build({
  entryPoints: ["src/recovery-bootstrap.ts"],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2022",
  minify: true,
  define: { "import.meta.env": "{}" },
});
const fonts = [
  [
    "IBM Plex Sans",
    "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
  ],
  [
    "Roboto Slab",
    "node_modules/@fontsource/roboto-slab/files/roboto-slab-latin-400-normal.woff2",
  ],
]
  .map(
    ([name, path]) =>
      `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${readFileSync(path).toString("base64")})format('woff2');font-weight:400;font-display:swap}`,
  )
  .join("");
const logo = readFileSync("public/logo.svg", "utf8");
const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>ExitOS | Backup withdrawal page</title><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(logo)}"><style>${fonts}body{background:#F6F4EB;color:#263323;font-family:'IBM Plex Sans',sans-serif}#recovery-root{min-height:80vh}</style><script>try{document.documentElement.dataset.theme=localStorage.getItem('exitos.theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}</script></head><body><div id="recovery-root" role="region" aria-label="Verified recovery route"><p style="max-width:510px;margin:70px auto;padding:25px">Checking your saved withdrawal page against the approved code on X Layer…</p></div><script>${output.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
writeFileSync("public/recovery-kit.html", html);
console.log(
  `Standalone recovery kit generated (${Math.round(Buffer.byteLength(html) / 1024)}KB). No app asset requests required.`,
);
