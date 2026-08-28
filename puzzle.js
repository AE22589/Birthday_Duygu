/* Quest VI — Our Little Puzzle */
'use strict';
const PUZZLE_VERSION='1.0.0';
const PUZZLE_COLS=2,PUZZLE_ROWS=3,PUZZLE_COUNT=PUZZLE_COLS*PUZZLE_ROWS,PUZZLE_EMPTY=PUZZLE_COUNT-1;
const PUZZLE_IMAGE='assets/quest-vi/puzzle-source.jpeg';
const PUZZLE_KEY='duyguBirthdayQuestState_v1';
function puzzleSolvedBoard(){return Array.from({length:PUZZLE_COUNT},(_,index)=>index)}
function puzzleEmptyIndex(board){return board.indexOf(PUZZLE_EMPTY)}
function puzzleAdjacent(a,b){return Math.abs(Math.floor(a/PUZZLE_COLS)-Math.floor(b/PUZZLE_COLS))+Math.abs(a%PUZZLE_COLS-b%PUZZLE_COLS)===1}
function puzzleCanMove(board,index){return Array.isArray(board)&&index>=0&&index<PUZZLE_COUNT&&board[index]!==PUZZLE_EMPTY&&puzzleAdjacent(index,puzzleEmptyIndex(board))}
function puzzleMove(board,index){if(!puzzleCanMove(board,index))return board;const next=[...board],empty=puzzleEmptyIndex(next);[next[index],next[empty]]=[next[empty],next[index]];return next}
function puzzleIsSolved(board){return Array.isArray(board)&&board.length===PUZZLE_COUNT&&board.every((tile,index)=>tile===index)}
function puzzleIsSolvable(board){const tiles=board.filter(tile=>tile!==PUZZLE_EMPTY);let inversions=0;for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(tiles[i]>tiles[j])inversions++;const blankRowFromBottom=PUZZLE_ROWS-Math.floor(puzzleEmptyIndex(board)/PUZZLE_COLS);return (inversions+blankRowFromBottom)%2===1}
function puzzleShuffle(random=Math.random,steps=30){let board=puzzleSolvedBoard(),previous=-1;for(let i=0;i<steps;i++){const empty=puzzleEmptyIndex(board),choices=[];for(let index=0;index<PUZZLE_COUNT;index++)if(index!==previous&&puzzleAdjacent(index,empty))choices.push(index);const move=choices[Math.floor(random()*choices.length)];previous=empty;board=puzzleMove(board,move)}if(puzzleIsSolved(board))board=puzzleMove(board,PUZZLE_EMPTY-1);return board}
const PuzzleLogic={VERSION:PUZZLE_VERSION,COLS:PUZZLE_COLS,ROWS:PUZZLE_ROWS,COUNT:PUZZLE_COUNT,EMPTY:PUZZLE_EMPTY,solvedBoard:puzzleSolvedBoard,adjacent:puzzleAdjacent,canMove:puzzleCanMove,move:puzzleMove,isSolved:puzzleIsSolved,isSolvable:puzzleIsSolvable,shuffle:puzzleShuffle};
if(typeof module!=='undefined'&&module.exports)module.exports=PuzzleLogic;
if(typeof document!=='undefined')(function(){
  const $=id=>document.getElementById(id),screen=$('puzzleScreen'),boardEl=$('pzBoard'),views={intro:$('puzzleIntro'),game:$('puzzleGame'),result:$('puzzleResult')};
  if(!screen||!boardEl)return;
  let board=puzzleSolvedBoard(),hintTimer=0;
  function setView(view){screen.hidden=false;Object.entries(views).forEach(([name,element])=>{if(element)element.hidden=name!==view})}
  function saveCompletion(){try{const state=JSON.parse(localStorage.getItem(PUZZLE_KEY)||'{}'),completed=Array.isArray(state.completed)?state.completed.filter(Number.isInteger):[];if(!completed.includes(6))completed.push(6);localStorage.setItem(PUZZLE_KEY,JSON.stringify({completed:[...new Set(completed)].sort((a,b)=>a-b)}))}catch{}}
  function backgroundPosition(tile){const row=Math.floor(tile/PUZZLE_COLS),col=tile%PUZZLE_COLS;return `${col/(PUZZLE_COLS-1)*100}% ${row/(PUZZLE_ROWS-1)*100}%`}
  function render(){boardEl.replaceChildren(...board.map((tile,index)=>{const button=document.createElement('button');button.type='button';button.className='pz-tile';button.dataset.index=String(index);button.setAttribute('role','gridcell');button.dataset.goal=tile===PUZZLE_EMPTY?'EMPTY':String(tile+1);if(tile===PUZZLE_EMPTY){button.classList.add('is-empty');button.setAttribute('aria-label','Empty puzzle field');button.disabled=true}else{button.style.backgroundImage=`url("${PUZZLE_IMAGE}")`;button.style.backgroundPosition=backgroundPosition(tile);button.setAttribute('aria-label','Move puzzle tile');button.addEventListener('click',()=>move(index))}return button}))}
  function move(index){const next=puzzleMove(board,index);if(next===board)return;board=next;render();if(puzzleIsSolved(board)){saveCompletion();setView('result')}}
  function start(){clearTimeout(hintTimer);boardEl.classList.remove('pz-show-hint');board=puzzleShuffle();render();setView('game')}
  function showHint(){if(document.getElementById('puzzleGame')?.hidden)return;clearTimeout(hintTimer);boardEl.classList.add('pz-show-hint');hintTimer=setTimeout(()=>boardEl.classList.remove('pz-show-hint'),2500)}
  function back(){setView('intro');window.showQuestMap?.()}
  $('pzReadyButton')?.addEventListener('click',start);$('pzRetryButton')?.addEventListener('click',start);$('pzBackButton')?.addEventListener('click',back);$('pzGameBackButton')?.addEventListener('click',back);$('pzReturnButton')?.addEventListener('click',back);$('pzHintButton')?.addEventListener('click',showHint);
  window.showPuzzleScreen=()=>{board=puzzleSolvedBoard();setView('intro')};window.__PUZZLE__={start,move,getBoard:()=>[...board]};
})();
