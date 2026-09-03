/* Quest I — The Road Trip — v1.9.0 (kompletter Neubau)
   Ersetzt die frühere, foto-realistische Umsetzung durch eine bewusst
   einfache, robuste Architektur:
   - Nur Prozentwerte für top/left. Keine gecachte Board-Breite/-Höhe, keine
     Stale-Value-Möglichkeit (das war die Ursache fast aller Bugs der
     vorherigen Version: TDZ-Absturz, Auto-Rutscher, verwaister Zwischenspeicher).
   - Reine Logik (Teil 1) ist von der Darstellung (Teil 2) getrennt und ganz
     ohne Browser mit node --check/require testbar.
   - Keine Bild-Assets — reine CSS-Formen. Kein Asset kann fehlschlagen,
     falsch cachen oder die Ladereihenfolge stören.
   - Ein Bildschirm-Zustand, eine Funktion zum Wechseln.
*/
'use strict';
const VERSION='1.11.1';

/* =========================================================================
   TEIL 1 — REINE SPIELLOGIK (kein DOM, kein Browser nötig, pur testbar)
   ========================================================================= */
const RT_CONFIG = Object.freeze({
  DURATION: 60,
  LIVES: 3,
  TARGET_STARS: 15,
  LANES: [22, 50, 78],
  HORIZON_Y: 8,
  CAR_Y: 84,
  MIN_SCALE: 0.18,
  MAX_SCALE: 1.0,
  LANE_SPREAD_TOP: 6,
  LANE_SPREAD_BOTTOM: 30,
  EASE: 1.6,
  COLLISION_MIN_Y: 70,
  COLLISION_MAX_Y: 92,
  INVULN_MS: 1100
});

function rtClampLane(lane){ return Math.max(0, Math.min(2, lane)); }
function rtMoveLane(lane, dir){ return rtClampLane(lane + (dir === -1 || dir === 1 ? dir : 0)); }
function rtSwipeDirection(dx, threshold = 24){ return Math.abs(dx) <= threshold ? 0 : (dx < 0 ? -1 : 1); }
function rtAdvanceProgress(progress, dt, travelMs){ return Math.min(1, progress + dt / travelMs); }

function rtComputeVisual(progress, lane){
  const t = Math.max(0, Math.min(1, progress));
  const p = Math.pow(t, RT_CONFIG.EASE);
  const y = RT_CONFIG.HORIZON_Y + (RT_CONFIG.CAR_Y - RT_CONFIG.HORIZON_Y) * p;
  const scale = RT_CONFIG.MIN_SCALE + (RT_CONFIG.MAX_SCALE - RT_CONFIG.MIN_SCALE) * p;
  const laneWidth = RT_CONFIG.LANE_SPREAD_TOP + (RT_CONFIG.LANE_SPREAD_BOTTOM - RT_CONFIG.LANE_SPREAD_TOP) * p;
  const x = 50 + (lane - 1) * laneWidth;
  return { x, y, scale };
}
function rtIsInCollisionZone(y){ return y > RT_CONFIG.COLLISION_MIN_Y && y < RT_CONFIG.COLLISION_MAX_Y; }

