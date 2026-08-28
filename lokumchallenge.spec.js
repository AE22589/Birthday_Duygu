const { test, expect } = require('@playwright/test');

function monitorRuntime(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(`console: ${msg.text()}`);});
  page.on('requestfailed',req=>errors.push(`requestfailed: ${req.url()} :: ${req.failure()?.errorText||'unknown'}`));
  return errors;
}

async function reachQuestFour(page){
  await page.addInitScript(()=>{
    Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime();
    localStorage.clear();
    localStorage.setItem('duyguBirthdayQuestState_v1',JSON.stringify({completed:[1,2,3]}));
  });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await page.locator('.quest-hotspot[data-quest="4"]').click();
  await expect(page.locator('#lokumChallengeIntro')).toBeVisible();
}

test('Quest IV bleibt lazy und lädt erst bei Aktivierung', async ({page})=>{
  await page.addInitScript(()=>{Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime();localStorage.clear();localStorage.setItem('duyguBirthdayQuestState_v1',JSON.stringify({completed:[1,2,3]}));});
  await page.goto('/index.html');
  expect(await page.evaluate(()=>typeof window.showLokumChallengeScreen)).toBe('undefined');
  expect(await page.locator('script[src*="lokumchallenge.js"]').count()).toBe(0);
});

test('Quest IV zeigt zwei Mazes, 20 Treats gesamt und die richtigen Assets', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestFour(page);
  await expect(page.locator('#lokumChallengeIntro')).toContainText(/two mazes/i);
  await page.locator('#lcReadyButton').click();
  await expect(page.locator('#lokumChallengeGame')).toBeVisible();
  await expect(page.locator('#lcMazeImage')).toHaveAttribute('src',/quest-iv\/maze-01\.png/);
  expect(await page.locator('.lc-treat').count()).toBe(8);
  await expect(page.locator('#lcLokum')).toHaveAttribute('src',/quest-iv\/lokum-/);
  const assetResults=await page.evaluate(async urls=>Promise.all(urls.map(async url=>({url,ok:(await fetch(url,{cache:'no-store'})).ok}))),[
    'assets/quest-iv/maze-01.png','assets/quest-iv/maze-02.png',
    'assets/quest-iv/lokum-idle.png','assets/quest-iv/lokum-walk-1.png','assets/quest-iv/lokum-walk-2.png','assets/quest-iv/lokum-walk-3.png',
    'assets/quest-iv/treat-fish.png','assets/quest-iv/treat-pink-fish.png','assets/quest-iv/treat-heart.png','assets/quest-iv/treat-ball.png'
  ]);
  expect(assetResults.filter(x=>!x.ok)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Lokum bewegt sich nur durch aktive Eingabe und sammelt Treats', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestFour(page);
  await page.locator('#lcReadyButton').click();
  const before=await page.evaluate(()=>window.__LOKUMCHALLENGE__.getState());
  await page.waitForTimeout(350);
  const idle=await page.evaluate(()=>window.__LOKUMCHALLENGE__.getState());
  expect([idle.row,idle.col]).toEqual([before.row,before.col]);
  await page.evaluate(()=>['right','up','right','right','up','right','right','up'].forEach(d=>window.__LOKUMCHALLENGE__.move(d)));
  const moved=await page.evaluate(()=>window.__LOKUMCHALLENGE__.getState());
  expect([moved.row,moved.col]).toEqual([5,5]);
  expect(moved.collected.length).toBe(1);
  expect(errors).toEqual([]);
});

test('Maze 1 Exit führt zu Maze 2 und der zweite Exit beendet die Quest', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestFour(page);
  await page.locator('#lcReadyButton').click();
  await page.evaluate(()=>window.__LOKUMCHALLENGE__.forceExit());
  let state=await page.evaluate(()=>window.__LOKUMCHALLENGE__.getState());
  expect(state.mazeIndex).toBe(1);
  expect([state.row,state.col]).toEqual([10,0]);
  await expect(page.locator('#lcMazeImage')).toHaveAttribute('src',/quest-iv\/maze-02\.png/);
  await expect(page.locator('#lcTreatCount')).toHaveText(/\/ 20/);
  await page.evaluate(()=>window.__LOKUMCHALLENGE__.forceExit());
  await expect(page.locator('#lokumChallengeResult')).toBeVisible();
  await expect(page.locator('#lcResultTitle')).toHaveText(/NICE HUNT!/);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1')));
  expect(stored.completed).toContain(4);
  expect(errors).toEqual([]);
});

test('Timeout beendet Quest IV ohne Schlüssel', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestFour(page);
  await page.locator('#lcReadyButton').click();
  await page.evaluate(()=>window.__LOKUMCHALLENGE__.setElapsed(60));
  await page.waitForTimeout(120);
  await expect(page.locator('#lokumChallengeResult')).toBeVisible();
  const state=await page.evaluate(()=>window.__LOKUMCHALLENGE__.getState());
  expect(state.failed).toBe(true);
  expect(errors).toEqual([]);
});

test('Quest IV ist auf Mobile ohne Dokument-Overflow', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestFour(page);
  await page.locator('#lcReadyButton').click();
  const geometry=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
  expect(geometry.sw).toBeLessThanOrEqual(geometry.w+1);
  expect(geometry.sh).toBeLessThanOrEqual(geometry.h+1);
  expect(errors).toEqual([]);
});
