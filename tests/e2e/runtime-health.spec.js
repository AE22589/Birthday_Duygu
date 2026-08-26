const { test, expect } = require('@playwright/test');

const ASSETS = [
  'assets/entrance-scene.jpg', 'assets/quest-map-desktop.webp', 'assets/quest-map-mobile.webp'
];

function monitorRuntime(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('requestfailed', req => errors.push(`requestfailed: ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
  return errors;
}

async function unlock(page) {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-09-07T23:00:00+02:00').getTime();
    localStorage.clear();
  });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({ clickCount: 5, delay: 80, force: true });
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
}

async function start(page) {
  await unlock(page);
  await page.locator('[data-quest="1"]').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();
  await expect(page.locator('#readyButton')).toBeVisible();
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#roadTripIntro')).toBeHidden();
  await expect(page.locator('#roadTripResult')).toBeHidden();
  await expect(page.locator('#playerCar')).toBeVisible();
}

test('intro ist vollständig sichtbar und ohne Layout-Überlauf', async ({ page }) => {
  const errors = monitorRuntime(page);
  await unlock(page);
  await page.locator('[data-quest="1"]').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();

  const viewport = { width: page.viewportSize().width, height: page.viewportSize().height };
  const requiredSelectors = ['#roadTripScreen', '#roadTripIntro', '#readyButton'];
  for (const sel of requiredSelectors) {
    const box = await page.locator(sel).boundingBox();
    expect(box, `${sel} must have a valid bounding box and be visible`).not.toBeNull();
    expect(box.x, `${sel} x`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, `${sel} right`).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y, `${sel} y`).toBeGreaterThanOrEqual(-1);
    expect(box.y + box.height, `${sel} bottom`).toBeLessThanOrEqual(viewport.height + 1);
  }
  const scroll = await page.evaluate(() => ({
    scrollX, scrollY,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    overflowY: document.documentElement.scrollHeight - innerHeight
  }));
  expect(scroll.scrollX).toBe(0); expect(scroll.scrollY).toBe(0);
  expect(scroll.overflowX).toBeLessThanOrEqual(1); expect(scroll.overflowY).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('runtime health: keine JS-Fehler, keine fehlgeschlagenen Requests, kein Layout-Überlauf', async ({ page }) => {
  const errors = monitorRuntime(page);
  await start(page);

  const assetResults = await page.evaluate(async assets => Promise.all(assets.map(async url => {
    const response = await fetch(url, { cache: 'no-store' });
    return { url, ok: response.ok, status: response.status };
  })), ASSETS);
  expect(assetResults.filter(x => !x.ok)).toEqual([]);

  const geometry = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight };
    const ids = ['roadTripGame', 'roadBoard', 'playerCar', 'lifeCount', 'timeCount', 'starCount'];
    const boxes = Object.fromEntries(ids.map(id => {
      const r = document.getElementById(id)?.getBoundingClientRect();
      return [id, r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null];
    }));
    return {
      viewport, scrollX, scrollY,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      boxes
    };
  });
  expect(geometry.scrollX).toBe(0);
  expect(geometry.scrollY).toBe(0);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewport.height + 1);
  for (const id of ['roadTripGame', 'roadBoard', 'playerCar']) {
    const b = geometry.boxes[id];
    expect(b, `${id} must have a box`).not.toBeNull();
    expect(b.left).toBeGreaterThanOrEqual(-1);
    expect(b.top).toBeGreaterThanOrEqual(-1);
    expect(b.right).toBeLessThanOrEqual(geometry.viewport.width + 1);
    expect(b.bottom).toBeLessThanOrEqual(geometry.viewport.height + 1);
  }
  expect(errors).toEqual([]);
});

test('Timer läuft herunter und der Game Loop stoppt bei Ablauf', async ({ page }) => {
  const errors = monitorRuntime(page);
  await start(page);
  await page.evaluate(() => window.__ROADTRIP__.setElapsed(59));
  await expect(page.locator('#timeCount')).toHaveText('1');
  await page.waitForTimeout(1200);
  await expect(page.locator('#roadTripResult')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();
  await expect.poll(async () => (await page.evaluate(() => window.__ROADTRIP__.getState())).running).toBe(false);
  expect(errors).toEqual([]);
});

test('Sterne sammeln und Hindernis-Kollision aktualisieren den echten Spielzustand', async ({ page }) => {
  const errors = monitorRuntime(page);
  await start(page);
  await page.evaluate(() => window.__ROADTRIP__.spawn('star', 1));
  await expect.poll(async () => (await page.evaluate(() => window.__ROADTRIP__.getState())).score).toBe(1);
  await page.evaluate(() => window.__ROADTRIP__.spawn('barrel', 1));
  await expect.poll(async () => (await page.evaluate(() => window.__ROADTRIP__.getState())).lives).toBe(2);
  expect(errors).toEqual([]);
});
