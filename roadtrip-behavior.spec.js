import { test, expect } from '@playwright/test';

test.describe('Road Trip – fachliches Spielverhalten', () => {
  test('während der Fahrt bewegt sich ein Spielobjekt sichtbar auf das Auto zu', async ({ page }) => {
    await page.goto('/index.html');

    const initial = await page.evaluate(() => {
      window.__ROADTRIP_QA__?.start?.();
      window.__ROADTRIP_QA__?.spawnMotionTestObject?.('star', 1);
      const el = document.querySelector('#dynamicLayer .rt-object');
      const r = el?.getBoundingClientRect();
      return r ? { top: r.top, width: r.width } : null;
    });
    expect(initial).not.toBeNull();

    await page.waitForTimeout(300);

    const later = await page.evaluate(() => {
      const el = document.querySelector('#dynamicLayer .rt-object');
      const r = el?.getBoundingClientRect();
      return r ? { top: r.top, width: r.width } : null;
    });
    expect(later).not.toBeNull();
    expect(later.top).toBeGreaterThan(initial.top);
    expect(later.width).toBeGreaterThan(initial.width);

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
