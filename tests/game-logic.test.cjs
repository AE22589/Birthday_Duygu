const assert = require('node:assert/strict');
const L = require('../roadtrip.js');

// Spurwechsel
assert.equal(L.moveLane(1, -1), 0);
assert.equal(L.moveLane(1, 1), 2);
assert.equal(L.moveLane(0, -1), 0, 'darf nicht unter 0 gehen');
assert.equal(L.moveLane(2, 1), 2, 'darf nicht über 2 gehen');
assert.equal(L.clampLane(-5), 0);
assert.equal(L.clampLane(99), 2);

// Wischgesten
assert.equal(L.swipeDirection(-300), -1);
assert.equal(L.swipeDirection(300), 1);
assert.equal(L.swipeDirection(5), 0, 'kleine Bewegungen unterhalb der Schwelle zählen nicht');

// Fortschritt
assert.equal(L.advanceProgress(0, 1000, 2000), 0.5);
assert.equal(L.advanceProgress(0.9, 1000, 2000), 1, 'darf 1 nicht überschreiten');

// Perspektive: Horizont -> Scale MIN, Auto-Position -> Scale MAX
const atHorizon = L.computeVisual(0, 1);
assert.ok(Math.abs(atHorizon.scale - L.CONFIG.MIN_SCALE) < 1e-9, 'Scale am Horizont muss MIN_SCALE sein');
assert.ok(Math.abs(atHorizon.y - L.CONFIG.HORIZON_Y) < 1e-9);

const atCar = L.computeVisual(1, 1);
assert.ok(Math.abs(atCar.scale - L.CONFIG.MAX_SCALE) < 1e-9, 'Scale bei Auto muss MAX_SCALE sein');
assert.ok(Math.abs(atCar.y - L.CONFIG.CAR_Y) < 1e-9);

// Skalierung muss monoton wachsen
let prevScale = -1;
for (let t = 0; t <= 1; t += 0.1) {
  const { scale } = L.computeVisual(t, 1);
  assert.ok(scale >= prevScale, `Scale muss monoton wachsen (t=${t})`);
  prevScale = scale;
}

// Spurfächerung: am Horizont eng beieinander, am Auto weit auseinander
const laneAtHorizon = [0, 1, 2].map(l => L.computeVisual(0, l).x);
const laneAtCar = [0, 1, 2].map(l => L.computeVisual(1, l).x);
const spreadHorizon = laneAtHorizon[2] - laneAtHorizon[0];
const spreadCar = laneAtCar[2] - laneAtCar[0];
assert.ok(spreadCar > spreadHorizon, 'Spuren müssen zur Auto-Position hin auffächern');

// Kollisionszone
assert.equal(L.isInCollisionZone(50), false);
assert.equal(L.isInCollisionZone(80), true);

console.log('PASS: game logic unit QA (reine Logik, kein Browser nötig)');
