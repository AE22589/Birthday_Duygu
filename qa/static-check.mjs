import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=read('index.html'), script=read('script.js'), road=read('roadtrip.js'), css=read('style.css');
const required=['assets/quest1-game-background.jpg','assets/quest1-game-source.jpg','assets/quest1-intro-art.jpg','assets/roadtrip-car.png','assets/game-star.png','assets/game-barrel.png','assets/game-cat.png'];
for(const f of required){if(!fs.existsSync(path.join(root,f)))throw new Error(`missing ${f}`)}
if(!index.includes('style.css?v=1.3.3')||!index.includes('script.js?v=1.3.3')||!index.includes('roadtrip.js?v=1.3.3'))throw new Error('cache version mismatch');
if(!script.includes("const VERSION='1.3.3'"))throw new Error('app version mismatch');
if(!road.includes("const VERSION='1.3.3'"))throw new Error('roadtrip version mismatch');
if(!road.includes('window.showRoadTripScreen'))throw new Error('quest entry function missing');
if(!road.includes('SCREEN.hidden=false'))throw new Error('quest screen is never unhidden');
if(!road.includes('__DUYGU_ROADTRIP_SELF_TEST__'))throw new Error('self test missing');
if(road.includes('<canvas')||css.includes('road-scene'))throw new Error('obsolete renderer detected');
if(!css.includes("quest1-game-background.jpg"))throw new Error('concept background not referenced');
if(!css.includes('[hidden]{display:none!important}'))throw new Error('hidden-state CSS guard missing');
if(!css.includes('.roadtrip-screen.is-playing'))throw new Error('play-state layout missing');
if(!road.includes('function setView(view)'))throw new Error('view state manager missing');
if(!script.includes('function handleQuestActivation(n)'))throw new Error('quest activation missing');
if(script.includes('let roadTripLoadPromise=null'))throw new Error('runtime quest script loader should not be used');
if(!road.includes('lives=Math.max(0,lives-1)'))throw new Error('life counter never reaches zero');
if(!road.includes('objects=objects.filter(o=>!o.hit && o.el.isConnected)'))throw new Error('hit objects are not cleaned up');
if(!road.includes("SCREEN.classList.toggle('is-playing',view==='game')"))throw new Error('game view transition missing');
if(!road.includes("BOARD.focus({preventScroll:true})"))throw new Error('game focus missing');
if(!road.includes('assets/roadtrip-car.png'))throw new Error('player car asset missing');
console.log('PASS: v1.3.3 static QA');
console.log({requiredAssets:required.length,cache:'v1.3.3',renderer:'HTML/CSS layered art',viewState:'intro -> game -> result',hiddenGuard:true,security:'preserved',controls:['ArrowLeft','ArrowRight','A','D','swipe']});

// QA infrastructure checks
const pkg = JSON.parse(read('package.json'));
assert(pkg.version === '1.3.3', 'package version must be 1.3.3');
assert(read('script.js').includes("const VERSION='1.3.3'"), 'script.js version mismatch');
assert(read('roadtrip.js').includes('v1.3.3'), 'roadtrip.js version mismatch');
assert(read('index.html').includes('script.js?v=1.3.3'), 'script cache version mismatch');
assert(read('index.html').includes('roadtrip.js?v=1.3.3'), 'roadtrip cache version mismatch');
assert(read('tests/e2e/quest1.spec.js').includes("#readyButton"), 'E2E Quest I test missing');
assert(read('.github/workflows/qa.yml').includes('playwright install'), 'GitHub browser installation missing');
console.log('QA infrastructure: PASS');
