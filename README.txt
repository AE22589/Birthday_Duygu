Duygu's Birthday Quest - v1.0.12

Stability / Rendering Refactor

Key changes
- The quest artwork and interaction layer now share ONE SVG coordinate system.
- Desktop artwork: 1672 x 941.
- Mobile artwork: 322 x 696.
- The map image is embedded inside the SVG instead of being a separate HTML image with a separate overlay layer.
- Quest, final-door and return controls are transparent SVG hit areas in the same coordinate system.
- The desktop active-quest hover effect is also rendered in the same SVG coordinate system.
- Mobile uses the dedicated mobile artwork and does not depend on desktop geometry.
- Fixed the duplicated / crossed ROAD TRIP title in the mobile state-0 artwork.
- Developer access remains: 5 rapid clicks/taps on the locked door, then code 1337.
- No visible version number is shown on the quest map.

Regression requirements
- Countdown works on desktop and mobile.
- Door remains locked before 08 September 2026 00:00 Europe/Berlin unless developer preview is granted.
- 5 rapid clicks/taps -> Developer Access.
- Wrong code is rejected; 1337 opens the quest map.
- Return to Door returns to the entrance and clears developer preview.
- Quest I is the only active quest in the current build.
