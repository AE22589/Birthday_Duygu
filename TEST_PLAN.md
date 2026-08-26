# Duygu's Birthday Quest — QA / TEST PLAN

## Release v1.9.0 — Quest I Arcade-Neubau

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
26. `node --check` auf allen JS-Dateien.
27. Benötigte Assets (nur noch 3: Eingangsbild, 2× Quest-Map) vorhanden.
28. Alle Cache-Buster-Versionen konsistent `v1.9.0`.
29. `qa/project-consistency.mjs` schlägt fehl, falls die alte
    Board-Cache-Architektur wieder eingeführt wird.

### Deployment-Gate
Die live GitHub-Pages-URL nach dem Upload manuell prüfen. Lokale Tests sind
kein Beweis für den tatsächlichen CDN-Zustand — im Zweifel den
Netzwerk-Tab auf `roadtrip.js?v=1.9.0` kontrollieren.
