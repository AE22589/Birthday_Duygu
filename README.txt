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
