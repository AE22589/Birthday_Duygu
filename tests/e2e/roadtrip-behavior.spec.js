import { test, expect } from '@playwright/test';

test.describe('Road Trip – fachliches Spielverhalten', () => {
  test('die Straße bzw. Objekte bewegen sich während der Fahrt', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Start the quest through the existing UI.
    const roadTrip = page.getByRole('button', { name: /road trip/i }).first();
    if (await roadTrip.count()) {
      await roadTrip.click();
    } else {
      await page.locator('[data-quest="roadtrip"], #roadTrip, .road-trip').first().click();
    }

    await page.waitForTimeout(700);

    const stateBefore = await page.evaluate(() => {
      const qa = window.__ROADTRIP_QA__;
      return qa ? qa.getState() : null;
    });

    expect(stateBefore, 'Road Trip QA state must be available').not.toBeNull();

    await page.waitForTimeout(1200);

    const stateAfter = await page.evaluate(() => window.__ROADTRIP_QA__.getState());

    expect(stateAfter.running).toBeTruthy();

    // The game must actually advance its world while the car is driving.
    // At least one spawned object must have changed its Y position.
    const before = new Map(
      stateBefore.objects.map((o, i) => [`${o.type}-${i}`, o.y])
    );
    const moved = stateAfter.objects.some((o, i) => {
      const oldY = before.get(`${o.type}-${i}`);
      return typeof oldY === 'number' && typeof o.y === 'number' && Math.abs(o.y - oldY) > 5;
    });

    expect(
      moved,
      'Während der Fahrt muss sich mindestens ein Stern/Hindernis sichtbar auf das Auto zubewegen.'
    ).toBeTruthy();
  });
});
