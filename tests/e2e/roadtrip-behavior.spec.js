import { test, expect } from '@playwright/test';

test.describe('Road Trip – fachliches Spielverhalten', () => {
  test('während der Fahrt bewegt sich ein Spielobjekt sichtbar auf das Auto zu', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => window.__ROADTRIP_QA__?.start?.());
    await page.evaluate(() => window.__ROADTRIP_QA__.spawnTestObject('star', 0));

    const before = await page.evaluate(() =>
      window.__ROADTRIP_QA__.getState().objects.find(o => o.qaTest)?.y
    );
    expect(typeof before).toBe('number');

    await expect.poll(async () =>
      page.evaluate(() => window.__ROADTRIP_QA__.getVisualMotion?.()),
      { timeout: 1200, intervals: [50, 100, 150] }
    ).toBeGreaterThan(before + 5);

    await page.evaluate(() => window.__ROADTRIP_QA__?.stop?.());
  });

  test('Perspektive wächst von 0,2 am Horizont auf 1,0 am Auto', async ({ page }) => {
    await page.goto('/index.html');
    const samples = await page.evaluate(() => ({
      horizon: window.__ROADTRIP_QA__.getPerspectiveSample(),
      car: window.__ROADTRIP_QA__.getPerspectiveSample(88)
    }));

    expect(samples.horizon.scale).toBeCloseTo(0.2, 5);
    expect(samples.car.scale).toBeCloseTo(1.0, 5);
  });
});
