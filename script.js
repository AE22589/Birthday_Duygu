(()=>{'use strict';
const VERSION='1.9.2';
const QA_MODE=new URLSearchParams(location.search).has('qa') && navigator.webdriver===true;
const QA_VISUAL_MAP=new URLSearchParams(location.search).get('qa')==='visual-map' && navigator.webdriver===true;
const TARGET_MS=Date.parse('2026-09-08T00:00:00+02:00');
const ADMIN_CODE='1337';
const CLICK_LIMIT=5;
const CLICK_WINDOW_MS=2500;
const STATE_KEY='duyguBirthdayQuestState_v1';
const LOCKOUT_KEY='duyguAdminLockout_v1';
const LOCKOUT_ATTEMPT_LIMIT=3;
const LOCKOUT_DURATION_MS=24*60*60*1000;

const $=id=>document.getElementById(id);
const entrance=$('entrance'),questScreen=$('questScreen'),doorHit=$('doorHit'),modal=$('adminModal'),codeInput=$('adminCode'),unlockButton=$('unlock'),cancelButton=$('cancel'),error=$('error'),toast=$('toast'),lockTitle=$('lockTitle'),lockText=$('lockText'),mapShell=$('mapShell'),mapImage=$('mapImage'),svg=$('mapInteraction'),controlsGroup=$('questControls'),lockedLayers=$('lockedLayers'),activeLayer=$('activeLayer'),activeRing=$('activeRing'),activeRingGlow=$('activeRingGlow'),finalDoorHotspot=$('finalDoorHotspot'),returnHotspot=$('returnHotspot'),countdown={days:$('days'),hours:$('hours'),minutes:$('minutes'),seconds:$('seconds')};
if(!entrance||!questScreen||!doorHit||!mapImage||!svg||!controlsGroup||!lockedLayers||!activeLayer||!activeRing||!activeRingGlow||!finalDoorHotspot||!returnHotspot)return;

const NS='http://www.w3.org/2000/svg';
const GEOMETRY={
  desktop:{
    width:1672,height:941,
    quests:[
      {x:424,y:337,r:69},{x:646,y:214,r:66},{x:971,y:214,r:66},{x:1192,y:339,r:66},
      {x:1127,y:590,r:66},{x:809,y:689,r:66},{x:456,y:590,r:66}
    ],
    finalDoor:{x:806,y:573,r:82},
    return:{x:1372,y:16,w:284,h:49}
  },
  mobile:{
    width:322,height:696,
    quests:[
      {x:151,y:157,r:42},{x:46,y:230,r:40},{x:275,y:230,r:40},{x:276,y:365,r:40},
      {x:225,y:478,r:40},{x:78,y:487,r:36},{x:46,y:365,r:40}
    ],
    finalDoor:{x:161,y:358,r:60},
    return:{x:26,y:657,w:190,h:36}
  }
};
const ROMAN=['I','II','III','IV','V','VI','VII'];
const NAMES=['The Road Trip','Paint It!','Sucuk Master',"Lokum's Challenge",'Memory Lane','Our Little Puzzle','German Word Challenge'];
let previewGranted=false,countdownTimer=null,clickCount=0,clickWindowStart=0,lastTouchActivation=-Infinity,lockoutTimer=null,state=loadState();

function loadLockout(){try{const p=JSON.parse(localStorage.getItem(LOCKOUT_KEY)||'{}');return{attempts:Number.isInteger(p.attempts)?p.attempts:0,lockedUntil:Number.isFinite(p.lockedUntil)?p.lockedUntil:0}}catch{return{attempts:0,lockedUntil:0}}}
function saveLockout(s){try{localStorage.setItem(LOCKOUT_KEY,JSON.stringify(s))}catch{}}
function clearLockout(){try{localStorage.removeItem(LOCKOUT_KEY)}catch{}}
function isLockedOut(){return loadLockout().lockedUntil>Date.now()}
function lockoutRemainingMs(){return Math.max(0,loadLockout().lockedUntil-Date.now())}
function formatLockoutRemaining(ms){const totalMinutes=Math.ceil(ms/60000);const h=Math.floor(totalMinutes/60),m=totalMinutes%60;return h>0?`${h}h ${m}m`:`${Math.max(1,m)}m`}
function registerWrongAttempt(){const s=loadLockout();s.attempts=(s.attempts||0)+1;if(s.attempts>=LOCKOUT_ATTEMPT_LIMIT){s.lockedUntil=Date.now()+LOCKOUT_DURATION_MS;s.attempts=0}saveLockout(s)}

function loadState(){try{const p=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');const c=Array.isArray(p.completed)?p.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=7):[];return{completed:[...new Set(c)].sort((a,b)=>a-b)}}catch{return{completed:[]}}}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({completed:state.completed}))}catch{}}
function isMobile(){return window.matchMedia('(max-width:700px)').matches}
function geometry(){return isMobile()?GEOMETRY.mobile:GEOMETRY.desktop}
function mapState(){let n=0;while(state.completed.includes(n+1))n++;return n}
function currentQuest(){const n=mapState();return n<7?n+1:null}
function mapAsset(){return`assets/quest-map-${isMobile()?'mobile':'desktop'}.webp`}
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
function openPreviewModal(){
  clickCount=0;clickWindowStart=0;modal.hidden=false;codeInput.value='';error.textContent='';
  if(isLockedOut()){
    updateLockoutUI();
    if(!lockoutTimer)lockoutTimer=setInterval(updateLockoutUI,1000);
  }else{
    codeInput.disabled=false;unlockButton.disabled=false;
    requestAnimationFrame(()=>codeInput.focus());
  }
}
function closePreviewModal(){modal.hidden=true;clickCount=0;clickWindowStart=0;codeInput.value='';error.textContent='';if(lockoutTimer){clearInterval(lockoutTimer);lockoutTimer=null}}
function setSvgGeometry(g){
  svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  mapImage.setAttribute('width',String(g.width));
  mapImage.setAttribute('height',String(g.height));
  const asset=mapAsset();
  mapImage.setAttribute('href',asset);
  mapImage.setAttributeNS('http://www.w3.org/1999/xlink','href',asset);
}
function createHotspot(questNumber,q,active){
  const circle=document.createElementNS(NS,'circle');
  circle.classList.add('svg-hotspot','quest-hotspot');
  circle.setAttribute('cx',q.x);circle.setAttribute('cy',q.y);circle.setAttribute('r',Math.max(18,q.r-2));
  circle.setAttribute('role','button');circle.setAttribute('tabindex',active?'0':'-1');
  circle.setAttribute('aria-label',`Quest ${ROMAN[questNumber-1]}: ${NAMES[questNumber-1]}${active?', ready':', locked'}`);
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
function setHover(on){mapShell.classList.toggle('is-hover',on)}
function buildLockedLayer(g,active){
  lockedLayers.replaceChildren();
  svg.querySelectorAll('clipPath[id^=\"questClip-\"]').forEach(node=>node.remove());
  const defs=svg.querySelector('defs');

  g.quests.forEach((q,index)=>{
    const n=index+1;
    if(n===active)return;

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
}

function renderMap(){
  const g=geometry();
  const active=currentQuest();
  setSvgGeometry(g);
  setHover(false);
  controlsGroup.replaceChildren();
  buildLockedLayer(g,active);
  g.quests.forEach((q,index)=>{const n=index+1;controlsGroup.appendChild(createHotspot(n,q,n===active))});
  const target=active?g.quests[active-1]:g.finalDoor;
  activeRing.setAttribute('cx',String(target.x));
  activeRing.setAttribute('cy',String(target.y));
  const ringRadius=Math.max(1,target.r-4);
  activeRing.setAttribute('r',String(ringRadius));
  activeRingGlow.setAttribute('cx',String(target.x));
  activeRingGlow.setAttribute('cy',String(target.y));
  activeRingGlow.setAttribute('r',String(ringRadius));
  activeLayer.style.display=active?'block':'none';
  const d=g.finalDoor;
  finalDoorHotspot.setAttribute('x',String(d.x-d.r));finalDoorHotspot.setAttribute('y',String(d.y-d.r*.72));
  finalDoorHotspot.setAttribute('width',String(d.r*2));finalDoorHotspot.setAttribute('height',String(d.r*1.44));
  finalDoorHotspot.setAttribute('aria-label',state.completed.length===7?'The Final Door, unlocked':'The Final Door, locked');
  const r=g.return;
  returnHotspot.setAttribute('x',String(r.x));returnHotspot.setAttribute('y',String(r.y));returnHotspot.setAttribute('width',String(r.w));returnHotspot.setAttribute('height',String(r.h));
  mapImage.setAttribute('aria-label',`Duygu's birthday quest map, ${active?`quest ${active} ready`:'all quests complete'}`);
}
function showQuestMap(){if(!isUnlocked()){showToast('The door is still locked...');return}state=loadState();entrance.hidden=true;document.getElementById('roadTripScreen')?.setAttribute('hidden','');questScreen.hidden=false;renderMap();window.scrollTo(0,0)}
window.showQuestMap=showQuestMap;
function showEntrance(){questScreen.hidden=true;modal.hidden=true;entrance.hidden=false;previewGranted=false;refreshCountdown()}
function handleDoorActivation(e){if(!modal.hidden)return;e.preventDefault();if(isUnlocked()){showQuestMap();return}const now=performance.now();if(!clickWindowStart||now-clickWindowStart>CLICK_WINDOW_MS){clickWindowStart=now;clickCount=1}else clickCount++;if(clickCount>=CLICK_LIMIT){clickCount=0;clickWindowStart=0;openPreviewModal();return}showToast(`The door remains sealed. ${CLICK_LIMIT-clickCount} more clicks...`)}
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
async function handleQuestActivation(n){
  const active=currentQuest();
  const reachable=active===null?7:active;
  if(n>reachable){showToast('Complete the previous challenge to unlock this quest.');return}
  if(n===1){
    try{await ensureRoadTripLoaded();window.showRoadTripScreen();}
    catch(err){console.error('[Quest I]',err);showToast('Quest I could not be loaded. Please refresh and try again.');}
  }
}
function handleFinalDoor(){showToast(state.completed.length===7?'The Final Door is ready to open.':'Complete each challenge. Claim every key. Close the circle.')}
function handleReturn(){showEntrance();document.getElementById('roadTripScreen')?.setAttribute('hidden','')}

window.__DUYGU_APP_VERSION__=VERSION;
window.__DUYGU_SELF_TEST__=()=>({
  version:VERSION,
  securityCodeLength:ADMIN_CODE.length,
  questOneAvailable:typeof window.showRoadTripScreen==='function',
  questOneLoaderAvailable:typeof ensureRoadTripLoaded==='function',
  mapHotspots:document.querySelectorAll('.quest-hotspot').length,
  stateKey:STATE_KEY,
  lockoutAttemptLimit:LOCKOUT_ATTEMPT_LIMIT,
  isLockedOut:isLockedOut(),
  lockoutRemainingMs:lockoutRemainingMs()
});

doorHit.addEventListener('touchend',e=>{lastTouchActivation=performance.now();handleDoorActivation(e)},{passive:false});
doorHit.addEventListener('click',e=>{if(performance.now()-lastTouchActivation<450)return;handleDoorActivation(e)});
finalDoorHotspot.addEventListener('click',e=>{e.preventDefault();handleFinalDoor()});
finalDoorHotspot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleFinalDoor()}});
returnHotspot.addEventListener('click',e=>{e.preventDefault();handleReturn()});
returnHotspot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleReturn()}});
unlockButton.addEventListener('click',()=>{
  if(isLockedOut()){updateLockoutUI();return}
  if(codeInput.value.trim()!==ADMIN_CODE){
    registerWrongAttempt();
    if(isLockedOut()){
      updateLockoutUI();
      if(!lockoutTimer)lockoutTimer=setInterval(updateLockoutUI,1000);
    }else{
      error.textContent='Wrong code.';codeInput.select();
    }
    return;
  }
  clearLockout();
  previewGranted=true;closePreviewModal();unlockEntrance();showQuestMap();showToast('Developer preview unlocked.');
});
cancelButton.addEventListener('click',closePreviewModal);
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