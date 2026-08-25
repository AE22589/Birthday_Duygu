# Deep QA Report — Duygu Birthday Quest v1.6.0

## Release decision
**HOLD until the next GitHub Browser QA run is green.** Static QA and JavaScript syntax checks pass locally. The previous v1.3.7 Browser QA run exposed test-scope errors and a mobile-input path that needed hardening; those are corrected in this release.

## Findings from the v1.3.7 Browser QA run
The supplied GitHub Actions run executed 16 tests and finished with **10 passed / 6 failed**. The failures were:
- the desktop projects incorrectly executed the mobile-swipe test;
- the mobile projects incorrectly executed the desktop keyboard/on-screen-button test;
- the mobile swipe assertion remained on lane `2` instead of reaching lane `0`.
The log explicitly shows the desktop/mobile test-matrix mismatch and the hidden desktop controls on mobile. The swipe failure also showed `Expected: "0" / Received: "2"`. 

## Corrective actions in v1.6.0
- Desktop keyboard test now runs only on desktop projects.
- Mobile swipe test now runs only on mobile projects.
- Mobile lane input was moved from the old synthetic `touchstart/touchend` path to Pointer Events (`pointerdown/pointerup`) with `pointerType === 'touch'`, pointer capture, and cancellation cleanup.
- `touch-action: none` remains on the game board to prevent browser gesture scrolling.
- The visible car position remains bound to `left: calc(var(--car-x) * 1%)`, so lane changes are tested as actual visual movement rather than only internal state.
- Browser tests assert the car's bounding-box center moves by a visible amount after keyboard/swipe input.
- Desktop keyboard testing still covers ArrowLeft/ArrowRight and the visible on-screen arrow controls.
- The test suite now avoids false failures caused by controls intentionally hidden on mobile.

## Static checks
- `node --check script.js`: PASS
- `node --check roadtrip.js`: PASS
- `node --check tests/e2e/quest1.spec.js`: PASS
- required assets: PASS
- version/cache consistency v1.6.0: PASS
- developer 5-click + 1337 gate: PASS
- Quest I navigation bridge: PASS
- ArrowLeft / ArrowRight / A / D: PASS
- Pointer swipe controls: PASS
- mobile CSS and `touch-action:none`: PASS
- visible car lane CSS binding: PASS
- life counter can reach zero: PASS

## Browser QA status
The previous GitHub run is the source of the reported failures. A fresh Browser QA run is required after this v1.6.0 package is committed. The local environment here does not have the Playwright package installed; an attempted `npm install` timed out, so a full local Playwright run is **not** claimed.

## Required acceptance tests
1. Desktop: start Quest I and press ArrowLeft/ArrowRight; the car must visibly move between lanes.
2. Desktop: A/D must move the car and the on-screen arrows must work.
3. Desktop: repeated left/right input must respect lane boundaries.
4. Mobile: swipe left moves center -> left; swipe right moves left -> center/right.
5. Mobile: game board must not scroll during swipe.
6. READY countdown, game start, result, retry and return-to-map must remain functional.
7. Key I persistence must remain functional.
8. Security gate must remain functional.

A release should only be considered QA-passed when Static QA and Browser QA are both green.
