(()=>{'use strict';
const VERSION='1.11.1';
const QA_MODE=new URLSearchParams(location.search).has('qa') && navigator.webdriver===true;
const QA_VISUAL_MAP=new URLSearchParams(location.search).get('qa')==='visual-map' && navigator.webdriver===true;
const TARGET_MS=Date.parse('2026-09-08T00:00:00+02:00');
const ADMIN_CODE='1337';
const CLICK_LIMIT=5;
const CLICK_WINDOW_MS=2500;
const STATE_KEY='duyguBirthdayQuestState_v1';
const QA_UNLOCK_KEY='duyguQaUnlockAll_v1';
const QA_FINAL_KEY='duyguQaFinalComplete_v1';
const WRONG_CODE_MESSAGES=[
  ['Nice try. 👀','You’re pretty curious, aren’t you?\nBut this door is locked tighter than you think.'],
  ['Caught you snooping. 👀','Nice try, but this door is very well locked.\nYou’ll have to wait.'],
  ['Well, well, well... 👀','Someone’s getting curious.\nUnfortunately for you, this door knows how to keep a secret.'],
  ['Access denied. 😏','Cute attempt. But this door isn’t giving up its secrets that easily.'],
  ['Wrong code, detective. 🔐','Curiosity is encouraged.\nBreaking in is not.'],
  ['Not today. 👀','The door has seen your little experiment — and remains unimpressed.']
];
const LOCKOUT_KEY='duyguAdminLockout_v1';
const LOCKOUT_ATTEMPT_LIMIT=3;
const LOCKOUT_DURATION_MS=24*60*60*1000;

const $=id=>document.getElementById(id);
const entrance=$('entrance'),timeTravelScreen=$('timeTravelScreen'),timeTravelText=$('timeTravelText'),timeTravelStorm=$('timeTravelStorm'),returnTravelScreen=$('returnTravelScreen'),returnTravelText=$('returnTravelText'),returnTravelGif=$('returnTravelGif'),returnVideoPanel=$('returnVideoPanel'),returnVideo=$('returnVideo'),returnVideoPlay=$('returnVideoPlay'),returnVideoEnd=$('returnVideoEnd'),oneLastChoice=$('oneLastChoice'),choiceContinue=$('choiceContinue'),choiceReplay=$('choiceReplay'),pathChoice=$('pathChoice'),yourPick=$('yourPick'),pickedPath=$('pickedPath'),questScreen=$('questScreen'),doorHit=$('doorHit'),modal=$('adminModal'),finalDoorModal=$('finalDoorModal'),openFinalDoor=$('openFinalDoor'),finalDoorAnimatedOverlay=$('finalDoorAnimatedOverlay'),mobileFinalDoorCta=$('mobileFinalDoorCta'),mobileFinalDoorButton=$('mobileFinalDoorButton'),codeInput=$('adminCode'),unlockButton=$('unlock'),cancelButton=$('cancel'),error=$('error'),wrongCodePopup=$('wrongCodePopup'),wrongCodeTitle=$('wrongCodeTitle'),wrongCodeMessage=$('wrongCodeMessage'),wrongCodeClose=$('wrongCodeClose'),toast=$('toast'),lockTitle=$('lockTitle'),lockText=$('lockText'),mapShell=$('mapShell'),mapImage=$('mapImage'),svg=$('mapInteraction'),controlsGroup=$('questControls'),lockedLayers=$('lockedLayers'),questStatusLayers=$('questStatusLayers'),finalDoorReadyLayer=$('finalDoorReadyLayer'),activeLayer=$('activeLayer'),activeRing=$('activeRing'),activeRingGlow=$('activeRingGlow'),finalDoorHotspot=$('finalDoorHotspot'),returnHotspot=$('returnHotspot'),countdown={days:$('days'),hours:$('hours'),minutes:$('minutes'),seconds:$('seconds')};
if(!entrance||!timeTravelScreen||!timeTravelText||!timeTravelStorm||!questScreen||!doorHit||!mapImage||!svg||!controlsGroup||!lockedLayers||!questStatusLayers||!activeLayer||!activeRing||!activeRingGlow||!finalDoorHotspot||!returnHotspot)return;

const NS='http://www.w3.org/2000/svg';
const GEOMETRY={
  desktop:{
    width:1536,height:1024,
    quests:[
      {x:150,y:650,r:105},{x:350,y:650,r:105},{x:550,y:650,r:105},{x:850,y:650,r:105},
      {x:1050,y:650,r:105},{x:1250,y:650,r:105},{x:1400,y:650,r:95}
    ],
    finalDoor:{x:768,y:390,r:150},
    return:{x:1250,y:30,w:250,h:55}
  },
  mobile:{
    width:1536,height:1024,
    quests:[
      {x:150,y:650,r:105},{x:350,y:650,r:105},{x:550,y:650,r:105},{x:850,y:650,r:105},
      {x:1050,y:650,r:105},{x:1250,y:650,r:105},{x:1400,y:650,r:95}
    ],
    finalDoor:{x:768,y:390,r:150},
    return:{x:1250,y:30,w:250,h:55}
  }
};
const ROMAN=['I','II','III','IV','V','VI','VII'];
const NAMES=['The Road Trip','Paint It!','Sucuk Master',"Lokum's Challenge",'Memory Lane','Our Little Puzzle','German Word Challenge'];
const CHECKMARK_ANCHORS=[{x:190,y:665},{x:390,y:655},{x:535,y:645},{x:875,y:645},{x:1030,y:650},{x:1195,y:655},{x:1355,y:670}];
const FINAL_DOOR_PROGRESS_SLOTS=[{x:630,y:201,width:30,height:48},{x:665,y:201,width:30,height:48},{x:699,y:201,width:30,height:48},{x:733,y:201,width:30,height:48},{x:767,y:201,width:30,height:48},{x:802,y:201,width:29,height:48},{x:835,y:201,width:30,height:48}];
const STATUS_BADGE_ANCHORS=[{x:197,y:700},{x:404,y:700},{x:562,y:700},{x:916,y:700},{x:1072,y:700},{x:1229,y:700},{x:1386,y:700}];
let previewGranted=false,countdownTimer=null,clickCount=0,clickWindowStart=0,lastTouchActivation=-Infinity,lockoutTimer=null,mapQaClickCount=0,mapQaClickWindowStart=0,finalQaClickCount=0,finalQaClickWindowStart=0,lastEffectiveCount=null,unlockAnimating=false,adminUnlockContext='entrance',lastWrongCodeIndex=-1,transitionRunning=false,state=loadState();

function loadLockout(){try{const p=JSON.parse(localStorage.getItem(LOCKOUT_KEY)||'{}');return{attempts:Number.isInteger(p.attempts)?p.attempts:0,lockedUntil:Number.isFinite(p.lockedUntil)?p.lockedUntil:0}}catch{return{attempts:0,lockedUntil:0}}}
function saveLockout(s){try{localStorage.setItem(LOCKOUT_KEY,JSON.stringify(s))}catch{}}
function clearLockout(){try{localStorage.removeItem(LOCKOUT_KEY)}catch{}}
function isLockedOut(){return loadLockout().lockedUntil>Date.now()}
function lockoutRemainingMs(){return Math.max(0,loadLockout().lockedUntil-Date.now())}
function formatLockoutRemaining(ms){const totalMinutes=Math.ceil(ms/60000);const h=Math.floor(totalMinutes/60),m=totalMinutes%60;return h>0?`${h}h ${m}m`:`${Math.max(1,m)}m`}
function registerWrongAttempt(){const s=loadLockout();s.attempts=(s.attempts||0)+1;if(s.attempts>=LOCKOUT_ATTEMPT_LIMIT){s.lockedUntil=Date.now()+LOCKOUT_DURATION_MS;s.attempts=0}saveLockout(s)}

function loadState(){try{const p=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');const c=Array.isArray(p.completed)?p.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=7):[];return{completed:[...new Set(c)].sort((a,b)=>a-b)}}catch{return{completed:[]}}}
function isQaUnlockAllActive(){try{return sessionStorage.getItem(QA_UNLOCK_KEY)==='1'}catch{return false}}
function isQaFinalActive(){if(Date.now()>=TARGET_MS)return false;try{return sessionStorage.getItem(QA_FINAL_KEY)==='1'}catch{return false}}
function effectiveCompleted(){const c=new Set(state.completed);if(isQaFinalActive())for(let n=1;n<=7;n++)c.add(n);return c}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({completed:state.completed}))}catch{}}
function isMobile(){return window.matchMedia('(max-width:700px)').matches}
function geometry(){return isMobile()?GEOMETRY.mobile:GEOMETRY.desktop}
function mapState(){let n=0;while(state.completed.includes(n+1))n++;return n}
function currentQuest(){const n=mapState();return n<7?n+1:null}
function isQuestReachable(n){return state.completed.includes(n)||isQaUnlockAllActive()||n===currentQuest()}
function questStatus(n){if(state.completed.includes(n))return 'completed';if(isQuestReachable(n))return 'ready';return 'locked'}
function mapAsset(){return'arcade map.gif'}
function loadDeferredAsset(el,attr,sourceAttr){if(!el||el.getAttribute(attr))return;const source=el.getAttribute(sourceAttr);if(source)el.setAttribute(attr,source)}
function loadStormAsset(){const picture=timeTravelStorm.querySelector('picture'),source=picture?.querySelector('source'),img=picture?.querySelector('img');loadDeferredAsset(source,'srcset','data-srcset');loadDeferredAsset(img,'src','data-src')}
function loadReturnAsset(){loadDeferredAsset(returnTravelGif.querySelector('img'),'src','data-src')}
function preloadMapAsset(){loadDeferredAsset(mapImage,'href','data-href');const asset=mapImage.getAttribute('href');if(asset)mapImage.setAttributeNS('http://www.w3.org/1999/xlink','href',asset)}
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200)}
function setCountdown(ms){const t=Math.max(0,Math.floor(ms/1000));const d=Math.floor(t/86400),h=Math.floor(t%86400/3600),m=Math.floor(t%3600/60),s=t%60;countdown.days.textContent=String(d).padStart(2,'0');countdown.hours.textContent=String(h).padStart(2,'0');countdown.minutes.textContent=String(m).padStart(2,'0');countdown.seconds.textContent=String(s).padStart(2,'0')}
function isUnlocked(){return previewGranted||Date.now()>=TARGET_MS}
function unlockEntrance(){lockTitle.textContent='THE DOOR IS READY';lockText.innerHTML='The right moment has arrived.<br>Click the door and begin the adventure.'}
function refreshCountdown(){const remaining=TARGET_MS-Date.now();setCountdown(remaining);if(remaining<=0||previewGranted){unlockEntrance();if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null}}}
function updateLockoutUI(){
  if(isLockedOut()){
    error.textContent=`Too many attempts. Try again in ${formatLockoutRemaining(lockoutRemainingMs())}.`;
    codeInput.disabled=true;
    unlockButton.disabled=true;
  }else{
    codeInput.disabled=false;
    unlockButton.disabled=false;
    if(lockoutTimer){clearInterval(lockoutTimer);lockoutTimer=null}
  }
}
function openPreviewModal(context='entrance'){
  adminUnlockContext=context;
  if(wrongCodePopup)wrongCodePopup.hidden=true;
  clickCount=0;clickWindowStart=0;modal.hidden=false;codeInput.value='';error.textContent='';
  if(isLockedOut()){
    updateLockoutUI();
    if(!lockoutTimer)lockoutTimer=setInterval(updateLockoutUI,1000);
  }else{
    codeInput.disabled=false;unlockButton.disabled=false;
    requestAnimationFrame(()=>codeInput.focus());
  }
}
function closePreviewModal(){modal.hidden=true;clickCount=0;clickWindowStart=0;adminUnlockContext='entrance';codeInput.value='';error.textContent='';if(lockoutTimer){clearInterval(lockoutTimer);lockoutTimer=null}}
function showWrongCodePopup(){let index=Math.floor(Math.random()*WRONG_CODE_MESSAGES.length);if(WRONG_CODE_MESSAGES.length>1&&index===lastWrongCodeIndex)index=(index+1)%WRONG_CODE_MESSAGES.length;lastWrongCodeIndex=index;wrongCodeTitle.textContent=WRONG_CODE_MESSAGES[index][0];wrongCodeMessage.textContent=WRONG_CODE_MESSAGES[index][1];wrongCodePopup.hidden=false;wrongCodeClose.focus()}
function setSvgGeometry(g){
  svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  mapImage.setAttribute('width',String(g.width));
  mapImage.setAttribute('height',String(g.height));
  const asset=mapImage.getAttribute('href')||mapImage.getAttribute('data-href')||mapAsset();
  loadDeferredAsset(mapImage,'href','data-href');
  mapImage.setAttribute('href',asset);
  mapImage.setAttributeNS('http://www.w3.org/1999/xlink','href',asset);
}
function createHotspot(questNumber,q,active){
  const circle=document.createElementNS(NS,'rect');
  circle.classList.add('svg-hotspot','quest-hotspot');
  const b=cabinetBounds(q),status=questStatus(questNumber);
  circle.classList.add(`status-${status}`);
  circle.setAttribute('x',b.x);circle.setAttribute('y',b.y);circle.setAttribute('width',b.w);circle.setAttribute('height',b.h);circle.setAttribute('rx',8);
  circle.setAttribute('role','button');circle.setAttribute('tabindex',active?'0':'-1');
  circle.setAttribute('aria-label',`Quest ${ROMAN[questNumber-1]}: ${NAMES[questNumber-1]}, ${status}`);
  circle.dataset.quest=String(questNumber);
  circle.addEventListener('click',()=>handleQuestActivation(questNumber));
  circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleQuestActivation(questNumber)}});
  if(active){
    circle.addEventListener('mouseenter',()=>setHover(true));
    circle.addEventListener('mouseleave',()=>setHover(false));
    circle.addEventListener('focus',()=>setHover(true));
    circle.addEventListener('blur',()=>setHover(false));
  }
  return circle;
}
function cabinetBounds(q){const w=q.w||q.r*1.8,oldH=q.h||q.r*2.5,h=oldH*1.75;return{x:q.x-w/2,y:q.y-oldH/2-oldH*.75,w,h}}
function setHover(on){mapShell.classList.toggle('is-hover',on)}
function buildLockedLayer(g,active){
  lockedLayers.replaceChildren();
  // The arcade GIF is the complete map artwork; legacy clipped image copies
  // would create black/circular masks and must remain disabled.
  lockedLayers.style.display='none';
  questStatusLayers.replaceChildren();
  svg.querySelectorAll('clipPath[id^=\"questClip-\"]').forEach(node=>node.remove());
  const defs=svg.querySelector('defs');

  g.quests.forEach((q,index)=>{
    const n=index+1;
    if(isQuestReachable(n))return;

    // Use a real SVG image instance rather than <use>. Both the master image
    // and the locked image occupy the exact same user-space coordinates.
    const lockedImage=document.createElementNS(NS,'image');
    lockedImage.setAttribute('x','0');
    lockedImage.setAttribute('y','0');
    lockedImage.setAttribute('width',String(g.width));
    lockedImage.setAttribute('height',String(g.height));
    lockedImage.setAttribute('preserveAspectRatio','none');
    lockedImage.setAttribute('href',mapAsset());
    lockedImage.setAttributeNS('http://www.w3.org/1999/xlink','href',mapAsset());

    const clip=document.createElementNS(NS,'clipPath');
    clip.id=`questClip-${n}`;
    clip.setAttribute('clipPathUnits','userSpaceOnUse');

    // q.r is the measured outer medallion radius. Do not enlarge it.
    const c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',String(q.x));
    c.setAttribute('cy',String(q.y));
    c.setAttribute('r',String(q.r));
    clip.appendChild(c);
    defs.appendChild(clip);

    lockedImage.setAttribute('clip-path',`url(#${clip.id})`);
    lockedImage.setAttribute('aria-hidden','true');
    lockedLayers.appendChild(lockedImage);
  });

  for(let n=1;n<=g.quests.length;n++){
    const effective=effectiveCompleted(),anchor=STATUS_BADGE_ANCHORS[n-1];
    const status=effective.has(n)?'completed':(n===currentQuest()?'ready':isQuestReachable(n)?'ready':'locked');
    const asset=status==='completed'?'checkmark.png':status==='ready'&&n===currentQuest()?'insertcoin.png':status==='locked'?'locked.png':null;
    if(!asset)continue;
    const image=document.createElementNS(NS,'image');image.classList.add('map-status-marker');image.setAttribute('href',asset);image.setAttributeNS('http://www.w3.org/1999/xlink','href',asset);image.setAttribute('pointer-events','none');
    const w=status==='completed'?68:status==='ready'?140:124,h=status==='completed'?68:status==='ready'?105:93;const point=status==='completed'?CHECKMARK_ANCHORS[n-1]:anchor;image.setAttribute('x',point.x-w/2);image.setAttribute('y',point.y-h/2);image.setAttribute('width',w);image.setAttribute('height',h);image.setAttribute('preserveAspectRatio','xMidYMid meet');questStatusLayers.appendChild(image);
  }
}
function renderFinalDoorProgress(){
  let layer=document.getElementById('finalDoorProgress');if(!layer){layer=document.createElementNS(NS,'g');layer.id='finalDoorProgress';layer.setAttribute('pointer-events','none');svg.insertBefore(layer,controlsGroup)}layer.replaceChildren();
  const count=[...effectiveCompleted()].filter(n=>Number.isInteger(n)&&n>=1&&n<=7).length;
  FINAL_DOOR_PROGRESS_SLOTS.slice(0,count).forEach((slot,index)=>{const rect=document.createElementNS(NS,'rect');rect.setAttribute('x',slot.x+5);rect.setAttribute('y',slot.y+5);rect.setAttribute('width',slot.width-10);rect.setAttribute('height',slot.height-10);rect.setAttribute('rx','3');rect.setAttribute('fill','rgba(114,240,164,.72)');rect.setAttribute('pointer-events','none');if(unlockAnimating){rect.classList.add('final-key-flash');rect.style.animationDelay=`${index*280}ms`}layer.appendChild(rect)});
}
function renderFinalDoorReady(){
  finalDoorReadyLayer.replaceChildren();const count=[...effectiveCompleted()].filter(n=>Number.isInteger(n)&&n>=1&&n<=7).length;if(mobileFinalDoorCta)mobileFinalDoorCta.hidden=!(isMobile()&&count===7);if(count!==7){finalDoorAnimatedOverlay.setAttribute('visibility','hidden');finalDoorAnimatedOverlay.style.opacity='0';return}finalDoorAnimatedOverlay.setAttribute('visibility','visible');finalDoorAnimatedOverlay.style.opacity='1';
  [['THE FINAL DOOR IS READY','458'],['OPEN THE DOOR','488']].forEach(([value,y],i)=>{const text=document.createElementNS(NS,'text');text.setAttribute('x','768');text.setAttribute('y',y);text.setAttribute('text-anchor','middle');text.setAttribute('class',`final-door-ready-text final-door-ready-${i}`);text.setAttribute('pointer-events','none');text.textContent=value;finalDoorReadyLayer.appendChild(text)});
}
function triggerFinalDoorUnlock(){if(unlockAnimating)return;unlockAnimating=true;finalDoorReadyLayer.replaceChildren();renderFinalDoorProgress();setTimeout(()=>{renderFinalDoorProgress();unlockAnimating=false;renderFinalDoorReady()},1000+7*280+350)}

