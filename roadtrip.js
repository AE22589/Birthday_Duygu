/* Quest I — The Road Trip v1.8.0
   Art-first implementation based on the accepted Quest I concept artwork.
   The artwork is the visual source of truth; HTML/CSS only adds interaction.
*/
(()=>{
'use strict';
const INTRO=document.getElementById('roadTripIntro');
const GAME=document.getElementById('roadTripGame');
const RESULT=document.getElementById('roadTripResult');
const READY=document.getElementById('readyButton');
const BACK=document.getElementById('backToMapFromIntro');
const RETURN=document.getElementById('returnToMapFromResult');
const RETRY=document.getElementById('retryRoadTrip');
const BOARD=document.getElementById('roadBoard');
const SCENE=document.getElementById('sceneLayer');
const ROAD_MOTION=document.getElementById('roadMotion');
const DYNAMIC=document.getElementById('dynamicLayer');
const CAR=document.getElementById('playerCar');
const PULSE=document.getElementById('lanePulse');
const TOUCH_HINT=document.getElementById('touchHint');
const STARS=document.getElementById('starCount');
const TIME=document.getElementById('timeCount');
const LIVES=document.getElementById('lifeCount');
const RESULT_STARS=document.getElementById('resultStars');
const RESULT_TIME=document.getElementById('resultTime');
const RESULT_TITLE=document.getElementById('resultTitle');
const RESULT_COPY=document.getElementById('resultCopy');
const RESULT_KICKER=document.getElementById('resultKicker');
const KEY_REWARD=document.getElementById('keyReward');
const QUEST_KEY='duyguBirthdayQuestState_v1';
const VERSION='1.8.1';
const SCREEN=document.getElementById('roadTripScreen');
const DURATION=60;
const TARGET_STARS=20;
const MAX_STARS=43;
const GAME_LOGIC=window.DuyguGameLogic;
if(!GAME_LOGIC) throw new Error('Game logic module failed to load');
const LANES=GAME_LOGIC.LANES;
const HORIZON_Y=-8;
const CAR_Y=88;
const COLLISION_MIN_Y=76;
const COLLISION_MAX_Y=93;
const EXIT_Y=112;
const OBJECT_MIN_SCALE=0.2;
const OBJECT_MAX_SCALE=1.0;
const LANE_TOP_WIDTH=8;
const LANE_BOTTOM_WIDTH=30;
let running=false,raf=0,startAt=0,lastFrame=0,elapsed=0,score=0,lives=3,lane=1,objects=[],device='desktop',touchStart=null,lastMove=0,readyTimer=0,spawnStarAt=0,spawnObstacleAt=0,invulnerableUntil=0;
function mobile(){return matchMedia('(max-width:700px)').matches || (navigator.maxTouchPoints>0 && innerWidth<900)}
function setDevice(){device=mobile()?'mobile':'desktop';TOUCH_HINT.hidden=device!=='mobile';TOUCH_HINT.style.display=device==='mobile'?'block':'none';positionCar(false)}
function laneX(i){return LANES[Math.max(0,Math.min(2,i))]}
function positionCar(animate=true){const x=laneX(lane);CAR.style.setProperty('--car-x',x);CAR.dataset.lane=String(lane);CAR.setAttribute('aria-label',`Player car, lane ${lane+1} of 3`);CAR.classList.toggle('move',animate);}
function updateHud(){STARS.textContent=`${score} / ${MAX_STARS}`;TIME.textContent=String(Math.max(0,Math.ceil(DURATION-elapsed)));LIVES.textContent=`${'♥ '.repeat(lives).trim()}${lives<3?' '+ '♡ '.repeat(3-lives).trim():''}`}
function clearObjects(){objects.forEach(o=>o.el.remove());objects=[];DYNAMIC.replaceChildren()}
function reset(){stop();clearObjects();elapsed=0;score=0;lives=3;lane=1;lastMove=0;spawnStarAt=0;spawnObstacleAt=0;invulnerableUntil=0;CAR.classList.remove('hit');PULSE.classList.remove('show');positionCar(false);updateHud()}
function asset(type){return type==='star'?'assets/game-star.png':type==='cat'?'assets/game-cat.png':'assets/game-barrel.png'}
function spawn(type,idx){
  const el=document.createElement('img');
  el.className=`rt-object ${type}`;
  el.src=asset(type);
  el.alt='';
  el.draggable=false;
  DYNAMIC.appendChild(el);
  const o={
    type,lane:idx,y:HORIZON_Y,el,
    speed:type==='star'?14+Math.random()*2:12+Math.random()*2,
    phase:Math.random()*6.28,hit:false
  };
  objects.push(o);
  renderObject(o,performance.now());
}
function maybeSpawn(){if(score<MAX_STARS && elapsed*1000>=spawnStarAt){spawn('star',Math.random()<.7?lane:Math.floor(Math.random()*3));spawnStarAt=elapsed*1000+900+Math.random()*650}if(elapsed*1000>=spawnObstacleAt){const occupied=new Set(objects.filter(o=>!o.hit&&o.y<55&&o.type!=='star').map(o=>o.lane));let choices=[0,1,2].filter(i=>!occupied.has(i));if(!choices.length)choices=[0,1,2];let idx=choices[Math.floor(Math.random()*choices.length)];if(Math.random()<.58)idx=(lane+(Math.random()<.5?-1:1)+3)%3;spawn(Math.random()<.7?'barrel':'cat',idx);spawnObstacleAt=elapsed*1000+1900+Math.random()*1400}}
function renderObject(o,now){
  const t=Math.max(0,Math.min(1,(o.y-HORIZON_Y)/(CAR_Y-HORIZON_Y)));
  // Perspective acceleration: slow at horizon, fast near the car.
  const p=t*t;
  const scale=OBJECT_MIN_SCALE+(OBJECT_MAX_SCALE-OBJECT_MIN_SCALE)*p;
  const laneWidth=LANE_TOP_WIDTH+(LANE_BOTTOM_WIDTH-LANE_TOP_WIDTH)*p;
  const center=50;
  const laneOffset=(o.lane-1)*laneWidth;
  const bob=o.type==='star'?Math.sin(now/300+o.phase)*.7:Math.sin(now/500+o.phase)*.25;
  o.el.style.transform=`translate3d(calc(${center}% + ${laneOffset}% - 50% + ${bob}px), ${o.y}%, 0) scale(${scale})`;
  o.el.style.opacity=o.hit?'0':String(.35+.65*t);
  o.el.style.zIndex=String(10+Math.round(t*20));
}
function collect(o){if(o.hit)return;o.hit=true;score=Math.min(MAX_STARS,score+1);o.el.classList.add('collected');if(score===TARGET_STARS)flash('FIRST KEY WITHIN REACH')}
function collide(o,now){if(o.hit||now<invulnerableUntil)return;o.hit=true;o.el.classList.add('hit');lives=Math.max(0,lives-1);invulnerableUntil=now+1300;CAR.classList.remove('hit');void CAR.offsetWidth;CAR.classList.add('hit');flash(lives===1?'WATCH THE ROAD':'EASY DOES IT')}
function flash(text){let el=document.getElementById('rtFlash');if(!el){el=document.createElement('div');el.id='rtFlash';document.getElementById('rtEffects').appendChild(el)}el.textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
function update(dt,now){
  elapsed=Math.min(DURATION,(now-startAt)/1000);
  maybeSpawn();
  for(const o of objects){
    if(o.hit)continue;
    const t=Math.max(0,Math.min(1,(o.y-HORIZON_Y)/(CAR_Y-HORIZON_Y)));
    const travelRate=o.type==='star'?0.000020:0.000017;
    o.y += (CAR_Y-HORIZON_Y) * travelRate * dt * (0.35 + 1.65*t);
    renderObject(o,now);
    const near=o.y>COLLISION_MIN_Y&&o.y<COLLISION_MAX_Y&&o.lane===lane;
    if(near){
      if(o.type==='star')collect(o);
      else if(now>=invulnerableUntil)collide(o,now);
    }
    if(o.y>EXIT_Y){o.hit=true;o.el.remove();}
  }
  objects=objects.filter(o=>!o.hit||o.el.isConnected);
  updateHud();
  if(elapsed>=DURATION){finish();return}
  if(lives<=0){finish(true);return}
  raf=requestAnimationFrame(tick);
}
function tick(now){if(!running)return;const dt=Math.min(50,now-lastFrame||16);lastFrame=now;update(dt,now)}
let globalListenersBound=false;
function bindGlobalListeners(){
  if(globalListenersBound)return;
  window.addEventListener('keydown',onKey,{passive:false,capture:true});
  window.addEventListener('resize',setDevice);
  window.addEventListener('orientationchange',onOrientationChange);
  globalListenersBound=true;
}
function unbindGlobalListeners(){
  if(!globalListenersBound)return;
  window.removeEventListener('keydown',onKey,{capture:true});
  window.removeEventListener('resize',setDevice);
  // orientation handler is intentionally stable via named reference below.
  window.removeEventListener('orientationchange',onOrientationChange);
  globalListenersBound=false;
}
function onOrientationChange(){setTimeout(setDevice,60)}
function startLoop(){
  const roadTripGame=document.getElementById('roadTripGame');
  roadTripGame?.classList.add('is-driving');stop();bindGlobalListeners();running=true;SCENE.classList.add('is-driving');ROAD_MOTION?.classList.add('is-driving');startAt=performance.now();lastFrame=startAt;raf=requestAnimationFrame(tick)}
function stop(){running=false;SCENE.classList.remove('is-driving');ROAD_MOTION?.classList.remove('is-driving');if(raf)cancelAnimationFrame(raf);raf=0;touchStart=null;unbindGlobalListeners()}
function move(dir){if(!running)return;const now=performance.now();if(now-lastMove<120)return;const next=GAME_LOGIC.moveLane(lane,dir);if(next===lane)return;lane=next;lastMove=now;positionCar(true);PULSE.style.setProperty('--pulse-x',laneX(lane));PULSE.classList.remove('show');void PULSE.offsetWidth;PULSE.classList.add('show')}
function bindControls(){document.querySelectorAll('[data-move]').forEach(btn=>{btn.addEventListener('click',()=>move(Number(btn.dataset.move)))})}
function onKey(e){
  if(!running)return;
  const key=e.key;
  if(key==='ArrowLeft'||key==='a'||key==='A'){e.preventDefault();e.stopPropagation();move(-1);return}
  if(key==='ArrowRight'||key==='d'||key==='D'){e.preventDefault();e.stopPropagation();move(1)}
}
function onPointerDown(e){
  if(!running||e.pointerType!=='touch')return;
  e.preventDefault();
  touchStart=e.clientX;
  try{BOARD.setPointerCapture(e.pointerId)}catch{}
}
function onPointerUp(e){
  if(!running||touchStart===null||e.pointerType!=='touch')return;
  e.preventDefault();
  const startX=touchStart;
  touchStart=null;
  try{BOARD.releasePointerCapture(e.pointerId)}catch{}
  const direction=GAME_LOGIC.swipeDirection(startX,e.clientX);
  if(direction)move(direction);
}
function clearReadyTimer(){if(readyTimer){clearInterval(readyTimer);readyTimer=0}READY.disabled=false;READY.textContent="I'M READY"}
function setView(view){
  if(view!=='intro') clearReadyTimer();
  SCREEN.hidden=false;
  INTRO.hidden=view!=='intro';
  GAME.hidden=view!=='game';
  RESULT.hidden=view!=='result';
  SCREEN.classList.toggle('is-playing',view==='game');
  SCREEN.classList.toggle('is-result',view==='result');
  SCREEN.classList.toggle('is-intro',view==='intro');
  if(view==='game'){requestAnimationFrame(()=>BOARD.focus({preventScroll:true}))}
}
function intro(){stop();clearObjects();setView('intro');reset();setDevice()}
function ready(){
  if(readyTimer||running)return;
  READY.disabled=true;
  let n=3;
  setView('intro');
  const id=setInterval(()=>{
    READY.textContent=n>0?String(n):'GO';
    n--;
    if(n<0){
      clearInterval(id);
      readyTimer=0;
      READY.disabled=false;
      READY.textContent="I'M READY";
      reset();
      setView('game');
      startLoop();
    }
  },700);
  readyTimer=id;
}
function finish(gameOver=false){
  document.getElementById('roadTripGame')?.classList.remove('is-driving');stop();const finalTime=Math.min(DURATION,elapsed);RESULT_STARS.textContent=String(score);RESULT_TIME.textContent=`${Math.round(finalTime)}s`;RESULT_KICKER.textContent=gameOver?'JOURNEY ENDED':'JOURNEY COMPLETE';RESULT_TITLE.textContent=gameOver?'THE ROAD TURNED AGAINST YOU':'THE ROAD REMEMBERS';RESULT_COPY.textContent=gameOver?'The road has turned against you. Take a breath and try again.':`You collected ${score} / ${MAX_STARS} stars.`;const won=score>=TARGET_STARS&&!gameOver;KEY_REWARD.hidden=!won;if(won){grantKey();}setView('result')}
function grantKey(){try{const s=JSON.parse(localStorage.getItem(QUEST_KEY)||'{}');const c=Array.isArray(s.completed)?s.completed.filter(Number.isInteger):[];if(!c.includes(1))c.push(1);localStorage.setItem(QUEST_KEY,JSON.stringify({completed:[...new Set(c)].sort((a,b)=>a-b)}))}catch{}}
function back(){clearReadyTimer();stop();clearObjects();setView('intro');window.showQuestMap?.()}
function showRoadTripScreen(){clearReadyTimer();stop();clearObjects();reset();setView('intro');setDevice()}
READY.addEventListener('click',ready);BACK.addEventListener('click',back);RETURN.addEventListener('click',back);RETRY.addEventListener('click',()=>{stop();clearObjects();reset();setView('intro');setDevice()});BOARD.addEventListener('pointerdown',onPointerDown,{passive:false});BOARD.addEventListener('pointerup',onPointerUp,{passive:false});BOARD.addEventListener('pointercancel',e=>{try{BOARD.releasePointerCapture(e.pointerId)}catch{} touchStart=null},{passive:true});bindControls();setDevice();
window.showRoadTripScreen=showRoadTripScreen;
if(new URLSearchParams(location.search).has('qa') && navigator.webdriver===true){
  window.__DUYGU_QA__={
    getPerspectiveSample:(y=HORIZON_Y)=>{const t=Math.max(0,Math.min(1,(y-HORIZON_Y)/(CAR_Y-HORIZON_Y)));return {y,scale:OBJECT_MIN_SCALE+(OBJECT_MAX_SCALE-OBJECT_MIN_SCALE)*Math.pow(t,2)}},
  getVisualMotion:()=>{const el=document.getElementById('roadFlowLayer');if(!el)return null;return getComputedStyle(el).backgroundPositionY;},
  getState:()=>({running,elapsed,score,lives,lane}),
    move:(dir)=>move(dir),
    reset:()=>{stop();clearObjects();reset();setView('game');setDevice()},
    forceFinish:(gameOver=false)=>finish(gameOver),
    setLives:(value)=>{lives=Math.max(0,Math.min(3,Number(value)));updateHud()},
    setScore:(value)=>{score=Math.max(0,Math.min(MAX_STARS,Number(value)));updateHud()},
    setElapsed:(seconds)=>{elapsed=Math.max(0,Math.min(DURATION,Number(seconds)));if(running)startAt=performance.now()-elapsed*1000;updateHud()},
    spawnTestObject:(type,testLane)=>{const safeType=['star','barrel','cat'].includes(type)?type:'star';const safeLane=Math.max(0,Math.min(2,Number(testLane)));const before=objects.length;spawn(safeType,safeLane);const o=objects[before];if(o){o.y=82;renderObject(o,performance.now())}},
    runtime:()=>({running,rafActive:!!raf,objectCount:objects.length,elapsed,score,lives,lane})
  };
}
window.__DUYGU_ROADTRIP_SELF_TEST__=()=>({version:VERSION,renderer:'HTML/CSS layered art',background:'assets/quest1-game-background.jpg',car:'assets/roadtrip-car.png',desktopKeyboard:true,mobileSwipe:true,pointerTouch:true,lanes:LANES.length, logicModule:true,duration:DURATION,targetStars:TARGET_STARS,maxStars:MAX_STARS,stateKey:QUEST_KEY,readyGate:!!READY,hiddenCssEnforced:getComputedStyle(GAME).display==='none'||GAME.hidden});
window.__ROADTRIP_QA__={
  getPerspectiveSample:(y=HORIZON_Y)=>{const t=Math.max(0,Math.min(1,(y-HORIZON_Y)/(CAR_Y-HORIZON_Y)));return {y,scale:OBJECT_MIN_SCALE+(OBJECT_MAX_SCALE-OBJECT_MIN_SCALE)*Math.pow(t,2)}},
  
  start:()=>{clearReadyTimer();reset();setView('game');startLoop();},
  stop:()=>stop(),
  getVisualMotion:()=>{const el=document.getElementById('roadFlowLayer');return el?getComputedStyle(el,'::before').backgroundPositionY:null;},
  getState:()=>({
    running,
    lives,
    stars:score,
    elapsed,
    objects:objects.map(o=>({lane:o.lane,y:o.y,type:o.type,qaTest:!!o.qaTest}))
  }),
  spawnTestObject:(type='star',testLane=0)=>{
    const safeType=['star','barrel','cat'].includes(type)?type:'star';
    const safeLane=Math.max(0,Math.min(2,Number(testLane)));
    const before=objects.length;
    spawn(safeType,safeLane);
    const o=objects[before];
    if(o){
      o.qaTest=true;
      o.y=40;
      o.lane = safeLane;
      renderObject(o,performance.now());
    }
  }
};
})();
