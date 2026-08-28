const { test, expect } = require('@playwright/test');

function monitorRuntime(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(`console: ${msg.text()}`);});
  page.on('requestfailed',req=>errors.push(`requestfailed: ${req.url()} :: ${req.failure()?.errorText||'unknown'}`));
  return errors;
}

async function reachQuestThree(page){
  await page.addInitScript(()=>{Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime();localStorage.clear();localStorage.setItem('duyguBirthdayQuestState_v1',JSON.stringify({completed:[1,2]}));});
  await page.goto('/index.html');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible();
  await page.locator('[data-quest="3"]').click();
  await expect(page.locator('#sucukMasterIntro')).toBeVisible({timeout:4000});
}

test('Quest III lädt lazy und zeigt die verbindlichen Zwei-Klick-Hinweise', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  expect(await page.evaluate(()=>typeof window.showSucukMasterScreen)).toBe('function');
  await expect(page.locator('#sucukMasterIntro')).toContainText(/turn/i);
  await expect(page.locator('#sucukMasterIntro')).toContainText(/perfect/i);
  await expect(page.locator('#sucukMasterIntro')).toContainText(/burnt/i);
  await expect(page.locator('#sucukMasterIntro')).toContainText(/Lokum/i);
  expect(errors).toEqual([]);
});

test('Quest III verwendet die fünf Produktionsassets und hat vier Pfannen-Slots', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  await page.locator('#smReadyButton').click();
  await expect(page.locator('#sucukMasterGame')).toBeVisible();
  const state=await page.evaluate(()=>{window.__SUCUKMASTER__.spawn();return window.__SUCUKMASTER__.getState();});
  expect(state.slots.length).toBe(4);
  expect(state.slots.filter(s=>s.state==='active').length).toBe(1);
  await expect(page.locator('.sm-slot[data-slot="0"] .sm-pan')).toHaveAttribute('src', /quest-iii\/pan\.png/);
  await expect(page.locator('.sm-slot[data-slot="0"] .sm-sucuk')).toHaveAttribute('src', /quest-iii\/sucuk-raw\.png/);
  const assetResults=await page.evaluate(async urls=>Promise.all(urls.map(async url=>({url,ok:(await fetch(url,{cache:'no-store'})).ok}))),[
    'assets/quest-iii/pan.png','assets/quest-iii/sucuk-raw.png','assets/quest-iii/sucuk-brown.png','assets/quest-iii/sucuk-burnt.png','assets/quest-iii/plate.png'
  ]);
  expect(assetResults.filter(x=>!x.ok)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Zwei-Klick-System: goldene Zone wendet, perfekte Zone beendet', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  await page.locator('#smReadyButton').click();
  await page.evaluate(()=>window.__SUCUKMASTER__.spawn());
  await page.evaluate(()=>window.__SUCUKMASTER__.clickSlot(0,0.70));
  let state=await page.evaluate(()=>window.__SUCUKMASTER__.getState());
  expect(state.slots[0].side).toBe(2);
  expect(state.perfectSucuks).toBe(0);
  await page.evaluate(()=>window.__SUCUKMASTER__.clickSlot(0,0.90));
  state=await page.evaluate(()=>window.__SUCUKMASTER__.getState());
  expect(state.perfectSucuks).toBe(1);
  expect(state.plateCount).toBe(1);
  expect(errors).toEqual([]);
});

test('Verbrannte Pfanne bleibt blockiert und kann per Klick geleert werden', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  await page.locator('#smReadyButton').click();
  await page.evaluate(()=>window.__SUCUKMASTER__.spawn());
  await page.evaluate(()=>window.__SUCUKMASTER__.forceBurn(0));
  let state=await page.evaluate(()=>window.__SUCUKMASTER__.getState());
  expect(state.slots[0].state).toBe('burnt');
  await page.evaluate(()=>window.__SUCUKMASTER__.clickSlot(0,0.99));
  state=await page.evaluate(()=>window.__SUCUKMASTER__.getState());
  expect(state.slots[0].state).toBe('empty');
  expect(errors).toEqual([]);
});

test('Ab fünf perfekten Sucuks gibt es Schlüssel III', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  await page.locator('#smReadyButton').click();
  await page.evaluate(()=>{for(let i=0;i<5;i++){window.__SUCUKMASTER__.spawn();window.__SUCUKMASTER__.clickSlot(i%4,0.70);window.__SUCUKMASTER__.clickSlot(i%4,0.90);}});
  await page.evaluate(()=>window.__SUCUKMASTER__.forceFinish());
  await expect(page.locator('#sucukMasterResult')).toBeVisible();
  await expect(page.locator('#smResultTitle')).toHaveText(/SUCUK MASTER|SUCUK PRO|WELL BROWNED/);
  await expect(page.locator('#smKeyReward')).toBeVisible();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('duyguBirthdayQuestState_v1')));
  expect(stored.completed).toContain(3);
  expect(errors).toEqual([]);
});

test('Quest III ist auf Mobile ohne horizontalen oder vertikalen Dokument-Overflow', async ({page})=>{
  const errors=monitorRuntime(page);
  await reachQuestThree(page);
  await page.locator('#smReadyButton').click();
  const geometry=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
  expect(geometry.sw).toBeLessThanOrEqual(geometry.w+1);
  expect(geometry.sh).toBeLessThanOrEqual(geometry.h+1);
  expect(errors).toEqual([]);
});
