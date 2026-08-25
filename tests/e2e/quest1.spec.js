const { test, expect } = require('@playwright/test');

async function unlockDeveloperPreview(page) {
  const door = page.locator('#doorHit');
  await expect(door).toBeVisible();
  await door.click({ clickCount: 5, delay: 80 });
  const modal = page.locator('#adminModal');
  await expect(modal).toBeVisible();
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
}

async function openQuestOne(page) {
  const quest = page.locator('#questControls .quest-hotspot[data-quest="1"]');
  await expect(quest).toBeVisible();
  await quest.click();
  await expect(page.locator('#roadTripScreen')).toBeVisible();
  await expect(page.locator('#questScreen')).toBeHidden();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  await page.goto('/?qa=1', { waitUntil: 'networkidle' });
  page.on('close', () => {});
  page.__qaErrors = errors;
});

test('security gate and Quest I navigation are intact', async ({ page }) => {
  await expect(page.locator('#entrance')).toBeVisible();
  await expect(page.locator('#questScreen')).toBeHidden();
  await unlockDeveloperPreview(page);
  await expect(page.locator('#adminModal')).toBeHidden();
  await openQuestOne(page);
  expect(page.__qaErrors).toEqual([]);
});

test('READY is a real state transition: intro only, then game only', async ({ page }) => {
  await unlockDeveloperPreview(page);
  await openQuestOne(page);

  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();

  await page.waitForTimeout(2300);
  await expect(page.locator('#roadTripGame')).toBeVisible();
  await expect(page.locator('#roadTripIntro')).toBeHidden();
  await expect(page.locator('#roadTripResult')).toBeHidden();

  expect(await page.locator('#roadBoard').boundingBox()).not.toBeNull();
  expect(page.__qaErrors).toEqual([]);
});

test('desktop keyboard changes lanes without page scrolling', async ({ page }) => {
  test.skip(!page.context().browser().browserType().name().includes('chromium'), 'Keyboard regression is browser-agnostic but kept on Chromium baseline');
  await unlockDeveloperPreview(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await page.waitForTimeout(2300);

  const board = page.locator('#roadBoard');
  await board.focus();
  const before = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(150);
  const afterLeft = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const afterRight = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));

  expect(afterLeft).not.toBe(before);
  expect(afterRight).toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(page.__qaErrors).toEqual([]);
});

test('mobile swipe changes lanes and does not scroll the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only regression');
  await unlockDeveloperPreview(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await page.waitForTimeout(2300);

  const board = page.locator('#roadBoard');
  const box = await board.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.65;
  const before = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));

  await page.touchscreen.tap(x, y);
  await page.evaluate(({x1, y1, x2, y2}) => {
    const el = document.getElementById('roadBoard');
    const touch = type => new Touch({ identifier: 1, target: el, clientX: type === 'start' ? x1 : x2, clientY: type === 'start' ? y1 : y2 });
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, changedTouches: [touch('start')] }));
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [touch('end')] }));
  }, {x1: x, y1: y, x2: x - 90, y2: y});
  await page.waitForTimeout(150);

  const after = await page.locator('#playerCar').evaluate(el => getComputedStyle(el).getPropertyValue('--car-x'));
  expect(after).not.toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(page.__qaErrors).toEqual([]);
});

test('game screen stays inside the viewport on desktop and mobile', async ({ page }) => {
  await unlockDeveloperPreview(page);
  await openQuestOne(page);
  await page.locator('#readyButton').click();
  await page.waitForTimeout(2300);

  const viewport = page.viewportSize();
  const board = await page.locator('#roadBoard').boundingBox();
  expect(board).not.toBeNull();
  expect(board.y).toBeGreaterThanOrEqual(0);
  expect(board.x).toBeGreaterThanOrEqual(0);
  expect(board.y + board.height).toBeLessThanOrEqual(viewport.height + 2);
  expect(board.x + board.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(page.__qaErrors).toEqual([]);
});
