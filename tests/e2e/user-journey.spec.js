const { test, expect } = require('@playwright/test');

function monitorRuntime(page) {
  const errors=[];
  let fontsBlocked=false;
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{
    if(m.type()!=='error') return;
    const text=m.text();
    if (/fonts\.(googleapis|gstatic)\.com/.test(text)) return;
    if (fontsBlocked && text === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED') return;
    errors.push(`console: ${text}`);
  });
  page.on('requestfailed',r=>{
    const url=r.url(), reason=r.failure()?.errorText || '';
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) { fontsBlocked=true; return; }
    if (/\/Testvideo\.mp4$/.test(url) && /cancel|abort/i.test(reason)) return;
    errors.push(`requestfailed: ${url} (${reason})`);
  });
  return errors;
}

async function start(page) {
  await page.addInitScript(() => {
    Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime();
    localStorage.clear();
  });
  await page.goto('/index.html?qa=1');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await page.locator('[data-quest="1"]').click();
  await expect(page.locator('#roadTripIntro')).toBeVisible();
  await expect(page.locator('#roadTripIntro .rt-hint').first()).toBeVisible();
  await expect(page.locator('#roadTripIntro .rt-rules')).toBeVisible();
  await page.locator('#readyButton').click();
  await expect(page.locator('#roadTripGame')).toBeVisible({timeout:6000});
}


async function waitForInputCooldown(page) {
  await page.waitForTimeout(140);
}

async function carCenter(page) {
  const b=await page.locator('#playerCar').boundingBox();
  if(!b) throw new Error('player car has no bounding box');
  return b.x+b.width/2;
}

async function swipe(page, from, to) {
  const board=page.locator('#roadBoard');
  const b=await board.boundingBox();
  if(!b) throw new Error('road board has no bounding box');
  const y=b.y+b.height/2;
  await page.evaluate(({x1,x2,y})=>{
    const el=document.querySelector('#roadBoard');
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:77,pointerType:'touch',clientX:x1,clientY:y}));
    el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:77,pointerType:'touch',clientX:x2,clientY:y}));
  },{x1:b.x+b.width*from,x2:b.x+b.width*to,y});
}

test('real user journey: desktop controls and gameplay outcomes', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile-'));
  const errors=monitorRuntime(page);
  await start(page);
  const timerBefore=Number(await page.locator('#timeCount').textContent());
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#roadTripGame')).toBeVisible();
  await expect.poll(async()=>Number(await page.locator('#timeCount').textContent())).toBeLessThanOrEqual(timerBefore);
  await expect(page.locator('#starCount')).toHaveText(/^\d+ \/ 15$/);
  await expect(page.locator('#roadBoard')).toBeVisible();
  expect(errors).toEqual([]);
});

test('real user journey: mobile swipe controls and gameplay outcomes', async ({page}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'));
  const errors=monitorRuntime(page);
  await start(page);
  const initial=await carCenter(page);
  await waitForInputCooldown(page);
  await swipe(page,.70,.30);
  await expect.poll(async()=>await page.locator('#playerCar').getAttribute('data-lane')).toBe('0');
  await expect.poll(async()=>await carCenter(page)).toBeLessThan(initial-10);
  await waitForInputCooldown(page);
  await swipe(page,.30,.70);
  await expect.poll(async()=>await page.locator('#playerCar').getAttribute('data-lane')).toBe('1');
  await waitForInputCooldown(page);
  await swipe(page,.50,.53);
  await page.waitForTimeout(160);
  await expect(page.locator('#playerCar')).toHaveAttribute('data-lane','1');
  await page.evaluate(()=>window.__DUYGU_QA__.spawnTestObject('star',1));
  await expect.poll(async()=>await page.evaluate(()=>window.__DUYGU_QA__.getState().score)).toBe(1);
  await page.evaluate(()=>window.__DUYGU_QA__.setScore(20));
  await page.evaluate(()=>window.__DUYGU_QA__.forceFinish(false));
  await expect(page.locator('#keyReward')).toBeVisible();
  await page.locator('#returnToMapFromResult').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  expect(errors).toEqual([]);
});
