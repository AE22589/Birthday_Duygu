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
