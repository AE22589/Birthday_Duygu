import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const index = read('index.html');
const script = read('script.js');
const road = read('roadtrip.js');
const css = read('style.css');
const logic = read('game-logic.js');

const VERSION = '1.6.5';
if (!fs.existsSync(path.join(root, 'game-logic.js'))) throw new Error('missing game logic module');

const requiredAssets = [
  'assets/entrance-scene.jpg',
  'assets/quest-map-desktop.webp',
  'assets/quest-map-mobile.webp',
  'assets/roadtrip-intro-art.jpg',
  'assets/quest1-intro-art.jpg',
  'assets/quest1-game-background.jpg',
  'assets/roadtrip-car.png',
  'assets/game-star.png',
  'assets/game-barrel.png',
  'assets/game-cat.png'
];

for (const asset of requiredAssets) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`missing asset: ${asset}`);
}

if (!index.includes(`game-logic.js?v=${VERSION}`)) throw new Error('cache version missing for game-logic.js');

for (const file of ['style.css','script.js','roadtrip.js']) {
  if (!index.includes(file + `?v=${VERSION}`)) throw new Error(`cache version missing for ${file}`);
}
if (!script.includes(`const VERSION='1.6.5'`)) throw new Error('app version mismatch');
if (!road.includes(`const VERSION='1.6.5'`)) throw new Error('roadtrip version mismatch');

const requiredSelectors = ['#entrance','#questScreen','#adminModal','#doorHit','#roadTripScreen','#roadTripIntro','#roadTripGame','#roadTripResult','#readyButton','#roadBoard'];
for (const selector of requiredSelectors) {
  if (!index.includes(selector.slice(1))) throw new Error(`missing required DOM id: ${selector}`);
}

if (!script.includes('const ADMIN_CODE=\'1337\'')) throw new Error('developer security code missing');
if (!script.includes('const CLICK_LIMIT=5')) throw new Error('five-click developer gate missing');
if (!script.includes('if(clickCount>=CLICK_LIMIT)')) throw new Error('developer gate handler missing');
if (!script.includes("codeInput.value.trim()!==ADMIN_CODE")) throw new Error('developer code validation missing');
if (!script.includes('window.showQuestMap=showQuestMap')) throw new Error('quest map navigation missing');
if (!script.includes('window.showRoadTripScreen')) throw new Error('Quest I navigation bridge missing');

if (!road.includes("if(key==='ArrowLeft'||key==='a'||key==='A')")) throw new Error('desktop left control missing');
if (!road.includes("if(key==='ArrowRight'||key==='d'||key==='D')")) throw new Error('desktop right control missing');
if (!road.includes("BOARD.addEventListener('pointerdown'") || !road.includes("BOARD.addEventListener('pointerup'")) throw new Error('mobile pointer swipe controls missing');
if (!road.includes('lives=Math.max(0,lives-1)')) throw new Error('lives must be able to reach zero');
if (!road.includes('if(lives<=0){finish(true);return}')) throw new Error('game over condition missing');
if (!road.includes('score>=TARGET_STARS&&!gameOver')) throw new Error('key reward condition missing');

if (!css.includes('@media(max-width:700px)')) throw new Error('mobile CSS missing');
if (!css.includes('touch-action:none')) throw new Error('touch-action guard missing');
if (!css.includes('left:calc(var(--car-x) * 1%)')) throw new Error('car lane position CSS binding missing');
if (!css.includes('left:calc(var(--pulse-x,50) * 1%)')) throw new Error('lane pulse position CSS binding missing');
if (!logic.includes('dx < 0 ? -1 : 1')) throw new Error('swipe direction primitive missing');
if (!logic.includes('return clampLane(Number(currentLane) + dir)')) throw new Error('lane movement primitive missing');
if (!road.includes('spawnTestObject:(type,testLane)=>')) throw new Error('deterministic object QA hook missing');
if (!road.includes('setElapsed:(seconds)=>')) throw new Error('deterministic timer QA hook missing');
if (!road.includes('runtime:()=>({running,rafActive:!!raf')) throw new Error('runtime QA diagnostics missing');
if (!road.includes('GAME_LOGIC.moveLane(lane,dir)')) throw new Error('central lane movement not used');
if (!road.includes('GAME_LOGIC.swipeDirection(startX,e.clientX)')) throw new Error('swipe direction primitive not used');
if (!road.includes('CAR.dataset.lane=String(lane)')) throw new Error('car lane state binding missing');
if (!road.includes("window.addEventListener('keydown',onKey,{passive:false,capture:true})")) throw new Error('keyboard listener binding missing');


for (const file of ['tests/e2e/security-map.spec.js','tests/e2e/roadtrip-regression.spec.js','tests/e2e/visual-map.spec.js','tests/e2e/runtime-health.spec.js','tests/e2e/user-journey.spec.js','tests/game-logic.test.cjs']) {
  if (!fs.existsSync(path.join(root,file))) throw new Error(`missing QA test: ${file}`);
}
for (const project of ['desktop-1366','desktop-1920','mobile-390','mobile-430']) {
  const snap=path.join(root,'tests/e2e/__screenshots__',project,'quest-map.png');
  if (!fs.existsSync(snap)) throw new Error(`missing visual baseline: ${project}`);
  if (fs.statSync(snap).size < 10000) throw new Error(`visual baseline looks invalid: ${project}`);
}
if (!script.includes('function isUnlocked()')) throw new Error('security unlock function missing');
if (!script.includes("if(!isUnlocked()){showToast('The door is still locked...');return}")) throw new Error('locked map guard missing');
if (!road.includes("new URLSearchParams(location.search).has('qa')")) throw new Error('deterministic QA mode missing');

console.log(`PASS: v${VERSION} static QA`);
console.log(JSON.stringify({
  version: VERSION,
  requiredAssets: requiredAssets.length,
  security: '5-click + 1337 code',
  questFlow: 'map -> intro -> countdown -> game -> result',
  controls: ['ArrowLeft','ArrowRight','A','D','swipe (pointerdown/up)','pointerTouch'],
  gameOver: 'lives can reach 0',
  mobileCss: true
}, null, 2));

if (!script.includes('navigator.webdriver===true')) throw new Error('QA mode must be browser-test-only');
if (!script.includes('QA_VISUAL_MAP')) throw new Error('visual QA mode missing');
if (!road.includes('navigator.webdriver===true')) throw new Error('roadtrip QA API must be browser-test-only');
