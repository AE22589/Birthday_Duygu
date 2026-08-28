const assert = require('node:assert/strict');
const L = require('../sucukmaster.js');

assert.equal(L.CONFIG.SLOT_COUNT, 4);
assert.equal(L.CONFIG.SIDE_DURATION_MS, 6000);
assert.equal(L.CONFIG.SUCCESS_MIN, 0.65);
assert.equal(L.CONFIG.SUCCESS_MAX, 0.90);

let slots = L.createSlots();
assert.equal(slots.length, 4);
assert.ok(slots.every(s => s.state === 'empty'));

let spawned = L.spawnSlice(slots, 1000);
assert.equal(spawned.index, 0);
slots = spawned.slots;
assert.equal(slots[0].state, 'active');

assert.equal(L.progress(1000, 1000), 0);
assert.equal(L.progress(1000, 4600), 0.6);
let result = L.clickSlot(slots[0], 0.50);
assert.equal(result.action, 'none');
result = L.clickSlot(slots[0], 0.65);
assert.equal(result.action, 'finish');
assert.equal(result.slot.state, 'done');

let burnt = {...slots[0], state:'burnt'};
result = L.clickSlot(burnt, 0.99);
assert.equal(result.action, 'clear');
assert.equal(result.slot.state, 'empty');

const advanced = L.advanceSlot({...slots[0], state:'active', startAt:0}, 1);
assert.equal(advanced.state, 'burnt');

let full = L.createSlots();
for(let i=0;i<4;i++) full = L.spawnSlice(full, i * 10).slots;
assert.equal(full.filter(s=>s.state==='active').length, 4);
const noSpace = L.spawnSlice(full, 99);
assert.equal(noSpace.index, -1);

assert.equal(L.grade(10).tier, 'master');
assert.equal(L.grade(9).tier, 'pro');
assert.equal(L.grade(8).tier, 'pro');
assert.equal(L.grade(7).tier, 'well');
assert.equal(L.grade(5).tier, 'well');
assert.equal(L.grade(4).tier, 'incomplete');

console.log('PASS: Sucuk Master logic unit QA');
