/* Quest II — Paint It! — v1.10.0
   Baut auf denselben Architekturprinzipien wie Quest I (roadtrip.js):
   - Reine Logik (Teil 1) ist von der DOM-Darstellung (Teil 2) getrennt und
     ganz ohne Browser mit node --check/require testbar.
   - Kein gecachtes, potenziell veraltetes Spielfeld-Maß über die Zeit.
     Die Wand-Geometrie wird bei jeder Zeigerinteraktion frisch gemessen
     (getBoundingClientRect() im Moment der Nutzung) statt einmalig
     gespeichert und später wiederverwendet — das ist der Unterschied, der
     bei Quest I mehrere Bugs verursacht hat (Wert wird gelesen, wenn er
     gebraucht wird, nicht vorab zwischengespeichert).
   - Positionierung von Duygu/Lokum ausschließlich über Prozentwerte
     (top/left), wie im Fachkonzept für alle künftigen Quests festgelegt.
   - Ein Bildschirm-Zustand, eine Funktion zum Wechseln.
   - Lazy geladen über ensurePaintItLoaded() in script.js — kein statischer
     <script>-Tag in index.html.
*/
'use strict';
const PI_VERSION='1.11.1';

/* =========================================================================
   TEIL 1 — REINE SPIELLOGIK (kein DOM, kein Browser nötig, pur testbar)
   ========================================================================= */
const PI_CONFIG = Object.freeze({
  DURATION: 60,
  GRID_COLS: 6,
  GRID_ROWS: 6,
  PASSES_NEEDED: 4,
  COMPLETE_THRESHOLD: 0.9,
  PAW_MIN_INTERVAL_MS: 5000,
  PAW_MAX_INTERVAL_MS: 8000
});

function piCreateGrid(cols, rows){ return new Array(cols * rows).fill(0); }
function piCellIndex(cols, row, col){ return row * cols + col; }
function piRowColFromIndex(cols, index){ return { row: Math.floor(index / cols), col: index % cols }; }
function piPaintCell(grid, index, passesNeeded){
  const next = grid.slice();
  next[index] = Math.min(passesNeeded, next[index] + 1);
  return next;
}
function piApplyPawPrint(grid, index, passesNeeded){
  // Nur vollständig fertige Felder können getroffen werden — Lokum
  // sabotiert gezielt Erfolge, nicht laufende Arbeit.
  if (grid[index] !== passesNeeded) return grid;
  const next = grid.slice();
  next[index] = 0;
  return next;
}
function piCoverage(grid, passesNeeded){
  return grid.reduce((sum, p) => sum + p, 0) / (grid.length * passesNeeded);
}
function piCellFromPoint(nx, ny, cols, rows){
  // nx/ny: normalisierte Zeigerposition (0..1) relativ zur Wand.
  const col = Math.max(0, Math.min(cols - 1, Math.floor(nx * cols)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(ny * rows)));
  return piCellIndex(cols, row, col);
}
function piGrade(coverage){
  if (coverage >= 1) {
    return { tier: 'perfect', title: 'SPOTLESS!', message: "Lokum has officially retired from wall inspection duty." };
  }
  if (coverage >= PI_CONFIG.COMPLETE_THRESHOLD) {
    return { tier: 'success', title: 'WALL COMPLETE', message: "You're a professional painter now \u2014 paw prints and all." };
  }
  return { tier: 'incomplete', title: 'NOT QUITE THERE', message: "So close! Lokum left a few surprises. The wall (and the roller) will still be here." };
}

const PaintItLogic = {
  CONFIG: PI_CONFIG, createGrid: piCreateGrid, cellIndex: piCellIndex, rowColFromIndex: piRowColFromIndex,
  paintCell: piPaintCell, applyPawPrint: piApplyPawPrint, coverage: piCoverage,
  cellFromPoint: piCellFromPoint, grade: piGrade
};
if (typeof module !== 'undefined' && module.exports) module.exports = PaintItLogic;

