# QUEST-001 „The Road Trip" — Rebuild-Spezifikation für robuste Objektbewegung

**Zweck dieses Dokuments:** Diese Datei an ChatGPT geben, zusammen mit den bestehenden Dateien
`roadtrip.js` und `style.css`. Sie beschreibt exakt, was geändert werden soll, warum, und wie —
ohne das Gameplay selbst zu verändern (Fahrgefühl, Sterne sammeln, Hindernissen ausweichen
bleiben fachlich identisch).

---

## 1. Diagnose: Warum "nur das Auto bewegt sich"

Im aktuellen Code gibt es einen entscheidenden Unterschied zwischen Auto und Spielobjekten
(Sterne/Tonnen/Katzen):

| | Auto | Sterne/Tonnen/Katzen |
|---|---|---|
| Wird bewegt über | `style.left` (CSS-Layout-Eigenschaft) | `style.left` + `style.top` (CSS-Layout-Eigenschaften) |
| Wie oft pro Sekunde | Nur bei Spurwechsel (max. 2–3×) | **Jeden Frame, ~60×/Sekunde, pro Objekt** |
| Von CSS `transition` unterstützt | Ja (glättet den seltenen Sprung) | Nein (jeder Frame ein harter Sprung) |

`left`/`top` sind **Layout-Eigenschaften**: Jede Änderung zwingt den Browser zu einem Reflow
(Neuberechnung von Position/Größe aller betroffenen Elemente), bevor er neu zeichnen kann. Beim
Auto passiert das selten genug, um auf jeder Hardware unproblematisch zu sein. Bei den
Spielobjekten passiert es **kontinuierlich, mehrfach pro Frame, für mehrere Objekte
gleichzeitig** — auf schwächerer, virtualisierter oder eingeschränkter Grafik-Pipeline (Firmen-
Notebook, Remote-Desktop/VDI, deaktivierte Hardwarebeschleunigung) kann der Browser das
drosseln oder die sichtbaren Repaints ausfallen lassen, obwohl die JavaScript-Werte im
Hintergrund längst korrekt weiterlaufen.

**Kernidee des Rebuilds:** Objekte dürfen während der Animation **niemals** `left`/`top`
anfassen. Nur noch `transform` — das ist die einzige Eigenschaft, die praktisch jeder Browser
direkt an die GPU durchreicht, ganz ohne Reflow.

---

## 2. Architekturprinzip

1. **Ein Fortschrittswert pro Objekt** (`progress`, 0→1) bleibt wie bisher die einzige
   Quelle der Wahrheit für Position, Skalierung und Spurbreite. **Das ändert sich nicht.**
2. Die **Spielfeld-Geometrie** (Breite/Höhe von `#roadBoard` in Pixel) wird **einmalig
   gemessen und zwischengespeichert** — nicht mehr implizit bei jedem Frame über
   Prozent-Strings neu interpretiert. Neu gemessen wird nur bei `resize`/`orientationchange`.
3. **Prozent → Pixel** wird in JavaScript berechnet (`board.width * anteil`), das Ergebnis
   fließt fertig in Pixeln in `translate3d()`. Damit bezieht sich nichts mehr versehentlich
   auf die Objektgröße selbst (das war der ursprüngliche Bug).
4. `left`/`top` werden bei Objekten **nur ein einziges Mal beim Erzeugen** auf `0` gesetzt
   und danach nie wieder angefasst.
5. `will-change: transform` auf Objekte und Auto, damit der Browser sie frühzeitig auf einen
   eigenen Compositor-Layer legt.

---

## 3. Konkrete Änderungen in `roadtrip.js`

### 3.1 Neue Geometrie-Messung (einmal ergänzen, nahe den anderen `const`/`let`-Deklarationen)

```js
let boardW = 0, boardH = 0;
function measureBoard(){
  const r = BOARD.getBoundingClientRect();
  boardW = r.width;
  boardH = r.height;
}
measureBoard();
window.addEventListener('resize', measureBoard);
window.addEventListener('orientationchange', () => setTimeout(measureBoard, 60));
```
(In `setDevice()` zusätzlich `measureBoard()` aufrufen, da sich beim Geräte-/Layoutwechsel auch
die Board-Größe ändert.)

### 3.2 `renderObject()` ersetzen

**Alt** (aktuell im Code, verursacht Reflow pro Frame):
```js
o.el.style.left = `${50 + laneOffset}%`;
o.el.style.top = `${o.y}%`;
o.el.style.transform = `translate(-50%, 0) translate(${bob}px, 0) scale(${scale})`;
```

