import { test, expect } from '@playwright/test';

test('Quest III Sucuk Master smoke', async ({ page }) => {
  test.setTimeout(60000);
  const networkErrors = [], consoleErrors = [], pageErrors = [];
  page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('duyguBirthdayQuestState_v1')) {
      localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2] }));
    }
  });
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="3"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="4"]')).toHaveAttribute('tabindex', '-1');
  await page.locator('[data-quest="3"]').click();
  await expect(page.locator('#sucukMasterScreen')).toBeVisible();
  await expect(page.locator('#sucukMasterIntro')).toBeVisible();
  await page.locator('#smReadyButton').click();
  await expect(page.locator('#sucukMasterGame')).toBeVisible();
  for (let expected = 1; expected <= 5; expected++) {
    await page.evaluate(() => window.__SUCUKMASTER__.spawn());
    const slotIndex = await page.evaluate(() => window.__SUCUKMASTER__.getState().slots.findIndex(slot => slot.state === 'active'));
    expect(slotIndex).toBeGreaterThanOrEqual(0);
    await page.evaluate(index => {
      window.__SUCUKMASTER__.setSlotProgress(index, 0.75);
      window.__SUCUKMASTER__.clickSlot(index, 0.75);
    }, slotIndex);
    await expect.poll(() => page.evaluate(() => window.__SUCUKMASTER__.getState().perfectSucuks)).toBe(expected);
  }
  await expect(page.locator('#sucukMasterResult')).toBeVisible();
  await expect(page.locator('#smKeyReward')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3]);
  await page.locator('#smReturnToMapFromResult').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="3"]')).toHaveAttribute('aria-label', /completed/i);
  await expect(page.locator('[data-quest="4"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '-1');
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3]);
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="4"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '-1');
  expect(networkErrors, networkErrors.join('\n')).toEqual([]);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
