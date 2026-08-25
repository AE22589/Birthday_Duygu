# Deep QA Report — Duygu Birthday Quest v1.3.2

## Release decision
**PASS for static/integration review.** Live GitHub Pages deployment must still be verified after upload.

## Root cause found in v1.3.1
Quest I's `<section id="roadTripScreen" ... hidden>` was never unhidden by `showRoadTripScreen()`. The click handler could call the function successfully, but the browser was required to keep the entire Quest I screen hidden. This made the Quest I hotspot appear non-functional.

## Corrective actions
- `showRoadTripScreen()` now explicitly sets `#roadTripScreen.hidden = false`.
- Opening Quest I hides both `#questScreen` and `#entrance`.
- The runtime script loader was removed. `roadtrip.js` is loaded once by the main HTML with `defer`; the Quest I hotspot now calls the already-registered entry function directly.
- Returning to the map hides `#roadTripScreen` and restores the map through the existing navigation function.
- Life decrement corrected from `max(1, lives - 1)` to `max(0, lives - 1)`, so Game Over can actually occur.
- Collected/hit/expired game objects are removed from the DOM and object state.
- Retry resets timer, score, lives, lane, timers, objects and visual state.

## Static checks
- `node --check script.js`: PASS
- `node --check roadtrip.js`: PASS
- required assets: PASS
- cache-busters consistent at v1.3.2: PASS
- no Canvas renderer: PASS
- no obsolete generic `road-scene` renderer: PASS
- concept background referenced: PASS
- `[hidden] { display:none!important }` guard present: PASS
- view-state manager present: PASS
- Quest I entry function present: PASS
- direct Quest I entry, no runtime script injection: PASS
- life counter can reach zero: PASS
- object cleanup present: PASS

## Functional regression checklist
### Security / map
- countdown gate remains in `script.js`
- 5-click developer gesture remains
- code remains `1337`
- `showQuestMap()` still enforces `isUnlocked()`
- existing state key remains `duyguBirthdayQuestState_v1`

### Quest I navigation
- map -> Quest I -> intro: implemented
- intro -> READY -> countdown -> game: implemented
- game -> result: implemented
- result/retry -> intro: implemented
- back -> quest map: implemented

### Controls
- desktop ArrowLeft / ArrowRight: implemented
- desktop A / D: implemented
- desktop on-screen arrow controls: implemented
- mobile swipe left/right: implemented
- touch scrolling disabled during game: implemented

### Gameplay
- 60 second maximum: implemented
- 3 lives: implemented
- collision invulnerability: implemented
- 20 stars required for Key I: implemented
- 43 star cap: implemented
- Key I persisted in existing quest state: implemented

## Required live deployment tests
These cannot be claimed from static analysis alone and must be performed against GitHub Pages after upload:
1. Open the real map on desktop and click Quest I.
2. Confirm Quest I intro replaces the map (not layered beneath it).
3. Click `I'M READY`; confirm only the game view is visible.
4. Verify ArrowLeft/ArrowRight and A/D.
5. Verify mobile swipe on 390x844 and 412x915.
6. Verify Retry and Return to Quest Map.
7. Verify Key I persists after reload.
8. Verify the 5-click -> 1337 developer flow still works from the entrance.
