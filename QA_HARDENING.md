# QA Hardening — v1.10.0

## Release-Gates
1. Static QA (`qa/static-check.mjs`) — Datei-/Versions-/Architektur-Konsistenz
2. Unit-Tests der reinen Spiellogik (`tests/game-logic.test.cjs`,
   `tests/paintit-logic.test.cjs`)
3. Security E2E (`security-map.spec.js`)
4. Quest-Map Visual Regression (`visual-map.spec.js`)
5. Runtime Health (`runtime-health.spec.js`)
6. Quest II Funktionstests (`paintit.spec.js`)
7. Vollständiger Nutzerpfad inkl. Quest-I- und Quest-II-Gewinn und
   Persistenz

## Architektur-Schutzregel
`qa/project-consistency.mjs` prüft aktiv gegen den Wiedereinzug der alten
Fehlerklasse: gecachte Board-/Wand-Maße, `translate3d`-Positionierung
oder `--car-x`-CSS-Variablen dürfen weder in `roadtrip.js` noch in
`paintit.js` vorkommen. Zusätzlich wird geprüft, dass `paintit.js` (und
jedes künftige Quest-Modul) echt lazy geladen bleibt, nicht statisch in
`index.html` eingebunden wird. Wird eines dieser Muster verletzt, schlägt
Static QA bewusst fehl.

## QA-Schnittstellen
`window.__ROADTRIP__` und `window.__PAINTIT__` sind ungated (kein
`?qa=1`-Flag nötig), da beide Quests keine echten Nutzerdaten
verarbeiten.
- Quest I: `getState()`, `start()`, `move(dir)`, `spawn(type, lane)`,
  `forceFinish(gameOver)`, `setElapsed(seconds)`.
- Quest II: `getState()`, `start()`, `paintAt(row, col)`,
  `pawPrintAt(row, col)`, `setElapsed(seconds)`, `forceFinish()`.

## Debug-Overlay
`?debug=1` an die URL anhängen zeigt Live-Werte direkt im Bild — kein
DevTools-Zugriff nötig. Quest I zeigt sein Panel oben links, Quest II
oben rechts (beide können parallel eingeblendet sein, ohne sich zu
überlappen).

## Manuelle Testpolitik
Manuelle Prüfung bleibt reserviert für subjektive visuelle Qualität und
Verhalten auf echten Geräten, das sich nicht zuverlässig automatisieren
lässt. Funktionale Regressionen werden so bald wie möglich automatisiert.
