const { test, expect } = require('@playwright/test');

async function lockedPage(page) {
  await page.addInitScript(() => {
    const fixed = new Date('2026-09-07T23:00:00+02:00').getTime();
    Date.now = () => fixed;
    localStorage.clear();
  });
  await page.goto('/index.html');
  await expect(page.locator('#entrance')).toBeVisible();
  await expect(page.locator('#questScreen')).toBeHidden();
}

async function unlock(page) {
  await page.locator('#doorHit').click({clickCount:5, delay:80, force:true});
  await expect(page.locator('#adminModal')).toBeVisible();
}

test('security gate rejects direct map access and wrong code', async ({page}) => {
  await lockedPage(page);
  await page.evaluate(() => window.showQuestMap());
  await expect(page.locator('#questScreen')).toBeHidden();
  await unlock(page);
  await page.locator('#adminCode').fill('0000');
  await page.locator('#unlock').click();
  await expect(page.locator('#adminModal')).toBeVisible();
  await expect(page.locator('#questScreen')).toBeHidden();
  await expect(page.locator('#error')).toHaveText('Wrong code.');
});

test('security gate requires exactly five door activations and accepts the correct code', async ({page}) => {
  await lockedPage(page);
  for(let i=0;i<4;i++){
    await page.locator('#doorHit').click({force:true});
    await expect(page.locator('#adminModal')).toBeHidden();
  }
  await page.locator('#doorHit').click({force:true});
  await expect(page.locator('#adminModal')).toBeVisible();
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#adminModal')).toBeHidden();
  await expect(page.locator('#questScreen')).toBeVisible();
  await expect(page.locator('#entrance')).toBeHidden();
});

test('quest map geometry stays aligned and inside viewport', async ({page}, testInfo) => {
  await page.addInitScript(() => { Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime(); });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  const result=await page.evaluate(() => {
    const svg=document.querySelector('#mapInteraction');
    const shell=document.querySelector('#mapShell');
    const ring=document.querySelector('#activeRing');
    const active=document.querySelector('.quest-hotspot[data-quest="1"]');
    const map=document.querySelector('#mapImage');
    const locked=[...document.querySelectorAll('#lockedLayers image')];
    const sr=shell.getBoundingClientRect(), vr={w:innerWidth,h:innerHeight};
    const rc={x:+ring.getAttribute('cx'),y:+ring.getAttribute('cy'),r:+ring.getAttribute('r')};
    const ac={x:+active.getAttribute('cx'),y:+active.getAttribute('cy'),r:+active.getAttribute('r')};
    return {
      viewBox: svg.getAttribute('viewBox'),
      shellInViewport: sr.left>=-1 && sr.top>=-1 && sr.right<=vr.w+1 && sr.bottom<=vr.h+1,
      ringMatchesActive: Math.abs(rc.x-ac.x)<0.01 && Math.abs(rc.y-ac.y)<0.01 && rc.r<=ac.r+0.01,
      mapImageLoaded: map.getAttribute('href') && map.getAttribute('href').includes('quest-map-'),
      lockedLayersAligned: locked.every(x=>x.getAttribute('width')===svg.viewBox.baseVal.width.toString() && x.getAttribute('height')===svg.viewBox.baseVal.height.toString())
    };
  });
  expect(result.shellInViewport).toBeTruthy();
  expect(result.ringMatchesActive).toBeTruthy();
  expect(result.mapImageLoaded).toBeTruthy();
  expect(result.lockedLayersAligned).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
});



test('quest unlock state is refreshed and reachable quests no longer show locked', async ({page}) => {
  await page.addInitScript(() => {
    Date.now=()=>new Date('2026-09-07T23:00:00+02:00').getTime();
    localStorage.clear();
    localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({completed:[1]}));
  });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({clickCount:5,delay:80,force:true});
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('[data-quest="2"]')).toHaveAttribute('aria-label', /ready/i);
  await expect(page.locator('[data-quest="3"]')).toHaveAttribute('aria-label', /locked/i);

  await page.evaluate(() => localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({completed:[1,2]})));
  await page.evaluate(() => window.showQuestMap());
  await expect(page.locator('[data-quest="3"]')).toHaveAttribute('aria-label', /ready/i);
  await page.locator('[data-quest="3"]').click();
  await expect(page.locator('#sucukMasterIntro')).toBeVisible({timeout:4000});
});

test('QA controls are not exposed to a non-automated browser context', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
  });
  await page.goto('/index.html?qa=1');
  await expect(page.locator('#entrance')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__DUYGU_QA__)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.__DUYGU_QA__?.forceFinish)).toBe('undefined');
});

test('admin code locks out for 24h after 3 wrong attempts and survives reload', async ({page}) => {
  await page.addInitScript(() => {
    const fixed = new Date('2026-09-07T23:00:00+02:00').getTime();
    Date.now = () => fixed;
  });
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await unlock(page);
  for (const wrongCode of ['0000', '1111', '2222']) {
    await page.locator('#adminCode').fill(wrongCode);
    await page.locator('#unlock').click();
  }
  await expect(page.locator('#error')).toHaveText(/Too many attempts/);
  await expect(page.locator('#adminCode')).toBeDisabled();
  await expect(page.locator('#unlock')).toBeDisabled();

  // Sperre muss einen Reload überstehen (liegt in localStorage, nicht nur im Speicher).
  await page.reload();
  await page.locator('#doorHit').click({clickCount:5, delay:80, force:true});
  await expect(page.locator('#adminModal')).toBeVisible();
  await expect(page.locator('#error')).toHaveText(/Too many attempts/);
  await expect(page.locator('#adminCode')).toBeDisabled();

  // Selbst der korrekte Code darf während der Sperre nicht greifen.
  const remaining = await page.evaluate(() => window.__DUYGU_SELF_TEST__().lockoutRemainingMs);
  expect(remaining).toBeGreaterThan(0);
  expect(remaining).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
});
