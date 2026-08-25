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

test('desktop keyboard visibly changes lanes and prevents page scrolling', async ({ page }) => {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({ timeout: 6000 });
  const board = page.locator('#roadBoard');
  const car = page.locator('#playerCar');
  await expect(board).toBeVisible();

  const center = async () => {
    const box = await car.boundingBox();
    if (!box) throw new Error('player car has no bounding box');
    return box.x + box.width / 2;
  };

  const initial = await center();
  expect(await car.getAttribute('data-lane')).toBe('1');

  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('0');
  await page.waitForTimeout(350);
  const left = await center();
  expect(left).toBeLessThan(initial - 10);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('1');
  await page.waitForTimeout(350);
  const backToCenter = await center();
  expect(Math.abs(backToCenter - initial)).toBeLessThan(3);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('2');
  await page.waitForTimeout(350);
  const right = await center();
  expect(right).toBeGreaterThan(initial + 10);

  await page.waitForTimeout(160);
  await page.locator('.game-control[data-move="-1"]').click();
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('1');
  await page.waitForTimeout(350);
  const afterButton = await center();
  expect(Math.abs(afterButton - initial)).toBeLessThan(3);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('mobile swipe visibly changes lanes without browser scrolling', async ({ page }) => {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({ timeout: 6000 });
  const board = page.locator('#roadBoard');
  const car = page.locator('#playerCar');

  const center = async () => {
    const box = await car.boundingBox();
    if (!box) throw new Error('player car has no bounding box');
    return box.x + box.width / 2;
  };

  const before = await center();
  await board.evaluate(board => {
    const fire = (type, x) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'changedTouches', { value: [{ clientX: x }] });
      board.dispatchEvent(ev);
    };
    fire('touchstart', 300);
    fire('touchend', 100);
  });

  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('0');
  await page.waitForTimeout(350);
  const after = await center();
  expect(after).toBeLessThan(before - 10);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