function renderMap(){
  // Always render badges and Final-Door slots from the persisted source of truth.
  state=loadState();
  const g=geometry();
  const active=currentQuest();
  setSvgGeometry(g);
  setHover(false);
  controlsGroup.replaceChildren();
  buildLockedLayer(g,active);
  renderFinalDoorProgress();
  const effectiveCount=[...effectiveCompleted()].filter(n=>Number.isInteger(n)&&n>=1&&n<=7).length;
  if(lastEffectiveCount!==null&&lastEffectiveCount<7&&effectiveCount===7)triggerFinalDoorUnlock();
  if(!unlockAnimating)renderFinalDoorReady();
  lastEffectiveCount=effectiveCount;
  g.quests.forEach((q,index)=>{const n=index+1;controlsGroup.appendChild(createHotspot(n,q,n===active && isQuestReachable(n)))});
  const target=active?g.quests[active-1]:g.finalDoor;
  activeRing.setAttribute('cx',String(target.x));
  activeRing.setAttribute('cy',String(target.y));
  const ringRadius=Math.max(1,target.r-4);
  activeRing.setAttribute('r',String(ringRadius));
  activeRingGlow.setAttribute('cx',String(target.x));
  activeRingGlow.setAttribute('cy',String(target.y));
  activeRingGlow.setAttribute('r',String(ringRadius));
  activeLayer.style.display='none';
  const d=g.finalDoor;
  finalDoorHotspot.setAttribute('x',String(d.x-d.r));finalDoorHotspot.setAttribute('y',String(d.y-d.r*.72));
  finalDoorHotspot.setAttribute('width',String(d.r*2));finalDoorHotspot.setAttribute('height',String(d.r*1.44));
  finalDoorHotspot.setAttribute('aria-label',state.completed.length===7?'The Final Door, unlocked':'The Final Door, locked');
  const r=g.return;
  const mobileReturnHit=window.matchMedia('(max-width:700px)').matches;
  const returnHitHeight=mobileReturnHit?118:r.h;
  returnHotspot.setAttribute('x',String(r.x));
  returnHotspot.setAttribute('y',String(r.y-(returnHitHeight-r.h)/2));
  returnHotspot.setAttribute('width',String(r.w));
  returnHotspot.setAttribute('height',String(returnHitHeight));
  mapImage.setAttribute('aria-label',`Duygu's birthday quest map, ${active?`quest ${active} ready`:'all quests complete'}`);
}
function showQuestMap(){if(!isUnlocked()){showToast('The door is still locked...');return}state=loadState();entrance.hidden=true;timeTravelScreen.hidden=true;document.getElementById('roadTripScreen')?.setAttribute('hidden','');document.getElementById('paintItScreen')?.setAttribute('hidden','');document.getElementById('sucukMasterScreen')?.setAttribute('hidden','');document.getElementById('lokumChallengeScreen')?.setAttribute('hidden','');document.getElementById('memoryLaneScreen')?.setAttribute('hidden','');document.getElementById('puzzleScreen')?.setAttribute('hidden','');document.getElementById('wordChallengeScreen')?.setAttribute('hidden','');questScreen.hidden=false;renderMap();window.scrollTo(0,0)}
async function startTimeTravelTransition(){if(transitionRunning)return;transitionRunning=true;loadStormAsset();preloadMapAsset();entrance.hidden=true;questScreen.hidden=true;timeTravelScreen.hidden=false;timeTravelStorm.hidden=true;timeTravelText.className='time-travel-text';const lines=["There’s so much fog...","Wait. I can see lightning.","Okay... this is getting weird.","Oh my God — what is happening?!"];const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));for(const line of lines){timeTravelText.textContent=line;timeTravelText.classList.remove('is-visible');void timeTravelText.offsetWidth;timeTravelText.classList.add('is-visible');await wait(3600);timeTravelText.classList.remove('is-visible');await wait(350)}timeTravelStorm.hidden=false;await wait(4300);timeTravelText.className='time-travel-text time-travel-storm-message';timeTravelText.textContent="I don’t think we’re in 2026 anymore.";void timeTravelText.offsetWidth;timeTravelText.classList.add('is-visible');await wait(3600);timeTravelText.classList.remove('is-visible');await wait(500);timeTravelStorm.hidden=true;timeTravelScreen.hidden=true;transitionRunning=false;showQuestMap()}
window.showQuestMap=showQuestMap;
function showEntrance(){questScreen.hidden=true;modal.hidden=true;entrance.hidden=false;previewGranted=false;refreshCountdown()}
function handleDoorActivation(e){if(!modal.hidden||transitionRunning)return;e.preventDefault();if(isUnlocked()){startTimeTravelTransition();return}const now=performance.now();if(!clickWindowStart||now-clickWindowStart>CLICK_WINDOW_MS){clickWindowStart=now;clickCount=1}else clickCount++;if(clickCount>=CLICK_LIMIT){clickCount=0;clickWindowStart=0;openPreviewModal();return}showToast(`The door remains sealed. ${CLICK_LIMIT-clickCount} more clicks...`)}
let roadTripLoadPromise=null;
function ensureRoadTripLoaded(){
  if(typeof window.showRoadTripScreen==='function')return Promise.resolve();
  if(roadTripLoadPromise)return roadTripLoadPromise;
  roadTripLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-roadtrip-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showRoadTripScreen==='function'?resolve():reject(new Error('roadtrip.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('roadtrip.js failed to load')),{once:true});return;}
    const script=document.createElement('script');
    script.src=`roadtrip.js?v=${VERSION}`;script.defer=true;script.dataset.roadtripLoader='true';
    script.onload=()=>typeof window.showRoadTripScreen==='function'?resolve():reject(new Error('roadtrip.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('roadtrip.js failed to load'));
    document.head.appendChild(script);
  });
  return roadTripLoadPromise;
}
let lokumChallengeLoadPromise=null;
function ensureLokumChallengeLoaded(){
  if(typeof window.showLokumChallengeScreen==='function')return Promise.resolve();
  if(lokumChallengeLoadPromise)return lokumChallengeLoadPromise;
  lokumChallengeLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-lokumchallenge-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showLokumChallengeScreen==='function'?resolve():reject(new Error('lokumchallenge.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('lokumchallenge.js failed to load')),{once:true});return;}
    const script=document.createElement('script');script.src=`lokumchallenge.js?v=${VERSION}`;script.defer=true;script.dataset.lokumchallengeLoader='true';
    script.onload=()=>typeof window.showLokumChallengeScreen==='function'?resolve():reject(new Error('lokumchallenge.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('lokumchallenge.js failed to load'));document.head.appendChild(script);
  });
  return lokumChallengeLoadPromise;
}
let memoryLaneLoadPromise=null;
function ensureMemoryLaneLoaded(){
  if(typeof window.showMemoryLaneScreen==='function')return Promise.resolve();
  if(memoryLaneLoadPromise)return memoryLaneLoadPromise;
  memoryLaneLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-memorylane-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showMemoryLaneScreen==='function'?resolve():reject(new Error('memorylane.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('memorylane.js failed to load')),{once:true});return;}
    const script=document.createElement('script');script.src=`memorylane.js?v=${VERSION}`;script.defer=true;script.dataset.memorylaneLoader='true';
    script.onload=()=>typeof window.showMemoryLaneScreen==='function'?resolve():reject(new Error('memorylane.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('memorylane.js failed to load'));document.head.appendChild(script);
  });
  return memoryLaneLoadPromise;
}
let puzzleLoadPromise=null;
function ensurePuzzleLoaded(){
  if(typeof window.showPuzzleScreen==='function')return Promise.resolve();
  if(puzzleLoadPromise)return puzzleLoadPromise;
  puzzleLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-puzzle-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showPuzzleScreen==='function'?resolve():reject(new Error('puzzle.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('puzzle.js failed to load')),{once:true});return;}
    const script=document.createElement('script');script.src=`puzzle.js?v=${VERSION}`;script.defer=true;script.dataset.puzzleLoader='true';
    script.onload=()=>typeof window.showPuzzleScreen==='function'?resolve():reject(new Error('puzzle.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('puzzle.js failed to load'));document.head.appendChild(script);
  });
  return puzzleLoadPromise;
}
let wordChallengeLoadPromise=null;
function ensureWordChallengeLoaded(){
  if(typeof window.showWordChallengeScreen==='function')return Promise.resolve();
  if(wordChallengeLoadPromise)return wordChallengeLoadPromise;
  wordChallengeLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-wordchallenge-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showWordChallengeScreen==='function'?resolve():reject(new Error('wordchallenge.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('wordchallenge.js failed to load')),{once:true});return;}
    const script=document.createElement('script');script.src=`wordchallenge.js?v=${VERSION}`;script.defer=true;script.dataset.wordchallengeLoader='true';
    script.onload=()=>typeof window.showWordChallengeScreen==='function'?resolve():reject(new Error('wordchallenge.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('wordchallenge.js failed to load'));document.head.appendChild(script);
  });
  return wordChallengeLoadPromise;
}
let sucukMasterLoadPromise=null;
function ensureSucukMasterLoaded(){
  if(typeof window.showSucukMasterScreen==='function')return Promise.resolve();
  if(sucukMasterLoadPromise)return sucukMasterLoadPromise;
  sucukMasterLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-sucukmaster-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showSucukMasterScreen==='function'?resolve():reject(new Error('sucukmaster.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('sucukmaster.js failed to load')),{once:true});return;}
    const script=document.createElement('script');script.src=`sucukmaster.js?v=${VERSION}`;script.defer=true;script.dataset.sucukmasterLoader='true';
    script.onload=()=>typeof window.showSucukMasterScreen==='function'?resolve():reject(new Error('sucukmaster.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('sucukmaster.js failed to load'));document.head.appendChild(script);
  });
  return sucukMasterLoadPromise;
}
let paintItLoadPromise=null;
function ensurePaintItLoaded(){
  if(typeof window.showPaintItScreen==='function')return Promise.resolve();
  if(paintItLoadPromise)return paintItLoadPromise;
  paintItLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-paintit-loader]');
    if(existing){existing.addEventListener('load',()=>typeof window.showPaintItScreen==='function'?resolve():reject(new Error('paintit.js loaded without registering the quest')),{once:true});existing.addEventListener('error',()=>reject(new Error('paintit.js failed to load')),{once:true});return;}
    const script=document.createElement('script');
    script.src=`paintit.js?v=${VERSION}`;script.defer=true;script.dataset.paintitLoader='true';
    script.onload=()=>typeof window.showPaintItScreen==='function'?resolve():reject(new Error('paintit.js loaded without registering the quest'));
    script.onerror=()=>reject(new Error('paintit.js failed to load'));
    document.head.appendChild(script);
  });
  return paintItLoadPromise;
}
async function handleQuestActivation(n){
  state=loadState();
  const active=currentQuest();
  if(!isQuestReachable(n)){showToast('Complete the previous challenge to unlock this quest.');return}
  if(n===1){
    try{await ensureRoadTripLoaded();window.showRoadTripScreen();}
    catch(err){console.error('[Quest I]',err);showToast('Quest I could not be loaded. Please refresh and try again.');}
  }else if(n===2){
    try{await ensurePaintItLoaded();window.showPaintItScreen();}
    catch(err){console.error('[Quest II]',err);showToast('Quest II could not be loaded. Please refresh and try again.');}
  }else if(n===3){
    try{await ensureSucukMasterLoaded();window.showSucukMasterScreen();}
    catch(err){console.error('[Quest III]',err);showToast('Quest III could not be loaded. Please refresh and try again.');}
  }else if(n===4){
    try{await ensureLokumChallengeLoaded();window.showLokumChallengeScreen();}
    catch(err){console.error('[Quest IV]',err);showToast('Quest IV could not be loaded. Please refresh and try again.');}
  }else if(n===5){
    try{await ensureMemoryLaneLoaded();window.showMemoryLaneScreen();}
    catch(err){console.error('[Quest V]',err);showToast('Quest V could not be loaded. Please refresh and try again.');}
  }else if(n===6){
    try{await ensurePuzzleLoaded();window.showPuzzleScreen();}
    catch(err){console.error('[Quest VI]',err);showToast('Quest VI could not be loaded. Please refresh and try again.');}
  }else if(n===7){
    try{await ensureWordChallengeLoaded();window.showWordChallengeScreen();}
    catch(err){console.error('[Quest VII]',err);showToast('Quest VII could not be loaded. Please refresh and try again.');}
  }
}
async function startReturnTimeTravel(){loadReturnAsset();finalDoorModal.hidden=true;returnTravelScreen.hidden=false;returnVideoPanel.hidden=true;returnVideo.pause();returnVideo.currentTime=0;returnVideoEnd.hidden=true;returnVideoPlay.hidden=false;returnTravelGif.hidden=true;returnTravelText.hidden=false;returnTravelText.className='return-travel-text';const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));for(const line of ['One last trip.','Hold on.',"Let's get you back home."]){returnTravelText.textContent=line;returnTravelText.classList.remove('is-visible');void returnTravelText.offsetWidth;returnTravelText.classList.add('is-visible');await wait(2500);returnTravelText.classList.remove('is-visible');await wait(250)}returnTravelText.hidden=true;returnTravelGif.hidden=false;await wait(4800);returnTravelGif.hidden=true;returnVideoPanel.hidden=false}
function handleFinalDoor(){const completedCount=[...effectiveCompleted()].filter(n=>Number.isInteger(n)&&n>=1&&n<=7).length;if(completedCount<7){toast.classList.add('final-door-locked');showToast('FINAL DOOR LOCKED\nThe door needs all seven keys.');setTimeout(()=>toast.classList.remove('final-door-locked'),2300);return}finalDoorModal.hidden=false;openFinalDoor.focus()}
function handleReturn(){showEntrance();document.getElementById('roadTripScreen')?.setAttribute('hidden','');document.getElementById('paintItScreen')?.setAttribute('hidden','');document.getElementById('memoryLaneScreen')?.setAttribute('hidden','');document.getElementById('puzzleScreen')?.setAttribute('hidden','');document.getElementById('wordChallengeScreen')?.setAttribute('hidden','')}

window.__DUYGU_APP_VERSION__=VERSION;
window.__DUYGU_SELF_TEST__=()=>({
  version:VERSION,
  securityCodeLength:ADMIN_CODE.length,
  questOneAvailable:typeof window.showRoadTripScreen==='function',
  questOneLoaderAvailable:typeof ensureRoadTripLoaded==='function',
  questTwoLoaderAvailable:typeof ensurePaintItLoaded==='function',
  questThreeLoaderAvailable:typeof ensureSucukMasterLoaded==='function',
  questFourLoaderAvailable:typeof ensureLokumChallengeLoaded==='function',
  mapHotspots:document.querySelectorAll('.quest-hotspot').length,
  stateKey:STATE_KEY,
  lockoutAttemptLimit:LOCKOUT_ATTEMPT_LIMIT,
  isLockedOut:isLockedOut(),
  lockoutRemainingMs:lockoutRemainingMs()
});

doorHit.addEventListener('touchend',e=>{lastTouchActivation=performance.now();handleDoorActivation(e)},{passive:false});
doorHit.addEventListener('click',e=>{if(performance.now()-lastTouchActivation<450)return;handleDoorActivation(e)});
svg.addEventListener('pointerup',e=>{
  if(questScreen.hidden||modal.hidden===false)return;
  if(e.target!==svg&&e.target!==mapImage)return;
  const now=performance.now();
  if(!mapQaClickWindowStart||now-mapQaClickWindowStart>CLICK_WINDOW_MS){mapQaClickWindowStart=now;mapQaClickCount=1}else mapQaClickCount++;
  if(mapQaClickCount>=CLICK_LIMIT){mapQaClickCount=0;mapQaClickWindowStart=0;openPreviewModal('mapQa')}
});
finalDoorHotspot.addEventListener('click',e=>{e.preventDefault();if(Date.now()<TARGET_MS){const now=performance.now();if(!finalQaClickWindowStart||now-finalQaClickWindowStart>CLICK_WINDOW_MS){finalQaClickWindowStart=now;finalQaClickCount=1}else finalQaClickCount++;if(finalQaClickCount>=CLICK_LIMIT){finalQaClickCount=0;finalQaClickWindowStart=0;openPreviewModal('finalDoorQa');return}}handleFinalDoor()});
finalDoorHotspot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleFinalDoor()}});
returnHotspot.addEventListener('click',e=>{e.preventDefault();handleReturn()});
returnHotspot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleReturn()}});
mobileFinalDoorButton?.addEventListener('click',handleFinalDoor);
openFinalDoor.addEventListener('click',startReturnTimeTravel);
returnVideoPlay.addEventListener('click',()=>{returnVideo.play().then(()=>{returnVideoPlay.hidden=true}).catch(()=>{})});
returnVideo.addEventListener('ended',()=>{returnVideoEnd.hidden=false;returnVideoPanel.hidden=true;returnTravelScreen.classList.add('video-active');oneLastChoice.hidden=false});
choiceReplay.addEventListener('click',()=>{oneLastChoice.hidden=true;returnVideoPanel.hidden=false;returnVideoEnd.hidden=true;returnVideo.currentTime=0;returnVideoPlay.hidden=false;});
choiceContinue.addEventListener('click',()=>{oneLastChoice.hidden=true;pathChoice.hidden=false});
pathChoice.querySelectorAll('.path-card').forEach(card=>card.addEventListener('click',()=>{pathChoice.querySelectorAll('.path-card').forEach(c=>c.setAttribute('aria-pressed',String(c===card)));pickedPath.textContent=card.dataset.path;yourPick.hidden=false}));
finalDoorModal.addEventListener('pointerup',e=>{if(e.target===finalDoorModal)finalDoorModal.hidden=true});
unlockButton.addEventListener('click',()=>{
  if(isLockedOut()){updateLockoutUI();return}
  if(codeInput.value.trim()!==ADMIN_CODE){
    registerWrongAttempt();
    if(adminUnlockContext==='entrance'&&wrongCodePopup)showWrongCodePopup();
    if(isLockedOut()){
      updateLockoutUI();
      if(!lockoutTimer)lockoutTimer=setInterval(updateLockoutUI,1000);
    }else{
      error.textContent='Wrong code.';codeInput.select();
    }
    return;
  }
  clearLockout();
  if(adminUnlockContext==='mapQa'){
    try{sessionStorage.setItem(QA_UNLOCK_KEY,'1')}catch{}
    closePreviewModal();showQuestMap();showToast('Quest map QA unlock enabled.');
  }else if(adminUnlockContext==='finalDoorQa'){
    try{sessionStorage.setItem(QA_FINAL_KEY,'1')}catch{}
    closePreviewModal();lastEffectiveCount=0;showQuestMap();showToast('Final Door QA mode enabled.');
  }else{
    previewGranted=true;closePreviewModal();unlockEntrance();startTimeTravelTransition();
  }
});
cancelButton.addEventListener('click',closePreviewModal);
wrongCodeClose?.addEventListener('click',()=>{wrongCodePopup.hidden=true;codeInput.focus()});
codeInput.addEventListener('keydown',e=>{if(e.key==='Enter')unlockButton.click();if(e.key==='Escape')closePreviewModal()});
modal.addEventListener('pointerup',e=>{if(e.target===modal)closePreviewModal()});
window.addEventListener('resize',()=>{if(!questScreen.hidden)renderMap()});
window.addEventListener('orientationchange',()=>setTimeout(()=>{if(!questScreen.hidden)renderMap()},50));
refreshCountdown();countdownTimer=setInterval(refreshCountdown,250);
if(QA_VISUAL_MAP){
  previewGranted=true;
  entrance.hidden=true;
  questScreen.hidden=false;
  renderMap();
  window.scrollTo(0,0);
}
})();
