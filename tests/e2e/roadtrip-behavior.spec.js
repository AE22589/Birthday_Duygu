import { test, expect } from '@playwright/test';

test.describe('Road Trip – fachliches Spielverhalten', () => {
  test('während der Fahrt bewegt sich die Spielwelt auf das Auto zu', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Open Quest I through the same public navigation bridge used by the app.
    await page.evaluate(() => {
      if (typeof window.showRoadTripScreen !== 'function') {
        throw new Error('Road Trip navigation bridge missing');
      }
      window.showRoadTripScreen();
    });

    const ready = page.locator('#readyButton');
    await expect(ready).toBeVisible();
    await ready.click();

    await expect.poll(async () => {
      return await page.evaluate(() => window.__ROADTRIP_QA__?.getState()?.running);
    }).toBe(true);

    await page.evaluate(() => window.__ROADTRIP_QA__.spawnTestObject('star', 0));

    const before = await page.evaluate(() => {
      const object = window.__ROADTRIP_QA__.getState().objects.find(o => o.qaTest);
      return object?.y;
    });

    expect(typeof before).toBe('number');

    // Do not depend on one fixed frame interval: WebKit on CI can throttle
    // animation frames. Wait until the same deterministic test object has
    // demonstrably advanced, while failing if it never moves.
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const object = window.__ROADTRIP_QA__.getState().objects.find(o => o.qaTest);
        if (!object) return null;
        return object.y;
      });
    }, { timeout: 2500, intervals: [100, 200, 300] }).toBeGreaterThan(before + 2);
  });
});
