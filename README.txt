Duygu's Birthday Quest — v1.10.0

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
Quest I: central spawn validation checks full future sprite paths, with larger
spacing near the car and a reaction gap between stars and hazards. Unsafe spawns
are skipped. Star spawns remain random, but move to another lane after three
consecutive stars in one lane. The larger stars, detailed CSS arcade car and layered neon skyline
use roadtrip-visual.css; controls, hitboxes, timer and rewards remain unchanged.
- 3 Fahrspuren, Pfeiltasten (← →) oder Wischen zum Spurwechsel.
- Sterne sammeln, Tonnen/Katzen ausweichen.
- 60 Sekunden, 3 Leben, 15 Sterne zum Freischalten von Schlüssel I.
- Bei Erfolg: Persistenz über denselben `localStorage`-Schlüssel wie der
  Rest der Seite (`duyguBirthdayQuestState_v1`), unverändertes Format.

QUESTS II–VII
QUEST-002 "Paint It!" ist jetzt vollständig umgesetzt (siehe unten).
QUEST-003 bis QUEST-007 sind weiterhin gesperrt und fachlich offen.

QUEST II: PAINT IT! — Arcade Edition (neu, v1.10.0)
Duygu und Lokum erscheinen als Sprites im Spiel (Fachkonzept Abschnitt 14
korrigiert — ursprünglich zurückgestellt, jetzt mit passendem
Illustrations-Material umgesetzt). Ein 6×6-Raster stellt eine Wand dar;
Ziehen mit Maus/Finger streicht Felder ein. Jedes Feld braucht 4
Durchgänge, bis es vollständig gedeckt ist — einmaliges Berühren reicht
bewusst nicht, das verlängert die Spieldauer auf ein realistisches
Fenster von 25-40 Sekunden und gibt Lokum eine echte Chance zu stören.
Lokum hinterlässt in unregelmäßigen Abständen (4-6.4s) Pfotenabdrücke auf
bereits vollständig gestrichenen Feldern — diese fallen auf 0 zurück und
müssen neu gestrichen werden. Duygu folgt der Zeigerposition sanft
(CSS-Transition, kein Eins-zu-eins-Kleben am Cursor, damit der Finger auf
Mobile die eigene Arbeit nicht verdeckt); ein kleiner, präziser
Rollen-Cursor trägt die tatsächliche Mal-Interaktion.

- 60 Sekunden Zeitlimit, kein Leben-System, kein vorzeitiges Game Over.
- 100% Deckung beendet die Runde sofort (Bestwertung "SPOTLESS!").
- 90-99% bei Zeitablauf: Erfolg ("WALL COMPLETE"), Schlüssel II.
- Unter 90% bei Zeitablauf: "NOT QUITE THERE", kein Schlüssel, sofort
  erneut spielbar (kein Reset nötig).
- Einzelne Wandfarbe (Cyan), passend zum bestehenden Arcade-Farbschema.
- Die Spielansicht zeigt dauerhaft die tatsächlichen 4 Durchgänge pro Feld;
  bei neuen Pfotenabdrücken erscheint ein kurzer Hinweis zum Überstreichen.

ARCHITEKTURREGEL FÜR QUESTS II–VII (verbindlich, siehe
PROJECT_REQUIREMENTS.docx Abschnitt 9) — bei QUEST-002 erstmals
angewendet, gilt unverändert für QUEST-003 bis QUEST-007:
Jede neue Quest wird wie QUEST-001 als eigenständiges JS-Modul gebaut,
lazy nachgeladen über eine ensure<Quest>Loaded()-Funktion (Vorbild:
ensureRoadTripLoaded() in script.js). Einheitliches schmales Interface
(show...Screen()), sauberer Rückweg zur Quest Map, Fortschritt weiterhin
über denselben State-Schlüssel duyguBirthdayQuestState_v1. Keine
gecachten Pixelmaße für Spielfeld-Geometrie — nur Prozent-/
Transform-Positionierung wie in QUEST-001. Jede Quest bleibt unabhängig
testbar und darf bestehende Quests nicht beeinflussen.

SPRACHE
Das gesamte Spiel ist konsequent auf Englisch (siehe
PROJECT_REQUIREMENTS.docx Abschnitt 10).

