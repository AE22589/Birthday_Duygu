import { test, expect } from '@playwright/test';

test('Quest IV Lokum Challenge smoke', async ({ page }) => {
  test.setTimeout(60000);
  const networkErrors = [], consoleErrors = [], pageErrors = [];
  page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('duyguBirthdayQuestState_v1')) {
      localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2, 3] }));
    }
  });
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="4"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '-1');
  await page.locator('[data-quest="4"]').click();
  await expect(page.locator('#lokumChallengeScreen')).toBeVisible();
  await expect(page.locator('#lcMazeImage[src="maze-01-new.png"]')).toBeVisible();
  await expect(page.locator('#lcLokum')).toBeVisible();
  await expect(page.locator('#lcMaze')).toBeVisible();
  await expect(page.locator('[data-lc-direction]').first()).toBeVisible();
  const before = await page.evaluate(() => { const s = window.__LOKUMCHALLENGE__.getState(); return { row: s.row, col: s.col }; });
  await page.evaluate(() => window.__LOKUMCHALLENGE__.move('up'));
  const after = await page.evaluate(() => { const s = window.__LOKUMCHALLENGE__.getState(); return { row: s.row, col: s.col }; });
  expect(after).not.toEqual(before);
  await page.evaluate(() => window.__LOKUMCHALLENGE__.forceExit());
  await expect(page.locator('#lcMazeImage[src="maze-02-new.png"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).not.toContain(4);
  await page.evaluate(() => window.__LOKUMCHALLENGE__.forceExit());
  await expect(page.locator('#lokumChallengeResult')).toBeVisible();
  await expect(page.locator('#lcKeyReward')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4]);
  await page.locator('#lcReturnToMapFromResult').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="4"]')).toHaveAttribute('aria-label', /completed/i);
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="6"]')).toHaveAttribute('tabindex', '-1');
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4]);
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="6"]')).toHaveAttribute('tabindex', '-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
  expect(networkErrors, networkErrors.join('\n')).toEqual([]);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