const RT_SPRITES = Object.freeze({
  star: Object.freeze({ size:44, travelMs:2500 }),
  barrel: Object.freeze({ size:34, travelMs:2850 }),
  cat: Object.freeze({ size:34, travelMs:2850 })
});
const RT_SPAWN = Object.freeze({
  // Conservative envelope also covers smaller mobile boards and rotation.
  BOARD_WIDTH:240, BOARD_HEIGHT:180, STEP_MS:20, REACTION_MS:350
});
function rtSpriteBounds(o, progress=o.progress, boardWidth=RT_SPAWN.BOARD_WIDTH, boardHeight=RT_SPAWN.BOARD_HEIGHT){
  const v=rtComputeVisual(progress,o.lane),size=RT_SPRITES[o.type].size;
  const x=v.x*boardWidth/100,y=v.y*boardHeight/100;
  // Matches transform-origin:center bottom, including a halo around the glyph.
  return {left:x-size*v.scale/2-4,right:x+size*v.scale/2+4,
    top:y+size*(1-v.scale)-4,bottom:y+size+4};
}
function rtCollisionWindow(o){
  const entry=Math.pow((RT_CONFIG.COLLISION_MIN_Y-RT_CONFIG.HORIZON_Y)/(RT_CONFIG.CAR_Y-RT_CONFIG.HORIZON_Y),1/RT_CONFIG.EASE);
  return {start:Math.max(0,(entry-o.progress)*o.travelMs),end:(1-o.progress)*o.travelMs};
}
function rtCanSpawn(candidate, active, boardWidth=RT_SPAWN.BOARD_WIDTH, boardHeight=RT_SPAWN.BOARD_HEIGHT){
  if(!RT_SPRITES[candidate.type]||![0,1,2].includes(candidate.lane)||candidate.progress!==0)return false;
  // Never weaken mobile spacing on a large screen. Read dimensions only at spawn.
  const width=Math.min(boardWidth,RT_SPAWN.BOARD_WIDTH),height=Math.min(boardHeight,RT_SPAWN.BOARD_HEIGHT);
  if(!(width>0&&height>0))return false;
  return active.filter(o=>!o.hit&&o.progress<1).every(other=>{
    const a=rtCollisionWindow(candidate),b=rtCollisionWindow(other);
    const starHazard=(candidate.type==='star')!==(other.type==='star');
    // A collectable never lures the player into a simultaneous hazard, in any lane.
    if((candidate.lane===other.lane||starHazard)&&
      a.start<b.end+RT_SPAWN.REACTION_MS&&b.start<a.end+RT_SPAWN.REACTION_MS)return false;
    const until=Math.min(a.end,b.end);
    for(let ms=0;ms<until;ms+=RT_SPAWN.STEP_MS){
      const end=Math.min(until,ms+RT_SPAWN.STEP_MS);
      const swept=o=>{
        const first=rtSpriteBounds(o,o.progress+ms/o.travelMs,width,height);
        const last=rtSpriteBounds(o,o.progress+end/o.travelMs,width,height);
        return {left:Math.min(first.left,last.left),right:Math.max(first.right,last.right),
          top:Math.min(first.top,last.top),bottom:Math.max(first.bottom,last.bottom)};
      };
      const x=swept(candidate),y=swept(other);
      // Increasing safety margin towards the car. Swept bounds cover BETWEEN samples.
      const depth=Math.max(candidate.progress+end/candidate.travelMs,other.progress+end/other.travelMs);
      const gap=3+9*depth*depth;
      if(x.left<y.right+gap&&x.right+gap>y.left&&x.top<y.bottom+gap&&x.bottom+gap>y.top)return false;
    }
    return true;
  });
}

const RoadTripLogic = {
  CONFIG: RT_CONFIG, clampLane: rtClampLane, moveLane: rtMoveLane, swipeDirection: rtSwipeDirection,
  advanceProgress: rtAdvanceProgress, computeVisual: rtComputeVisual, isInCollisionZone: rtIsInCollisionZone,
  SPRITES:RT_SPRITES, SPAWN:RT_SPAWN, spriteBounds:rtSpriteBounds, collisionWindow:rtCollisionWindow, canSpawn:rtCanSpawn
};
if (typeof module !== 'undefined' && module.exports) module.exports = RoadTripLogic;

/* =========================================================================
   TEIL 2 — SPIELZUSTAND + DOM-ANBINDUNG AN DIE GESAMTSEITE
   Läuft nur im Browser, damit Teil 1 in Node.js isoliert testbar bleibt.
   ========================================================================= */