**Neu** (nur noch `transform`, keine Layout-Schreibzugriffe mehr):
```js
const pxX = boardW * (50 + laneOffset) / 100;
const pxY = boardH * o.y / 100;
o.el.style.transform =
  `translate3d(${pxX}px, ${pxY}px, 0) translate(-50%, 0) translate(${bob}px, 0) scale(${scale})`;
```
`o.y` (Prozentwert) bleibt exakt wie bisher berechnet und wird weiterhin unverändert für die
Kollisions-/Sammel-Logik (`COLLISION_MIN_Y`/`COLLISION_MAX_Y`) verwendet — daran ändert sich
nichts.

### 3.3 Objekt-Erzeugung (`spawn()`) — `left`/`top` einmalig fixieren

Direkt nach dem Erzeugen des `<img>`-Elements:
```js
el.style.left = '0';
el.style.top = '0';
```
Damit hat das Element von Anfang an eine feste Ausgangsbasis; alle Bewegung läuft danach
ausschließlich über `transform`.

### 3.4 Auto ebenfalls auf `transform` umstellen (Konsistenz + Robustheit)

**Alt:**
```js
CAR.style.setProperty('--car-x', x); // CSS: left: calc(var(--car-x) * 1%)
```
**Neu:**
```js
function positionCar(animate = true){
  const x = laneX(lane); // 25 / 50 / 75
  const pxX = boardW * x / 100;
  CAR.style.transform = `translate3d(${pxX}px, 0, 0) translate(-50%, 0)`;
  CAR.dataset.lane = String(lane);
  CAR.setAttribute('aria-label', `Player car, lane ${lane+1} of 3`);
  CAR.classList.toggle('move', animate);
}
```
In `style.css` beim `.player-car`-Selektor `left:` entfernen und stattdessen
`transition: transform .28s cubic-bezier(.22,.8,.2,1);` setzen (CSS-`transition` funktioniert
identisch für `transform` wie vorher für `left`).

### 3.5 `will-change` ergänzen (in `style.css`)
```css
.rt-object, .player-car { will-change: transform; }
```

---

## 4. Eingebautes Debug-Overlay (`?debug=1`)

Ziel: Diagnose künftig **ohne DevTools, ohne Konsole** — nur per Screenshot mit
`?debug=1` in der URL.

```js
if (new URLSearchParams(location.search).has('debug')) {
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:4px;left:4px;z-index:9999;background:rgba(0,0,0,.75);' +
    'color:#0f0;font:11px monospace;padding:6px 8px;white-space:pre;pointer-events:none;';
  document.body.appendChild(panel);
  setInterval(() => {
    const lines = [`running:${running} raf:${!!raf} objs:${objects.length} boardW:${Math.round(boardW)} boardH:${Math.round(boardH)}`];
    objects.slice(0, 6).forEach((o, i) => {
      lines.push(`#${i} ${o.type} lane:${o.lane} progress:${o.progress.toFixed(2)} y:${o.y.toFixed(1)}`);
    });
    panel.textContent = lines.join('\n');
  }, 200);
}
```
Damit reicht künftig **ein** Screenshot mit `?debug=1`, um sofort zu sehen, ob `progress`/`y`
sich verändern — unabhängig davon, ob es sichtbar auf dem Bildschirm ankommt.

---

## 5. Zusätzliche Ausfallsicherheit (optional, aber empfohlen)

`requestAnimationFrame` kann in seltenen Fällen (Tab im Hintergrund, aggressive
Energiesparmodi, bestimmte Sicherheits-/Gruppenrichtlinien auf Firmengeräten) gedrosselt oder
ausgesetzt werden. Ein einfacher Watchdog verhindert ein komplettes Einfrieren:

```js
let lastTickAt = 0;
function tick(now){
  if(!running) return;
  lastTickAt = now;
  const dt = Math.min(50, now - lastFrame || 16);
  lastFrame = now;
  update(dt, now);
}
// Fallback: falls RAF 400ms lang nicht feuert, per Intervall nachstoßen.
setInterval(() => {
  if (running && performance.now() - lastTickAt > 400) {
    tick(performance.now());
  }
}, 200);
```

---

## 6. Was sich fachlich NICHT ändert

- Sterne/Tonnen/Katzen-Verhalten, Kollisionslogik, Spurlogik, Zeitlimit, Leben, Zielscore:
  **unverändert**.
- Das statische Hintergrundbild bleibt statisch (keine Parallax-Wiedereinführung).
- `game-logic.js`, `script.js` (Quest Map, Security-Gate): **nicht betroffen, nicht anfassen**.

## 7. Abnahme nach dem Umbau (ohne DevTools testbar)

1. Quest starten, einem einzelnen Stern beim Herannahen zusehen: sichtbar wachsend, sichtbar
   näherkommend.
2. `?debug=1` an die URL anhängen → Overlay zeigt laufend wechselnde `progress`/`y`-Werte.
3. Bestehende Kollisions-/Sammel-Mechanik unverändert testen (Stern einsammeln, Tonne/Katze
   treffen kostet Leben).
4. Auto-Spurwechsel weiterhin butterweich (jetzt über `transform` statt `left`).
