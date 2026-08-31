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
    'index.html', 'script.js', 'roadtrip.js', 'style.css',
    'package.json', 'playwright.config.js', 'qa/static-check.mjs'
  ];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(root, f))) errors.push(`missing file: ${f}`);
  }

  // game-logic.js gehört zur ausgemusterten Quest-I-Implementierung und darf
  // nicht wieder auftauchen (sonst referenziert index.html eventuell noch
  // eine Altlast).
  const index = read('index.html');

  const localAssets = ['style.css', 'script.js', 'roadtrip.js'];
  for (const asset of localAssets) {
    const expected = `${asset}?v=${version}`;
    if (!index.includes(expected)) errors.push(`cache version mismatch: ${asset}; expected ${expected}`);
    const stale = index.match(new RegExp(`${asset.replace('.', '\\.')}\\?v=([0-9.]+)`, 'g')) || [];
    for (const ref of stale) {
      if (ref !== expected) errors.push(`stale cache reference: ${ref}`);
    }
  }

  for (const file of ['script.js', 'roadtrip.js']) {
    const text = read(file);
    if (!text.includes(`const VERSION='${version}'`)) {
      errors.push(`VERSION mismatch: ${file}`);
    }
  }

  // Vertrag der neuen, vereinfachten Quest-I-Architektur: nur Prozentwerte,
  // kein boardW-Cache, reine Logik von der Darstellung getrennt.
  const roadtrip = read('roadtrip.js');
  const requiredRoadtripSymbols = [
    "const RT_CONFIG",
    "function rtComputeVisual(",
    "function rtAdvanceProgress(",
    "function rtIsInCollisionZone(",
    "module.exports = RoadTripLogic",
    "window.showRoadTripScreen",
    "window.__ROADTRIP__",
    "o.el.style.top = y + '%'",
    "o.el.style.left = x + '%'",
    "car.style.left = RT_CONFIG.LANES[lane] + '%'",
    "function grantKey()",
    "QUEST_KEY = 'duyguBirthdayQuestState_v1'",
  ];
  for (const symbol of requiredRoadtripSymbols) {
    if (!roadtrip.includes(symbol)) errors.push(`roadtrip runtime contract missing: ${symbol}`);
  }
  // Verbotene Altlasten: darf nicht wieder auftauchen, sonst ist die alte
  // boardW-Fehlerklasse zurück.
  const forbiddenRoadtripPatterns = ['measureBoard', 'translate3d(', '--car-x'];
  for (const pattern of forbiddenRoadtripPatterns) {
    if (roadtrip.includes(pattern)) errors.push(`roadtrip.js enthält verbotenes Altlast-Muster: ${pattern}`);
  }

  const style = read('style.css');
  if (!style.includes('#playerCar.rt-car{position:absolute')) {
    errors.push('rt-car position:absolute contract missing');
  }
  if (!style.includes("transition:left .18s ease-out")) {
    errors.push('rt-car left-transition contract missing');
  }

  const requiredAssets = [
    'assets/entrance-scene.jpg', 'assets/quest-map-desktop.webp', 'assets/quest-map-mobile.webp'
  ];
  for (const a of requiredAssets) {
    if (!fs.existsSync(path.join(root, a))) errors.push(`missing asset: ${a}`);
  }
  // Diese Assets gehörten zur alten, foto-realistischen Quest-I-Umsetzung.
  // Das neue Spiel braucht keine Bild-Dateien mehr — falls sie doch wieder
  // auftauchen, ist das ein Hinweis auf eine versehentliche Vermischung
  // alter und neuer Dateien.
  return { version, packageJson, errors };
}
