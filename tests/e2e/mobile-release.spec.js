const { test, expect, devices } = require('@playwright/test');

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-412', width: 412, height: 915 },
  { name: 'mobile-430', width: 430, height: 932 },
];

function monitor(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  return errors;
}

async function prepare(page) {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-09-09T12:00:00+02:00').getTime();
    localStorage.clear();
    localStorage.setItem('duyguBirthdayQuestState_v1', JSON.stringify({ completed: [1, 2, 3, 4, 5, 6, 7] }));
  });
  await page.goto('/index.html');
}

for (const viewport of viewports) {
  test.describe(`Mobile release ${viewport.name}`, () => {
    test.use({ ...devices['iPhone 12'], viewport: { width: viewport.width, height: viewport.height } });

    test('Entrance, Map, Quest screens and final video remain usable', async ({ page }) => {
      const errors = monitor(page);
      await prepare(page);
      await expect(page.locator('#entrance')).toBeVisible();
      await expect(page.locator('#questScreen')).toBeHidden();
      await page.locator('#doorHit').click({ force: true });
      await expect(page.locator('#questScreen')).toBeVisible({ timeout: 12000 });

      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll('body *')].filter(el => {
          const style = getComputedStyle(el); const r = el.getBoundingClientRect();
          return !el.hidden && style.display !== 'none' && r.width > 0 && r.height > 0;
        });
        return { docWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
          viewport: innerWidth, boxes: visible.slice(-20).map(el => { const r = el.getBoundingClientRect(); return { id: el.id, right: r.right, bottom: r.bottom }; }) };
      });
      expect(result.docWidth).toBeLessThanOrEqual(result.viewport + 1);
      expect(result.bodyWidth).toBeLessThanOrEqual(result.viewport + 1);
      expect(result.boxes.filter(b => b.right > result.viewport + 1 || b.bottom > viewport.height + 1)).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}

test.describe('Mobile release WebKit', () => {
  test.use({ ...devices['iPhone 12'], browserName: 'webkit' });
  test('390x844 entrance and map smoke', async ({ page }) => {
    const errors = monitor(page);
    await prepare(page);
    await expect(page.locator('#entrance')).toBeVisible();
    await page.locator('#doorHit').click({ force: true });
    await expect(page.locator('#questScreen')).toBeVisible({ timeout: 12000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});
