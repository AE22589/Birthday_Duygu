import fs from 'node:fs';
import path from 'node:path';

export function loadProject(root) {
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  const packageJson = JSON.parse(read('package.json'));
  return { read, packageJson, version: packageJson.version };
}

export function validateProject(root) {
  const { read, packageJson, version } = loadProject(root);
  const errors = [];
  const requiredFiles = [
    'index.html','script.js','roadtrip.js','game-logic.js','style.css',
    'package.json','playwright.config.js','qa/static-check.mjs'
  ];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(root, f))) errors.push(`missing file: ${f}`);
  }

  const index = read('index.html');
  const localAssets = ['game-logic.js','style.css','script.js','roadtrip.js'];
  for (const asset of localAssets) {
    const expected = `${asset}?v=${version}`;
    if (!index.includes(expected)) errors.push(`cache version mismatch: ${asset}; expected ${expected}`);
    const stale = index.match(new RegExp(`${asset.replace('.', '\\.')}\\?v=([0-9.]+)`, 'g')) || [];
    for (const ref of stale) {
      if (ref !== expected) errors.push(`stale cache reference: ${ref}`);
    }
  }

  for (const file of ['script.js','roadtrip.js']) {
    const text = read(file);
    if (!text.includes(`const VERSION='${version}'`)) {
      errors.push(`VERSION mismatch: ${file}`);
    }
  }

  const roadtrip = read('roadtrip.js');
  const requiredRoadtripSymbols = [
    "requestAnimationFrame(tick)",
    "function startLoop(",
    "function stop(",
    "const HORIZON_Y=",
    "const CAR_Y=",
    "const OBJECT_MIN_SCALE=0.2",
    "const OBJECT_MAX_SCALE=1.0",
    "window.__ROADTRIP_QA__"
  ];
  for (const symbol of requiredRoadtripSymbols) {
    if (!roadtrip.includes(symbol)) errors.push(`roadtrip runtime contract missing: ${symbol}`);
  }

  const requiredAssets = [
    'assets/entrance-scene.jpg','assets/quest-map-desktop.webp',
    'assets/quest-map-mobile.webp','assets/roadtrip-intro-art.jpg',
    'assets/quest1-intro-art.jpg','assets/quest1-game-background.jpg',
    'assets/roadtrip-car.png','assets/game-star.png','assets/game-barrel.png',
    'assets/game-cat.png'
  ];
  for (const a of requiredAssets) {
    if (!fs.existsSync(path.join(root,a))) errors.push(`missing asset: ${a}`);
  }

  return { version, packageJson, errors };
}
