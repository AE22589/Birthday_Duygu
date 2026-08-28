# Duygu's Birthday Quest — QA / TEST PLAN

## Release v1.10.0 — Quest I Arcade-Neubau + Quest II "Paint It!"

### A. Regression / Sicherheit
1. Countdown-Bildschirm lädt.
2. Vor dem Stichtag öffnet ein normaler Türklick nicht die Map.
3. Fünf Klicks im Zeitfenster öffnen den Entwickler-Zugang.
4. `1337` öffnet die Quest Map.
5. Weniger als fünf Klicks öffnet die Map nie.

### B. Map → Quest I
6. Quest I ist anfangs die einzige aktive Quest.
7. Klick auf Quest I zeigt das Intro.
8. Andere Quests bleiben gesperrt.

### C. Intro-Gate
9. `I'M READY` startet das Spiel direkt (kein Countdown mehr nötig — bewusst
   vereinfacht gegenüber der Vorversion).
10. Zurück zur Map funktioniert vor dem Spielstart.

### D. Gameplay
11. Timer startet bei 60.
12. Sterne können gesammelt werden.
13. Hindernisse kosten Leben.
14. Kollision hat ein Unverwundbarkeits-Fenster.
15. 15+ Sterne innerhalb von 60 Sekunden vergeben Schlüssel I.
16. Retry setzt den Lauf vollständig zurück.
17. Abschluss kehrt zur Map zurück.

### E. Desktop-Steuerung
18. Pfeiltasten links/rechts wechseln je eine Spur.
19. Kein Seiten-Scrollen durch Pfeiltasten während des Spiels.

### F. Mobile-Steuerung
20. Wischen links/rechts wechselt je eine Spur.
21. Touch scrollt die Seite während des Spiels nicht.
22. Keine Desktop-Steuerelemente auf Mobile.

### G. Zustand / Regression
23. Quest-Abschluss schreibt nach `duyguBirthdayQuestState_v1`.
24. Reload erhält Schlüssel I.
25. Bestehende Quest-Map-Sicherheit/-Zustand bleiben unberührt.

### H. Statische technische Prüfungen
26. `node --check` auf allen JS-Dateien (inkl. `paintit.js`).
27. Benötigte Assets (5: Eingangsbild, 2× Quest-Map, Duygu-/Lokum-Sprite)
    vorhanden.
28. Alle Cache-Buster-Versionen konsistent `v1.10.0`.
29. `qa/project-consistency.mjs` schlägt fehl, falls die alte
    Board-Cache-Architektur wieder eingeführt wird (gilt für beide
    Quest-Module).
30. `paintit.js` ist nicht statisch in `index.html` eingebunden (echtes
    Lazy-Loading).

### I. Quest II "Paint It!" — Zugang
31. Quest II ist gesperrt, solange Quest I nicht abgeschlossen ist.
32. `paintit.js` wird erst beim Öffnen von Quest II nachgeladen, nicht
    beim ersten Seitenaufruf.
33. Intro nennt ausdrücklich die Mehrfach-Durchgangs-Regel und die
    Pfotenabdruck-Regel, bevor das Spiel startet.

### J. Quest II — Gameplay
34. Jedes Feld benötigt 4 Durchgänge, bis es vollständig gedeckt ist;
    ein einzelnes Berühren reicht nicht.
35. Lokum hinterlässt in unregelmäßigen Abständen Pfotenabdrücke — nur
    auf bereits vollständig gestrichenen Feldern, niemals auf halb
    fertigen.
36. Ein Pfotenabdruck auf Feld A bleibt sichtbar, auch wenn währenddessen
    ein anderes Feld B bestrichen wird (Regressionsschutz gegen einen
    beim Bau gefundenen Bug, bei dem jeder Pinselstrich versehentlich
    alle Pfotenabdrücke im Raster ausblendete).
37. 100% Deckung beendet die Runde sofort mit der Bestwertung
    ("SPOTLESS!") und vergibt Schlüssel II.
38. 90–99% Deckung bei Zeitablauf vergibt ebenfalls Schlüssel II
    ("WALL COMPLETE").
39. Unter 90% bei Zeitablauf vergibt keinen Schlüssel ("NOT QUITE
    THERE"), erlaubt aber sofortiges erneutes Spielen.
40. Duygus Sprite folgt der Zeigerposition sichtbar, ohne den Cursor
    exakt zu verdecken (wichtig für Mobile-Bedienbarkeit).
41. Touch-Ziehen auf der Wand scrollt die Seite nicht.

### Deployment-Gate
Die live GitHub-Pages-URL nach dem Upload manuell prüfen. Lokale Tests sind
kein Beweis für den tatsächlichen CDN-Zustand — im Zweifel den
Netzwerk-Tab auf `roadtrip.js?v=1.10.0` und `paintit.js?v=1.10.0`
kontrollieren.
