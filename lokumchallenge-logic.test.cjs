const assert = require('node:assert/strict');
const L = require('./lokumchallenge.js');

const directions = ['up', 'right', 'down', 'left'];
const opposite = { up: 'down', right: 'left', down: 'up', left: 'right' };
const vectors = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };

assert.equal(L.VERSION, '1.11.1');
assert.equal(L.CONFIG.DURATION, 80);
assert.equal(L.CONFIG.MAZES.length, 2);
assert.equal(L.CONFIG.MAZES[0].size, 9);
assert.equal(L.CONFIG.MAZES[1].size, 11);
assert.equal(L.CONFIG.MAZES[0].treats.length, 8);
assert.equal(L.CONFIG.MAZES[1].treats.length, 12);

function pathToExit(maze) {
  const start = maze.start.join(',');
  const target = maze.exit.join(',');
  const queue = [[maze.start[0], maze.start[1]]];
  const previous = new Map([[start, null]]);
  while (queue.length) {
    const [row, col] = queue.shift();
    if (`${row},${col}` === target) break;
    for (const direction of directions) {
      if (!L.canMove(maze, row, col, direction)) continue;
      const [dr, dc] = vectors[direction];
      const next = [row + dr, col + dc];
      const key = next.join(',');
      if (previous.has(key)) continue;
      previous.set(key, { from: `${row},${col}`, direction });
      queue.push(next);
    }
  }
  assert.ok(previous.has(target), 'Exit must be reachable from the start');
  const path = [];
  for (let key = target; previous.get(key); key = previous.get(key).from) {
    path.unshift(previous.get(key).direction);
  }
  return path;
}

for (const maze of L.CONFIG.MAZES) {
  const validation = L.validateMaze(maze);
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(validation.reachable, maze.size * maze.size);

  for (let row = 0; row < maze.size; row++) {
    for (let col = 0; col < maze.size; col++) {
      for (const direction of directions) {
        if (!L.canMove(maze, row, col, direction)) continue;
        const [dr, dc] = vectors[direction];
        assert.equal(L.canMove(maze, row + dr, col + dc, opposite[direction]), true,
          `${row},${col} ${direction} must be reversible`);
      }
    }
  }
}

for (let mazeIndex = 0; mazeIndex < L.CONFIG.MAZES.length; mazeIndex++) {
  const maze = L.CONFIG.MAZES[mazeIndex];
  const path = pathToExit(maze);
  let state = { ...L.createState(), mazeIndex, row: maze.start[0], col: maze.start[1], collected: [] };
  const start = [state.row, state.col];
  for (const direction of path) {
    const result = L.move(state, direction);
    assert.equal(result.changed, true);
    state = result.state;
  }
  assert.deepEqual([state.row, state.col], maze.exit);
  for (const direction of [...path].reverse()) {
    const result = L.move(state, opposite[direction]);
    assert.equal(result.changed, true);
    state = result.state;
  }
  assert.deepEqual([state.row, state.col], start);
}

let maze2State = { ...L.createState(), mazeIndex: 1, row: 10, col: 0, collected: [] };
for (const direction of ['up', 'up', 'up', 'right']) {
  const result = L.move(maze2State, direction);
  assert.equal(result.changed, true);
  maze2State = result.state;
}
assert.deepEqual([maze2State.row, maze2State.col], [7, 1]);
for (const direction of ['left', 'down', 'down', 'down']) {
  const result = L.move(maze2State, direction);
  assert.equal(result.changed, true);
  maze2State = result.state;
}
assert.deepEqual([maze2State.row, maze2State.col], [10, 0]);

let state = L.createState();
const blocked = L.move(state, 'left');
assert.equal(blocked.changed, false);
assert.strictEqual(blocked.state, state);
assert.deepEqual([state.row, state.col], [8, 0]);

assert.equal(L.grade(18).title, 'LOKUM LEGEND!');
assert.equal(L.grade(15).title, 'TREAT MASTER!');
assert.equal(L.grade(11).title, 'GOOD KITTY!');
assert.equal(L.grade(0).title, 'NICE HUNT!');
assert.equal(L.setElapsed(state, 90).elapsed, 80);

console.log('PASS: Lokum Challenge movement regression QA');

// Exercise the production DOM event wiring, including a touch/pointer/click
// sequence, against the real movement function (no second movement model).
const vm = require('node:vm');
const fs = require('node:fs');
function element() {
  const listeners = new Map();
  return {
    hidden: false, style: {}, dataset: {}, children: [],
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    emit(type, event = {}) { for (const callback of listeners.get(type) || []) callback(event); },
    replaceChildren() { this.children = []; },
    appendChild(child) { this.children.push(child); },
    focus() {}, setPointerCapture() {}
  };
}
const nodes = new Map();
const dom = {
  getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  },
  createElement: element
};
const buttons = directions.map(direction => Object.assign(element(), { dataset: { lcDirection: direction } }));
dom.getElementById('lokumChallengeScreen').querySelectorAll = () => buttons;
let mobile = true;
const win = Object.assign(element(), { matchMedia: () => ({ matches: mobile }) });
vm.runInNewContext(fs.readFileSync(require.resolve('./lokumchallenge.js'), 'utf8'), {
  document: dom, window: win, performance: { now: () => 0 },
  requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} }
});
const game = win.__LOKUMCHALLENGE__;
const position = () => { const s = game.getState(); return [s.row, s.col]; };
function tap(direction) {
  const button = buttons.find(b => b.dataset.lcDirection === direction);
  for (const type of ['touchstart', 'pointerdown', 'touchend', 'pointerup', 'click']) button.emit(type);
}
game.start();
game.forceExit(); // Maze 2 begins with a long corridor: a duplicate step is observable.
assert.deepEqual(position(), [10, 0]);
tap('up'); assert.deepEqual(position(), [9, 0], 'one tap must produce exactly one step');
tap('down'); assert.deepEqual(position(), [10, 0]);
tap('up'); tap('up'); tap('up');
tap('right'); assert.deepEqual(position(), [7, 1]);
tap('left'); assert.deepEqual(position(), [7, 0]);
const mazeNode = dom.getElementById('lcMaze');
mazeNode.emit('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
mazeNode.emit('pointerup', { pointerId: 1, clientX: 100, clientY: 150 });
assert.deepEqual(position(), [8, 0], 'swipe still uses one grid step');
tap('left'); assert.deepEqual(position(), [8, 0], 'D-pad cannot cross walls');
mobile = false;
tap('down'); assert.deepEqual(position(), [8, 0], 'D-pad is inactive on desktop');
win.emit('keydown', { key: 'ArrowDown', preventDefault() {} });
assert.deepEqual(position(), [9, 0], 'desktop arrow keys are unchanged');
mobile = true;
dom.getElementById('lokumChallengeScreen').hidden = true;
tap('down'); assert.deepEqual(position(), [9, 0], 'hidden quest ignores D-pad input');
console.log('PASS: Quest IV D-pad single-step, walls, swipe, desktop and visibility guards');
