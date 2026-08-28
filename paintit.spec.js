const { test, expect } = require('@playwright/test');

function monitorRuntime(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  return errors;
}

async function reachPaintIt(page) {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-09-07T23:00:00+02:00').getTime();
  });
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1] }));
  });
  await page.reload();
  await page.locator('#doorHit').click({ clickCount: 5, delay: 80, force: true });
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
}

test('Quest II bleibt gesperrt, bis Quest I abgeschlossen ist', async ({ page }) => {
  const errors = monitorRuntime(page);
  await page.addInitScript(() => { Date.now = () => new Date('2026-09-07T23:00:00+02:00').getTime(); });
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#doorHit').click({ clickCount: 5, delay: 80, force: true });
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();

  await page.locator('[data-quest="2"]').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('#paintItScreen')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Quest II lädt lazy und zeigt Intro mit Pflichthinweisen', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  expect(await page.evaluate(() => typeof window.showPaintItScreen)).toBe('undefined');
  await page.locator('[data-quest="2"]').click();
  await expect(page.locator('#paintItIntro')).toBeVisible({ timeout: 4000 });
  expect(await page.evaluate(() => typeof window.showPaintItScreen)).toBe('function');
  await expect(page.locator('#paintItIntro')).toContainText(/pass/i);
  await expect(page.locator('#paintItIntro')).toContainText(/paw print/i);
  await expect(page.locator('#paintItIntro')).toContainText(/60 seconds/i);
  expect(errors).toEqual([]);
});

test('Bemalen mehrerer Durchgänge erhöht die Deckung korrekt', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  await page.locator('[data-quest="2"]').click();
  await page.locator('#piReadyButton').click();
  await expect(page.locator('#paintItGame')).toBeVisible({ timeout: 4000 });

  await page.evaluate(() => window.__PAINTIT__.paintAt(0, 0));
  let state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.grid[0]).toBe(1);

  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__PAINTIT__.paintAt(0, 0); });
  state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.grid[0]).toBe(4);
  expect(state.coverage).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Pfotenabdruck wirkt nur auf vollständig gestrichene Felder und bleibt sichtbar', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  await page.locator('[data-quest="2"]').click();
  await page.locator('#piReadyButton').click();
  await expect(page.locator('#paintItGame')).toBeVisible({ timeout: 4000 });

  await page.evaluate(() => window.__PAINTIT__.paintAt(1, 1));
  await page.evaluate(() => window.__PAINTIT__.pawPrintAt(1, 1));
  let state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.grid[7]).toBe(1); // unverändert, da noch nicht voll

  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__PAINTIT__.paintAt(1, 1); });
  await page.evaluate(() => window.__PAINTIT__.pawPrintAt(1, 1));
  state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.grid[7]).toBe(0); // jetzt zurückgesetzt

  // Ein anderes Feld bemalen darf den Pfotenabdruck-Zustand von Feld 7 nicht löschen
  await page.evaluate(() => window.__PAINTIT__.paintAt(3, 3));
  state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.pawFlags[7]).toBe(true);
  expect(errors).toEqual([]);
});

test('100% Deckung beendet die Runde sofort mit Bestwertung und Schlüssel', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  await page.locator('[data-quest="2"]').click();
  await page.locator('#piReadyButton').click();
  await expect(page.locator('#paintItGame')).toBeVisible({ timeout: 4000 });

  await page.evaluate(() => {
    const s = window.__PAINTIT__.getState();
    const cols = 6, rows = 6;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let i = 0; i < 4; i++) window.__PAINTIT__.paintAt(r, c);
  });
  await expect(page.locator('#paintItResult')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#piResultTitle')).toHaveText('SPOTLESS!');
  await expect(page.locator('#piKeyReward')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('duyguBirthdayQuestState_v1'));
  expect(JSON.parse(stored).completed).toContain(2);
  expect(errors).toEqual([]);
});

test('Zeitablauf unter 90% zeigt "NOT QUITE THERE" ohne Schlüssel, Retry funktioniert', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  await page.locator('[data-quest="2"]').click();
  await page.locator('#piReadyButton').click();
  await expect(page.locator('#paintItGame')).toBeVisible({ timeout: 4000 });

  await page.evaluate(() => window.__PAINTIT__.setElapsed(60));
  await expect(page.locator('#paintItResult')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#piResultTitle')).toHaveText('NOT QUITE THERE');
  await expect(page.locator('#piKeyReward')).toBeHidden();

  await page.locator('#piRetry').click();
  await expect(page.locator('#paintItGame')).toBeVisible({ timeout: 4000 });
  const state = await page.evaluate(() => window.__PAINTIT__.getState());
  expect(state.coverage).toBe(0);
  expect(errors).toEqual([]);
});

test('Zurück zur Map von Intro und Ergebnis funktioniert', async ({ page }) => {
  const errors = monitorRuntime(page);
  await reachPaintIt(page);
  await page.locator('[data-quest="2"]').click();
  await expect(page.locator('#paintItIntro')).toBeVisible({ timeout: 4000 });
  await page.locator('#piBackToMapFromIntro').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('#paintItScreen')).toBeHidden();
  expect(errors).toEqual([]);
});
