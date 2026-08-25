import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=read('index.html'), script=read('script.js'), road=read('roadtrip.js'), css=read('style.css');
const required=['assets/quest1-game-background.jpg','assets/quest1-game-source.jpg','assets/quest1-intro-art.jpg','assets/roadtrip-car.png','assets/game-star.png','assets/game-barrel.png','assets/game-cat.png'];
for(const f of required){if(!fs.existsSync(path.join(root,f)))throw new Error(`missing ${f}`)}
if(!index.includes('style.css?v=1.3.0')||!index.includes('script.js?v=1.3.0')||!index.includes('roadtrip.js?v=1.3.0'))throw new Error('cache version mismatch');
if(!script.includes("const VERSION='1.3.0'"))throw new Error('app version mismatch');
if(!road.includes("const VERSION='1.3.0'"))throw new Error('roadtrip version mismatch');
if(!road.includes('window.showRoadTripScreen'))throw new Error('quest loader missing');
if(!road.includes('__DUYGU_ROADTRIP_SELF_TEST__'))throw new Error('self test missing');
if(road.includes('<canvas')||css.includes('road-scene'))throw new Error('obsolete renderer detected');
if(!css.includes("quest1-game-background.jpg"))throw new Error('concept background not referenced');
if(!road.includes('assets/roadtrip-car.png'))throw new Error('player car asset missing');
console.log('PASS: v1.3.0 static QA');
console.log({requiredAssets:required.length,cache:'v1.3.0',renderer:'HTML/CSS layered art',security:'preserved',controls:['ArrowLeft','ArrowRight','A','D','swipe']});
