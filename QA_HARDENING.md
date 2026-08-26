# QA Hardening — v1.9.0

## Release-Gates
1. Static QA (`qa/static-check.mjs`) — Datei-/Versions-/Architektur-Konsistenz
2. Unit-Tests der reinen Spiellogik (`tests/game-logic.test.cjs`)
3. Security E2E (`security-map.spec.js`)
4. Quest-Map Visual Regression (`visual-map.spec.js`)
5. Runtime Health (`runtime-health.spec.js`)
6. Vollständiger Nutzerpfad inkl. Quest-I-Gewinn und Persistenz

## Architektur-Schutzregel
`qa/project-consistency.mjs` prüft aktiv gegen den Wiedereinzug der alten
Fehlerklasse: gecachte Board-Maße, `translate3d`-Positionierung oder
`--car-x`-CSS-Variablen dürfen in `roadtrip.js` nicht mehr vorkommen. Wird
eines dieser Muster gefunden, schlägt Static QA bewusst fehl.

## QA-Schnittstelle
`window.__ROADTRIP__` ist ungated (kein `?qa=1`-Flag nötig), da Quest I
keine echten Nutzerdaten verarbeitet. Verfügbare Methoden: `getState()`,
`start()`, `move(dir)`, `spawn(type, lane)`, `forceFinish(gameOver)`,
`setElapsed(seconds)`.

## Debug-Overlay
`?debug=1` an die URL anhängen zeigt Live-Werte (Ansicht, Fortschritt pro
Objekt, laufender Zustand) direkt im Bild — kein DevTools-Zugriff nötig.

## Manuelle Testpolitik
Manuelle Prüfung bleibt reserviert für subjektive visuelle Qualität und
Verhalten auf echten Geräten, das sich nicht zuverlässig automatisieren
lässt. Funktionale Regressionen werden so bald wie möglich automatisiert.
