# QA-Verifikationsprotokoll für Duygu_Birthday_Quest

**Zweck:** Dieses Protokoll an ChatGPT geben, mit der Bitte, es ab sofort für **jede** Version
als festen Ablauf zu befolgen — nicht nur als Idee, sondern als Checkliste, die vor jeder
Aussage "behoben"/"funktioniert" komplett durchlaufen und mit echten Belegen dokumentiert wird.

**Grundregel:** Jede Aussage über den Code bekommt einen von drei Nachweis-Typen. Diese
werden nicht vermischt oder stillschweigend hochgestuft:

- **[GELESEN]** – Code angeschaut, Logik nachvollzogen, aber nicht ausgeführt.
- **[AUSGEFÜHRT: Node]** – tatsächlich als Prozess laufen lassen (`node --check`, eigene
  QA-Skripte, Unit-Tests), mit der echten Ausgabe im Wortlaut.
- **[AUSGEFÜHRT: Browser]** – ein echter Browser wurde gestartet, die Seite wurde geladen,
  Konsole/Laufzeitfehler wurden aktiv mitgeschnitten, mit der echten Ausgabe im Wortlaut.

Eine Aussage ohne Nachweis-Typ-Kennzeichnung ist nicht zulässig.

---

## Ablauf, Schritt für Schritt

### Schritt 1 — Datei-Ebene [GELESEN, aber verifizierbar]
1. ZIP tatsächlich entpacken (nicht aus dem Dateinamen auf den Inhalt schließen).
2. `PROJECT_REQUIREMENTS.docx` tatsächlich konvertieren/öffnen und lesen — nicht aus dem
   Gedächtnis der letzten Version zusammenfassen.
3. **Diff gegen die letzte bekannte funktionierende Version** (`diff -u alt.js neu.js`)
   für jede geänderte Datei. Ziel: genau wissen, was sich verändert hat — nicht nur, dass
   sich "etwas" verändert hat.

### Schritt 2 — Node-Ebene [AUSGEFÜHRT: Node]
Für jede JS-Datei, die geändert wurde:
```
node --check <datei>.js
```
Dann die eigenen QA-Skripte als echte Prozesse laufen lassen und die **komplette** Ausgabe
dokumentieren (nicht zusammenfassen als "grün"):
```
node qa/preflight.mjs
node qa/static-check.mjs
node tests/game-logic.test.cjs
```

### Schritt 3 — Browser-Ebene [AUSGEFÜHRT: Browser] — **das ist die Pflichtstufe, die zuletzt gefehlt hat**

1. Lokalen Server starten, echten Browser (Chromium/Playwright) starten.
2. **Vor** dem `page.goto(...)` müssen Fehler-Listener registriert sein:
   ```js
   page.on('pageerror', e => console.log('PAGEERROR:', e.message));
   page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
   ```
   Das ist der einzige Weg, Laufzeitfehler wie den `boardW`-TDZ-Fehler überhaupt zu sehen —
   ein normaler Test-Assert (`expect(...).toBe(...)`) prüft nur das, was er explizit abfragt,
   nicht, ob im Hintergrund parallel ein `ReferenceError` auftritt.
3. Den **echten Nutzerpfad** klicken (nicht nur QA-Hooks aufrufen): Tür 5× klicken → Code
   eingeben → Quest Map → Quest I → Ready → Countdown → Spiel läuft.
4. Danach die vorhandene Playwright-Testsuite laufen lassen und das **wörtliche** Terminal-
   Ergebnis dokumentieren (Anzahl bestanden/fehlgeschlagen, Fehlermeldungen im Klartext,
   nicht paraphrasiert).
5. Falls diese Stufe in der lokalen Umgebung nicht lauffähig ist (Playwright-Browser-Download
   blockiert o. ä.): **das explizit vor jeder Bewertung sagen**, z. B. "Browser-Ebene: nicht
   verifizierbar, Ergebnis daher nur [GELESEN]/[AUSGEFÜHRT: Node]." Niemals in diesem Fall
   Formulierungen wie "sollte funktionieren" mit "funktioniert" gleichsetzen.

### Schritt 4 — Verhaltensnachweis bei Animations-/Rendering-Änderungen [AUSGEFÜHRT: Browser]

Bei allem, was Bewegung, Position oder Sichtbarkeit betrifft, reicht das Lesen der internen
Variablen (`o.progress`, `o.y`) **nicht** als Beweis, dass etwas *sichtbar* passiert — diese
Werte können korrekt hochzählen, während auf dem Bildschirm nichts passiert (genau das war
das ursprüngliche Symptom). Stattdessen:

```js
const before = await page.evaluate(() => {
  const el = document.querySelector('#dynamicLayer .rt-object');
  const r = el.getBoundingClientRect();
  return { top: r.top, width: r.width };
});
await page.waitForTimeout(300);
const after = await page.evaluate(() => { /* gleiche Messung */ });
// after.top > before.top UND after.width > before.width
// erst DAS ist der Beweis für sichtbare Bewegung/Skalierung.
```

### Schritt 5 — Cross-Referenz-Check bei QA-Hooks

Wenn ein Test `window.__ROADTRIP_QA__.irgendeineFunktion()` aufruft: tatsächlich in der Datei
nachsehen, **auf welchem der beiden QA-Objekte** (`__DUYGU_QA__`, gated hinter `?qa=1`, vs.
`__ROADTRIP_QA__`, ungated) diese Funktion wirklich definiert ist. Ein Funktionsname, der
irgendwo in der Datei vorkommt, beweist nicht, dass er auf dem richtigen Objekt existiert.

---

## Format für jede Status-Meldung

Statt:
> ✅ Static QA, Preflight, Game Logic — alles grün.

Immer so:
> - Syntax: **[AUSGEFÜHRT: Node]** `node --check roadtrip.js` → kein Fehler.
> - Preflight: **[AUSGEFÜHRT: Node]** `node qa/preflight.mjs` → `PREFLIGHT PASS: v1.8.10`.
> - Browser-Laufzeit (`pageerror`/`console.error`): **[AUSGEFÜHRT: Browser]** → keine Fehler /
>   ODER **nicht verifizierbar in dieser Umgebung**.
> - Sichtbare Objektbewegung: **[AUSGEFÜHRT: Browser]** Bounding-Box vor/nach: top 15%→26%,
>   width 14px→22px über 300ms.

---

## Kurzer Prompt zum Weitergeben an ChatGPT

> Befolge ab sofort für jede Änderung an `roadtrip.js` (und generell bei Timing-, Sichtbarkeits-
> oder Animationsfragen) das angehängte QA-Verifikationsprotokoll vollständig. Kennzeichne jede
> Aussage explizit mit [GELESEN], [AUSGEFÜHRT: Node] oder [AUSGEFÜHRT: Browser] und zeige die
> jeweilige Rohausgabe. Wenn eine Stufe in deiner Umgebung nicht ausführbar ist, sag das *vor*
> jeder Bewertung, nicht danach. Verwende "behoben"/"funktioniert" ausschließlich für Aussagen
> mit [AUSGEFÜHRT: Browser]-Nachweis.
