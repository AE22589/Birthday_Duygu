import { test, expect } from '@playwright/test';

test('Road Trip smoke: board measurement and visible object motion', async ({ page }) => {
  await page.goto('/index.html');

  const before = await page.evaluate(() => {
    window.__ROADTRIP_QA__?.start?.();
    window.__ROADTRIP_QA__?.spawnMotionTestObject?.('star', 1);
    const board = window.__ROADTRIP_QA__?.getBoardSize?.();
    const el = document.querySelector('#dynamicLayer .rt-object');
    const r = el?.getBoundingClientRect();
    return { board, box: r ? {top:r.top,width:r.width} : null };
  });

  expect(before.board?.w).toBeGreaterThan(0);
  expect(before.board?.h).toBeGreaterThan(0);
  expect(before.box).not.toBeNull();

  await page.waitForTimeout(300);

  const after = await page.evaluate(() => {
    const el = document.querySelector('#dynamicLayer .rt-object');
    const r = el?.getBoundingClientRect();
    return r ? {top:r.top,width:r.width} : null;
  });

  expect(after).not.toBeNull();
  expect(after.top).toBeGreaterThan(before.box.top);
  expect(after.width).toBeGreaterThan(before.box.width);

  await page.evaluate(() => window.__ROADTRIP_QA__?.stop?.());
});
