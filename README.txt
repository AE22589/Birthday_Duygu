Duygu's Birthday Quest — v1.0.14

Map rendering architecture refactor.

- One clean master map artwork per platform.
- SVG viewBox contains the artwork and all dynamic state layers.
- Locked quests are rendered by clipping the same master artwork to the exact quest medallion and applying an SVG filter.
- Active glow/ring and invisible hit areas use the same coordinates as the artwork.
- Desktop and mobile use fixed source coordinate systems and preserveAspectRatio= xMidYMid meet.
- Countdown, door, 5-click developer access and code 1337 remain unchanged.

Developer preview: click the locked door 5 times quickly, then enter 1337.


Version 1.0.14: corrected Mobile Quest VI geometry and replaced <use>-based locked rendering with direct SVG <image> instances using user-space clip paths.