/* =========================================================================
   TEIL 2 — SPIELZUSTAND + DOM-ANBINDUNG AN DIE GESAMTSEITE
   Läuft nur im Browser, damit Teil 1 in Node.js isoliert testbar bleibt.
   ========================================================================= */
if (typeof document !== 'undefined') (function(){
  const $ = id => document.getElementById(id);
  const QUEST_KEY = 'duyguBirthdayQuestState_v1';
  const QUEST_NUMBER = 2;
  const COLS = PI_CONFIG.GRID_COLS, ROWS = PI_CONFIG.GRID_ROWS, PASSES = PI_CONFIG.PASSES_NEEDED;

  const screenEl = $('paintItScreen');
  const views = { intro: $('paintItIntro'), game: $('paintItGame'), result: $('paintItResult') };
  const wall = $('piWall'), cellsLayer = $('piCells'), rollerCursor = $('piRoller');
  const duygu = $('piDuygu'), lokum = $('piLokum');
  const hudTime = $('piTimeCount'), hudCoverage = $('piCoverageCount');
  const readyBtn = $('piReadyButton'), backFromIntro = $('piBackToMapFromIntro');
  const retryBtn = $('piRetry'), returnBtn = $('piReturnToMapFromResult');
  const resultTitle = $('piResultTitle'), resultMessage = $('piResultMessage'), resultCoverage = $('piResultCoverage'), keyReward = $('piKeyReward');
  const pawHint = $('piPawHint'), paintLegend = $('piPaintLegend');

  if (!screenEl || !wall || !cellsLayer) return; // defensiv: Seite unvollständig geladen
  if (paintLegend) paintLegend.textContent = `Paint each tile ${PASSES} times to fully cover it.`;

  let view = 'intro';
  let running = false, timerHandle = null, pawHandle = null, pawHintHandle = null, startAt = 0, elapsed = 0;
  let grid = piCreateGrid(COLS, ROWS);
  let pawFlags = piCreateGrid(COLS, ROWS).map(() => false);
  let cellEls = [];
  let lastPaintedIndex = null;
  let pointerActive = false;
  let facingRight = true;

  function setView(next){
    view = next;
    screenEl.hidden = false;
    Object.entries(views).forEach(([name, el]) => { if (el) el.hidden = name !== next; });
    if (next === 'game') requestAnimationFrame(() => wall.focus({ preventScroll: true }));
  }

  function updateHud(){
    hudTime.textContent = String(Math.max(0, Math.ceil(PI_CONFIG.DURATION - elapsed)));
    hudCoverage.textContent = Math.round(piCoverage(grid, PASSES) * 100) + '%';
  }

  function buildGrid(){
    cellsLayer.innerHTML = '';
    cellEls = [];
    cellsLayer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    cellsLayer.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
    for (let i = 0; i < COLS * ROWS; i++) {
      const cell = document.createElement('div');
      cell.className = 'pi-cell';
      const paint = document.createElement('div');
      paint.className = 'pi-cell-paint';
      const paw = document.createElement('div');
      paw.className = 'pi-cell-paw';
      paw.textContent = '\uD83D\uDC3E'; // 🐾
      paw.hidden = true;
      cell.appendChild(paint);
      cell.appendChild(paw);
      cellsLayer.appendChild(cell);
      cellEls.push({ cell, paint, paw });
    }
  }

  function paintCells(){
    for (let i = 0; i < grid.length; i++) {
      const coverage = grid[i] / PASSES;
      cellEls[i].paint.style.opacity = String(coverage);
      cellEls[i].paw.hidden = !pawFlags[i];
    }
  }

  function normalizedPointer(clientX, clientY){
    // Frisch gemessen bei jeder Interaktion — kein zwischengespeichertes
    // Spielfeld-Maß, das veralten könnte.
    const rect = wall.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return { nx: Math.max(0, Math.min(1, nx)), ny: Math.max(0, Math.min(1, ny)) };
  }

  function moveRoller(clientX, clientY){
    const { nx, ny } = normalizedPointer(clientX, clientY);
    rollerCursor.style.left = (nx * 100) + '%';
    rollerCursor.style.top = (ny * 100) + '%';
    const goingRight = duygu.dataset.lastX === undefined ? true : nx * 100 > parseFloat(duygu.dataset.lastX);
    duygu.dataset.lastX = String(nx * 100);
    if (goingRight !== facingRight) {
      facingRight = goingRight;
      duygu.style.transform = `translate(-50%, 0) scaleX(${facingRight ? 1 : -1})`;
    }
    duygu.style.left = (nx * 100) + '%';
    return { nx, ny };
  }

  function tryPaintAt(clientX, clientY){
    const { nx, ny } = moveRoller(clientX, clientY);
    const index = piCellFromPoint(nx, ny, COLS, ROWS);
    if (index === lastPaintedIndex) return;
    lastPaintedIndex = index;
    grid = piPaintCell(grid, index, PASSES);
    pawFlags[index] = false; // erneutes Streichen entfernt die Markierung
    paintCells();
    updateHud();
    checkEarlyFinish();
  }

  function checkEarlyFinish(){
    if (running && piCoverage(grid, PASSES) >= 1) finish();
  }

  function scheduleNextPaw(){
    const delay = PI_CONFIG.PAW_MIN_INTERVAL_MS + Math.random() * (PI_CONFIG.PAW_MAX_INTERVAL_MS - PI_CONFIG.PAW_MIN_INTERVAL_MS);
    pawHandle = setTimeout(dropPawPrint, delay);
  }

  function dropPawPrint(){
    if (!running) return;
    const finishedIndices = grid.map((p, i) => (p === PASSES ? i : -1)).filter(i => i >= 0);
    if (finishedIndices.length === 0) { scheduleNextPaw(); return; }
    const index = finishedIndices[Math.floor(Math.random() * finishedIndices.length)];
    walkLokumTo(index, () => {
      grid = piApplyPawPrint(grid, index, PASSES);
      pawFlags[index] = true;
      cellEls[index].paint.style.opacity = String(grid[index] / PASSES);
      cellEls[index].paw.hidden = false;
      if (pawHint) { pawHint.hidden = false; clearTimeout(pawHintHandle); pawHintHandle = setTimeout(() => { pawHint.hidden = true; }, 2800); }
      updateHud();
      scheduleNextPaw();
    });
  }

  function walkLokumTo(index, onArrive){
    const { row, col } = piRowColFromIndex(COLS, index);
    const x = ((col + 0.5) / COLS) * 100;
    const y = ((row + 0.5) / ROWS) * 100;
    const currentX = parseFloat(lokum.style.left) || 50;
    lokum.style.transform = `translate(-50%, -50%) scaleX(${x >= currentX ? 1 : -1})`;
    lokum.style.left = x + '%';
    lokum.style.top = y + '%';
    lokum.hidden = false;
    clearTimeout(walkLokumTo._t);
    walkLokumTo._t = setTimeout(() => { if (running) onArrive(); }, 650);
  }

  function tick(){
    if (!running) return;
    elapsed = (performance.now() - startAt) / 1000;
    updateHud();
    if (elapsed >= PI_CONFIG.DURATION) { finish(); return; }
    timerHandle = requestAnimationFrame(tick);
  }

  function grantKey(){
    try {
      const s = JSON.parse(localStorage.getItem(QUEST_KEY) || '{}');
      const c = Array.isArray(s.completed) ? s.completed.filter(Number.isInteger) : [];
      if (!c.includes(QUEST_NUMBER)) c.push(QUEST_NUMBER);
      localStorage.setItem(QUEST_KEY, JSON.stringify({ completed: [...new Set(c)].sort((a, b) => a - b) }));
    } catch {}
  }

  function finish(){
    running = false;
    if (timerHandle) cancelAnimationFrame(timerHandle);
    if (pawHandle) clearTimeout(pawHandle);
    const coverage = piCoverage(grid, PASSES);
    const grading = piGrade(coverage);
    resultTitle.textContent = grading.title;
    resultMessage.textContent = grading.message;
    resultCoverage.textContent = Math.round(coverage * 100) + '%';
    const won = grading.tier !== 'incomplete';
    keyReward.hidden = !won;
    if (won) grantKey();
    setView('result');
  }

  function resetState(){
    running = false;
    if (timerHandle) cancelAnimationFrame(timerHandle);
    if (pawHandle) clearTimeout(pawHandle);
    grid = piCreateGrid(COLS, ROWS);
    pawFlags = grid.map(() => false);
    lastPaintedIndex = null;
    elapsed = 0;
    facingRight = true;
    buildGrid();
    paintCells();
    updateHud();
    duygu.style.left = '50%';
    duygu.style.transform = 'translate(-50%, 0) scaleX(1)';
    delete duygu.dataset.lastX;
    lokum.hidden = true;
    rollerCursor.style.left = '50%';
    rollerCursor.style.top = '50%';
  }

  function startGame(){
    resetState();
    setView('game');
    running = true;
    startAt = performance.now();
    timerHandle = requestAnimationFrame(tick);
    scheduleNextPaw();
  }

  function backToMap(){
    resetState();
    setView('intro');
    window.showQuestMap?.();
  }

  // ---- Eingaben (Pointer Events: einheitlich für Maus und Touch) ----
  wall.addEventListener('pointerdown', e => {
    if (!running) return;
    pointerActive = true;
    wall.setPointerCapture(e.pointerId);
    tryPaintAt(e.clientX, e.clientY);
  });
  wall.addEventListener('pointermove', e => {
    if (pointerActive) tryPaintAt(e.clientX, e.clientY);
    else moveRoller(e.clientX, e.clientY);
  });
  wall.addEventListener('pointerup', () => { pointerActive = false; lastPaintedIndex = null; });
  wall.addEventListener('pointercancel', () => { pointerActive = false; lastPaintedIndex = null; });
  wall.addEventListener('pointerleave', () => { pointerActive = false; });

  readyBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  backFromIntro.addEventListener('click', backToMap);
  returnBtn.addEventListener('click', backToMap);

  // ---- Einstiegspunkt, den script.js aufruft ----
  function showPaintItScreen(){
    resetState();
    setView('intro');
  }
  window.showPaintItScreen = showPaintItScreen;

  // ---- Debug-Overlay: ?debug=1 zeigt Live-Werte direkt im Bild ----
  if (new URLSearchParams(location.search).has('debug')) {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:4px;right:4px;z-index:9999;background:rgba(0,0,0,.8);color:#4f4;font:11px monospace;padding:6px 8px;white-space:pre;pointer-events:none;';
    document.body.appendChild(panel);
    setInterval(() => {
      panel.textContent = `[PaintIt] view:${view} running:${running} elapsed:${elapsed.toFixed(1)} coverage:${(piCoverage(grid, PASSES) * 100).toFixed(1)}%`;
    }, 200);
  }

  // Für Browser-/E2E-Tests erreichbar machen — bewusst ohne ?qa=1-Gate,
  // da dieses Spiel keine echten Nutzerdaten verarbeitet.
  window.__PAINTIT__ = {
    getState: () => ({ view, running, elapsed, coverage: piCoverage(grid, PASSES), grid: grid.slice(), pawFlags: pawFlags.slice() }),
    start: startGame,
    paintAt: (row, col) => { const i = piCellIndex(COLS, row, col); grid = piPaintCell(grid, i, PASSES); pawFlags[i] = false; paintCells(); updateHud(); checkEarlyFinish(); },
    pawPrintAt: (row, col) => { const i = piCellIndex(COLS, row, col); const wasFull = grid[i] === PASSES; grid = piApplyPawPrint(grid, i, PASSES); if (wasFull) pawFlags[i] = true; paintCells(); updateHud(); },
    setElapsed: (seconds) => { elapsed = Math.max(0, Math.min(PI_CONFIG.DURATION, Number(seconds))); if (running) startAt = performance.now() - elapsed * 1000; updateHud(); },
    forceFinish: () => finish(),
  };

  buildGrid();
  paintCells();
  updateHud();
})();
