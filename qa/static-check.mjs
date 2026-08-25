import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const required = ['index.html','style.css','script.js','roadtrip.js','assets/quest-map-desktop.webp','assets/quest-map-mobile.webp','assets/entrance-scene.jpg','assets/roadtrip-intro-art.jpg','assets/roadtrip-desktop-art.jpg','assets/roadtrip-mobile-art.jpg','assets/roadtrip-car.png'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) throw new Error(`Missing files: ${missing.join(', ')}`);

for (const js of ['script.js','roadtrip.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, js)], { stdio: 'inherit' });
}

const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const v of ['1.2.0']) {
  if (!html.includes(`v=${v}`)) throw new Error(`index.html is missing cache version ${v}`);
}
for (const stale of ['1.1.0','1.1.1','1.1.2']) {
  if (html.includes(`v=${stale}`)) throw new Error(`stale cache version found: ${stale}`);
}

console.log('Static QA PASS');
console.log(`Root: ${root}`);
console.log(`Required files: ${required.length}`);
console.log('JavaScript syntax: PASS');
console.log('Version/cache references: PASS');