SICHERHEITS-GATE
5 Klicks auf die Tür innerhalb des Zeitfensters öffnen den Entwickler-
Zugang, Code 1337 schaltet die Quest Map frei. Bei 3 falschen Code-
Eingaben wird die Eingabe für 24 Stunden gesperrt (übersteht Neuladen,
liegt in localStorage).

QUEST-DURCHGÄNGE
Abgeschlossene Quests lassen sich über die Quest Map jederzeit erneut
öffnen und spielen — praktisch zum Testen, ohne Fortschritt zurücksetzen
oder den Browser schließen zu müssen. Der gespeicherte Fortschritt
(Schlüssel, Freischaltung der nächsten Quest) bleibt davon unberührt.

VERSION
v1.10.0

QUEST III — SUCUK MASTER (v1.11.0)
Quest III is implemented as a lazy-loaded independent module. It uses the approved
individual production assets from the project root. The pure timing/state logic is
unit-tested and the browser flow has a dedicated Playwright E2E suite. Quest III uses
four pan slots, one browning cycle per sucuk, a 65–90% golden success window, a
60-second round, and the approved result/key thresholds from the current design concept.
The intro legend states the actual minimum of five successfully served sucuks.

The current approved gameplay/design source is PROJECT_REQUIREMENTS.docx (concept v2.0).

QUEST V — MEMORY LANE
Quest V is a lazy-loaded 4×4 Memory with eight shuffled image pairs. Cards use
the shared neon arcade back, contain their full front image without cropping,
and support click/tap interaction. Two cards may be open at once; matches stay
open while non-matches turn back after a short delay. There is no time limit.
Finding all eight pairs keeps the completed board visible for a short, subtle
celebration before storing Quest 5 in the shared progress state and unlocking
Quest VI through the existing map progression.

QUEST VI — OUR LITTLE PUZZLE
Quest VI is a lazy-loaded 2×3 placement puzzle with six image pieces and six
empty board slots. A permanent uncropped reference image is displayed beside the
board on desktop and above it on mobile. On desktop, pieces can be dragged from
the shuffled palette into any free slot and back; on mobile, tap a piece and then
a free slot, with placed pieces returnable to the palette. There is no time limit,
and the quest succeeds only when all six pieces occupy their exact matching slots.
Solving it stores Quest 6 in the shared progress state and unlocks Quest VII.
The mobile game view keeps a compact tap instruction visible and uses a compact
three-panel layout for reference, board, and pieces.

QUEST VII — GERMAN WORD CHALLENGE
Quest VII uses ten fixed German words in this order: LÜFTEN, GARDINE,
PÜNKTLICH, SCHMETTERLING, SCHUBLADE, GEMÜTLICH, STUR, QUATSCH, FEIERABEND,
ZWICKMÜHLE. Each question has exactly three fixed English answers A, B and C;
neither the questions nor the answer order is randomized. There is no timer.
Each selection gives immediate CORRECT/Wrong feedback and locks the question.
The player advances only with NEXT WORD, never automatically. The score is out
of 10. Results are KEEP LEARNING! (0–5), GOOD JOB! (6–7), VERY IMPRESSIVE!
(8–9) or GERMAN MASTER! (10); FAST VERDÄCHTIG is shown for scores 8–10.
After the complete quiz, Quest 7 is stored in the shared progress state.

ENTRANCE-ZEITREISE
Nach dem regulären Öffnen der Entrance-Tür oder dem Entrance-Developer-Hack
mit 5 Klicks und Code 1337 erscheint vor der Quest Map eine gemeinsame
Zeitreise-Transition: vier atmosphärische Texttafeln, danach das Gewitter-GIF,
die Abschlusszeile „I don’t think we’re in 2026 anymore.“ und anschließend die
Quest Map. Die Transition läuft einmalig und verändert keinen Progress-State.

QA-DEVELOPER-HINWEIS
Auf der Quest Map fünfmal auf den freien Hintergrund klicken oder tippen und
den Code 1337 eingeben, um alle Quests für die aktuelle Browser-Session
startbar zu machen. Der temporäre Unlock liegt ausschließlich in
sessionStorage (`duyguQaUnlockAll_v1`); der echte completed-State bleibt
unverändert. Reguläre Quest-Abschlüsse werden weiterhin normal gespeichert.

