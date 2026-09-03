const { test, expect } = require('@playwright/test');

async function enterFinalQa(page) {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-09-08T12:00:00+02:00').getTime();
    if (!localStorage.getItem('duyguBirthdayQuestState_v1')) localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2, 3, 4, 5, 6, 7] }));
  });
  await page.goto('/index.html');
  await expect(page.locator('#questScreen')).toBeVisible({ timeout: 30000 });
  await page.locator('#finalDoorHotspot').click();
  await expect(page.locator('#finalDoorModal')).toBeVisible();
  await page.locator('#openFinalDoor').click();
  await expect(page.locator('#returnVideoPanel')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#returnVideoPlay')).toBeVisible();
  await expect(page.locator('#returnVideoPlay')).toBeEnabled();
  await expect(page.locator('#returnVideo')).toHaveAttribute('src', /bday\.mp4$/);
}

test.describe('final choice flow', () => {
  test.setTimeout(60000);
  for (const project of ['desktop-1366', 'desktop-1920', 'mobile-390']) {
    test(`video to final choice (${project})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== project);
      const errors = [];
      let fontsBlocked = false;
      const mediaRequests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (/\/(bday\.mp4|Testvideo\.mp4)$/.test(r.url())) mediaRequests.push(r.url()); });
      page.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) fontsBlocked = true; else errors.push(`requestfailed: ${r.url()}`); });
      page.on('console', m => { if (m.type() === 'error' && !(fontsBlocked && m.text() === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED')) errors.push(m.text()); });
      await enterFinalQa(page);
      await expect(page.locator('#oneLastChoice')).toBeHidden();
      await expect(page.locator('#choiceContinue')).toBeHidden();
      await expect(page.locator('.path-card')).toHaveCount(3);
      await expect(page.locator('.path-card').first()).toBeHidden();
      await page.locator('#returnVideo').dispatchEvent('ended');
      const firstEndedAt = Date.now();
      await expect(page.locator('#returnVideoPanel')).toHaveClass(/video-fade/, { timeout: 3000 });
      await expect(page.locator('#oneLastChoice')).toBeVisible({ timeout: 3000 });
      expect(Date.now() - firstEndedAt).toBeGreaterThanOrEqual(2200);
      expect(Date.now() - firstEndedAt).toBeLessThan(3500);
      await expect(page.locator('#oneLastChoice').getByText('ONE LAST STEP', { exact: true })).toBeVisible();
      await expect(page.locator('#oneLastChoice').getByText('❤️ HAPPY BIRTHDAY, DUYGU ❤️', { exact: true })).toBeVisible();
      await expect(page.locator('#choiceContinue')).toBeVisible();
      await page.locator('#choiceReplay').click();
      await expect(page.locator('#returnVideoPanel')).toBeVisible();
      await page.locator('#returnVideoPlay').click();
      await page.locator('#returnVideo').dispatchEvent('ended');
      const replayEndedAt = Date.now();
      await expect(page.locator('#returnVideoPanel')).toHaveClass(/video-fade/, { timeout: 3000 });
      await expect(page.locator('#oneLastChoice')).toBeVisible({ timeout: 3000 });
      expect(Date.now() - replayEndedAt).toBeGreaterThanOrEqual(2200);
      expect(Date.now() - replayEndedAt).toBeLessThan(3500);
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
      expect(requests.filter(url => !url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com') && !/\/bday\.mp4$/.test(url))).toEqual([]);
      await expect(page.locator('#returnVideo')).toHaveAttribute('src', /bday\.mp4$/);
      expect(mediaRequests.some(url => /\/bday\.mp4$/.test(url))).toBe(true);
      expect(mediaRequests.some(url => /\/Testvideo\.mp4$/.test(url))).toBe(false);
      expect(errors).toEqual([]);
    });
  }
});
