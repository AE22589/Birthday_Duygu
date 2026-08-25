const { test, expect } = require('@playwright/test');

async function openDeveloperQuestMap(page) {
  // Keep the test deterministic even after the birthday date has passed.
  await page.addInitScript(() => {
    const fixed = new Date('2026-09-07T23:00:00+02:00').getTime();
    Date.now = () => fixed;
  });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({ clickCount: 5, delay: 80, force: true });
  await expect(page.locator('#adminModal')).toBeVisible();
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('#adminModal')).toBeHidden();
}

async function openQuestOne(page) {
  await page.locator('[data-quest="1"]').click();
  await expect(page.locator('#roadTripScreen')).toBeVisible();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();
  await expect(page.locator('#roadTripResult')).toBeHidden();
}

test('security gate -> quest map -> Quest I intro', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  expect(errors).toEqual([]);
});

test('Quest I ready gate starts a real game', async ({ page }) => {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await expect(page.locator('#readyButton')).toHaveText(/3|2|1|GO|I'M READY/);
  await expect(page.locator('#roadTripGame')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#roadBoard')).toBeVisible();
  await expect(page.locator('#timeCount')).toHaveText(/^(5[0-9]|60)$/);
});

test('desktop keyboard changes lanes and game prevents page scrolling', async ({ page }) => {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await page.waitForTimeout(3000);
  const board = page.locator('#roadBoard');
  await expect(board).toBeVisible();
  const before = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(160);
  const after = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  expect(after).not.toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('mobile swipe changes lanes without browser scrolling', async ({ page }) => {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await page.waitForTimeout(3000);
  const before = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  await page.locator('#roadBoard').evaluate(board => {
    const fire = (type, x) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'changedTouches', { value: [{ clientX: x }] });
      board.dispatchEvent(ev);
    };
    fire('touchstart', 300);
    fire('touchend', 100);
  });
  await page.waitForTimeout(180);
  const after = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  expect(after).not.toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
