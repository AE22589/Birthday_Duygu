# Automated QA — Duygu Birthday Quest

## Purpose
This project uses three QA layers:

1. Static checks (`npm run test:static`)
2. Real browser E2E checks (`npm run test:e2e`)
3. GitHub Actions on every push / pull request

## Browser matrix
- Desktop 1366×768
- Desktop 1920×1080
- iPhone 13 viewport
- iPhone 14 Pro Max viewport

## Critical flow
Door → 5-click developer gate → 1337 → Quest Map → Quest I → Intro → I'M READY → Countdown → Game.

The tests also verify that Intro and Game are never visible simultaneously, keyboard/swipe movement works, the page does not scroll during play, and the game board remains inside the viewport.

## Local setup
```bash
npm install
npx playwright install chromium
npm test
```

## Release rule
A version should not be tagged/released if Static QA or Browser QA fails.

## Next QA additions
- Visual screenshot baselines
- Result/Key I persistence test
- Game-over test
- Return-to-map regression test
- Asset 404 sweep
