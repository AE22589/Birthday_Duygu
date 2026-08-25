# v1.1.1 Test Plan

## Static checks
- `node --check script.js`
- `node --check roadtrip.js`
- Verify `script.js?v=1.1.1`, `style.css?v=1.1.1`, and `roadtrip.js?v=1.1.1`.
- Verify both map and quest use the same localStorage key: `duyguBirthdayQuestState_v1`.
- Verify the Road Trip lane calculation uses the logical canvas width, never the DPR-scaled `canvas.width`.

## Functional browser checks
1. Open the site and unlock the door through the existing 5-click + `1337` developer preview.
2. Quest Map must show Quest I as READY.
3. Click Quest I.
4. Quest I intro must open; no "will be added" placeholder may appear.
5. Desktop: only laptop instructions are shown; Mobile: only mobile instructions are shown.
6. Click I'M READY -> 3 -> 2 -> 1 -> GO -> gameplay.
7. Desktop: ArrowLeft/ArrowRight change lanes.
8. Mobile: swipe left/right changes lanes.
9. Stars increment and lives decrease on collisions; game remains forgiving.
10. Timer reaches 0 at or before 60 seconds and shows the result screen.
11. Completing the quest stores Quest I in `duyguBirthdayQuestState_v1`.
12. Return to Quest Map: Quest I is complete and Quest II becomes READY.
13. Reload the page: Quest I remains complete.
14. Test at minimum 390x844, 412x915, 1366x768 and 1920x1080.
15. Confirm there are no console errors during the complete flow.

## Regression checks
- Existing 5-click developer access still opens the code modal.
- `1337` still opens the Quest Map.
- Countdown/door behavior is unchanged.
- Final Door remains locked until all seven quests are complete.
