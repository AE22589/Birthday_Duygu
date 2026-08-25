/* v1.1.0 — Quest I: The Road Trip */
(() => {
  'use strict';

  const INTRO = document.getElementById('roadTripIntro');
  const GAME = document.getElementById('roadTripGame');
  const RESULT = document.getElementById('roadTripResult');
  const READY = document.getElementById('readyButton');
  const BACK_INTRO = document.getElementById('backToMapFromIntro');
  const RETURN_RESULT = document.getElementById('returnToMapFromResult');
  const RETRY = document.getElementById('retryRoadTrip');
  const CANVAS = document.getElementById('roadCanvas');
  const CTX = CANVAS.getContext('2d');
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

  const QUEST_KEY = 'duyguBirthdayQuestState';
  const LANES = [-1, 0, 1];
  const DURATION = 60;
  const TARGET_STARS = 20;
  const MAX_STARS = 43;

  let animationFrame = 0;
  let running = false;
  let startedAt = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let score = 0;
  let lives = 3;
  let lane = 1;
  let playerX = 0;
  let playerTargetX = 0;
  let objects = [];
  let spawnTimer = 0;
  let starTimer = 0;
  let roadOffset = 0;
  let invulnerableUntil = 0;
  let shake = 0;
  let swipeStartX = null;
  let deviceType = 'desktop';

  function isMobile() { return window.matchMedia('(max-width:700px)').matches || 'ontouchstart' in window; }
  function laneX(laneIndex) { return CANVAS.width * (0.5 + (laneIndex - 1) * 0.25); }
  function setDeviceInstructions() {
    deviceType = isMobile() ? 'mobile' : 'desktop';
    TOUCH_HINT.hidden = deviceType !== 'mobile';
  }
  function resizeCanvas() {
    const rect = CANVAS.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const logicalW = 600;
    const logicalH = 960;
    CANVAS.width = logicalW * dpr;
    CANVAS.height = logicalH * dpr;
    CANVAS.style.width = '100%';
    CANVAS.style.height = '100%';
    CTX.setTransform(dpr,0,0,dpr,0,0);
    CANVAS._logicalW = logicalW;
    CANVAS._logicalH = logicalH;
    playerTargetX = laneX(lane);
    if (!playerX) playerX = playerTargetX;
    void rect;
  }

  function resetGame() {
    running = false;
    elapsed = 0;
    score = 0;
    lives = 3;
    lane = 1;
    playerX = 300;
    playerTargetX = 300;
    objects = [];
    spawnTimer = 500;
    starTimer = 250;
    roadOffset = 0;
    invulnerableUntil = 0;
    shake = 0;
    updateHud();
  }

  function updateHud() {
    STARS.textContent = `${score} / ${MAX_STARS}`;
    TIME.textContent = String(Math.max(0, Math.ceil(DURATION - elapsed)));
    LIVES.textContent = `${'♥ '.repeat(Math.max(0,lives)).trim()}${lives < 3 ? ' ' + '♡ '.repeat(3-lives).trim() : ''}`.trim();
  }

  function openQuest() {
    if (typeof window.showRoadTripScreen === 'function') window.showRoadTripScreen();
  }

  function startReadySequence() {
    READY.disabled = true;
    let n = 3;
    READY.textContent = String(n);
    const timer = setInterval(() => {
      n -= 1;
      if (n > 0) READY.textContent = String(n);
      else {
        clearInterval(timer);
        READY.textContent = "I'M READY";
        READY.disabled = false;
        beginGame();
      }
    }, 700);
  }

  function beginGame() {
    resetGame();
    INTRO.hidden = true;
    RESULT.hidden = true;
    GAME.hidden = false;
    setDeviceInstructions();
    resizeCanvas();
    running = true;
    startedAt = performance.now();
    lastFrame = startedAt;
    animationFrame = requestAnimationFrame(loop);
  }

  function finishGame() {
    running = false;
    cancelAnimationFrame(animationFrame);
    const finalTime = Math.min(DURATION, elapsed);
    RESULT_STARS.textContent = String(score);
    RESULT_TIME.textContent = `${Math.round(finalTime)}s`;
    RESULT_KICKER.textContent = 'JOURNEY COMPLETE';
    if (score >= 43) {
      RESULT_TITLE.textContent = 'PERFECT JOURNEY';
      RESULT_COPY.textContent = '43 stars. You made the whole road sparkle.';
    } else if (score >= 30) {
      RESULT_TITLE.textContent = 'GREAT JOURNEY';
      RESULT_COPY.textContent = 'A beautiful ride from start to finish.';
    } else if (score >= TARGET_STARS) {
      RESULT_TITLE.textContent = 'THE ROAD REMEMBERS';
      RESULT_COPY.textContent = 'You collected enough stars and made it home.';
    } else {
      RESULT_TITLE.textContent = 'THE ROAD REMEMBERS';
      RESULT_COPY.textContent = 'You made it through the night. The journey counts.';
    }
    KEY_REWARD.hidden = false;
    markQuestComplete();
    GAME.hidden = true;
    RESULT.hidden = false;
  }

  function markQuestComplete() {
    try {
      const raw = JSON.parse(localStorage.getItem(QUEST_KEY) || '{}');
      const completed = Array.isArray(raw.completed) ? raw.completed : [];
      if (!completed.includes(1)) completed.push(1);
      completed.sort((a,b)=>a-b);
      localStorage.setItem(QUEST_KEY, JSON.stringify({completed}));
    } catch {}
  }

  function moveLane(direction) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, lane + direction));
    if (next === lane) return;
    lane = next;
    playerTargetX = laneX(lane);
  }

  function spawnObject(type) {
    const laneIndex = Math.floor(Math.random()*3);
    objects.push({type, lane:laneIndex, x:laneX(laneIndex), y:-80, hit:false, wobble:Math.random()*Math.PI*2, speed:0.92+Math.random()*0.12});
  }

  function spawnStar() {
    if (score >= MAX_STARS) return;
    const laneIndex = Math.floor(Math.random()*3);
    objects.push({type:'star',lane:laneIndex,x:laneX(laneIndex),y:-50,hit:false,wobble:Math.random()*Math.PI*2,speed:0.94+Math.random()*0.08});
  }

  function difficulty() {
    return Math.min(1, elapsed / DURATION);
  }

  function update(dt, now) {
    elapsed = Math.min(DURATION, (now-startedAt)/1000);
    const d = difficulty();
    const speed = 285 + d*65;
    roadOffset = (roadOffset + speed*dt) % 80;
    spawnTimer -= dt*1000;
    starTimer -= dt*1000;
    const obstacleGap = 1100 - d*160;
    if (spawnTimer <= 0) {
      // Very forgiving: most spawns are stars, obstacles are deliberately sparse.
      if (Math.random() < 0.42) spawnObject(Math.random() < 0.58 ? 'barrel' : 'animal');
      spawnTimer = obstacleGap + Math.random()*360;
    }
    if (starTimer <= 0) {
      spawnStar();
      if (Math.random() < 0.35) setTimeout(()=>{if(running)spawnStar()}, 180);
      starTimer = 720 - d*70;
    }

    playerX += (playerTargetX-playerX) * Math.min(1, dt*9);
    for (const o of objects) {
      o.y += speed * o.speed * dt;
      o.wobble += dt*2;
      const nearPlayer = o.y > CANVAS._logicalH*0.72 && o.y < CANVAS._logicalH*0.88;
      const xDistance = Math.abs(o.x-playerX);
      if (!o.hit && nearPlayer && xDistance < 55) {
        o.hit = true;
        if (o.type === 'star') {
          score = Math.min(MAX_STARS, score+1);
        } else if (now > invulnerableUntil) {
          lives -= 1;
          invulnerableUntil = now + 1200;
          shake = 8;
          if (lives <= 0) {
            // Gentle recovery instead of a frustrating hard game-over.
            lives = 1;
            invulnerableUntil = now + 2200;
            showFloatingMessage('THE ROAD GIVES YOU ANOTHER CHANCE');
          } else {
            showFloatingMessage('EASY DOES IT');
          }
        }
      }
    }
    objects = objects.filter(o=>o.y<CANVAS._logicalH+100 && !(o.hit && o.type==='star'));
    if (shake>0) shake*=Math.max(0,1-dt*7);
    updateHud();
    if (elapsed>=DURATION) finishGame();
  }

  let floating = null;
  function showFloatingMessage(text) {
    floating = {text,until:performance.now()+900};
  }

  function drawBackground(t) {
    const W=CANVAS._logicalW,H=CANVAS._logicalH;
    const sky=CTX.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#050914'); sky.addColorStop(.48,'#11182a'); sky.addColorStop(1,'#030507');
    CTX.fillStyle=sky; CTX.fillRect(0,0,W,H);
    const moonX=W*.78, moonY=H*.15;
    const mg=CTX.createRadialGradient(moonX,moonY,2,moonX,moonY,100);mg.addColorStop(0,'rgba(255,226,164,.34)');mg.addColorStop(1,'rgba(255,226,164,0)');CTX.fillStyle=mg;CTX.fillRect(moonX-110,moonY-110,220,220);
    CTX.fillStyle='#f8e5bd';CTX.beginPath();CTX.arc(moonX,moonY,28,0,Math.PI*2);CTX.fill();
    // Distant hills.
    CTX.fillStyle='#080d16';CTX.beginPath();CTX.moveTo(0,H*.36);CTX.quadraticCurveTo(W*.15,H*.28,W*.3,H*.36);CTX.quadraticCurveTo(W*.46,H*.25,W*.62,H*.36);CTX.quadraticCurveTo(W*.8,H*.27,W,H*.36);CTX.lineTo(W,H*.58);CTX.lineTo(0,H*.58);CTX.closePath();CTX.fill();
    // Tiny roadside lights.
    for(let i=0;i<7;i++){const x=40+i*87+(Math.sin(t*.0003+i)*8);const y=H*.38+(i%2)*30;CTX.fillStyle='rgba(239,190,100,.5)';CTX.beginPath();CTX.arc(x,y,2.5,0,Math.PI*2);CTX.fill();}
  }

  function drawRoad() {
    const W=CANVAS._logicalW,H=CANVAS._logicalH;
    const topY=H*.39,bottomY=H+50, topLeft=W*.39,topRight=W*.61,bottomLeft=-W*.04,bottomRight=W*1.04;
    const road=CTX.createLinearGradient(0,topY,0,H);road.addColorStop(0,'#252936');road.addColorStop(1,'#10131a');
    CTX.fillStyle=road;CTX.beginPath();CTX.moveTo(topLeft,topY);CTX.lineTo(topRight,topY);CTX.lineTo(bottomRight,bottomY);CTX.lineTo(bottomLeft,bottomY);CTX.closePath();CTX.fill();
    // Road edges.
    CTX.strokeStyle='rgba(229,190,108,.22)';CTX.lineWidth=5;CTX.beginPath();CTX.moveTo(topLeft,topY);CTX.lineTo(bottomLeft,bottomY);CTX.moveTo(topRight,topY);CTX.lineTo(bottomRight,bottomY);CTX.stroke();
    // Lane markers with perspective.
    CTX.strokeStyle='rgba(230,220,192,.34)';CTX.lineWidth=3;CTX.setLineDash([28,22]);
    for(let i=1;i<3;i++){const topX=topLeft+(topRight-topLeft)*i/3;const bottomX=bottomLeft+(bottomRight-bottomLeft)*i/3;CTX.lineDashOffset=-roadOffset;CTX.beginPath();CTX.moveTo(topX,topY);CTX.lineTo(bottomX,bottomY);CTX.stroke();}
    CTX.setLineDash([]);
    // Roadside grass.
    CTX.fillStyle='#050a0d';CTX.beginPath();CTX.moveTo(0,topY);CTX.lineTo(topLeft,topY);CTX.lineTo(bottomLeft,bottomY);CTX.lineTo(0,bottomY);CTX.closePath();CTX.fill();CTX.beginPath();CTX.moveTo(W,topY);CTX.lineTo(topRight,topY);CTX.lineTo(bottomRight,bottomY);CTX.lineTo(W,bottomY);CTX.closePath();CTX.fill();
  }

  function drawStar(x,y,scale=1) {
    CTX.save();CTX.translate(x,y);CTX.rotate(-.12);CTX.shadowColor='rgba(255,211,110,.85)';CTX.shadowBlur=18*scale;CTX.fillStyle='#f8cf76';CTX.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const r=(i%2?8:20)*scale;CTX.lineTo(Math.cos(a)*r,Math.sin(a)*r)}CTX.closePath();CTX.fill();CTX.restore();
  }

  function drawBarrel(x,y,scale=1) {
    CTX.save();CTX.translate(x,y);CTX.scale(scale,scale);CTX.shadowColor='rgba(0,0,0,.5)';CTX.shadowBlur=12;CTX.fillStyle='#765039';CTX.strokeStyle='#d2a15f';CTX.lineWidth=3;CTX.beginPath();CTX.roundRect(-22,-28,44,56,8);CTX.fill();CTX.stroke();CTX.fillStyle='#1b2028';CTX.fillRect(-24,-18,48,7);CTX.fillRect(-24,11,48,7);CTX.restore();
  }

  function drawAnimal(x,y,scale=1) {
    CTX.save();CTX.translate(x,y);CTX.scale(scale,scale);CTX.fillStyle='#c48b70';CTX.strokeStyle='#4a2d27';CTX.lineWidth=3;CTX.beginPath();CTX.ellipse(0,4,27,19,0,0,Math.PI*2);CTX.fill();CTX.stroke();CTX.beginPath();CTX.moveTo(-20,-7);CTX.lineTo(-28,-27);CTX.lineTo(-8,-17);CTX.closePath();CTX.fill();CTX.stroke();CTX.beginPath();CTX.moveTo(20,-7);CTX.lineTo(28,-27);CTX.lineTo(8,-17);CTX.closePath();CTX.fill();CTX.stroke();CTX.fillStyle='#f3d0b5';CTX.beginPath();CTX.arc(0,-12,21,0,Math.PI*2);CTX.fill();CTX.stroke();CTX.fillStyle='#222';CTX.beginPath();CTX.arc(-7,-15,2.5,0,Math.PI*2);CTX.arc(7,-15,2.5,0,Math.PI*2);CTX.fill();CTX.fillStyle='#d68d98';CTX.beginPath();CTX.arc(0,-8,3,0,Math.PI*2);CTX.fill();CTX.restore();
  }

  function drawCar(x,y,invulnerable) {
    CTX.save();CTX.translate(x,y);if(shake>0)CTX.translate((Math.random()-.5)*shake,0);CTX.shadowColor='rgba(0,0,0,.6)';CTX.shadowBlur=20;
    CTX.fillStyle='#131820';CTX.fillRect(-39,8,78,58);CTX.fillStyle='#8f2635';CTX.beginPath();CTX.roundRect(-46,-10,92,70,16);CTX.fill();CTX.fillStyle='#d83d50';CTX.beginPath();CTX.roundRect(-36,-28,72,45,18);CTX.fill();
    CTX.fillStyle='#101927';CTX.beginPath();CTX.moveTo(-25,-18);CTX.lineTo(-15,-33);CTX.lineTo(15,-33);CTX.lineTo(25,-18);CTX.closePath();CTX.fill();
    CTX.fillStyle='#1d2a39';CTX.fillRect(-17,-27,34,20);CTX.fillStyle='#f6d27d';CTX.fillRect(-33,13,12,7);CTX.fillRect(21,13,12,7);CTX.fillStyle='#0a0d12';CTX.beginPath();CTX.arc(-29,55,10,0,Math.PI*2);CTX.arc(29,55,10,0,Math.PI*2);CTX.fill();
    CTX.fillStyle='#f3b66e';CTX.beginPath();CTX.arc(0,-42,9,0,Math.PI*2);CTX.fill();CTX.fillStyle='#d8a24f';CTX.fillRect(-11,-48,22,5);
    if(invulnerable){CTX.strokeStyle='rgba(255,226,159,.75)';CTX.lineWidth=3;CTX.shadowColor='rgba(255,226,159,.8)';CTX.shadowBlur=25;CTX.beginPath();CTX.arc(0,12,63+Math.sin(performance.now()/90)*4,0,Math.PI*2);CTX.stroke();}
    CTX.restore();
  }

  function draw(now) {
    const W=CANVAS._logicalW,H=CANVAS._logicalH;
    CTX.clearRect(0,0,W,H);
    drawBackground(now);drawRoad();
    for(const o of objects){const scale=Math.max(.62,Math.min(1.15,o.y/H+0.25));if(o.type==='star')drawStar(o.x,o.y,scale);else if(o.type==='barrel')drawBarrel(o.x,o.y,scale);else drawAnimal(o.x,o.y,scale);}
    drawCar(playerX,H*.82,now<invulnerableUntil);
    if(floating && now<floating.until){CTX.save();CTX.globalAlpha=Math.max(0,(floating.until-now)/900);CTX.textAlign='center';CTX.fillStyle='#f2cb77';CTX.font='700 15px Montserrat,Arial';CTX.fillText(floating.text,W/2,H*.48);CTX.restore();}else floating=null;
    // Soft vignette.
    const vg=CTX.createRadialGradient(W/2,H*.5,W*.25,W/2,H*.5,W*.75);vg.addColorStop(.65,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.42)');CTX.fillStyle=vg;CTX.fillRect(0,0,W,H);
  }

  function loop(now) {
    if(!running)return;
    const dt=Math.min(.032,(now-lastFrame)/1000);lastFrame=now;
    update(dt,now);draw(now);
    if(running) animationFrame=requestAnimationFrame(loop);
  }

  READY.addEventListener('click', startReadySequence);
  BACK_INTRO.addEventListener('click', ()=>window.showQuestMap?.());
  RETURN_RESULT.addEventListener('click', ()=>window.showQuestMap?.());
  RETRY.addEventListener('click', ()=>{RESULT.hidden=true;INTRO.hidden=false;setDeviceInstructions();resetGame();});
  window.addEventListener('resize',()=>{if(!GAME.hidden)resizeCanvas();setDeviceInstructions();});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{if(!GAME.hidden)resizeCanvas();setDeviceInstructions()},80));
  window.addEventListener('keydown',e=>{
    if(!running)return;
    if(e.key==='ArrowLeft'){e.preventDefault();moveLane(-1)}
    if(e.key==='ArrowRight'){e.preventDefault();moveLane(1)}
  },{passive:false});
  CANVAS.addEventListener('pointerdown',e=>{if(deviceType==='mobile')swipeStartX=e.clientX});
  CANVAS.addEventListener('pointerup',e=>{if(deviceType!=='mobile'||swipeStartX===null)return;const dx=e.clientX-swipeStartX;if(Math.abs(dx)>28)moveLane(dx>0?1:-1);swipeStartX=null});
  CANVAS.addEventListener('pointercancel',()=>{swipeStartX=null});
  window.openRoadTripIntro=()=>{setDeviceInstructions();INTRO.hidden=false;GAME.hidden=true;RESULT.hidden=true;resetGame()};
  window.showRoadTripScreen=()=>{document.getElementById('questScreen').hidden=true;document.getElementById('entrance').hidden=true;document.getElementById('roadTripScreen').hidden=false;window.openRoadTripIntro()};
  setDeviceInstructions();resizeCanvas();resetGame();
})();
