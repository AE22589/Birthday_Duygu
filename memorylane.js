/* Quest V — Memory Lane */
'use strict';
const MEMORY_ASSETS=Object.freeze(Array.from({length:8},(_,i)=>`assets/quest-v/memory-${String(i+1).padStart(2,'0')}.png`));
const MEMORY_BACK='assets/quest-v/neon_memory_lane_arcade_card.png';
const MEMORY_KEY='duyguBirthdayQuestState_v1';
if(typeof document!=='undefined')(function(){
  const $=id=>document.getElementById(id),screen=$('memoryLaneScreen'),views={intro:$('memoryLaneIntro'),game:$('memoryLaneGame'),result:$('memoryLaneResult')},board=$('mlBoard'),pairsEl=$('mlPairs'),movesEl=$('mlMoves');
  if(!screen||!board)return;
  let cards=[],open=[],matched=0,moves=0,locked=false,hideTimer=0;
  function setView(view){screen.hidden=false;Object.entries(views).forEach(([k,v])=>{if(v)v.hidden=k!==view;});}
  function saveCompletion(){try{const state=JSON.parse(localStorage.getItem(MEMORY_KEY)||'{}'),completed=Array.isArray(state.completed)?state.completed.filter(Number.isInteger):[];if(!completed.includes(5))completed.push(5);localStorage.setItem(MEMORY_KEY,JSON.stringify({completed:[...new Set(completed)].sort((a,b)=>a-b)}));}catch{}}
  function shuffled(){const source=[];MEMORY_ASSETS.forEach((src,id)=>{source.push({src,id},{src,id});});for(let i=source.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[source[i],source[j]]=[source[j],source[i]];}return source;}
  function updateHud(){pairsEl.textContent=`${matched} / 8`;movesEl.textContent=String(moves);}
  function renderCard(card,index){const button=document.createElement('button');button.type='button';button.className='ml-card';button.dataset.index=String(index);button.setAttribute('role','gridcell');button.setAttribute('aria-label',`Memory card ${index+1}, face down`);const back=document.createElement('img');back.className='ml-card-back';back.src=MEMORY_BACK;back.alt='';const front=document.createElement('img');front.className='ml-card-front';front.src=card.src;front.alt='';button.append(back,front);button.addEventListener('click',()=>flip(index));return button;}
  function refreshCard(index){const el=board.querySelector(`[data-index="${index}"]`);if(!el)return;const card=cards[index];el.classList.toggle('is-open',card.open||card.matched);el.classList.toggle('is-matched',card.matched);el.setAttribute('aria-label',`Memory card ${index+1}, ${card.open||card.matched?'face up':'face down'}`);}
  function flip(index){if(locked||open.length>=2)return;const card=cards[index];if(!card||card.open||card.matched)return;card.open=true;open.push(index);refreshCard(index);if(open.length<2)return;moves++;updateHud();const [a,b]=open;if(cards[a].id===cards[b].id){cards[a].matched=cards[b].matched=true;matched++;open=[];refreshCard(a);refreshCard(b);updateHud();if(matched===8){saveCompletion();setView('result');}return;}locked=true;hideTimer=setTimeout(()=>{cards[a].open=cards[b].open=false;open=[];locked=false;refreshCard(a);refreshCard(b);},650);}
  function reset(){clearTimeout(hideTimer);cards=shuffled().map(c=>({...c,open:false,matched:false}));open=[];matched=0;moves=0;locked=false;board.replaceChildren(...cards.map(renderCard));updateHud();}
  function start(){reset();setView('game');} function back(){setView('intro');window.showQuestMap?.();}
  $('mlReadyButton')?.addEventListener('click',start);$('mlRetryButton')?.addEventListener('click',start);$('mlBackButton')?.addEventListener('click',back);$('mlGameBackButton')?.addEventListener('click',back);$('mlReturnButton')?.addEventListener('click',back);
  window.showMemoryLaneScreen=()=>{reset();setView('intro');};window.__MEMORYLANE__={start,flip,getState:()=>({matched,moves,open:[...open]})};
})();
