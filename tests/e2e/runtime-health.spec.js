const { test, expect } = require('@playwright/test');

const ASSETS = [
  'assets/entrance-scene.jpg','assets/quest-map-desktop.webp','assets/quest-map-mobile.webp',
  'assets/roadtrip-intro-art.jpg','assets/quest1-intro-art.jpg','assets/quest1-game-background.jpg',
  'assets/roadtrip-car.png','assets/game-star.png','assets/game-barrel.png','assets/game-cat.png'
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
  await page.goto('/index.html?qa=1');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
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
  await expect(page.locator('#roadTripGame')).toBeVisible({timeout:6000});
  await expect(page.locator('#roadTripIntro')).toBeHidden();
  await expect(page.locator('#roadTripResult')).toBeHidden();
  await expect(page.locator('#playerCar')).toBeVisible();
}


test('intro is complete, responsive, and uses the correct control instructions', async ({page}, testInfo) => {
  const errors = monitorRuntime(page);
  await unlock(page);
  await page.locator('[data-quest="1"]').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  const mobile = testInfo.project.name.startsWith('mobile-');
  if (mobile) {
    await expect(page.locator('.mobile-instructions')).toBeVisible();
    await expect(page.locator('.desktop-instructions')).toBeHidden();
  } else {
    await expect(page.locator('.mobile-instructions')).toBeHidden();
    await expect(page.locator('.desktop-instructions')).toBeVisible();
  }
  const viewport = { width: page.viewportSize().width, height: page.viewportSize().height };
  const targetSelector = mobile ? '.mobile-instructions' : '.desktop-instructions';
  const requiredSelectors = ['#roadTripScreen','#roadTripIntro','.intro-art-panel','.intro-copy','#readyButton'];
  for (const sel of requiredSelectors) {
    const box = await page.locator(sel).boundingBox();
    expect(box, `${sel} must have a valid bounding box and be visible`).not.toBeNull();
    expect(box.left, `${sel} left`).toBeGreaterThanOrEqual(-1);
    expect(box.right, `${sel} right`).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.top, `${sel} top`).toBeGreaterThanOrEqual(-1);
    expect(box.bottom, `${sel} bottom`).toBeLessThanOrEqual(viewport.height + 1);
  }
  const instructionBox = await page.locator(targetSelector).boundingBox();
  expect(instructionBox, `${targetSelector} must have a valid bounding box and be visible`).not.toBeNull();
  expect(instructionBox.left, `${targetSelector} left`).toBeGreaterThanOrEqual(-1);
  expect(instructionBox.right, `${targetSelector} right`).toBeLessThanOrEqual(viewport.width + 1);
  expect(instructionBox.top, `${targetSelector} top`).toBeGreaterThanOrEqual(-1);
  expect(instructionBox.bottom, `${targetSelector} bottom`).toBeLessThanOrEqual(viewport.height + 1);
  const scroll = await page.evaluate(() => ({scrollX, scrollY, overflowX:document.documentElement.scrollWidth-innerWidth, overflowY:document.documentElement.scrollHeight-innerHeight}));
  expect(scroll.scrollX).toBe(0); expect(scroll.scrollY).toBe(0);
  expect(scroll.overflowX).toBeLessThanOrEqual(1); expect(scroll.overflowY).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('runtime health: no JS errors, failed requests, missing assets, or viewport overflow', async ({page}) => {
  const errors = monitorRuntime(page);
  await start(page);
  const assetResults = await page.evaluate(async assets => Promise.all(assets.map(async url => {
    const response = await fetch(url, {cache:'no-store'});
    return {url, ok:response.ok, status:response.status};
  })), ASSETS);
  expect(assetResults.filter(x => !x.ok)).toEqual([]);

  const geometry = await page.evaluate(() => {
    const viewport={width:innerWidth,height:innerHeight};
    const ids=['roadTripGame','roadBoard','playerCar','lifeCount','timeCount','starCount'];
    const boxes=Object.fromEntries(ids.map(id=>{
      const r=document.getElementById(id)?.getBoundingClientRect();
      return [id,r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null];
    }));
    return {
      viewport,
      scrollX,
      scrollY,
      documentWidth:document.documentElement.scrollWidth,
      documentHeight:document.documentElement.scrollHeight,
      boxes
    };
  });
  expect(geometry.scrollX).toBe(0);
  expect(geometry.scrollY).toBe(0);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewport.height + 1);
  for (const id of ['roadTripGame','roadBoard','playerCar']) {
    const b=geometry.boxes[id];
    expect(b,`${id} must have a box`).not.toBeNull();
    expect(b.left).toBeGreaterThanOrEqual(-1);
    expect(b.top).toBeGreaterThanOrEqual(-1);
    expect(b.right).toBeLessThanOrEqual(geometry.viewport.width+1);
    expect(b.bottom).toBeLessThanOrEqual(geometry.viewport.height+1);
  }
  expect(errors).toEqual([]);
});

test('timer counts down and game loop stops at timeout', async ({page}) => {
  const errors = monitorRuntime(page);
  await start(page);
  await page.evaluate(() => window.__DUYGU_QA__.setElapsed(59));
  await expect(page.locator('#timeCount')).toHaveText('1');
  await page.waitForTimeout(1200);
  await expect(page.locator('#roadTripResult')).toBeVisible();
  await expect(page.locator('#roadTripGame')).toBeHidden();
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.runtime())).toMatchObject({running:false,rafActive:false});
  expect(errors).toEqual([]);
});

test('star collection and obstacle collision update real game state', async ({page}) => {
  const errors = monitorRuntime(page);
  await start(page);
  await page.evaluate(() => window.__DUYGU_QA__.spawnTestObject('star',1));
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.getState().score)).toBe(1);
  await page.evaluate(() => window.__DUYGU_QA__.spawnTestObject('barrel',1));
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.getState().lives)).toBe(2);
  expect(errors).toEqual([]);
});
