import { test, expect } from '@playwright/test';

test('Quest V Memory Lane smoke', async ({ page }) => {
  test.setTimeout(60000);
  const networkErrors = [], consoleErrors = [], pageErrors = [];
  page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('duyguBirthdayQuestState_v1')) {
      localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2, 3, 4] }));
    }
  });
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="6"]')).toHaveAttribute('tabindex', '-1');
  await page.locator('[data-quest="5"]').click();
  await expect(page.locator('#memoryLaneScreen')).toBeVisible();
  await page.locator('#mlReadyButton').click();
  await expect(page.locator('#memoryLaneGame')).toBeVisible();
  const cards = page.locator('#mlBoard .ml-card');
  await expect(cards).toHaveCount(16);
  await expect(cards.locator('.ml-card-back')).toHaveCount(16);
  const first = cards.nth(0);
  await first.click();
  await expect(first).toHaveClass(/is-open/);
  const groups = await cards.evaluateAll(elements => {
    const grouped = {};
    elements.forEach((element, index) => {
      const asset = element.querySelector('.ml-card-front')?.getAttribute('src');
      (grouped[asset] ??= []).push(index);
    });
    return Object.values(grouped);
  });
  expect(groups).toHaveLength(8);
  expect(groups.every(pair => pair.length === 2)).toBe(true);
  const firstPartner = groups.find(pair => pair.includes(0)).find(index => index !== 0);
  await cards.nth(firstPartner).click();
  await expect.poll(() => page.evaluate(() => window.__MEMORYLANE__.getState().matched)).toBe(1);
  for (const pair of groups.filter(pair => !pair.includes(0))) {
    await cards.nth(pair[0]).click();
    await cards.nth(pair[1]).click();
    const expected = groups.indexOf(pair) + 1;
    await expect.poll(() => page.evaluate(() => window.__MEMORYLANE__.getState().matched)).toBe(expected);
    await expect.poll(() => page.evaluate(() => window.__MEMORYLANE__.getState().open)).toEqual([]);
  }
  await expect(page.locator('#memoryLaneResult')).toBeVisible();
  await expect(page.locator('#memoryLaneResult .rt-key-reward')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4, 5]);
  await page.locator('#mlReturnButton').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="5"]')).toHaveAttribute('aria-label', /completed/i);
  await expect(page.locator('[data-quest="6"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="7"]')).toHaveAttribute('tabindex', '-1');
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4, 5]);
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="6"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-quest="7"]')).toHaveAttribute('tabindex', '-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
  expect(networkErrors, networkErrors.join('\n')).toEqual([]);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
