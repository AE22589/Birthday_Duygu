/* Quest IV — Lokum's Challenge
   Pure maze/state logic is separated from DOM. The DOM module is lazy-loaded
   by script.js and uses the supplied Quest-IV maze/treat/Lokum assets.
*/
'use strict';
const LC_VERSION='1.11.1';

const N=Object.freeze({N:1,E:2,S:4,W:8});
const DIRECTION_VECTORS=Object.freeze({up:[-1,0],right:[0,1],down:[1,0],left:[0,-1]});

const MAZE_1=Object.freeze({
  size:9,
  start:[8,0], exit:[0,8],
  walls:Object.freeze([
    [9,5,5,3,9,5,5,1,3],
    [12,5,3,14,10,9,3,10,14],
    [9,3,12,3,12,6,10,12,3],
    [10,12,5,4,5,3,12,3,10],
    [8,5,5,5,3,14,9,6,10],
    [10,9,3,11,12,5,6,11,10],
    [12,6,12,0,5,5,5,6,10],
    [9,3,13,6,9,3,9,3,10],
    [14,12,5,5,6,12,6,12,6]
  ]),
  boundsX:Object.freeze([75,166,257,348,439,530,621,712,803,894]),
  boundsY:Object.freeze([229,320,411,502,593,684,775,866,957,1048]),
  treats:Object.freeze([
    [7,7],[2,2],[8,4],[3,6],[5,8],[5,1],[0,4],[0,0]
  ])
});

const MAZE_2=Object.freeze({
  size:11,
  start:[10,0], exit:[0,10],
  walls:Object.freeze([
    [9,3,9,5,5,3,13,1,5,5,3],
    [10,10,12,5,3,12,3,12,3,9,6],
    [10,12,5,5,6,11,12,5,6,12,3],
    [8,5,5,3,9,0,5,7,9,5,6],
    [14,9,5,6,10,12,5,3,10,13,3],
    [9,6,13,5,4,1,7,12,4,3,10],
    [12,5,5,3,13,6,9,5,3,10,10],
    [9,5,3,8,3,9,6,9,6,12,2],
    [10,9,6,10,12,4,7,12,3,11,10],
    [10,12,3,12,7,9,3,9,6,10,10],
    [14,13,4,5,5,6,12,6,13,4,6]
  ]),
  boundsX:Object.freeze([82,164,234,311,385,458,533,607,682,757,836,919]),
  boundsY:Object.freeze([212,299,376,452,532,609,686,762,837,916,995,1058]),
  treats:Object.freeze([
    [6,6],[1,1],[10,10],[9,4],[4,3],[3,8],[0,5],[7,9],[6,1],[3,5],[9,8],[4,10]
  ])
});

const LC_CONFIG=Object.freeze({
  DURATION:60,
  MAZES:Object.freeze([MAZE_1,MAZE_2]),
  RESULT:Object.freeze({LEGEND:18,MASTER:15,GOOD:11}),
  TREAT_ASSETS:Object.freeze([
    'treat-fish.png','treat-pink-fish.png',
    'treat-heart.png','treat-ball.png'
  ])
});

