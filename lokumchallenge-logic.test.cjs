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
  const queue = [[maze.start[0], maze.start[1]];
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
