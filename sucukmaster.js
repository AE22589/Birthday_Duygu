/* Quest III — Sucuk Master
   Pure timing/state logic is separated from DOM. The DOM module is lazy-loaded
   by script.js and uses the approved individual production assets.
*/
'use strict';
const SM_VERSION='1.11.1';

const SM_CONFIG=Object.freeze({
  DURATION:60,
  SLOT_COUNT:4,
  SIDE_DURATION_MS:6000,
  TURN_MIN:0.60,
  TURN_MAX:0.85,
  PERFECT_MIN:0.85,
  PERFECT_MAX:0.95,
  SPAWN_MIN_MS:2000,
  SPAWN_MAX_MS:3000,
  LOKUM_MIN_MS:8000,
  LOKUM_MAX_MS:12000,
  LOKUM_WARNING_MS:1500,
  RESULT:{MASTER:10,PRO:8,WELL:5}
});

function smClamp(n,min=0,max=1){return Math.max(min,Math.min(max,n));}
function smProgress(startAt,now,sideDuration=SM_CONFIG.SIDE_DURATION_MS){return smClamp((now-startAt)/sideDuration);}
function smZone(progress){
  if(progress>=SM_CONFIG.PERFECT_MIN && progress<SM_CONFIG.PERFECT_MAX)return 'perfect';
  if(progress>=SM_CONFIG.TURN_MIN && progress<SM_CONFIG.TURN_MAX)return 'turn';
  return 'none';
}
function smClickSlot(slot,progress){
  if(!slot||slot.state==='empty')return {action:'none',slot};
  if(slot.state==='burnt')return {action:'clear',slot:{...slot,state:'empty'}};
  const zone=smZone(progress);
  if(slot.side===1 && zone==='turn')return {action:'turn',slot:{...slot,side:2}};
  if(slot.side===2 && zone==='perfect')return {action:'finish',slot:{...slot,state:'done'}};
  return {action:'none',slot};
}
function smAdvanceSlot(slot,progress){
  if(!slot||slot.state==='empty'||slot.state==='done'||slot.state==='burnt')return slot;
  return progress>=1 ? {...slot,state:'burnt'} : slot;
}
function smCreateSlots(count=SM_CONFIG.SLOT_COUNT){return Array.from({length:count},(_,i)=>({id:i,state:'empty',side:1,startAt:0}));}
function smSpawnSlice(slots,now){
  const next=slots.map(s=>({...s}));
  const index=next.findIndex(s=>s.state==='empty');
  if(index<0)return {slots:next,index:-1};
  next[index]={id:index,state:'active',side:1,startAt:now};
  return {slots:next,index};
}
function smAdvanceSlices(slots,now){
  return slots.map(s=>{
    if(s.state!=='active')return s;
    return smAdvanceSlot(s,smProgress(s.startAt,now));
  });
}
function smGrade(perfectSucuks){
  if(perfectSucuks>=SM_CONFIG.RESULT.MASTER)return {tier:'master',title:'SUCUK MASTER!',key:true};
  if(perfectSucuks>=SM_CONFIG.RESULT.PRO)return {tier:'pro',title:'SUCUK PRO',key:true};
  if(perfectSucuks>=SM_CONFIG.RESULT.WELL)return {tier:'well',title:'WELL BROWNED',key:true};
  return {tier:'incomplete',title:'NOT QUITE THERE',key:false};
}
function smRandomDelay(random,min,max){return min+random()*(max-min);}

const SucukMasterLogic={CONFIG:SM_CONFIG,clamp:smClamp,progress:smProgress,zone:smZone,clickSlot:smClickSlot,advanceSlot:smAdvanceSlot,createSlots:smCreateSlots,spawnSlice:smSpawnSlice,advanceSlices:smAdvanceSlices,grade:smGrade,randomDelay:smRandomDelay};
if(typeof module!=='undefined'&&module.exports){ module.exports = SucukMasterLogic; }

