# QA Hardening — v1.6.1

## Release gates

1. Static QA and asset integrity
2. Game logic unit QA
3. Security E2E
4. Quest Map visual regression at 1366, 1920, 390 and 430 CSS pixels
5. Desktop keyboard/button E2E
6. Mobile swipe E2E in both directions
7. Deterministic game-state regression
8. Quest completion and persistence regression
9. Retry/lifecycle regression
10. Overflow/no-scroll checks

## Visual regression

The Quest Map is captured against four approved baselines under `tests/e2e/__screenshots__/`. The baseline is generated from the current map artwork plus the active-ring treatment at the exact viewport geometry used by the test matrix.

A future intentional visual change must update the baseline deliberately; it must never be updated just to make CI green.

## QA-only controls

The deterministic QA API is exposed only when both `?qa=1` is present and `navigator.webdriver === true`. The visual-map mode uses `?qa=visual-map` with the same browser-test requirement. This prevents ordinary visitors from activating the QA API through the URL alone.

## Manual testing policy

Manual checks are reserved for subjective visual quality, animation feel, and real-device/browser compatibility that cannot be represented reliably by automated assertions. Functional regressions should be automated as soon as they are discovered.