QUEST IV — LOKUM'S CHALLENGE
Quest IV uses the two approved arcade maze graphics and their matching data from
quest4-maze-spec.json. Each arrow-key, WASD, or swipe input moves Lokum exactly
one grid cell after a wall check; diagonal and free pixel movement are not used.
Every input is resolved as one immediate atomic grid step; there is no input
buffer or intermediate position. Lokum and every Treat stay centered in their
grid cells, and idle/walk sprites use the same render size and anchor point.
The total Quest-IV round duration is 80 seconds.
Mobile Quest IV (up to 700px): a large, nearly full-width maze, compact
MAZE/TIME/TREATS status, D-pad + Swipe, and the unchanged legend below the
maze/D-pad. Each D-pad tap uses the existing one-cell, wall-checked move.
The mobile cabinet follows its content and respects iPhone safe areas;
desktop presentation, both mazes, timer, treats and completion stay unchanged.
Mobile styles are isolated in lokumchallenge-mobile.css; style.css is untouched.

QUEST MAP — ARCADE HALL
The Quest Map uses the animated `arcade map.gif` as its permanent 80s arcade
background. The seven arcade machines are direct quest hotspots and the central
Final Door remains a separate hotspot. READY, LOCKED, and DONE states are shown
on or near the machines; the right-hand status legend is not rendered separately
and the left hint box remains part of the artwork. Progression, completed-state
storage, and the Map QA unlock remain unchanged.
Completed quests also light the seven key slots above the Final Door from left to
right; this uses only unique completed quest IDs 1–7, and QA unlocks do not count.
The Final Door stays locked until all seven real completions are present. Before
then it shows “The door needs all seven keys.” At 7/7 it opens the final popup;
`OPEN THE FINAL DOOR` is reserved for the later return journey.
After activation, the return journey shows three text beats, then `returntime.gif`,
followed by `WELCOME BACK.` and `There's one last thing for you.` The endscreen
remains visible; a personal video will be added in a later step.
Before 8 September 2026 00:00, five quick Final Door clicks can open the existing
admin dialog; code 1337 enables the session-only `duyguQaFinalComplete_v1` test
state. It simulates 7/7 without changing `completed` and is inert after the cutoff.
Bei effektivem 7/7 markiert ein permanenter SVG-CTA THE FINAL DOOR IS READY / OPEN THE DOOR
die Final Door. Nach der Rueckreise bleiben WELCOME BACK. und There's one last thing for you.
gemeinsam sichtbar; der Videoscreen folgt spaeter.
Beim Wechsel auf effektives 7/7 reagieren die Keyholes nach einer kurzen Pause
nacheinander, bevor der permanente Final-Door-CTA erscheint.
Der grosse Circle-Glow ist entfernt. Nach der ca. 280-ms-Keyhole-Sequenz erscheint
das rein dekorative Effect-only-Overlay `final-door-energy-effects-overlay-large.apng`
mit transparenten Licht-/Energieeffekten (`pointer-events:none`), das erst nach der
Keyhole-Unlock-Sequenz bei effektivem 7/7 eingeblendet wird;
der vorhandene Final-Door-Hotspot bleibt unverändert; mobil ergänzt ein großer
CTA dieselbe Öffnen-Aktion außerhalb der Map.
Der erste Rueckreise-Text lautet `One last trip.`. Der finale Return-Endscreen zeigt anschliessend dauerhaft `WELCOME BACK.`, den
ruhigen Videoscreen mit dem Label `A MESSAGE FROM HOME`, dem Platzhalter `Testvideo.mp4` und dem manuellen Button
`PLAY MY MESSAGE` (mit `Turn the sound on.`). Das Video startet nicht automatisch,
verwendet nach dem Start native Controls und zeigt nach dem Ende `Happy Birthday,
Duygu. 🤍`. Ein erneuter QA-Run setzt den Videoplayer auf Anfang und blendet den
Play-Button wieder ein; das Platzhaltervideo wird spaeter ersetzt.
Nach dem echten Video-Ende folgt der separate Screen `ONE LAST CHOICE`; `CONTINUE`
öffnet `YOUR TURN` mit den drei strukturellen Auswahlkarten ACTION, CULINARY und
RELAX. Die Auswahl ist ausschließlich lokaler UI-State ohne Persistenz, Backend,
Fetch oder Formular. Das Kartendesign bleibt bewusst austauschbar und wird später
finalisiert; `REPLAY VIDEO` führt zurück zum unveränderten Videoscreen.