function lcClamp(n,min=0,max=LC_CONFIG.DURATION){return Math.max(min,Math.min(max,n));}
function lcCreateState(){
  return {mazeIndex:0,row:MAZE_1.start[0],col:MAZE_1.start[1],collected:[],elapsed:0,running:false,finished:false,failed:false};
}
function lcMaze(state){return LC_CONFIG.MAZES[state.mazeIndex];}
function lcKey(row,col){return `${row}:${col}`;}
function lcCanMove(maze,row,col,direction){
  const vector=DIRECTION_VECTORS[direction];
  if(!vector||row<0||col<0||row>=maze.size||col>=maze.size)return false;
  const [dr,dc]=vector,nr=row+dr,nc=col+dc;
  if(nr<0||nc<0||nr>=maze.size||nc>=maze.size)return false;
  const bit={up:N.N,right:N.E,down:N.S,left:N.W}[direction];
  return (maze.walls[row][col]&bit)===0;
}
function lcMove(state,direction){
  if(!state||state.finished||state.failed)return {state,changed:false,collected:false,exit:false};
  const maze=lcMaze(state);
  if(!lcCanMove(maze,state.row,state.col,direction))return {state,changed:false,collected:false,exit:false};
  const [dr,dc]=DIRECTION_VECTORS[direction];
  const next={...state,row:state.row+dr,col:state.col+dc,collected:[...state.collected]};
  const treat=maze.treats.findIndex(([r,c])=>r===next.row&&c===next.col);
  let collected=false;
  if(treat>=0){const globalKey=`${state.mazeIndex}:${treat}`;if(!next.collected.includes(globalKey)){next.collected.push(globalKey);collected=true;}}
  const exit=next.row===maze.exit[0]&&next.col===maze.exit[1];
  return {state:next,changed:true,collected,exit};
}
function lcReachExit(state){const maze=lcMaze(state);return state.row===maze.exit[0]&&state.col===maze.exit[1];}
function lcAdvanceMaze(state){
  if(state.mazeIndex!==0||!lcReachExit(state))return state;
  const maze=LC_CONFIG.MAZES[1];
  return {...state,mazeIndex:1,row:maze.start[0],col:maze.start[1]};
}
function lcTreatCount(state){return state.collected.length;}
function lcGrade(count){
  if(count>=LC_CONFIG.RESULT.LEGEND)return {tier:'legend',title:'LOKUM LEGEND!',key:true};
  if(count>=LC_CONFIG.RESULT.MASTER)return {tier:'master',title:'TREAT MASTER!',key:true};
  if(count>=LC_CONFIG.RESULT.GOOD)return {tier:'good',title:'GOOD KITTY!',key:true};
  return {tier:'nice',title:'NICE HUNT!',key:true};
}
function lcFinish(state){return {...state,running:false,finished:true,failed:false};}
function lcFail(state){return {...state,running:false,finished:false,failed:true};}
function lcSetElapsed(state,seconds){return {...state,elapsed:lcClamp(Number(seconds)||0)};}
function lcCellPosition(maze,row,col){
  const x=(maze.boundsX[col]+maze.boundsX[col+1])/2;
  const y=(maze.boundsY[row]+maze.boundsY[row+1])/2;
  return {x:x/1254*100,y:y/1254*100};
}

const LokumChallengeLogic={
  VERSION:LC_VERSION,
  CONFIG:LC_CONFIG,
  createState:lcCreateState,
  canMove:lcCanMove,
  move:lcMove,
  reachExit:lcReachExit,
  advanceMaze:lcAdvanceMaze,
  treatCount:lcTreatCount,
  grade:lcGrade,
  finish:lcFinish,
  fail:lcFail,
  setElapsed:lcSetElapsed,
  cellPosition:lcCellPosition
};
if(typeof module!=='undefined'&&module.exports){module.exports=LokumChallengeLogic;}

