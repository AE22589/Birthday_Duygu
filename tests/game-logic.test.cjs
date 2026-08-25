const assert = require('node:assert/strict');
const { LANES, clampLane, moveLane, swipeDirection } = require('../game-logic.js');

assert.deepEqual(LANES, [25, 50, 75]);
assert.equal(moveLane(1, -1), 0);
assert.equal(moveLane(1, 1), 2);
assert.equal(moveLane(0, -1), 0);
assert.equal(moveLane(2, 1), 2);
assert.equal(moveLane(1, 0), 1);
assert.equal(clampLane(-99), 0);
assert.equal(clampLane(99), 2);
assert.equal(swipeDirection(300, 100), -1);
assert.equal(swipeDirection(100, 300), 1);
assert.equal(swipeDirection(200, 210), 0);
console.log('PASS: game logic unit QA');
