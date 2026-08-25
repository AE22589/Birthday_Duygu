const { test, expect } = require('@playwright/test');

async function startQaGame(page) {
  await page.addInitScript(() => { Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime(); localStorage.clear(); });
  await page.goto('/index.html?qa=1');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await page.locator('[data-quest="1"]').click();
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({timeout:6000});
  await expect.poll(async()=>await page.locator('#playerCar').getAttribute('data-lane')).toBe('1');
}

test('game state QA API exposes deterministic movement state', async ({page}) => {
  await startQaGame(page);
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__?.getState().running)).toBeTruthy();
  await page.evaluate(()=>window.__DUYGU_QA__.move(-1));
  await expect.poll(async()=>await page.locator('#playerCar').getAttribute('data-lane')).toBe('0');
  await page.evaluate(()=>window.__DUYGU_QA__.move(1));
  await expect.poll(async()=>await page.locator('#playerCar').getAttribute('data-lane')).toBe('1');
});

test('game over and key reward states are reachable deterministically', async ({page}) => {
  await startQaGame(page);
  await page.evaluate(()=>window.__DUYGU_QA__.setScore(20));
  await page.evaluate(()=>window.__DUYGU_QA__.forceFinish(false));
  await expect(page.locator('#roadTripResult')).toBeVisible();
  await expect(page.locator('#keyReward')).toBeVisible();

  await page.locator('#retryRoadTrip').click();
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({timeout:6000});
  await page.evaluate(()=>window.__DUYGU_QA__.setLives(0));
  await page.evaluate(()=>window.__DUYGU_QA__.forceFinish(true));
  await expect(page.locator('#roadTripResult')).toBeVisible();
  await expect(page.locator('#keyReward')).toBeHidden();
});


test('successful Quest I persists completion and returns to Quest Map', async ({page}) => {
  await startQaGame(page);
  await page.evaluate(() => window.__DUYGU_QA__.setScore(20));
  await page.evaluate(() => window.__DUYGU_QA__.forceFinish(false));
  await expect(page.locator('#keyReward')).toBeVisible();
  await page.locator('#returnToMapFromResult').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="2"]')).toBeVisible();
  await expect(page.locator('[data-quest="1"]')).toHaveAttribute('aria-label', /already|locked|complete/i);
  await page.reload();
  await expect(page.locator('#entrance')).toBeVisible();
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('[data-quest="2"]')).toBeVisible();
});

test('retry resets the game to a clean deterministic start state', async ({page}) => {
  await startQaGame(page);
  await page.evaluate(() => window.__DUYGU_QA__.setScore(7));
  await page.evaluate(() => window.__DUYGU_QA__.setLives(1));
  await page.evaluate(() => window.__DUYGU_QA__.forceFinish(true));
  await expect(page.locator('#roadTripResult')).toBeVisible();
  await page.locator('#retryRoadTrip').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.getState())).toMatchObject({score:0,lives:3,lane:1,running:false});
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({timeout:6000});
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.getState())).toMatchObject({score:0,lives:3,lane:1,running:true});
});