if(typeof document!=='undefined')(function(){
  const $=id=>document.getElementById(id);
  const QUEST_KEY='duyguBirthdayQuestState_v1',QUEST_NUMBER=4;
  const screenEl=$('lokumChallengeScreen');
  const views={intro:$('lokumChallengeIntro'),game:$('lokumChallengeGame'),result:$('lokumChallengeResult')};
  const mazeEl=$('lcMaze'),mazeImage=$('lcMazeImage'),actorEl=$('lcLokum'),treatsEl=$('lcTreats');
  const hudTime=$('lcTimeCount'),hudTreats=$('lcTreatCount'),mazeLabel=$('lcMazeLabel');
  const readyBtn=$('lcReadyButton'),backBtn=$('lcBackToMapFromIntro'),retryBtn=$('lcRetry'),returnBtn=$('lcReturnToMapFromResult');
  const resultTitle=$('lcResultTitle'),resultTreats=$('lcResultTreats'),keyReward=$('lcKeyReward');
  if(!screenEl||!mazeEl||!mazeImage||!actorEl||!treatsEl)return;

  let view='intro',state=lcCreateState(),raf=0,startAt=0,animIndex=0,animAt=0;

  function setView(next){view=next;screenEl.hidden=false;Object.entries(views).forEach(([k,v])=>{if(v)v.hidden=k!==next;});}
  function loadAsset(url){mazeImage.src=url;}
  function renderTreats(){
    const maze=lcMaze(state);treatsEl.replaceChildren();
    maze.treats.forEach(([r,c],i)=>{
      const key=`${state.mazeIndex}:${i}`;
      if(state.collected.includes(key))return;
      const img=document.createElement('img');
      img.className='lc-treat';img.alt='';img.draggable=false;
      img.src=LC_CONFIG.TREAT_ASSETS[i%LC_CONFIG.TREAT_ASSETS.length];
      const p=lcCellPosition(maze,r,c);img.style.left=p.x+'%';img.style.top=p.y+'%';
      treatsEl.appendChild(img);
    });
  }
  function renderActor(now=performance.now()){
    const maze=lcMaze(state),p=lcCellPosition(maze,state.row,state.col);
    actorEl.style.left=p.x+'%';actorEl.style.top=p.y+'%';
    if(now-animAt>150){animIndex=(animIndex+1)%4;animAt=now;}
    actorEl.src=`lokum-${animIndex===0?'idle':`walk-${animIndex}`}.png`;
  }
  function render(now=performance.now()){
    const maze=lcMaze(state);loadAsset(`maze-0${state.mazeIndex+1}-new.png`);
    mazeLabel.textContent=`MAZE ${state.mazeIndex+1}/2`;
    hudTime.textContent=String(Math.max(0,Math.ceil(LC_CONFIG.DURATION-state.elapsed)));
    hudTreats.textContent=`${lcTreatCount(state)} / 20`;
    renderTreats();renderActor(now);
  }
  function grantKey(){try{const s=JSON.parse(localStorage.getItem(QUEST_KEY)||'{}');const c=Array.isArray(s.completed)?s.completed.filter(Number.isInteger):[];if(!c.includes(QUEST_NUMBER))c.push(QUEST_NUMBER);localStorage.setItem(QUEST_KEY,JSON.stringify({completed:[...new Set(c)].sort((a,b)=>a-b)}));}catch{}}
  function finish(){state=lcFinish(state);const grade=lcGrade(lcTreatCount(state));resultTitle.textContent=grade.title;resultTreats.textContent=String(lcTreatCount(state));keyReward.hidden=false;grantKey();setView('result');}
  function fail(){state=lcFail(state);resultTitle.textContent='TIME UP!';resultTreats.textContent=String(lcTreatCount(state));keyReward.hidden=true;setView('result');}
  function handleExit(){
    if(state.mazeIndex===0){state=lcAdvanceMaze(state);render();return;}
    finish();
  }
  function move(direction){
    if(!state.running)return;
    const result=lcMove(state,direction);state=result.state;
    if(result.changed){render();if(result.exit)handleExit();}
  }
  function tick(now){
    if(!state.running)return;
    state.elapsed=(now-startAt)/1000;
    if(state.elapsed>=LC_CONFIG.DURATION){state.elapsed=LC_CONFIG.DURATION;fail();return;}
    render(now);raf=requestAnimationFrame(tick);
  }
  function reset(){state=lcCreateState();if(raf)cancelAnimationFrame(raf);raf=0;startAt=0;animIndex=0;animAt=performance.now();render();}
  function start(){reset();setView('game');state.running=true;startAt=performance.now();raf=requestAnimationFrame(tick);mazeEl.focus();}
  function back(){reset();setView('intro');window.showQuestMap?.();}
  function keydown(e){
    const map={ArrowUp:'up',w:'up',W:'up',ArrowRight:'right',d:'right',D:'right',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left'};
    const direction=map[e.key];if(!direction)return;e.preventDefault();move(direction);
  }
  let swipeStart=null;
  mazeEl.addEventListener('pointerdown',e=>{if(!state.running)return;swipeStart={id:e.pointerId,x:e.clientX,y:e.clientY};mazeEl.setPointerCapture?.(e.pointerId);});
  mazeEl.addEventListener('pointerup',e=>{if(!swipeStart||swipeStart.id!==e.pointerId)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;const threshold=22;if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
  window.addEventListener('keydown',keydown);
  readyBtn?.addEventListener('click',start);retryBtn?.addEventListener('click',start);backBtn?.addEventListener('click',back);returnBtn?.addEventListener('click',back);

  function showLokumChallengeScreen(){reset();setView('intro');}
  window.showLokumChallengeScreen=showLokumChallengeScreen;
  window.__LOKUMCHALLENGE__={
    getState:()=>({...state,collected:[...state.collected]}),
    start,
    move,
    forceExit:()=>{if(!state.running)return;if(state.mazeIndex===0){state.row=0;state.col=8;handleExit();}else{state.row=0;state.col=10;handleExit();}},
    setElapsed:seconds=>{state=lcSetElapsed(state,seconds);if(state.running)startAt=performance.now()-state.elapsed*1000;render();},
    forceFinish:()=>{if(state.running)finish()},
    grade:lcGrade
  };
  reset();
})();