if(typeof document!=='undefined')(function(){
  const $=id=>document.getElementById(id);
  const QUEST_KEY='duyguBirthdayQuestState_v1', QUEST_NUMBER=3;
  const screenEl=$('sucukMasterScreen');
  const views={intro:$('sucukMasterIntro'),game:$('sucukMasterGame'),result:$('sucukMasterResult')};
  const slotsLayer=$('smSlots'),plateEl=$('smPlate'),finishedSucuksEl=$('smFinishedSucuks'),plateCountEl=$('smPlateCount'),lokumEl=$('smLokum'),lokumWarn=$('smLokumWarning');
  const hudTime=$('smTimeCount'),hudPerfect=$('smPerfectCount');
  const readyBtn=$('smReadyButton'),backBtn=$('smBackToMapFromIntro'),retryBtn=$('smRetry'),returnBtn=$('smReturnToMapFromResult');
  const resultTitle=$('smResultTitle'),resultPerfect=$('smResultPerfect'),keyReward=$('smKeyReward');
  if(!screenEl||!slotsLayer||!plateEl||!lokumEl)return;

  let view='intro',running=false,raf=0,startAt=0,elapsed=0,lastSpawnAt=0,nextSpawnDelay=2500;
  let slots=smCreateSlots(),perfectSucuks=0,plateCount=0,lokumActive=false,lokumDeadline=0,nextLokumAt=Infinity;
  let pendingFrame=null,renderedPlateCount=-1,feedbackIndex=-1,feedbackUntil=0,feedbackText='';

  function setView(next){view=next;screenEl.hidden=false;Object.entries(views).forEach(([k,v])=>{if(v)v.hidden=k!==next;});}
  function updateHud(){hudTime.textContent=String(Math.max(0,Math.ceil(SM_CONFIG.DURATION-elapsed)));hudPerfect.textContent=String(perfectSucuks);}
  function slotProgress(s,now){return smProgress(s.startAt,now);}
  function renderSlot(s,now){
    let el=slotsLayer.querySelector(`[data-slot="${s.id}"]`);
    if(s.state==='empty'){el?.remove();return;}
    if(!el){el=document.createElement('button');el.type='button';el.className='sm-slot';el.dataset.slot=String(s.id);el.setAttribute('aria-label',`Pan ${s.id+1}`);slotsLayer.appendChild(el);}
    el.className=`sm-slot ${s.state}`;
    const progress=slotProgress(s,now);
    const pan=document.createElement('img');pan.alt='';pan.draggable=false;pan.className='sm-pan';pan.src='pan.png';
    const img=document.createElement('img');img.alt='';img.draggable=false;img.className='sm-sucuk';
    if(s.state==='burnt')img.src='sucuk-burnt.png';
    else if(s.side===1)img.src='sucuk-raw.png';
    else img.src='sucuk-brown.png';
    el.style.setProperty('--sm-brown',String(Math.min(1,progress)));
    const pct=Math.round(progress*100);
    const zone=smZone(progress);
    const meter=document.createElement('span');meter.className='sm-slot-meter';meter.style.setProperty('--sm-progress',`${pct}%`);meter.innerHTML='<i></i>';
    const status=document.createElement('span');status.className=`sm-slot-status ${s.side===1&&zone==='turn'?'turn':s.side===2&&zone==='perfect'?'perfect':''}`;
    status.textContent=s.state==='burnt'?'BURNT — CLICK TO CLEAR':s.side===1&&zone==='turn'?'TURN NOW!':s.side===2&&zone==='perfect'?'TAKE OUT NOW!':s.side===2?`SIDE 2 — ${pct}%`:`SIDE 1 — ${pct}%`;
    el.replaceChildren(pan,img,meter,status);
    if(feedbackIndex===s.id&&now<feedbackUntil){const feedback=document.createElement('span');feedback.className='sm-slot-feedback';feedback.textContent=feedbackText;el.appendChild(feedback)}
    el.title=s.state==='burnt'?'Click to clear the burnt pan':s.side===1?`Browned ${pct}% — click in the golden zone to turn`: `Side 2 ${pct}% — click in the perfect zone to remove`;
  }
  function renderPlate(){
    plateEl.dataset.count=String(plateCount);
    plateCountEl.textContent=plateCount?`x${plateCount}`:'';
    plateCountEl.hidden=plateCount===0;
    if(plateCount===renderedPlateCount)return;
    const positions=[[14,36,-18],[43,31,8],[27,52,-5],[55,53,19],[8,58,11],[62,20,-12]];
    const fragment=document.createDocumentFragment();
    for(let i=0;i<plateCount;i++){
      const [left,top,rotation]=positions[i%positions.length];
      const sucuk=document.createElement('img');sucuk.alt='';sucuk.className='sm-finished-sucuk';sucuk.src='sucuk-brown.png';
      sucuk.style.left=`${left}%`;sucuk.style.top=`${top}%`;sucuk.style.transform=`rotate(${rotation}deg)`;
      fragment.appendChild(sucuk);
    }
    finishedSucuksEl.replaceChildren(fragment);renderedPlateCount=plateCount;
  }
  function renderAll(now=performance.now()){
    slots.forEach(s=>renderSlot(s,now));
    renderPlate();
    lokumEl.hidden=!lokumActive;lokumWarn.hidden=!lokumActive;
    updateHud();
  }
  function randomDelay(min,max){return smRandomDelay(Math.random,min,max);}
  function scheduleSpawn(now){lastSpawnAt=now;nextSpawnDelay=randomDelay(SM_CONFIG.SPAWN_MIN_MS,SM_CONFIG.SPAWN_MAX_MS);}
  function scheduleLokum(now){nextLokumAt=now+randomDelay(SM_CONFIG.LOKUM_MIN_MS,SM_CONFIG.LOKUM_MAX_MS);}
  function finish(){
    if(!running)return;
    running=false;cancelAnimationFrame(raf);raf=0;
    const grading=smGrade(perfectSucuks);
    resultTitle.textContent=grading.title;resultPerfect.textContent=String(perfectSucuks);keyReward.hidden=!grading.key;
    if(grading.key)grantKey();
    setView('result');
  }
  function grantKey(){try{const s=JSON.parse(localStorage.getItem(QUEST_KEY)||'{}');const c=Array.isArray(s.completed)?s.completed.filter(Number.isInteger):[];if(!c.includes(QUEST_NUMBER))c.push(QUEST_NUMBER);localStorage.setItem(QUEST_KEY,JSON.stringify({completed:[...new Set(c)].sort((a,b)=>a-b)}));}catch{}}
  function spawn(){const result=smSpawnSlice(slots,performance.now());if(result.index>=0){slots=result.slots;scheduleSpawn(performance.now());}}
  function clearBurnt(index){slots[index]={id:index,state:'empty',side:1,startAt:0};}
  function showClickFeedback(index,slot,progress,now){feedbackIndex=index;feedbackUntil=now+650;feedbackText=slot.side===1?(progress<SM_CONFIG.TURN_MIN?'KEEP BROWNING':'TOO LATE — CLEAR AFTER BURNING'):(progress<SM_CONFIG.PERFECT_MIN?'SIDE 2 — KEEP BROWNING':'TOO LATE — CLEAR AFTER BURNING');}
  function clickSlot(index){
    if(!running)return;
    const now=performance.now();const s=slots[index];if(!s||s.state==='empty')return;
    const progress=slotProgress(s,now);const result=smClickSlot(s,progress);
    if(result.action!=='none'){feedbackIndex=-1;feedbackUntil=0;}
    if(result.action==='turn'){slots[index]={...s,side:2,startAt:now};}
    else if(result.action==='finish'){slots[index]={id:index,state:'empty',side:1,startAt:0};perfectSucuks++;plateCount++;if(nextLokumAt===Infinity)scheduleLokum(now);}
    else if(result.action==='clear'){clearBurnt(index);}
    else showClickFeedback(index,s,progress,now);
    renderAll(now);
  }
  function showLokum(){if(plateCount<=0||lokumActive)return;lokumActive=true;lokumDeadline=performance.now()+SM_CONFIG.LOKUM_WARNING_MS;lokumEl.hidden=false;lokumWarn.hidden=false;lokumEl.classList.remove('sm-lokum-pop');void lokumEl.offsetWidth;lokumEl.classList.add('sm-lokum-pop');}
  function clickLokum(){if(!running||!lokumActive)return;lokumActive=false;nextLokumAt=performance.now()+randomDelay(SM_CONFIG.LOKUM_MIN_MS,SM_CONFIG.LOKUM_MAX_MS);renderAll();}
  function stealSucuk(){if(plateCount>0){plateCount--;perfectSucuks=Math.max(0,perfectSucuks-1)}lokumActive=false;nextLokumAt=performance.now()+randomDelay(SM_CONFIG.LOKUM_MIN_MS,SM_CONFIG.LOKUM_MAX_MS);renderAll();}
  function tick(now){
    if(!running)return;
    elapsed=(now-startAt)/1000;
    slots=smAdvanceSlices(slots,now);
    if(now-lastSpawnAt>=nextSpawnDelay)spawn();
    if(plateCount>0&&now>=nextLokumAt&&!lokumActive)showLokum();
    if(lokumActive&&now>=lokumDeadline)stealSucuk();
    renderAll(now);
    if(elapsed>=SM_CONFIG.DURATION){finish();return;}
    raf=requestAnimationFrame(tick);
  }
  function reset(){running=false;if(raf)cancelAnimationFrame(raf);slots=smCreateSlots();perfectSucuks=0;plateCount=0;elapsed=0;lokumActive=false;nextLokumAt=Infinity;pendingFrame=null;renderedPlateCount=-1;feedbackIndex=-1;feedbackUntil=0;feedbackText='';slotsLayer.innerHTML='';renderAll(performance.now());}
  function start(){reset();setView('game');running=true;startAt=performance.now();lastSpawnAt=startAt;nextSpawnDelay=2500;nextLokumAt=Infinity;raf=requestAnimationFrame(tick);}
  function back(){reset();setView('intro');window.showQuestMap?.();}
  readyBtn?.addEventListener('click',start);retryBtn?.addEventListener('click',start);backBtn?.addEventListener('click',back);returnBtn?.addEventListener('click',back);
  slotsLayer.addEventListener('click',e=>{const button=e.target.closest('.sm-slot');if(button)clickSlot(Number(button.dataset.slot));});
  lokumEl.addEventListener('click',clickLokum);lokumWarn.addEventListener('click',clickLokum);

  function showSucukMasterScreen(){reset();setView('intro');}
  window.showSucukMasterScreen=showSucukMasterScreen;
  window.__SUCUKMASTER__={
    getState:()=>({view,running,elapsed,slots:slots.map(s=>({...s})),perfectSucuks,plateCount,lokumActive}),
    start,
    spawn:()=>{if(running){const r=smSpawnSlice(slots,performance.now());if(r.index>=0)slots=r.slots;renderAll();}},
    clickSlot:(index,progress)=>{if(!running)return;const now=performance.now();const s=slots[index];if(!s)return;const result=smClickSlot(s,progress);if(result.action==='turn')slots[index]={...s,side:2,startAt:now};else if(result.action==='finish'){slots[index]={id:index,state:'empty',side:1,startAt:0};perfectSucuks++;plateCount++;if(nextLokumAt===Infinity)scheduleLokum(now);}else if(result.action==='clear')clearBurnt(index);renderAll(now);},
    setSlotProgress:(index,progress)=>{if(!slots[index])return;slots[index]={...slots[index],startAt:performance.now()-smClamp(progress)*SM_CONFIG.SIDE_DURATION_MS,state:slots[index].state==='empty'?'active':slots[index].state};renderAll();},
    forceBurn:(index)=>{if(slots[index]){slots[index]={...slots[index],state:'burnt'};renderAll();}},
    setPlateCount:n=>{plateCount=Math.max(0,Number(n)||0);if(plateCount>0&&nextLokumAt===Infinity)nextLokumAt=performance.now();renderAll();},
    triggerLokum:()=>showLokum(),
    clickLokum,
    setElapsed:seconds=>{elapsed=Math.max(0,Math.min(SM_CONFIG.DURATION,Number(seconds)));if(running)startAt=performance.now()-elapsed*1000;renderAll();},
    forceFinish:finish
  };
  reset();
})();
