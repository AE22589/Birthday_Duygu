const assert = require('node:assert/strict');
const L = require('../lokumchallenge.js');

assert.equal(L.VERSION, '1.11.0');
assert.equal(L.CONFIG.DURATION, 60);
assert.equal(L.CONFIG.MAZES.length, 2);
assert.equal(L.CONFIG.MAZES[0].size, 9);
assert.equal(L.CONFIG.MAZES[1].size, 11);
assert.equal(L.CONFIG.MAZES[0].treats.length, 8);
assert.equal(L.CONFIG.MAZES[1].treats.length, 12);

let state = L.createState();
assert.deepEqual([state.row, state.col], [8, 0]);
assert.deepEqual(L.CONFIG.MAZES[0].exit, [0, 8]);
assert.deepEqual(L.CONFIG.MAZES[1].start, [10, 0]);
assert.deepEqual(L.CONFIG.MAZES[1].exit, [0, 10]);

const step = (s, direction) => L.move(s, direction).state;
assert.equal(L.move(state, 'left').changed, false);
assert.equal(L.move(state, 'down').changed, false);

// Follow the known shortest exit route for Maze 1.
const maze1Route = ['right','up','right','right','up','right','right','up','up','right','down','right','right','up','up','up','up','up'];
for (const direction of maze1Route) state = step(state, direction);
assert.deepEqual([state.row, state.col], [0, 8]);
assert.equal(L.reachExit(state), true);
state = L.advanceMaze(state);
assert.deepEqual([state.row, state.col], [10, 0]);
assert.equal(state.mazeIndex, 1);

// Collect one Maze-2 treat and verify it is collected only once.
for (let i=0;i<4;i++) state = step(state, 'up');
assert.equal(L.treatCount(state), 2);
state = step(state, 'down');
state = step(state, 'up');
assert.equal(L.treatCount(state), 2);

assert.equal(L.grade(18).title, 'LOKUM LEGEND!');
assert.equal(L.grade(17).title, 'TREAT MASTER!');
assert.equal(L.grade(15).title, 'TREAT MASTER!');
assert.equal(L.grade(14).title, 'GOOD KITTY!');
assert.equal(L.grade(11).title, 'GOOD KITTY!');
assert.equal(L.grade(10).title, 'NICE HUNT!');
assert.equal(L.grade(0).title, 'NICE HUNT!');

const finished = L.finish(state);
assert.equal(finished.finished, true);
assert.equal(finished.running, false);
const failed = L.fail(state);
assert.equal(failed.failed, true);
assert.equal(failed.running, false);
assert.equal(L.setElapsed(state, 90).elapsed, 60);

console.log('PASS: Lokum Challenge logic unit QA');