if (typeof document !== 'undefined') (function(){
  const $ = id => document.getElementById(id);
  const QUEST_KEY = 'duyguBirthdayQuestState_v1';
  const QUEST_NUMBER = 1;

  const screenEl = $('roadTripScreen');
  const views = { intro: $('roadTripIntro'), game: $('roadTripGame'), result: $('roadTripResult') };
  const board = $('roadBoard'), spritesLayer = $('dynamicLayer'), car = $('playerCar'), flashEl = $('rtFlash');
  const hudLives = $('lifeCount'), hudTime = $('timeCount'), hudScore = $('starCount');
  const readyBtn = $('readyButton'), backFromIntro = $('backToMapFromIntro');
  const retryBtn = $('retryRoadTrip'), returnBtn = $('returnToMapFromResult');
  const resultTitle = $('resultTitle'), resultStars = $('resultStars'), resultTime = $('resultTime'), keyReward = $('keyReward');

  if (!screenEl || !board || !car) return; // defensiv: Seite unvollständig geladen

  let view = 'intro';
  let running = false, raf = 0, startAt = 0, lastFrame = 0;
  let lane = 1, lives = RT_CONFIG.LIVES, score = 0, elapsed = 0;
  let invulnerableUntil = 0, lastMoveAt = 0;
  let sprites = [];
  let spawnStarAt = 0, spawnObstacleAt = 0;
  let lastStarLane = null, consecutiveStarLanes = 0;
  let touchStartX = null;

  function setView(next){
    view = next;
    screenEl.hidden = false;
    Object.entries(views).forEach(([name, el]) => { if (el) el.hidden = name !== next; });
    if (next === 'game') requestAnimationFrame(() => board.focus({ preventScroll: true }));
  }

  function updateHud(){
    hudLives.textContent = '♥ '.repeat(lives) + '♡ '.repeat(RT_CONFIG.LIVES - lives);
    hudTime.textContent = String(Math.max(0, Math.ceil(RT_CONFIG.DURATION - elapsed)));
    hudScore.textContent = `${score} / ${RT_CONFIG.TARGET_STARS}`;
  }

  function paintCar(){ car.style.left = RT_CONFIG.LANES[lane] + '%'; car.dataset.lane = String(lane); }

  function glyphFor(type){ return type === 'star' ? '★' : type === 'barrel' ? '⛔' : '🐈'; }
  function classFor(type){ return type === 'star' ? 'star' : type === 'barrel' ? 'barrel' : 'critter'; }

  function paintSprite(o){
    const { x, y, scale } = rtComputeVisual(o.progress, o.lane);
    o.el.style.top = y + '%';
    o.el.style.left = x + '%';
    o.el.style.transform = `translate(-50%, 0) scale(${scale})`;
    o.el.style.opacity = o.hit ? '0' : String(0.35 + 0.65 * Math.pow(o.progress, 0.5));
    o.el.style.zIndex = String(10 + Math.round(o.progress * 30));
  }

  function spawn(type, ln){
    const config=RT_SPRITES[type];
    if(!config)return null;
    const o={type,lane:ln,progress:0,travelMs:config.travelMs,hit:false};
    if(!rtCanSpawn(o,sprites,board.clientWidth,board.clientHeight))return null;
    const el = document.createElement('div');
    el.className = `sprite ${classFor(type)}`;
    el.style.setProperty('--rt-sprite-size',config.size+'px');
    el.innerHTML = `<span class="sprite-glyph">${glyphFor(type)}</span>`;
    spritesLayer.appendChild(el);
    o.el=el;
    sprites.push(o);
    paintSprite(o);
    return o;
  }

  function flash(text){
    flashEl.textContent = text;
    flashEl.classList.remove('show');
    void flashEl.offsetWidth;
    flashEl.classList.add('show');
  }

  function collect(o){
    if (o.hit) return;
    o.hit = true;
    score++;
    o.el.classList.add('collected');
    if (score === RT_CONFIG.TARGET_STARS) flash('KEY WITHIN REACH!');
  }

  function collide(o, now){
    if (o.hit || now < invulnerableUntil) return;
    o.hit = true;
    o.el.classList.add('hitfx');
    lives = Math.max(0, lives - 1);
    invulnerableUntil = now + RT_CONFIG.INVULN_MS;
    car.classList.remove('hit'); void car.offsetWidth; car.classList.add('hit');
    flash(lives <= 0 ? 'GAME OVER' : lives === 1 ? 'WATCH OUT!' : 'OUCH!');
  }

  function maybeSpawn(){
    const nowMs = elapsed * 1000;
    if (score < RT_CONFIG.TARGET_STARS + 8 && nowMs >= spawnStarAt) {
      let starLane = Math.random() < 0.65 ? lane : Math.floor(Math.random() * 3);
      if (consecutiveStarLanes >= 3 && starLane === lastStarLane) starLane = [0,1,2].filter(candidate => candidate !== lastStarLane)[Math.floor(Math.random() * 2)];
      if (spawn('star', starLane)) {
        consecutiveStarLanes = starLane === lastStarLane ? consecutiveStarLanes + 1 : 1;
        lastStarLane = starLane;
      }
      spawnStarAt = nowMs + 700 + Math.random() * 600;
    }
    if (nowMs >= spawnObstacleAt) {
      const target = Math.random() < 0.6
        ? (lane + (Math.random() < 0.5 ? -1 : 1) + 3) % 3
        : Math.floor(Math.random() * 3);
      spawn(Math.random() < 0.7 ? 'barrel' : 'cat', target);
      spawnObstacleAt = nowMs + 1500 + Math.random() * 1300;
    }
  }

  function update(dt, now){
    elapsed = Math.min(RT_CONFIG.DURATION, (now - startAt) / 1000);
    maybeSpawn();
    for (const o of sprites) {
      if (o.hit) continue;
      o.progress = rtAdvanceProgress(o.progress, dt, o.travelMs);
      paintSprite(o);
      const { y } = rtComputeVisual(o.progress, o.lane);
      if (rtIsInCollisionZone(y) && o.lane === lane) {
        if (o.type === 'star') collect(o); else if (now >= invulnerableUntil) collide(o, now);
      }
      if (o.progress >= 1) { o.hit = true; o.el.remove(); }
    }
    sprites = sprites.filter(o => !o.hit || o.el.isConnected);
    updateHud();
    if (elapsed >= RT_CONFIG.DURATION) return finish(false);
    if (lives <= 0) return finish(true);
    raf = requestAnimationFrame(tick);
  }

  function tick(now){
    if (!running) return;
    const dt = Math.min(50, now - lastFrame || 16);
    lastFrame = now;
    update(dt, now);
  }

  function move(dir){
    if (!running) return;
    const now = performance.now();
    if (now - lastMoveAt < 120) return;
    const next = rtMoveLane(lane, dir);
    if (next === lane) return;
    lane = next; lastMoveAt = now;
    paintCar();
  }

  function resetState(){
    running = false;
    if (raf) cancelAnimationFrame(raf);
    sprites.forEach(o => o.el.remove());
    sprites = [];
    lane = 1; lives = RT_CONFIG.LIVES; score = 0; elapsed = 0;
    spawnStarAt = 0; spawnObstacleAt = 0; invulnerableUntil = 0; lastStarLane = null; consecutiveStarLanes = 0;
    car.classList.remove('hit');
    paintCar();
    updateHud();
  }

  function startGame(){
    resetState();
    setView('game');
    running = true;
    startAt = performance.now();
    lastFrame = startAt;
    raf = requestAnimationFrame(tick);
  }

  // Persistenz im selben Format wie der Rest der Seite (script.js liest
  // denselben Schlüssel/dasselbe Format für den Quest-Map-Fortschritt).
  function grantKey(){
    try {
      const s = JSON.parse(localStorage.getItem(QUEST_KEY) || '{}');
      const c = Array.isArray(s.completed) ? s.completed.filter(Number.isInteger) : [];
      if (!c.includes(QUEST_NUMBER)) c.push(QUEST_NUMBER);
      localStorage.setItem(QUEST_KEY, JSON.stringify({ completed: [...new Set(c)].sort((a, b) => a - b) }));
    } catch {}
  }

  function finish(gameOver){
    running = false;
    if (raf) cancelAnimationFrame(raf);
    const won = score >= RT_CONFIG.TARGET_STARS && !gameOver;
    resultTitle.textContent = gameOver ? 'JOURNEY ENDED' : 'JOURNEY COMPLETE';
    resultStars.textContent = String(score);
    resultTime.textContent = Math.round(Math.min(RT_CONFIG.DURATION, elapsed)) + 's';
    keyReward.hidden = !won;
    if (won) grantKey();
    setView('result');
  }

  function backToMap(){
    resetState();
    setView('intro');
    window.showQuestMap?.();
  }

  // ---- Eingaben ----
  function onKey(e){
    if (view !== 'game') return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); move(-1); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); move(1); }
  }
  document.addEventListener('keydown', onKey);
  document.querySelectorAll('.rt-touch-controls button').forEach(btn => {
    btn.addEventListener('pointerdown', e => { e.preventDefault(); move(Number(btn.dataset.move)); }, { passive:false });
    btn.addEventListener('click', e => { if (e.detail === 0) move(Number(btn.dataset.move)); });
  });
  board.addEventListener('pointerdown', e => { touchStartX = e.clientX; });
  board.addEventListener('pointerup', e => {
    if (touchStartX === null) return;
    const dir = rtSwipeDirection(e.clientX - touchStartX);
    touchStartX = null;
    if (dir) move(dir);
  });

  readyBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  backFromIntro.addEventListener('click', backToMap);
  returnBtn.addEventListener('click', backToMap);

  // ---- Statische, einmalige Deko-Aufbauten (keine Auswirkung auf die
  //      Update-Schleife / Stabilität — reine Optik, läuft nur einmal) ----
  function buildRoadMarkers(){
    const layer = $('roadMarkers');
    if (!layer) return;
    const steps = [0.06, 0.18, 0.32, 0.48, 0.66, 0.85, 1.0];
    steps.forEach(t => {
      const p = Math.pow(t, RT_CONFIG.EASE);
      const y = RT_CONFIG.HORIZON_Y + (RT_CONFIG.CAR_Y - RT_CONFIG.HORIZON_Y) * p;
      const laneWidth = RT_CONFIG.LANE_SPREAD_TOP + (RT_CONFIG.LANE_SPREAD_BOTTOM - RT_CONFIG.LANE_SPREAD_TOP) * p;
      [-laneWidth / 2, laneWidth / 2].forEach(offset => {
        const dash = document.createElement('div');
        dash.className = 'road-dash';
        dash.style.left = (50 + offset) + '%';
        dash.style.top = y + '%';
        dash.style.width = (2 + 3 * p) + 'px';
        dash.style.height = (4 + 13 * p) + 'px';
        dash.style.opacity = String(0.35 + 0.55 * p);
        layer.appendChild(dash);
      });
    });
  }

  function buildSkyline(){
    [['skylineLeft', false], ['skylineRight', true]].forEach(([id, mirrored]) => {
      const layer = $(id);
      if (!layer) return;
      const count = 18;
      for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        const depth = i % 3;
        b.className = 'rt-building ' + (depth===0 ? 'rt-building-far' : depth===1 ? 'rt-building-mid' : 'rt-building-near');
        const w = 10 + (i % 3) * 6;
        const h = 30 + ((i * 37) % 60);
        const leftPct = (i / count) * 100;
        b.style.width = w + '%';
        b.style.height = h + '%';
        b.style.left = (mirrored ? (100 - leftPct - w) : leftPct) + '%';
        const windowCount = 5 + (i % 4);
        for (let w2 = 0; w2 < windowCount; w2++) {
          const win = document.createElement('i');
          if ((i + w2) % 2 === 0) win.classList.add('pink');
          win.style.left = (20 + (w2 * 25) % 60) + '%';
          win.style.top = (15 + (w2 * 23) % 65) + '%';
          win.style.animationDelay = ((i * 0.4 + w2 * 0.3) % 2.6) + 's';
          b.appendChild(win);
        }
        layer.appendChild(b);
      }
    });
  }

  // ---- Einstiegspunkt, den script.js aufruft ----
  function showRoadTripScreen(){
    resetState();
    setView('intro');
  }
  window.showRoadTripScreen = showRoadTripScreen;

  // ---- Debug-Overlay: ?debug=1 zeigt Live-Werte direkt im Bild ----
  if (new URLSearchParams(location.search).has('debug')) {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:4px;left:4px;z-index:9999;background:rgba(0,0,0,.8);color:#4f4;font:11px monospace;padding:6px 8px;white-space:pre;pointer-events:none;';
    document.body.appendChild(panel);
    setInterval(() => {
      const lines = [`view:${view} running:${running} raf:${!!raf} sprites:${sprites.length} elapsed:${elapsed.toFixed(1)}`];
      sprites.slice(0, 6).forEach((o, i) => lines.push(`#${i} ${o.type} lane:${o.lane} progress:${o.progress.toFixed(2)}`));
      panel.textContent = lines.join('\n');
    }, 200);
  }

  // Für Browser-/E2E-Tests erreichbar machen — bewusst ohne ?qa=1-Gate,
  // da dieses Spiel keine echten Nutzerdaten verarbeitet.
  window.__ROADTRIP__ = {
    getState: () => ({ view, running, lane, lives, score, elapsed, spriteCount: sprites.length }),
    start: startGame,
    move,
    spawn: (type, ln) => spawn(type, ln ?? lane),
    forceFinish: (gameOver = false) => finish(gameOver),
    setElapsed: (seconds) => {
      elapsed = Math.max(0, Math.min(RT_CONFIG.DURATION, Number(seconds)));
      if (running) startAt = performance.now() - elapsed * 1000;
      updateHud();
    },
  };

  buildRoadMarkers();
  buildSkyline();
  paintCar();
  updateHud();
})();
