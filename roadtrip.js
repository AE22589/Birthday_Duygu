/* Quest I — The Road Trip v1.2.0
   Art-led, responsive implementation. The gameplay layer uses a fixed 0–100 SVG
   coordinate system so desktop and mobile use the same stable geometry. */
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
  const BOARD = document.getElementById('roadBoard');
  const OBJECTS = document.getElementById('rtObjects');
  const PLAYER = document.getElementById('rtPlayer');
  const PLAYER_IMAGE = document.getElementById('playerImage');
  const SHIELD = document.getElementById('rtShield');
  const LANE_GLOW = document.getElementById('laneGlow');
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
  const VERSION = '1.2.0';
  const DURATION = 60;
  const TARGET_STARS = 20;
  const MAX_STARS = 43;
  const LANES = [32, 50, 68];
  const PLAYER_Y_DESKTOP = 73.5;
  const PLAYER_Y_MOBILE = 79.5;

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
  let spawnTimer = 900;
  let starTimer = 600;
  let invulnerableUntil = 0;
  let shakeUntil = 0;
  let swipeStartX = null;
  let floatingUntil = 0;
  let deviceType = 'desktop';
  let lastMoveAt = 0;
  let playerY = PLAYER_Y_DESKTOP;

  const NS = 'http://www.w3.org/2000/svg';

  function isMobile() {
    return window.matchMedia('(max-width:700px)').matches || 'ontouchstart' in window;
  }

  function setDeviceInstructions() {
    deviceType = isMobile() ? 'mobile' : 'desktop';
    playerY = deviceType === 'mobile' ? PLAYER_Y_MOBILE : PLAYER_Y_DESKTOP;
    TOUCH_HINT.hidden = deviceType !== 'mobile';
    TOUCH_HINT.style.display = deviceType === 'mobile' ? 'block' : 'none';
    const width = deviceType === 'mobile' ? 45.5 : 29.7;
    const height = width * 0.875;
    PLAYER_IMAGE.setAttribute('x', String(-width / 2));
    PLAYER_IMAGE.setAttribute('y', String(-height * .73));
    PLAYER_IMAGE.setAttribute('width', String(width));
    PLAYER_IMAGE.setAttribute('height', String(height));
    const mask = document.getElementById('playerMask');
    if (mask) {
      mask.setAttribute('rx', deviceType === 'mobile' ? '20' : '17');
      mask.setAttribute('ry', deviceType === 'mobile' ? '22' : '20');
      mask.setAttribute('cy', String(playerY));
      mask.setAttribute('opacity', deviceType === 'mobile' ? '.92' : (Math.abs(playerX - 50) > 1 ? '.9' : '0'));
    }
  }

  function laneX(index) { return LANES[Math.max(0, Math.min(2, index))]; }

  function resetGame() {
    stopLoop();
    elapsed = 0;
    score = 0;
    lives = 3;
    lane = 1;
    playerX = LANES[1];
    playerTargetX = LANES[1];
    objects = [];
    spawnTimer = 950;
    starTimer = 500;
    invulnerableUntil = 0;
    shakeUntil = 0;
    floatingUntil = 0;
    swipeStartX = null;
    lastMoveAt = 0;
    OBJECTS.replaceChildren();
    PLAYER.setAttribute('transform', `translate(${playerX} ${playerY})`);
    SHIELD.setAttribute('opacity', '0');
    FLOATING.setAttribute('opacity', '0');
    LANE_GLOW.setAttribute('opacity', '0.38');
    updateHud();
  }

  function updateHud() {
    STARS.textContent = `${score} / ${MAX_STARS}`;
    TIME.textContent = String(Math.max(0, Math.ceil(DURATION - elapsed)));
    const full = '♥ '.repeat(lives).trim();
    const empty = '♡ '.repeat(3 - lives).trim();
    LIVES.textContent = [full, empty].filter(Boolean).join(' ');
  }

  function startReadySequence() {
    if (READY.disabled || running) return;
    READY.disabled = true;
    let n = 3;
    READY.textContent = String(n);
    const timer = window.setInterval(() => {
      n -= 1;
      if (n > 0) {
        READY.textContent = String(n);
      } else {
        window.clearInterval(timer);
        READY.textContent = 'GO!';
        window.setTimeout(() => {
          READY.disabled = false;
          READY.textContent = "I'M READY";
          beginGame();
        }, 420);
      }
    }, 650);
  }

  function beginGame() {
    resetGame();
    INTRO.hidden = true;
    RESULT.hidden = true;
    GAME.hidden = false;
    setDeviceInstructions();
    running = true;
    startedAt = performance.now();
    lastTick = startedAt;
    renderFrame(startedAt);
    startLoop();
    requestAnimationFrame(() => BOARD.focus({ preventScroll: true }));
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
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function createSvgElement(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }

  function makeStar() {
    const g = createSvgElement('g', { class: 'game-object star-object', filter: 'url(#gameGlow)' });
    g.appendChild(createSvgElement('path', {
      d: 'M0,-5 L1.6,-1.6 L5,0 L1.6,1.6 L0,5 L-1.6,1.6 L-5,0 L-1.6,-1.6 Z',
      fill: '#ffd978', stroke: '#fff0bd', 'stroke-width': '.45'
    }));
    g.appendChild(createSvgElement('circle', { cx: 0, cy: 0, r: 7, fill: 'none', stroke: '#f0bd64', 'stroke-opacity': '.22', 'stroke-width': '.5' }));
    return g;
  }

  function makeBarrel() {
    const g = createSvgElement('g', { class: 'game-object barrel-object' });
    g.appendChild(createSvgElement('ellipse', { cx: 0, cy: -4.8, rx: 3.6, ry: 1.2, fill: '#2a1d16', stroke: '#e0ae63', 'stroke-width': '.35' }));
    g.appendChild(createSvgElement('path', { d: 'M-3.6,-4.8 L-3.2,5.2 Q0,6.4 3.2,5.2 L3.6,-4.8 Q0,-3.3 -3.6,-4.8Z', fill: '#3b2a23', stroke: '#b27a43', 'stroke-width': '.35' }));
    g.appendChild(createSvgElement('path', { d: 'M-2.9,-1.8 L2.9,-1.8 M-3.1,2.8 L3.1,2.8', stroke: '#17141a', 'stroke-width': '.7' }));
    g.appendChild(createSvgElement('path', { d: 'M-1.7,-.3 Q0,-1.8 1.7,-.3 L1.1,2.0 L-1.1,2.0Z', fill: '#b07a43', opacity: '.7' }));
    return g;
  }

  function makeCat() {
    const g = createSvgElement('g', { class: 'game-object cat-object' });
    g.appendChild(createSvgElement('ellipse', { cx: 0, cy: 1.5, rx: 5.4, ry: 3.1, fill: '#705047', stroke: '#2a1c1b', 'stroke-width': '.35' }));
    g.appendChild(createSvgElement('circle', { cx: 4.1, cy: -1.8, r: 2.6, fill: '#9b6d5a', stroke: '#2a1c1b', 'stroke-width': '.35' }));
    g.appendChild(createSvgElement('path', { d: 'M2.4,-3 L2.8,-6 L4.2,-3.7 M5.1,-3.8 L6.3,-6 L6.7,-2.8', fill: '#9b6d5a', stroke: '#2a1c1b', 'stroke-width': '.3' }));
    g.appendChild(createSvgElement('circle', { cx: 3.4, cy: -2.1, r: .32, fill: '#f4c86d' }));
    g.appendChild(createSvgElement('circle', { cx: 4.9, cy: -2.1, r: .32, fill: '#f4c86d' }));
    g.appendChild(createSvgElement('path', { d: 'M-4.5,1 Q-8,-1 -8,-4', fill: 'none', stroke: '#705047', 'stroke-width': '1.2', 'stroke-linecap': 'round' }));
    return g;
  }

  function spawn(type, laneIndex = Math.floor(Math.random() * 3)) {
    const factory = type === 'star' ? makeStar : type === 'cat' ? makeCat : makeBarrel;
    const group = factory();
    const x = laneX(laneIndex);
    const y = 8;
    group.setAttribute('transform', `translate(${x} ${y}) scale(.65)`);
    OBJECTS.appendChild(group);
    objects.push({
      type, lane: laneIndex, x, y, group, hit: false,
      speed: type === 'star' ? 15.5 + Math.random() * 1.5 : 14.2 + Math.random() * 1.2,
      scale: .65,
      phase: Math.random() * Math.PI * 2
    });
  }

  function moveLane(direction) {
    if (!running) return;
    const now = performance.now();
    if (now - lastMoveAt < 120) return;
    const next = Math.max(0, Math.min(2, lane + direction));
    if (next === lane) return;
    lane = next;
    playerTargetX = laneX(lane);
    lastMoveAt = now;
  }

  function update(dt, now) {
    elapsed = Math.min(DURATION, (now - startedAt) / 1000);
    const progress = elapsed / DURATION;
    const speedBoost = progress * 2.7;

    spawnTimer -= dt * 1000;
    starTimer -= dt * 1000;

    if (starTimer <= 0 && score < MAX_STARS) {
      // Favor the current lane occasionally so the relaxed difficulty feels generous.
      const targetLane = Math.random() < .58 ? lane : Math.floor(Math.random() * 3);
      spawn('star', targetLane);
      starTimer = 1250 + Math.random() * 350 - progress * 120;
    }

    if (spawnTimer <= 0) {
      // Never create two adjacent dangerous objects in the same lane.
      const dangerousLanes = objects.filter(o => o.type !== 'star' && o.y > 8 && o.y < 42).map(o => o.lane);
      let candidate = Math.floor(Math.random() * 3);
      if (dangerousLanes.includes(candidate)) candidate = (candidate + 1) % 3;
      const type = Math.random() < .78 ? 'barrel' : 'cat';
      spawn(type, candidate);
      spawnTimer = 2500 + Math.random() * 900 - progress * 220;
    }

    playerX += (playerTargetX - playerX) * Math.min(1, dt * 9);

    for (const o of objects) {
      o.y += o.speed * (1 + speedBoost * .12) * dt;
      o.scale = .58 + Math.max(0, o.y - 8) / 92 * .62;
      const wobble = o.type === 'star' ? Math.sin(o.phase + now / 420) * .35 : Math.sin(o.phase + now / 650) * .15;
      o.group.setAttribute('transform', `translate(${o.x + wobble} ${o.y}) scale(${o.scale})`);

      const nearPlayer = o.y > 74 && o.y < 87;
      const xDistance = Math.abs(o.x - playerX);
      if (!o.hit && nearPlayer && xDistance < 8.2) {
        o.hit = true;
        if (o.type === 'star') {
          score = Math.min(MAX_STARS, score + 1);
          showFloatingMessage('+1 STAR', '#f7cd78');
          o.group.setAttribute('opacity', '0');
        } else if (now > invulnerableUntil) {
          lives = Math.max(1, lives - 1);
          invulnerableUntil = now + 1350;
          shakeUntil = now + 260;
          showFloatingMessage(lives === 1 ? 'EASY DOES IT' : 'WATCH THE ROAD', '#e7a5c6');
        }
      }
    }

    objects = objects.filter(o => {
      const keep = o.y < 106 && !(o.hit && o.type === 'star');
      if (!keep && o.group.parentNode) o.group.parentNode.removeChild(o.group);
      return keep;
    });

    updateHud();
    if (elapsed >= DURATION) finishGame();
  }

  function showFloatingMessage(text, color) {
    FLOATING.replaceChildren();
    const t = createSvgElement('text', { x: 50, y: 63, 'text-anchor': 'middle', fill: color, 'font-family': 'Montserrat, Arial, sans-serif', 'font-size': 2.3, 'font-weight': 700, 'letter-spacing': '.18em', filter: 'url(#gameGlow)' });
    t.textContent = text;
    FLOATING.appendChild(t);
    FLOATING.setAttribute('opacity', '1');
    floatingUntil = performance.now() + 800;
  }

  function renderFrame(now) {
    const ease = Math.min(1, 0.18);
    playerX += (playerTargetX - playerX) * ease;
    const shake = now < shakeUntil ? Math.sin(now / 18) * .7 : 0;
    PLAYER.setAttribute('transform', `translate(${playerX + shake} ${playerY})`);
    const mask = document.getElementById('playerMask');
    if (mask) {
      const showMask = deviceType === 'mobile' || Math.abs(playerX - 50) > 1.2;
      mask.setAttribute('opacity', showMask ? (deviceType === 'mobile' ? '.92' : '.9') : '0');
      mask.setAttribute('cy', String(playerY));
    }
    SHIELD.setAttribute('opacity', now < invulnerableUntil ? '.85' : '0');
    if (floatingUntil && now >= floatingUntil) {
      FLOATING.setAttribute('opacity', '0');
      floatingUntil = 0;
    }
    const indicator = document.getElementById('laneIndicator');
    if (indicator) {
      indicator.setAttribute('transform', `translate(${playerX - 50} 0)`);
      indicator.setAttribute('opacity', running ? '.22' : '0');
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
      RESULT_KICKER.textContent = 'ONE MORE RUN';
      RESULT_TITLE.textContent = 'THE ROAD AWAITS';
      RESULT_COPY.textContent = `You found ${score} stars. ${TARGET_STARS - score} more will unlock the first key.`;
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
      console.error('[Road Trip] state persistence failed', err);
    }
  }

  function handlePointerDown(e) {
    if (!running || deviceType !== 'mobile') return;
    swipeStartX = e.clientX;
  }

  function handlePointerUp(e) {
    if (!running || deviceType !== 'mobile' || swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    if (Math.abs(dx) >= 26) moveLane(dx > 0 ? 1 : -1);
    swipeStartX = null;
  }

  function bindControls() {
    document.querySelectorAll('[data-move]').forEach(button => {
      button.addEventListener('click', () => moveLane(Number(button.dataset.move)));
    });

    window.addEventListener('keydown', event => {
      if (!running) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        moveLane(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }, { passive: false });

    BOARD.addEventListener('pointerdown', handlePointerDown, { passive: true });
    BOARD.addEventListener('pointerup', handlePointerUp, { passive: true });
    BOARD.addEventListener('pointercancel', () => { swipeStartX = null; }, { passive: true });
  }

  READY.addEventListener('click', startReadySequence);
  BACK_INTRO.addEventListener('click', () => window.showQuestMap?.());
  RETURN_RESULT.addEventListener('click', () => window.showQuestMap?.());
  RETRY.addEventListener('click', () => {
    RESULT.hidden = true;
    INTRO.hidden = false;
    resetGame();
    setDeviceInstructions();
  });

  window.addEventListener('resize', setDeviceInstructions);
  window.addEventListener('orientationchange', () => setTimeout(setDeviceInstructions, 80));

  window.openRoadTripIntro = () => {
    running = false;
    stopLoop();
    setDeviceInstructions();
    INTRO.hidden = false;
    GAME.hidden = true;
    RESULT.hidden = true;
    READY.disabled = false;
    READY.textContent = "I'M READY";
    resetGame();
  };

  window.showRoadTripScreen = () => {
    document.getElementById('questScreen').hidden = true;
    document.getElementById('entrance').hidden = true;
    document.getElementById('roadTripScreen').hidden = false;
    window.openRoadTripIntro();
  };

  window.__DUYGU_ROADTRIP_SELF_TEST__ = () => ({
    quest: 'I', version: VERSION, duration: DURATION, targetStars: TARGET_STARS,
    maxStars: MAX_STARS, renderer: 'svg-overlay-on-concept-art',
    controls: { desktop: ['ArrowLeft', 'ArrowRight'], mobile: ['swipe-left', 'swipe-right'] },
    intro: !!INTRO, game: !!GAME, scene: !!SCENE, board: !!BOARD, readyButton: !!READY,
    stateKey: QUEST_KEY, lanes: LANES.slice()
  });

  setDeviceInstructions();
  bindControls();
  resetGame();
})();
