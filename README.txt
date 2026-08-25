Duygu's 43rd Birthday Quest — v1.0.2

This release fixes the quest-map implementation.

Key changes:
- The approved map artwork is rendered at its native aspect ratio; CSS does not redraw or reposition the circle.
- Transparent hotspots are centered on the actual quest nodes in the 1672×941 desktop artwork and 322×696 mobile artwork.
- Desktop and mobile use the same visual source-of-truth concept with separate responsive artwork.
- Locked quest hotspots are visually pushed into the background using a localized grayscale/brightness treatment.
- Quest I receives a subtle game-style hover glow on mouse devices.
- The entire map is constrained to the viewport; no quest-map scrolling is required.
- Version badge is exposed as v1.0.2.
- Countdown, door unlock and 5-click/tap admin preview behavior are retained.

Testing checklist:
1. Desktop: map fits entirely in viewport.
2. Mobile: complete map, including VI and V, remains visible.
3. Quest I hotspot aligns with the car node.
4. Locked quests are visibly dimmed.
5. 5 rapid clicks/taps on the entrance door opens admin code dialog.
6. 1337 unlocks preview.


Version 1.0.3: restored the developer access verification flow. The 5-click/tap gesture opens the administrator code dialog; preview access is session-scoped so it cannot silently persist across new browser sessions. The visible version badge was removed from the quest map.


VERSION 1.0.4
Security gate regression fix:
- Developer preview is never persisted in localStorage or sessionStorage.
- Legacy preview session keys are cleared on startup.
- Before the birthday, the quest map cannot be reached without the 5-click developer gate and code 1337.
- Returning from the quest map revokes the temporary preview access.
- The visible version badge remains removed from the quest map.
