const assert = require('node:assert/strict');
const fs = require('node:fs');
const questions = require('../wordchallenge.js').questions;
const source = fs.readFileSync('wordchallenge.js', 'utf8');

const words = ['LÜFTEN', 'GARDINE', 'PÜNKTLICH', 'SCHMETTERLING', 'SCHUBLADE', 'GEMÜTLICH', 'STUR', 'QUATSCH', 'FEIERABEND', 'ZWICKMÜHLE'];
const correct = ['A', 'B', 'C', 'C', 'A', 'B', 'C', 'A', 'C', 'B'];
assert.equal(questions.length, 10);
assert.deepEqual(questions.map(question => question.word), words);
questions.forEach((question, index) => {
  assert.equal(question.answers.length, 3);
  assert.deepEqual(Object.keys(question.answers), ['0', '1', '2']);
  assert.match(question.correct, /^[ABC]$/);
  assert.equal(question.correct, correct[index]);
});
assert.match(source, /answered\s*=\s*true/);
assert.match(source, /if \(phase !== 'QUESTION' \|\| answered\) return/);
assert.match(source, /if \(phase !== 'ANSWERED'\) return/);
assert.match(source, /questionIndex === WORD_CHALLENGE_QUESTIONS\.length - 1\) \{ completeWordChallenge\(\)/);
assert.match(source, /value === 10/);
assert.match(source, /value >= 8/);
assert.match(source, /value >= 6/);
assert.match(source, /FAST VERDÄCHTIG/);
assert.match(source, /if \(!completed\.includes\(7\)\) completed\.push\(7\)/);
assert.match(source, /new Set\(completed\)/);
console.log('PASS: Quest VII content, answer order, lock, progression and completion guards');
