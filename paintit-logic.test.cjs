const assert = require('node:assert/strict');
const L = require('../paintit.js');

// Grid-Grundlagen
const grid0 = L.createGrid(6, 6);
assert.equal(grid0.length, 36);
assert.ok(grid0.every(p => p === 0));

// Zell-Index-Umrechnung
assert.equal(L.cellIndex(6, 0, 0), 0);
assert.equal(L.cellIndex(6, 1, 0), 6);
assert.equal(L.cellIndex(6, 0, 5), 5);
assert.deepEqual(L.rowColFromIndex(6, 7), { row: 1, col: 1 });

// Ein Anstrich erhöht genau ein Feld um 1, alle anderen bleiben unverändert
let grid = L.paintCell(grid0, 0, 4);
assert.equal(grid[0], 1);
assert.equal(grid[1], 0);
assert.notEqual(grid, grid0, 'paintCell darf das Original nicht mutieren (reine Funktion)');

// Vier Durchgänge = vollständig gedeckt, ein fünfter darf nicht überlaufen
for (let i = 0; i < 10; i++) grid = L.paintCell(grid, 0, 4);
assert.equal(grid[0], 4, 'darf 4 (PASSES_NEEDED) nicht überschreiten');

// Deckungsgrad: ein volles Feld von 36 macht 1/36 Gesamtdeckung
assert.ok(Math.abs(L.coverage(grid, 4) - 1 / 36) < 1e-9);

// Pfotenabdruck: nur auf vollständig gestrichenen Feldern wirksam
const partially = L.paintCell(L.createGrid(2, 1), 1, 4); // Feld 1 nur 1x gestrichen
const afterPawOnPartial = L.applyPawPrint(partially, 1, 4);
assert.equal(afterPawOnPartial[1], 1, 'Pfotenabdruck darf halb gestrichene Felder nicht zurücksetzen');

const full = L.paintCell(L.paintCell(L.paintCell(L.paintCell(L.createGrid(2, 1), 1, 4), 1, 4), 1, 4), 1, 4);
assert.equal(full[1], 4);
const afterPawOnFull = L.applyPawPrint(full, 1, 4);
assert.equal(afterPawOnFull[1], 0, 'Pfotenabdruck muss ein vollständiges Feld auf 0 zurücksetzen');

// Zeiger-zu-Zelle-Umrechnung (normalisierte Koordinaten 0..1)
assert.equal(L.cellFromPoint(0, 0, 6, 6), 0);
assert.equal(L.cellFromPoint(0.99, 0.99, 6, 6), 35);
assert.equal(L.cellFromPoint(0.5, 0.5, 6, 6), L.cellIndex(6, 3, 3));
// Randfälle dürfen nicht außerhalb des Rasters landen
assert.equal(L.cellFromPoint(-1, -1, 6, 6), 0);
assert.equal(L.cellFromPoint(2, 2, 6, 6), 35);

// Bewertung nach Fertigstellungsgrad
assert.equal(L.grade(1).tier, 'perfect');
assert.equal(L.grade(0.95).tier, 'success');
assert.equal(L.grade(0.9).tier, 'success');
assert.equal(L.grade(0.89).tier, 'incomplete');
assert.equal(L.grade(0.4).tier, 'incomplete');

console.log('PASS: Paint-It logic unit QA (reine Logik, kein Browser nötig)');
