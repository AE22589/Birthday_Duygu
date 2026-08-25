# Duygu's Birthday Quest — v1.0.10

## Stability Release

This version is a map-rendering stability refactor. It does not add a new quest.

### Architecture
- The approved desktop and mobile artwork are rendered inside one SVG coordinate system.
- Desktop uses the intrinsic 1672 × 941 coordinate system.
- Mobile uses the intrinsic 322 × 696 coordinate system.
- Locked overlays, active ring, hover ring and interaction targets share the exact same coordinates as the artwork.
- No percentage-based quest positioning is used.
- Desktop/mobile switch only the SVG viewBox and the corresponding artwork/state groups.

### Security / Developer Preview
Before 08 September 2026 00:00 Europe/Berlin:
1. Five quick clicks/taps on the locked door open Developer Access.
2. Enter 1337.
3. The Quest Map opens for the current session.
4. Returning to the door revokes preview access.
5. Preview access is not persisted across reloads.

### Core behavior
- Countdown remains active until the scheduled unlock.
- Quest I is the only active quest in this pre-quest build.
- Quests II–VII are visually locked and subdued.
- The Final Door remains locked until all seven keys exist.
- Desktop hover adds a subtle glow/scale effect to the active quest.

### Regression checks performed
- JavaScript syntax check: PASS
- Desktop 1366 × 768: PASS
- Desktop 1440 × 900: PASS
- Desktop 1920 × 1080: PASS
- Mobile 375 × 812: PASS
- Mobile 390 × 844: PASS
- Mobile 412 × 915: PASS
- Desktop 5-click Developer Access: PASS
- Wrong admin code rejected: PASS
- Code 1337 opens map: PASS
- Mobile 5-touch Developer Access: PASS
- Return to Door revokes preview: PASS
- Seven visible quest hit targets per active viewport: PASS
- Active ring and active hit center alignment: PASS
- Desktop hover state: PASS
- Browser page errors during automated regression run: NONE

Version number is technical only and is not displayed on the Quest Map.
