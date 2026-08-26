import { test, expect } from '@playwright/test';

test('Road Trip smoke: board is measured after game becomes visible and object moves', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => window.__ROADTRIP_QA__?.start?.());

  const board = await page.evaluate(() => window.__ROADTRIP_QA__?.getBoardSize?.());
  expect(board?.w).toBeGreaterThan(0);
  expect(board?.h).toBeGreaterThan(0);

  const before = await page.evaluate(() => {
    const o = window.__ROADTRIP_QA__?.getState?.().objects?.find(o => o.qaTest);
    return o ? { y:o.y, top:o.el.getBoundingClientRect().top, width:o.el.getBoundingClientRect().width } : null;
  });
  expect(before).not.toBeNull();

  await page.waitForTimeout(180);

  const after = await page.evaluate(() => {
    const o = window.__ROADTRIP_QA__?.getState?.().objects?.find(o => o.qaTest);
    return o ? { y:o.y, top:o.el.getBoundingClientRect().top, width:o.el.getBoundingClientRect().width } : null;
  });
  expect(after).not.toBeNull();
  expect(after.y).toBeGreaterThan(before.y);
  expect(after.top).toBeGreaterThan(before.top);
  expect(after.width).toBeGreaterThan(before.width);

  await page.evaluate(() => window.__ROADTRIP_QA__?.stop?.());
});
