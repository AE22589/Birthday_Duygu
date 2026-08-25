# QA Automation — v1.6.5

## Upload
Replace the repository contents with the contents of this folder, including `.github/workflows/qa.yml`. Commit once.

## Automated gates
1. Static QA: assets, version/cache consistency, security gate, navigation, controls, mobile CSS, visible car positioning, and game-over logic.
2. Browser QA: Chromium at 1366x768, 1920x1080, iPhone 12 and iPhone 14 Pro Max.
3. End-to-end flow: developer gate -> quest map -> Quest I intro -> READY countdown -> gameplay.
4. Desktop keyboard/on-screen controls run only on desktop projects.
5. Mobile swipe runs only on mobile projects and uses Pointer Events with `pointerType: touch`.
6. Control tests verify both internal lane state and actual visible car movement.
7. Console/page errors and unwanted page scrolling are treated as failures.

## GitHub
After commit, open Actions and select **Quest QA**. A release is not considered QA-passed until both Static QA and Browser QA are green.

## Local
Run `npm install`, then `npm run qa:static` and `npm run qa:e2e`.
