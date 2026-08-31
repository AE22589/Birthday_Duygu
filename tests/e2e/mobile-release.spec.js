const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-412', width: 412, height: 915 },
  { name: 'mobile-430', width: 430, height: 932 },
];

function monitor(page) {
  const errors = [];
  let fontsBlocked = false;
  const isWebKit = page.context().browser()?.browserType().name() === 'webkit';
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => {
    const url = request.url(), reason = request.failure()?.errorText || '';
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) { fontsBlocked = true; return; }
    if (/\/Testvideo\.mp4$/.test(url) && reason === 'net::ERR_ABORTED') return;
    if (isWebKit && /\/Testvideo\.mp4$/.test(url) && reason === 'Load request cancelled') return;
    errors.push(`requestfailed: ${url} (${reason})`);
  });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (isWebKit && text === 'Button failed to load, iconName = invalid-placard, layoutTraits = [AdwaitaLayoutTraits Inline], src = data:image/png;base64,') return;
    if (isWebKit && text === 'Could not connect to server') return;
    if (fontsBlocked && text === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED') return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function prepare(page) {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-08-01T12:00:00+02:00').getTime();
    localStorage.clear();
  });
  await page.goto('/index.html');
  await expect(page.locator('#entrance')).toBeVisible();
  await expect(page.locator('#doorHit')).toBeVisible();
  await expect(page.locator('#questScreen')).toBeHidden();
  for (let i = 0; i < 5; i++) {
    await page.locator('#doorHit').click({ force: true });
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#adminModal')).toBeVisible();
  await page.locator('#adminCode').fill('1337');
  await page.locator('#unlock').click();
  await expect(page.locator('#questScreen')).toBeVisible({ timeout: 30000 });
}

for (const viewport of viewports) {
  test.describe(`Mobile release ${viewport.name}`, () => {
    test('Entrance, Map, Quest screens and final video remain usable', async ({ page }) => {
      if (viewport.name === 'mobile-390') test.setTimeout(45000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const errors = monitor(page);
      await prepare(page);
      await expect(page.locator('#questScreen')).toBeVisible();
      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll('body *')].filter(el => {
          const style = getComputedStyle(el); const r = el.getBoundingClientRect();
          return !el.hidden && style.display !== 'none' && r.width > 0 && r.height > 0;
        });
        return { docWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
          viewport: innerWidth, boxes: visible.slice(-20).filter(el => el.id !== 'toast').map(el => { const r = el.getBoundingClientRect(); return { id: el.id, right: r.right, bottom: r.bottom }; }) };
      });
      expect(result.docWidth).toBeLessThanOrEqual(result.viewport + 1);
      expect(result.bodyWidth).toBeLessThanOrEqual(result.viewport + 1);
      expect(result.boxes.filter(b => b.right > result.viewport + 1 || b.bottom > viewport.height + 1)).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}
