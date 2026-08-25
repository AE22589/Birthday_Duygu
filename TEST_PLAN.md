# Duygu's Birthday Quest — QA / TEST PLAN

## Release v1.6.5 — Quest I art-first responsive implementation

### A. Regression / security
1. Countdown screen loads.
2. Before Sep 8 2026, normal door click does not open map.
3. Five clicks within the configured window open Developer Access.
4. `1337` opens the Quest Map.
5. Fewer than five clicks never opens the map.
6. Quest Map is not directly accessible through Quest I code.

### B. Map → Quest I
7. Quest I is the only active quest initially.
8. Clicking Quest I loads `roadtrip.js` if not already loaded.
9. Quest I intro appears.
10. Other quests remain locked.

### C. Intro gate
11. Desktop shows arrow-key instructions.
12. Mobile shows swipe instructions.
13. `I'M READY` is required.
14. 3-2-1-GO sequence runs once.
15. Back to map works before gameplay.

### D. Visual source-of-truth
16. `assets/quest1-game-background.jpg` is derived from the accepted Quest I concept artwork.
17. `assets/roadtrip-car.png` is layered above the background.
18. No generic vector road is used.
19. No opaque SVG/canvas layer covers the artwork.
20. Desktop and mobile use the same canonical scene and responsive crop.
21. No duplicated HUD from the concept sheet is shown; HUD is live HTML.

### E. Desktop interaction
22. Test 1366x768.
23. Test 1440x900.
24. Test 1920x1080.
25. Arrow Left changes one lane.
26. Arrow Right changes one lane.
27. A/D also change lanes.
28. Button controls work.
29. No page scrolling from arrow keys during gameplay.
30. Car remains visually attached to the road and never leaves the board.

### F. Mobile interaction
31. Test 390x844.
32. Test 393x852.
33. Test 412x915.
34. Swipe left changes one lane.
35. Swipe right changes one lane.
36. Touch does not scroll the page during gameplay.
37. Full board is visible without horizontal overflow.
38. Car remains centered on the chosen lane.
39. No desktop controls appear on mobile.
40. Mobile crop keeps the road, moon, lamps and destination readable.

### G. Gameplay
41. Timer starts at 60.
42. Stars can be collected.
43. Obstacles reduce lives.
44. All three lanes are never intentionally blocked.
45. Collision has an invulnerability window.
46. 20+ stars within the 60-second run awards Key I.
47. <20 stars does not award Key I.
48. 43 is the maximum displayed score.
49. Retry fully resets the run.
50. Completion returns to map.

### H. State / regression
51. Quest completion writes to `duyguBirthdayQuestState_v1`.
52. Reload preserves Key I.
53. Existing quest map security and state are untouched.
54. No stale v1.1.x/v1.2.x Quest I renderer remains referenced.

### I. Static technical checks
55. `node --check script.js`
56. `node --check roadtrip.js`
57. Required assets exist.
58. All HTML/CSS/JS cache-busters are `v1.6.5`.
59. `window.__DUYGU_ROADTRIP_SELF_TEST__()` reports renderer, source asset, controls, lanes and state key.
60. ZIP contents are internally consistent.

### Deployment gate
The live GitHub Pages URL must be checked manually after upload. Local static tests are not proof of the deployed CDN state. If the live page is unchanged, inspect the Network panel for `style.css?v=1.6.5`, `script.js?v=1.6.5`, and `roadtrip.js?v=1.6.5`.


## Regression gate — Quest I v1.6.5

- [ ] Before READY: intro visible, game hidden, result hidden.
- [ ] After READY countdown: intro hidden and game visible; both must not coexist.
- [ ] Game board is entirely inside the viewport on 1366×768, 1920×1080, 390×844 and 844×390.
- [ ] Desktop ArrowLeft / ArrowRight move exactly one lane per accepted input.
- [ ] A / D remain supported.
- [ ] Mobile swipe left / right moves exactly one lane.
- [ ] Touch scrolling does not start while playing.
- [ ] Returning to map stops the game loop and hides the entire Road Trip screen.
- [ ] Reloading the project never leaves the game view visible behind the intro.
- [ ] Developer security flow remains 5 clicks → code 1337 → quest map.
