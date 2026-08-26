# QA-Bericht — Duygu's Birthday Quest v1.9.0

## Freigabe-Entscheidung
Quest I wurde komplett neu gebaut (siehe README.txt für die fachliche
Begründung). Static QA, Preflight und Unit-Tests laufen lokal grün.
Ein vollständiger Browser-Lauf über alle Projekte (Desktop/Mobile/WebKit)
steht noch aus — bitte vor Live-Freigabe über `Quest QA` (GitHub Actions)
laufen lassen.

## Was geprüft wurde (Node-Ebene, tatsächlich ausgeführt)
- `node --check` auf allen JS-Dateien: PASS
- `node qa/preflight.mjs`: PASS (v1.9.0)
- `node qa/static-check.mjs`: PASS
- `node tests/game-logic.test.cjs`: PASS — reine Logik (Spurwechsel,
  Perspektivskalierung, Spurfächerung, Kollisionszone), ganz ohne Browser

## Was geprüft wurde (Browser-Ebene, tatsächlich ausgeführt)
- Kompletter Nutzerpfad: Tür-Code → Quest Map → Quest I → Spielen →
  Gewinnen → Schlüssel-Persistenz (`localStorage`) → zurück zur Map →
  Quest II entsperrt — alle Schritte bestätigt.
- Sichtbare Objektbewegung über echte Bounding-Box-Messung nachgewiesen
  (nicht nur interne Zustandswerte).
- Keine JavaScript-Laufzeitfehler während des gesamten Flows.
- `security-map.spec.js`: alle Tests grün.

## Bekannte Einschränkung dieser Prüfung
`runtime-health.spec.js` schlägt in der aktuellen Testumgebung wegen eines
blockierten externen Google-Fonts-Requests fehl (Netzwerk-Sandbox-Effekt,
nicht code-bedingt). Die eigentlichen Spiellogik-Assertions in denselben
Tests liefen durch, bevor die Fehler-Prüfung anschlug. Bitte in einer
Umgebung mit normalem Netzwerkzugriff (z. B. GitHub Actions) erneut prüfen.

## Architektur-Hinweis für künftige Änderungen
Positionierung läuft ausschließlich über Prozentwerte (`top`/`left`).
**Keine** gecachten Pixelwerte für Spielfeld-Maße einführen — das war die
Ursache der meisten Bugs der vorherigen Version. `qa/project-consistency.mjs`
enthält einen automatischen Check gegen den Wiedereinzug dieses Musters.
