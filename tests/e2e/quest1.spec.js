const { test, expect } = require('@playwright/test');

async function openDeveloperQuestMap(page) {
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

async function startGame(page) {
  await openDeveloperQuestMap(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#roadBoard')).toBeVisible();
  await expect(page.locator('#playerCar')).toBeVisible();
  await expect.poll(async () => await page.locator('#playerCar').getAttribute('data-lane')).toBe('1');
}

async function carCenter(page) {
  const box = await page.locator('#playerCar').boundingBox();
  if (!box) throw new Error('player car has no bounding box');
  return box.x + box.width / 2;
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
  await startGame(page);
  await expect(page.locator('#timeCount')).toHaveText(/^(5[0-9]|60)$/);
});

test('desktop keyboard moves the car left and right and prevents scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile-'));
  await startGame(page);
  const car = page.locator('#playerCar');
  const initial = await carCenter(page);

  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('0');
  await expect.poll(async () => await carCenter(page)).toBeLessThan(initial - 10);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('1');
  await expect.poll(async () => Math.abs(await carCenter(page) - initial)).toBeLessThan(3);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('2');
  await expect.poll(async () => await carCenter(page)).toBeGreaterThan(initial + 10);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('2');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('desktop lane control buttons use the same movement logic', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile-'));
  await startGame(page);
  const car = page.locator('#playerCar');
  const initial = await carCenter(page);
  await page.locator('.game-control[data-move="-1"]').click();
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('0');
  await expect.poll(async () => await carCenter(page)).toBeLessThan(initial - 10);
  await page.locator('.game-control[data-move="1"]').click();
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('1');
});

async function swipe(page, startRatio, endRatio) {
  const board = page.locator('#roadBoard');
  const box = await board.boundingBox();
  if (!box) throw new Error('road board has no bounding box');
  const y = box.y + box.height / 2;
  await page.evaluate(({xStart,xEnd,y}) => {
    const board = document.querySelector('#roadBoard');
    board.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:9,pointerType:'touch',clientX:xStart,clientY:y}));
    board.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:9,pointerType:'touch',clientX:xEnd,clientY:y}));
  }, {xStart:box.x+box.width*startRatio,xEnd:box.x+box.width*endRatio,y});
}

test('mobile swipe left moves car left without scrolling', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'));
  await startGame(page);
  const car = page.locator('#playerCar');
  const initial = await carCenter(page);
  await swipe(page, .70, .30);
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('0');
  await expect.poll(async () => await carCenter(page)).toBeLessThan(initial - 10);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('mobile swipe right moves car right without scrolling', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'));
  await startGame(page);
  const car = page.locator('#playerCar');
  const initial = await carCenter(page);
  await swipe(page, .30, .70);
  await expect.poll(async () => await car.getAttribute('data-lane')).toBe('2');
  await expect.poll(async () => await carCenter(page)).toBeGreaterThan(initial + 10);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('mobile door taps count reliably to developer gate', async ({ page }) => {
  await page.goto('/index.html');
  const door = page.locator('#doorHit');
  for (let i = 0; i < 5; i++) {
    await door.dispatchEvent('touchend', { bubbles: true, cancelable: true });
    await page.waitForTimeout(80);
  }
  await expect(page.locator('#adminModal')).toBeVisible();
});
