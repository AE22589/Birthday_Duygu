Duygu's Birthday Quest — v1.0.5

Security gate:
- Before September 8, 2026 at 00:00 Europe/Berlin, the quest map cannot be opened normally.
- Developer preview requires 5 rapid clicks/taps on the locked door, followed by code 1337.
- Preview access is session-only and is never persisted.
- Reloading the page revokes preview access.
- Returning to the entrance revokes preview access.

Regression checks performed:
- JavaScript syntax check
- Desktop five-click developer gate
- Mobile five-tap developer gate
- Wrong code rejected
- Correct code opens quest map
- Reload returns to locked entrance
- Normal pre-birthday door click does not open quest map


VERSION 1.0.6
- Fixed mobile entrance background alignment so the physical door is centered.
- Hardened 5-tap developer gate with touchend/click de-duplication.
- Increased secret tap window to 2.5 seconds for reliable mobile use.
- Re-ran JavaScript syntax and browser interaction checks before release.

VERSION 1.0.7
- Fixed first-click suppression in the touch/click de-duplication guard.
- Verified desktop mouse clicks and mobile taps open Developer Access after five activations.


VERSION 1.0.8
- Removed the visible version badge from the desktop artwork.
- Hotspots now cover only the circular quest icons, never the labels or header text.
- Locked visual treatment is limited to the icon circle.
- Desktop and mobile node coordinates were independently calibrated to the artwork.
- Developer preview security gate retained and regression-checked.


v1.0.9 — STABILITY RELEASE

This release does not add new gameplay. It stabilizes the quest map rendering.

Map positioning:
- Desktop and mobile artwork use intrinsic SVG coordinate systems matching the source image dimensions.
- Active and locked visual states are aligned to the artwork's actual quest medallions.
- Locked states use a clipped, filtered duplicate of the same artwork so only the icon/medallion is desaturated; labels and path remain untouched.
- Desktop hover is applied to the active quest only.

Core security behavior retained:
- Before September 8, 2026: the map is inaccessible by normal clicks/taps.
- Five rapid door clicks/taps open Developer Access.
- Code 1337 grants the current-session preview.
- Reload and Return to Door revoke preview access.
- On the real unlock date, a normal door activation opens the map.

No visible version badge is part of the quest map UI.
