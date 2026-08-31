const { test, expect } = require('@playwright/test');

async function enterFinalQa(page) {
  await page.addInitScript(() => { Date.now = () => new Date('2026-09-07T23:00:00+02:00').getTime(); localStorage.clear(); });
  await page.goto('/index.html');
  await page.locator('#doorHit').click({ clickCount: 5, delay: 80, force: true });
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible({ timeout: 30000 });
  await page.locator('#finalDoorHotspot').click({ clickCount: 5, delay: 80, force: true });
  await expect(page.locator('#adminModal')).toBeVisible();
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await page.locator('#finalDoorHotspot').click();
  await expect(page.locator('#finalDoorModal')).toBeVisible();
  await page.locator('#openFinalDoor').click();
  await expect(page.locator('#returnVideoPanel')).toBeVisible({ timeout: 30000 });
}

test.describe('final choice flow', () => {
  test.setTimeout(60000);
  for (const project of ['desktop-1920', 'mobile-390']) {
    test(`video to final choice (${project})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== project);
      const errors = [];
      let fontsBlocked = false;
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) fontsBlocked = true; else if (!/\/Testvideo\.mp4$/.test(r.url()) || r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`requestfailed: ${r.url()}`); });
      page.on('console', m => { if (m.type() === 'error' && !(fontsBlocked && m.text() === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED')) errors.push(m.text()); });
      await enterFinalQa(page);
      await expect(page.locator('#oneLastChoice')).toBeHidden();
      await expect(page.locator('#choiceContinue')).toBeHidden();
      await expect(page.locator('.path-card')).toHaveCount(3);
      await expect(page.locator('.path-card').first()).toBeHidden();
      await page.locator('#returnVideo').dispatchEvent('ended');
      await page.waitForTimeout(1000);
      await expect(page.locator('#returnVideoPanel')).toBeVisible();
      await expect(page.locator('#oneLastChoice')).toBeHidden();
      await expect(page.locator('#oneLastChoice')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('#oneLastChoice').getByText('Choose wisely.', { exact: true })).toBeVisible();
      await expect(page.locator('#choiceContinue')).toBeVisible();
      await page.locator('#choiceReplay').click();
      await expect(page.locator('#returnVideoPanel')).toBeVisible();
      await page.locator('#returnVideo').dispatchEvent('ended');
      await page.waitForTimeout(1000);
      await expect(page.locator('#returnVideoPanel')).toBeVisible();
      await expect(page.locator('#oneLastChoice')).toBeHidden();
      await expect(page.locator('#oneLastChoice')).toBeVisible({ timeout: 3000 });
      await page.locator('#choiceContinue').click();
      await expect(page.locator('#pathChoice')).toBeVisible();
      await expect(page.getByText('A Duygu Day in Hamburg is waiting for you.')).toBeVisible();
      await expect(page.getByText('Choose your path — I’ll turn it into your next adventure. Then tell me what you chose.')).toBeVisible();
      const stateBefore = await page.evaluate(() => localStorage.getItem('duyguBirthdayQuestState_v1'));
      const requests = []; page.on('request', r => requests.push(r.url()));
      for (const path of ['ACTION', 'CULINARY', 'RELAX']) {
        const card = page.locator(`.path-card[data-path="${path}"]`);
        await card.click();
        await expect(card).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.path-card[aria-pressed="true"]')).toHaveCount(1);
        await expect(page.locator('#pickedPath')).toHaveText(path);
        await expect(page.locator('#pickMessage')).toHaveText('Now tell me what you chose — I’ll take care of the rest.');
      }
      await page.locator('.path-card[data-path="RELAX"]').click();
      await expect(page.locator('#yourPick')).toBeHidden();
      await expect(page.locator('.path-card[aria-pressed="true"]')).toHaveCount(0);
      await page.locator('.path-card[data-path="ACTION"]').press('Enter');
      await expect(page.locator('#yourPick')).toBeVisible();
      await page.locator('.path-card[data-path="ACTION"]').press('Space');
      await expect(page.locator('#yourPick')).toBeHidden();
      await page.locator('.path-card[data-path="RELAX"]').click();
      await expect(page.locator('#yourPick')).toBeVisible();
      await expect(page.locator('.path-card[data-path="ACTION"]')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('#yourPick')).toBeVisible();
      await expect(page.locator('#pickedPath')).toHaveText('RELAX');
      expect(await page.evaluate(() => localStorage.getItem('duyguBirthdayQuestState_v1'))).toBe(stateBefore);
      expect(requests.filter(url => !url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com'))).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});
