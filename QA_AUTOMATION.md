# QA Automation — v1.10.0

## Upload
Repository-Inhalte durch den Inhalt dieses Ordners ersetzen, inklusive
`.github/workflows/qa.yml`. Einmalig committen.

## Automatisierte Gates
1. Static QA: Datei-/Asset-/Versions-Konsistenz, Architektur-Schutzregel
   gegen die alte Board-Cache-Fehlerklasse (gilt für `roadtrip.js` und
   `paintit.js` gleichermaßen).
2. Unit-Tests der reinen Spiellogik beider Quests (kein Browser nötig).
3. Browser QA: Chromium/WebKit auf den konfigurierten Viewports.
4. Kompletter Nutzerpfad Quest I: Entwickler-Gate → Quest Map → Quest I →
   Ready → Spielen → Gewinnen → Persistenz → Quest II entsperrt.
5. Kompletter Nutzerpfad Quest II: Sperre vor Quest-I-Abschluss, Lazy-
   Loading, Bemalen, Pfotenabdruck-Regel, Bewertungsstufen, Persistenz.

## GitHub
Nach dem Commit unter „Actions" den Workflow **Quest QA** prüfen. Ein
Release gilt erst als QA-bestanden, wenn Static QA und Browser QA beide
grün sind.

## Lokal
`npm install`, dann `npm run qa:static` und `npm run qa:e2e`.
