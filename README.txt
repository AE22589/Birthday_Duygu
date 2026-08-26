Duygu's Birthday Quest — v1.9.0

Quest I: The Road Trip — Arcade Edition (kompletter Neubau)

FACHLICHE ENTSCHEIDUNG
Quest I wurde komplett neu gebaut. Die frühere, foto-realistische Umsetzung
(personalisiertes Konzept-Artwork als visuelle Quelle der Wahrheit) wurde
durch einen bewusst einfachen, robusten Retro-Arcade-Look ersetzt — reine
CSS-Formen statt Bild-Assets. Diese Entscheidung wurde explizit getroffen,
um Stabilität über visuelle Fototreue zu stellen, nachdem die vorherige
Architektur wiederholt schwer zu diagnostizierende Laufzeitfehler zeigte.

WARUM DER NEUBAU
Die vorherige Implementierung kombinierte CSS-Layout-Positionierung mit
gecachten Pixelwerten (Board-Breite/-Höhe), was mehrere Klassen von Bugs
verursachte: einen Absturz durch falsche Variablen-Initialisierungsreihen-
folge, ein sichtbares "Rutschen" der Autoposition beim Spielstart, und
Testinstabilität. Die neue Architektur verwendet ausschließlich Prozent-
werte für Positionierung — dieselbe Fehlerklasse kann strukturell nicht
mehr auftreten.

ARCHITEKTUR
- Nur Prozentwerte (top/left) für Positionierung. Kein gecachter
  Zwischenspeicher für Spielfeld-Maße, keine Stale-Value-Möglichkeit.
- Reine Spiellogik (Perspektivskalierung, Fortschritt, Kollisionszone) ist
  von der DOM-Darstellung getrennt und ganz ohne Browser mit
  `node tests/game-logic.test.cjs` testbar.
- Keine Bild-Assets für Quest I — reine CSS-Formen (Auto, Sterne,
  Hindernisse, Skyline, Menge). Kein Asset kann fehlschlagen oder falsch
  cachen.
- Ein Bildschirm-Zustand (`view`: intro/game/result), eine Funktion zum
  Wechseln.

SPIELABLAUF
- 3 Fahrspuren, Pfeiltasten (← →) oder Wischen zum Spurwechsel.
- Sterne sammeln, Tonnen/Katzen ausweichen.
- 60 Sekunden, 3 Leben, 15 Sterne zum Freischalten von Schlüssel I.
- Bei Erfolg: Persistenz über denselben `localStorage`-Schlüssel wie der
  Rest der Seite (`duyguBirthdayQuestState_v1`), unverändertes Format.

QUESTS II–VII
Unverändert gegenüber der vorherigen Version — weiterhin gesperrt, fachliche
Ausgestaltung offen (siehe PROJECT_REQUIREMENTS.docx).

SICHERHEITS-GATE
Unverändert: 5 Klicks auf die Tür innerhalb des Zeitfensters öffnen den
Entwickler-Zugang, Code 1337 schaltet die Quest Map frei.

VERSION
v1.9.0
