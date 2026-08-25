# Duygu Birthday Quest — Test Plan v1.1.2

## Mandatory regression gate
1. Entrance countdown renders and reaches the unlock date logic.
2. Developer preview: five rapid door clicks opens the code dialog.
3. Code `1337` opens the quest map.
4. Quest I is the only available quest at the start.
5. Quest I opens reliably from the map.
6. Instruction screen is shown before gameplay.
7. Desktop instruction uses LEFT/RIGHT arrow keys.
8. Mobile instruction uses swipe LEFT/RIGHT.
9. `I'M READY` runs 3–2–1–GO before gameplay.
10. Gameplay renderer is visible immediately after GO.
11. Game uses SVG rendering; no canvas dependency remains.
12. Desktop keyboard input changes lanes and cannot move beyond lane 1 or 3.
13. Mobile swipe input changes lanes with a 28px threshold.
14. Stars increase score up to 43.
15. Obstacles are sparse and forgiving.
16. Three lives are displayed; a collision grants temporary invulnerability.
17. Game ends at 60 seconds maximum.
18. At 20+ stars, Key I is granted.
19. At fewer than 20 stars, Key I is not granted and retry is offered.
20. Key I is persisted in `duyguBirthdayQuestState_v1`.
21. Returning to the map shows Quest I as completed.
22. Reload preserves Quest I completion.
23. No stale `v1.1.1` references remain in HTML/CSS/JS runtime assets.
24. Cache-busting query version is `1.1.2`.
25. JavaScript syntax checks pass with `node --check`.
26. SVG master scene parses/renders independently at 600×960.
27. SVG scene scales proportionally for mobile and desktop viewports.

## Target viewport checks
- Mobile: 390×844
- Mobile: 412×915
- Desktop: 1366×768
- Desktop: 1920×1080

## Architecture note
v1.1.2 replaces the previous Canvas renderer with a responsive SVG scene. This removes device-pixel-ratio and canvas-context/render-loop failure modes that could leave the game area black while the HUD remained visible.
