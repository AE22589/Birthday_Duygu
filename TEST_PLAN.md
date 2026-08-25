# Duygu Birthday Quest — v1.2.0 QA Gate

## A. Static integrity
- [x] `index.html`, `style.css`, `script.js`, `roadtrip.js` are all shipped together.
- [x] All referenced local assets exist.
- [x] JavaScript passes `node --check`.
- [x] No old v1.1.x asset/script references remain in the shipped files.
- [x] Quest I uses a single fixed SVG coordinate system for the interaction layer.

## B. Security / regression
- [ ] Locked entrance remains locked before the release date.
- [ ] Exactly five door clicks within the click window open Developer Access.
- [ ] Code `1337` unlocks preview access.
- [ ] Wrong code does not unlock access.
- [ ] Quest Map remains inaccessible without normal unlock or Developer Access.

## C. Quest I flow
- [ ] Quest I opens its instruction screen; gameplay does not start automatically.
- [ ] Desktop instructions show LEFT / RIGHT arrow keys.
- [ ] Mobile instructions show SWIPE LEFT / RIGHT.
- [ ] `I'M READY` starts 3 / 2 / 1 / GO.
- [ ] Game starts only after the countdown.
- [ ] Game ends after 60 seconds.
- [ ] Minimum 20 stars awards Key I.
- [ ] Fewer than 20 stars does not award Key I.
- [ ] Key I persists in the shared quest state.
- [ ] Return to Quest Map works from both success and retry states.

## D. Controls
- [ ] Desktop ArrowLeft moves exactly one lane.
- [ ] Desktop ArrowRight moves exactly one lane.
- [ ] Repeated key presses cannot skip outside the three lanes.
- [ ] Mobile swipe left moves exactly one lane.
- [ ] Mobile swipe right moves exactly one lane.
- [ ] Small swipes do not move the car.
- [ ] Touch gestures do not scroll the game horizontally.
- [ ] On-screen desktop arrow controls work as a fallback.

## E. Gameplay
- [ ] Three lives are shown.
- [ ] Collision removes a life but never makes the relaxed quest impossible.
- [ ] Temporary invulnerability prevents immediate double-hit.
- [ ] Stars increment only once per collectible.
- [ ] Score caps at 43.
- [ ] Difficulty rises gradually and remains forgiving.
- [ ] No obstacle spawns directly on top of the player.

## F. Visual QA
Required viewport checks:
- [ ] Desktop 1366x768
- [ ] Desktop 1440x900
- [ ] Desktop 1920x1080
- [ ] Mobile 390x844
- [ ] Mobile 412x915
- [ ] Landscape mobile / small tablet

For each viewport:
- [ ] Full game board is visible without horizontal overflow.
- [ ] HUD remains readable.
- [ ] Player stays inside the road.
- [ ] Lane positions remain stable after resize/orientation change.
- [ ] Concept artwork is visible and not replaced by generic fallback graphics.
- [ ] Intro and result screens remain usable without clipping.

## G. Deployment / cache
- [ ] Deploy complete folder, not selected files.
- [ ] Hard reload after deployment.
- [ ] Confirm `?v=1.2.0` is present on CSS/JS requests.
- [ ] Confirm no stale v1.1.x JavaScript is loaded.

## Environment limitation
The current execution sandbox blocks local browser navigation for automated Chromium/Playwright rendering (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore this version is not claimed as live-browser-verified from this environment. Static checks, asset integrity, JavaScript syntax and architecture checks were performed here; the browser viewport checklist above must be run against the deployed GitHub Pages URL before calling the version production-ready.
