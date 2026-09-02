import { test, expect } from '@playwright/test';

test('Quest VII German Words smoke', async ({ page }) => {
  test.setTimeout(60000);
  const networkErrors = [], consoleErrors = [], pageErrors = [];
  page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__word7_fixture') === 'true') return;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2, 3, 4, 5, 6] }));
    sessionStorage.setItem('__word7_fixture', 'true');
  });
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="7"]')).toHaveAttribute('tabindex', '0');
  await page.locator('[data-quest="7"]').click();
  await expect(page.locator('#wordChallengeScreen')).toBeVisible();
  const answers = ['A', 'B', 'C', 'C', 'A', 'B', 'C', 'A', 'C', 'B'];
  await expect(page.locator('#gwWordCounter')).toHaveText('WORD 01/10');
  await expect(page.locator('[data-gw-answer]')).toHaveCount(3);
  await page.locator(`[data-gw-answer="${answers[0]}"]`).click();
  await expect(page.locator('#gwNextButton')).toBeVisible();
  expect(await page.locator('[data-gw-answer]').evaluateAll(buttons => buttons.every(button => button.disabled))).toBe(true);
  await page.locator('#gwNextButton').click();
  for (let index = 1; index < answers.length; index += 1) {
    await expect(page.locator('#gwWordCounter')).toHaveText(`WORD ${String(index + 1).padStart(2, '0')}/10`);
    await expect(page.locator('[data-gw-answer]')).toHaveCount(3);
    await page.locator(`[data-gw-answer="${answers[index]}"]`).click();
    await expect(page.locator('#gwScoreCounter')).toHaveText(`SCORE ${index + 1}/10`);
    await page.locator('#gwNextButton').click();
  }
  await expect(page.locator('#wordChallengeResult')).toBeVisible();
  await expect(page.locator('#gwResultMessage')).toContainText('10/10');
  await expect(page.locator('#gwResultTitle')).toHaveText('GERMAN MASTER!');
  await expect(page.locator('#wordChallengeResult')).toContainText('KEY UNLOCKED');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  await page.locator('#gwBackToMap').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="7"]')).toHaveAttribute('aria-label', /completed/i);
  await expect(page.locator('#finalDoorHotspot')).toHaveAttribute('aria-label', /unlocked/i);
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1') || '{}').completed || [])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  await page.goto('/index.html?qa=visual-map');
  await expect(page.locator('#finalDoorHotspot')).toHaveAttribute('aria-label', /unlocked/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
  expect(networkErrors, networkErrors.join('\n')).toEqual([]);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
