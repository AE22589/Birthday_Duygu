/* v1.1.2 — Quest I: The Road Trip
   Rendering: responsive SVG scene, no canvas dependency. */
(() => {
  'use strict';

  const INTRO = document.getElementById('roadTripIntro');
  const GAME = document.getElementById('roadTripGame');
  const RESULT = document.getElementById('roadTripResult');
  const READY = document.getElementById('readyButton');
  const BACK_INTRO = document.getElementById('backToMapFromIntro');
  const RETURN_RESULT = document.getElementById('returnToMapFromResult');
  const RETRY = document.getElementById('retryRoadTrip');
  const SCENE = document.getElementById('roadScene');
  const OBJECTS = document.getElementById('rtObjects');
  const PLAYER = document.getElementById('rtPlayer');
  const SHIELD = document.getElementById('rtShield');
  const LANE_MARKERS = document.getElementById('rtLaneMarkers');
  const FLOATING = document.getElementById('rtFloating');
  const STARS = document.getElementById('starCount');
  const TIME = document.getElementById('timeCount');
  const LIVES = document.getElementById('lifeCount');
  const TOUCH_HINT = document.getElementById('touchHint');
  const RESULT_STARS = document.getElementById('resultStars');
  const RESULT_TIME = document.getElementById('resultTime');
  const RESULT_TITLE = document.getElementById('resultTitle');
  const RESULT_COPY = document.getElementById('resultCopy');
  const RESULT_KICKER = document.getElementById('resultKicker');
  const KEY_REWARD = document.getElementById('keyReward');

  const QUEST_KEY = 'duyguBirthdayQuestState_v1';
  const VERSION = '1.1.2';
  const DURATION = 60;
  const TARGET_STARS = 20;
  const MAX_STARS = 43;
  const WIDTH = 600;
  const HEIGHT = 960;
  const LANES = [150, 300, 450];

  let running = false;
  let timerId = null;
  let startedAt = 0;
  let lastTick = 0;
  let elapsed = 0;
  let score = 0;
  let lives = 3;
  let lane = 1;
  let playerX = LANES[1];
  let playerTargetX = LANES[1];
  let objects = [];
  let spawnTimer = 700;
  let starTimer = 450;
  let invulnerableUntil = 0;
  let shake = 0;
  let swipeStartX = null;
  let deviceType = 'desktop';

  const NS = 'http://www.w3.org/2000/svg';

  function isMobile() {
    return window.matchMedia('(max-width:700px)').matches || 'ontouchstart' in window;
  }

  function laneX(index) { return LANES[Math.max(0, Math.min(2, index))]; }

  function setDeviceInstructions() {
    deviceType = isMobile() ? 'mobile' : 'desktop';
    TOUCH_HINT.hidden = deviceType !== 'mobile';
  }

  function resetGame() {
    stopLoop();
    elapsed = 0;
    score = 0;
    lives = 3;
    lane = 1;
    playerX = LANES[1];
    playerTargetX = LANES[1];
    objects = [];
    spawnTimer = 700;
    starTimer = 450;
    invulnerableUntil = 0;
    shake = 0;
    swipeStartX = null;
    OBJECTS.replaceChildren();
    PLAYER.setAttribute('transform', `translate(${playerX} 787)`);
    SHIELD.setAttribute('opacity', '0');
    FLOATING.setAttribute('opacity', '0');
    updateHud();
    renderFrame(performance.now());
  }

  function updateHud() {
    STARS.textContent = `${score} / ${MAX_STARS}`;
    TIME.textContent = String(Math.max(0, Math.ceil(DURATION - elapsed)));
    LIVES.textContent = `${'♥ '.repeat(lives).trim()}${lives < 3 ? ` ${'♡ '.repeat(3 - lives).trim()}` : ''}`.trim();
  }

  function startReadySequence() {
    if (READY.disabled) return;
    READY.disabled = true;
    let n = 3;
    READY.textContent = String(n);
    const timer = setInterval(() => {
      n -= 1;
      if (n > 0) READY.textContent = String(n);
      else {
        clearInterval(timer);
        READY.textContent = "I'M READY";
        beginGame();
      }
    }, 700);
  }

  function beginGame() {
    resetGame();
    INTRO.hidden = true;
    RESULT.hidden = true;
    GAME.hidden = false;
    READY.disabled = false;
    setDeviceInstructions();
    running = true;
    startedAt = performance.now();
    lastTick = startedAt;
    renderFrame(startedAt);
    startLoop();
  }

  function startLoop() {
    stopLoop();
    timerId = window.setInterval(() => {
      if (!running) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      update(dt, now);
      renderFrame(now);
    }, 33);
  }

  function stopLoop() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function finishGame() {
    if (!running) return;
    running = false;
    stopLoop();
    elapsed = Math.min(DURATION, elapsed);
    RESULT_STARS.textContent = String(score);
    RESULT_TIME.textContent = `${Math.round(elapsed)}s`;
    const success = score >= TARGET_STARS;
    KEY_REWARD.hidden = !success;

    if (score >= 43) {
      RESULT_KICKER.textContent = 'JOURNEY COMPLETE';
      RESULT_TITLE.textContent = 'PERFECT JOURNEY';
      RESULT_COPY.textContent = '43 stars. You made the whole road sparkle.';
    } else if (score >= 30) {
      RESULT_KICKER.textContent = 'JOURNEY COMPLETE';
      RESULT_TITLE.textContent = 'GREAT JOURNEY';
      RESULT_COPY.textContent = 'A beautiful ride from start to finish.';
    } else if (success) {
      RESULT_KICKER.textContent = 'JOURNEY COMPLETE';
      RESULT_TITLE.textContent = 'THE ROAD REMEMBERS';
      RESULT_COPY.textContent = 'You collected enough stars and made it home.';
    } else {
      RESULT_KICKER.textContent = 'JOURNEY INCOMPLETE';
      RESULT_TITLE.textContent = 'ONE MORE RUN';
      RESULT_COPY.textContent = `You found ${score} stars. Collect ${TARGET_STARS} to claim the first key.`;
    }

    if (success) markQuestComplete();
    GAME.hidden = true;
    RESULT.hidden = false;
  }

  function markQuestComplete() {
    try {
      const raw = JSON.parse(localStorage.getItem(QUEST_KEY) || '{}');
      const completed = Array.isArray(raw.completed) ? raw.completed : [];
      if (!completed.includes(1)) completed.push(1);
      completed.sort((a, b) => a - b);
      localStorage.setItem(QUEST_KEY, JSON.stringify({ completed }));
    } catch (err) {
      console.error('[Road Trip] Could not persist quest state', err);
    }
  }

  function moveLane(direction) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, lane + direction));
    if (next === lane) return;
    lane = next;
    playerTargetX = laneX(lane);
  }

  function makeStar(x, y, scale) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    g.setAttribute('filter', 'url(#rtGlow)');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M0,-20 L5,-6 L20,0 L5,6 L0,20 L-5,6 L-20,0 L-5,-6 Z');
    p.setAttribute('fill', '#f8cf76');
    g.appendChild(p);
    return g;
  }

  function makeBarrel(x, y, scale) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    const body = document.createElementNS(NS, 'rect');
    body.setAttribute('x', '-22'); body.setAttribute('y', '-28'); body.setAttribute('width', '44'); body.setAttribute('height', '56'); body.setAttribute('rx', '8');
    body.setAttribute('fill', '#765039'); body.setAttribute('stroke', '#d2a15f'); body.setAttribute('stroke-width', '3');
    g.appendChild(body);
    for (const yy of [-18, 11]) {
      const band = document.createElementNS(NS, 'rect');
      band.setAttribute('x', '-24'); band.setAttribute('y', yy); band.setAttribute('width', '48'); band.setAttribute('height', '7'); band.setAttribute('fill', '#1b2028');
      g.appendChild(band);
    }
    return g;
  }

  function makeAnimal(x, y, scale) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    const body = document.createElementNS(NS, 'ellipse');
    body.setAttribute('cx', '0'); body.setAttribute('cy', '4'); body.setAttribute('rx', '27'); body.setAttribute('ry', '19'); body.setAttribute('fill', '#c48b70'); body.setAttribute('stroke', '#4a2d27'); body.setAttribute('stroke-width', '3');
    g.appendChild(body);
    const head = document.createElementNS(NS, 'circle');
    head.setAttribute('cx', '0'); head.setAttribute('cy', '-12'); head.setAttribute('r', '21'); head.setAttribute('fill', '#f3d0b5'); head.setAttribute('stroke', '#4a2d27'); head.setAttribute('stroke-width', '3');
    g.appendChild(head);
    for (const sx of [-1, 1]) {
      const ear = document.createElementNS(NS, 'path');
      ear.setAttribute('d', sx < 0 ? 'M-20,-7 L-28,-27 L-8,-17 Z' : 'M20,-7 L28,-27 L8,-17 Z');
      ear.setAttribute('fill', '#c48b70'); ear.setAttribute('stroke', '#4a2d27'); ear.setAttribute('stroke-width', '3');
      g.appendChild(ear);
      const eye = document.createElementNS(NS, 'circle'); eye.setAttribute('cx', String(sx * 7)); eye.setAttribute('cy', '-15'); eye.setAttribute('r', '2.5'); eye.setAttribute('fill', '#222'); g.appendChild(eye);
    }
    const nose = document.createElementNS(NS, 'circle'); nose.setAttribute('cx', '0'); nose.setAttribute('cy', '-8'); nose.setAttribute('r', '3'); nose.setAttribute('fill', '#d68d98'); g.appendChild(nose);
    return g;
  }

  function spawn(type) {
    const laneIndex = Math.floor(Math.random() * 3);
    const y = -60;
    const scale = 0.65;
    const group = type === 'star' ? makeStar(laneX(laneIndex), y, scale) : type === 'barrel' ? makeBarrel(laneX(laneIndex), y, scale) : makeAnimal(laneX(laneIndex), y, scale);
    OBJECTS.appendChild(group);
    objects.push({ type, lane: laneIndex, x: laneX(laneIndex), y, group, hit: false, scale, wobble: Math.random() * Math.PI * 2, speed: 0.92 + Math.random() * 0.1 });
  }

  function difficulty() { return Math.min(1, elapsed / DURATION); }

  function update(dt, now) {
    elapsed = Math.min(DURATION, (now - startedAt) / 1000);
    const d = difficulty();
    const speed = 285 + d * 65;
    spawnTimer -= dt * 1000;
    starTimer -= dt * 1000;

    if (spawnTimer <= 0) {
      if (Math.random() < 0.36) spawn(Math.random() < 0.58 ? 'barrel' : 'animal');
      spawnTimer = 1150 - d * 120 + Math.random() * 350;
    }
    if (starTimer <= 0 && score < MAX_STARS) {
      spawn('star');
      starTimer = 650 - d * 50;
    }

    playerX += (playerTargetX - playerX) * Math.min(1, dt * 9);
    if (shake > 0) shake = Math.max(0, shake - dt * 20);

    for (const o of objects) {
      o.y += speed * o.speed * dt;
      o.wobble += dt * 2;
      o.scale = Math.max(0.62, Math.min(1.15, o.y / HEIGHT + 0.25));
      const xOffset = shake > 0 ? Math.sin(o.wobble) * 0 : 0;
      o.group.setAttribute('transform', `translate(${o.x + xOffset} ${o.y}) scale(${o.scale})`);

      const nearPlayer = o.y > HEIGHT * 0.72 && o.y < HEIGHT * 0.88;
      const xDistance = Math.abs(o.x - playerX);
      if (!o.hit && nearPlayer && xDistance < 58) {
        o.hit = true;
        if (o.type === 'star') {
          score = Math.min(MAX_STARS, score + 1);
          o.group.setAttribute('opacity', '0');
        } else if (now > invulnerableUntil) {
          lives -= 1;
          invulnerableUntil = now + 1300;
          shake = 8;
          showFloatingMessage(lives > 0 ? 'EASY DOES IT' : 'THE ROAD GIVES YOU ANOTHER CHANCE');
          if (lives <= 0) lives = 1;
        }
      }
    }

    objects = objects.filter(o => {
      const keep = o.y < HEIGHT + 100 && !(o.hit && o.type === 'star');
      if (!keep && o.group.parentNode) o.group.parentNode.removeChild(o.group);
      return keep;
    });

    updateHud();
    if (elapsed >= DURATION) finishGame();
  }

  let floatingUntil = 0;
  function showFloatingMessage(text) {
    FLOATING.replaceChildren();
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', '300'); t.setAttribute('y', '460'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#f2cb77'); t.setAttribute('font-family', 'Montserrat, Arial, sans-serif'); t.setAttribute('font-size', '15'); t.setAttribute('font-weight', '700'); t.textContent = text;
    FLOATING.appendChild(t); FLOATING.setAttribute('opacity', '1'); floatingUntil = performance.now() + 900;
  }

  function renderFrame(now) {
    playerX += (playerTargetX - playerX) * 0.08;
    const jitter = shake > 0 ? Math.sin(now / 25) * shake * 0.45 : 0;
    PLAYER.setAttribute('transform', `translate(${playerX + jitter} 787)`);
    SHIELD.setAttribute('opacity', now < invulnerableUntil ? '0.9' : '0');
    if (floatingUntil && now >= floatingUntil) { FLOATING.setAttribute('opacity', '0'); floatingUntil = 0; }
    const dash = -((now - startedAt) / 1000 * 80) % 80;
    LANE_MARKERS.querySelectorAll('path').forEach(p => p.setAttribute('stroke-dashoffset', String(dash)));
  }

  READY.addEventListener('click', startReadySequence);
  BACK_INTRO.addEventListener('click', () => window.showQuestMap?.());
  RETURN_RESULT.addEventListener('click', () => window.showQuestMap?.());
  RETRY.addEventListener('click', () => { RESULT.hidden = true; INTRO.hidden = false; setDeviceInstructions(); resetGame(); });
  window.addEventListener('resize', setDeviceInstructions);
  window.addEventListener('orientationchange', () => setTimeout(setDeviceInstructions, 80));

  window.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveLane(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); moveLane(1); }
  }, { passive: false });

  SCENE.addEventListener('pointerdown', e => { if (deviceType === 'mobile') swipeStartX = e.clientX; });
  SCENE.addEventListener('pointerup', e => {
    if (deviceType !== 'mobile' || swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    if (Math.abs(dx) > 28) moveLane(dx > 0 ? 1 : -1);
    swipeStartX = null;
  });
  SCENE.addEventListener('pointercancel', () => { swipeStartX = null; });

  window.openRoadTripIntro = () => {
    setDeviceInstructions();
    INTRO.hidden = false;
    GAME.hidden = true;
    RESULT.hidden = true;
    resetGame();
  };

  window.showRoadTripScreen = () => {
    document.getElementById('questScreen').hidden = true;
    document.getElementById('entrance').hidden = true;
    document.getElementById('roadTripScreen').hidden = false;
    window.openRoadTripIntro();
  };

  window.__DUYGU_ROADTRIP_SELF_TEST__ = () => ({
    quest: 'I', version: VERSION, duration: DURATION, targetStars: TARGET_STARS, maxStars: MAX_STARS,
    renderer: 'svg', controls: { desktop: ['ArrowLeft', 'ArrowRight'], mobile: ['swipe-left', 'swipe-right'] },
    scene: !!SCENE, readyButton: !!READY, stateKey: QUEST_KEY, lanePositions: LANES.slice()
  });

  setDeviceInstructions();
  resetGame();
})();
