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
    'index.html', 'script.js', 'roadtrip.js', 'paintit.js', 'sucukmaster.js', 'lokumchallenge.js', 'style.css',
    'package.json', 'playwright.config.js', 'qa/static-check.mjs'
  ];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(root, f))) errors.push(`missing file: ${f}`);
  }

  // game-logic.js gehört zur ausgemusterten Quest-I-Implementierung und darf
  // nicht wieder auftauchen (sonst referenziert index.html eventuell noch
  // eine Altlast).
  if (fs.existsSync(path.join(root, 'game-logic.js'))) {
    errors.push('stale file present: game-logic.js (gehört zur alten Quest-I-Architektur, wurde ersetzt)');
  }

  const index = read('index.html');
  if (index.includes('game-logic.js')) {
    errors.push('index.html referenziert noch das entfernte game-logic.js');
  }

  const localAssets = ['style.css', 'script.js', 'roadtrip.js'];
  for (const asset of localAssets) {
    const expected = `${asset}?v=${version}`;
    if (!index.includes(expected)) errors.push(`cache version mismatch: ${asset}; expected ${expected}`);
    const stale = index.match(new RegExp(`${asset.replace('.', '\\.')}\\?v=([0-9.]+)`, 'g')) || [];
    for (const ref of stale) {
      if (ref !== expected) errors.push(`stale cache reference: ${ref}`);
    }
  }

  // paintit.js muss echt lazy geladen bleiben (Architekturregel Abschnitt 9)
  // -- kein statischer <script>-Tag in index.html.
  if (index.includes('src="paintit.js') || index.includes("src='paintit.js")) {
    errors.push('paintit.js darf nicht statisch in index.html eingebunden sein (muss lazy geladen werden)');
  }
  if (index.includes('src="lokumchallenge.js') || index.includes("src='lokumchallenge.js")) {
    errors.push('lokumchallenge.js darf nicht statisch in index.html eingebunden sein (muss lazy geladen werden)');
  }

  for (const file of ['script.js', 'roadtrip.js', 'paintit.js', 'sucukmaster.js', 'lokumchallenge.js']) {
    const text = read(file);
    if (!text.includes(`const VERSION='${version}'`) && !text.includes(`const PI_VERSION='${version}'`)) {
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
  const forbiddenRoadtripPatterns = ['boardW', 'measureBoard', 'translate3d(', '--car-x'];
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

  // Vertrag der Quest-II-Architektur (Abschnitt 9 Fachkonzept): dieselben
  // Prinzipien wie Quest I -- reine Logik testbar, keine gecachten
  // Spielfeld-Maße, Prozent-/Transform-Positionierung.
  const paintit = read('paintit.js');
  const requiredPaintItSymbols = [
    "const PI_CONFIG",
    "function piCoverage(",
    "function piPaintCell(",
    "function piApplyPawPrint(",
    "function piGrade(",
    "module.exports = PaintItLogic",
    "window.showPaintItScreen",
    "window.__PAINTIT__",
    "function grantKey()",
    "QUEST_KEY = 'duyguBirthdayQuestState_v1'",
    "getBoundingClientRect()", // frisch gemessen, nicht gecacht
  ];
  for (const symbol of requiredPaintItSymbols) {
    if (!paintit.includes(symbol)) errors.push(`paintit runtime contract missing: ${symbol}`);
  }
  const forbiddenPaintItPatterns = ['boardW', 'wallW', 'measureBoard', 'measureWall'];
  for (const pattern of forbiddenPaintItPatterns) {
    if (paintit.includes(pattern)) errors.push(`paintit.js enthält verbotenes Altlast-Muster: ${pattern}`);
  }
  if (!style.includes('.pi-duygu{position:absolute')) {
    errors.push('pi-duygu position:absolute contract missing');
  }

  const lokum = read('lokumchallenge.js');
  const requiredLokumSymbols = [
    "const LC_CONFIG",
    "function lcCanMove(",
    "function lcMove(",
    "function lcAdvanceMaze(",
    "function lcGrade(",
    "module.exports=LokumChallengeLogic",
    "window.showLokumChallengeScreen",
    "window.__LOKUMCHALLENGE__",
    "QUEST_KEY='duyguBirthdayQuestState_v1'"
  ];
  for (const symbol of requiredLokumSymbols) {
    if (!lokum.includes(symbol)) errors.push(`lokum challenge runtime contract missing: ${symbol}`);
  }
  if (!lokum.includes('DURATION:60')) errors.push('lokum challenge duration contract missing: 60 seconds');
  if (!lokum.includes('size:9') || !lokum.includes('size:11')) errors.push('lokum challenge maze size contract missing: 9x9 + 11x11');
  const requiredLokumAssets = [
    'assets/quest-iv/maze-01.png','assets/quest-iv/maze-02.png',
    'assets/quest-iv/lokum-idle.png','assets/quest-iv/lokum-walk-1.png','assets/quest-iv/lokum-walk-2.png','assets/quest-iv/lokum-walk-3.png',
    'assets/quest-iv/treat-fish.png','assets/quest-iv/treat-pink-fish.png','assets/quest-iv/treat-heart.png','assets/quest-iv/treat-ball.png'
  ];
  for (const a of requiredLokumAssets) if(!fs.existsSync(path.join(root,a))) errors.push(`missing asset: ${a}`);

  const sucuk = read('sucukmaster.js');
  const requiredSucukSymbols = [
    "const SM_CONFIG",
    "function smProgress(",
    "function smClickSlot(",
    "function smAdvanceSlices(",
    "function smGrade(",
    "module.exports = SucukMasterLogic",
    "window.showSucukMasterScreen",
    "window.__SUCUKMASTER__",
    "function grantKey()",
    "QUEST_KEY='duyguBirthdayQuestState_v1'"
  ];
  for (const symbol of requiredSucukSymbols) {
    if (!sucuk.includes(symbol)) errors.push(`sucukmaster runtime contract missing: ${symbol}`);
  }
  const requiredSucukAssets = [
    'assets/quest-iii/pan.png','assets/quest-iii/sucuk-raw.png','assets/quest-iii/sucuk-brown.png',
    'assets/quest-iii/sucuk-burnt.png','assets/quest-iii/plate.png'
  ];
  for (const a of requiredSucukAssets) if(!fs.existsSync(path.join(root,a))) errors.push(`missing asset: ${a}`);

  const requiredAssets = [
    'assets/entrance-scene.jpg', 'assets/quest-map-desktop.webp', 'assets/quest-map-mobile.webp',
    'assets/duygu.png', 'assets/lokum.png', 'assets/quest-iii/pan.png', 'assets/quest-iii/sucuk-raw.png',
    'assets/quest-iii/sucuk-brown.png', 'assets/quest-iii/sucuk-burnt.png', 'assets/quest-iii/plate.png'
  ];
  for (const a of requiredAssets) {
    if (!fs.existsSync(path.join(root, a))) errors.push(`missing asset: ${a}`);
  }
  // Diese Assets gehörten zur alten, foto-realistischen Quest-I-Umsetzung.
  // Das neue Spiel braucht keine Bild-Dateien mehr — falls sie doch wieder
  // auftauchen, ist das ein Hinweis auf eine versehentliche Vermischung
  // alter und neuer Dateien.
  const forbiddenAssets = [
    'assets/game-star.png', 'assets/game-barrel.png', 'assets/game-cat.png',
    'assets/roadtrip-car.png', 'assets/quest1-game-background.jpg'
  ];
  for (const a of forbiddenAssets) {
    if (fs.existsSync(path.join(root, a))) errors.push(`stale asset present: ${a}`);
  }

  return { version, packageJson, errors };
}
