import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const fail = msg => { throw new Error(`PREFLIGHT: ${msg}`); };

const pkg = JSON.parse(read('package.json'));
const version = pkg.version;
if (!version) fail('package.json version missing');

const requiredFiles = [
  'index.html','script.js','roadtrip.js','game-logic.js','style.css',
  'package.json','playwright.config.js','qa/static-check.mjs'
];
for (const f of requiredFiles) {
  if (!fs.existsSync(path.join(root,f))) fail(`missing required file: ${f}`);
}

const index = read('index.html');
const script = read('script.js');
const road = read('roadtrip.js');

for (const asset of ['game-logic.js','style.css','script.js','roadtrip.js']) {
  if (!index.includes(`${asset}?v=${version}`)) fail(`cache version mismatch: ${asset}`);
}
for (const file of ['script.js','roadtrip.js']) {
  if (!read(file).includes(`const VERSION='${version}'`)) fail(`VERSION mismatch: ${file}`);
}

const assets = [
  'assets/entrance-scene.jpg','assets/quest-map-desktop.webp',
  'assets/quest-map-mobile.webp','assets/roadtrip-intro-art.jpg',
  'assets/quest1-intro-art.jpg','assets/quest1-game-background.jpg',
  'assets/roadtrip-car.png','assets/game-star.png','assets/game-barrel.png',
  'assets/game-cat.png'
];
for (const a of assets) if (!fs.existsSync(path.join(root,a))) fail(`missing asset: ${a}`);

const requiredIds = [
  'entrance','questScreen','doorHit','roadTripScreen','roadTripIntro',
  'roadTripGame','roadTripResult','readyButton','roadBoard'
];
for (const id of requiredIds) if (!index.includes(`id="${id}"`)) fail(`missing DOM id: ${id}`);

const requiredRoadPatterns = [
  "if(key==='ArrowLeft'||key==='a'||key==='A')",
  "if(key==='ArrowRight'||key==='d'||key==='D')",
  "BOARD.addEventListener('pointerdown'",
  "BOARD.addEventListener('pointerup'",
  'lives=Math.max(0,lives-1)',
  'if(lives<=0){finish(true);return}'
];
for (const p of requiredRoadPatterns) if (!road.includes(p)) fail(`Road Trip requirement missing: ${p}`);

const staleVersions = [];
for (const f of ['index.html','script.js','roadtrip.js','game-logic.js','qa/static-check.mjs']) {
  const t=read(f);
  for (const m of t.matchAll(/(?:\?v=|VERSION\s*=\s*['"])(\d+\.\d+\.\d+)/g)) {
    if (m[1] !== version) staleVersions.push(`${f}:${m[1]}`);
  }
}
if (staleVersions.length) fail(`stale version references: ${staleVersions.join(', ')}`);

for (const f of ['script.js','roadtrip.js','game-logic.js','qa/static-check.mjs','tests/e2e/roadtrip-behavior.spec.js']) {
  try { execFileSync('node',['--check',path.join(root,f)],{stdio:'pipe'}); }
  catch { fail(`syntax error: ${f}`); }
}

console.log(`PREFLIGHT PASS: v${version}`);
console.log(`required files: ${requiredFiles.length}`);
console.log(`required assets: ${assets.length}`);
console.log('version consistency: PASS');
console.log('Road Trip core requirements: PASS');
console.log('JavaScript syntax: PASS');
