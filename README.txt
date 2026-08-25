Duygu's Birthday Quest — v1.0.11

Stability release: state-artwork map architecture.

Core behavior:
- Birthday unlock: 08 September 2026 at 00:00 Europe/Berlin.
- Before unlock, the entrance door is gated.
- Developer preview: five rapid clicks/taps on the door, then code 1337.
- Developer preview is session-only and is revoked by Return to the Door.
- Normal quest progress is kept separately in localStorage.

Map architecture:
- Desktop and mobile use their own intrinsic artwork dimensions.
- Eight pre-rendered visual states exist for each platform (state 0..7).
- Locked quest appearance is part of the artwork itself; no grayscale image overlays are positioned over quest icons.
- A single intrinsic SVG layer handles only the active/hover ring, quest hit areas and Final Door hit area.
- The Return to the Door control is an HTML button anchored to the map shell, so it scales with the exact artwork aspect ratio.

Versioning:
- v1.0.11 is a technical release number only and is not displayed on the game map.
