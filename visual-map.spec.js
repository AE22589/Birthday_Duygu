const { test, expect } = require('@playwright/test');

test.describe('Quest Map visual regression', () => {
  test('quest map matches approved visual baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('webkit'), 'No separate WebKit golden master; WebKit is covered by functional mobile QA.');
    await page.goto('/index.html?qa=visual-map');
    await expect(page.locator('#questScreen')).toBeVisible();
    await expect(page.locator('#mapImage')).toHaveJSProperty('complete', true);
    await expect(page.locator('#mapImage')).toHaveAttribute('href', /quest-map-(desktop|mobile)\.webp/);
    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - innerWidth,
      y: document.documentElement.scrollHeight - innerHeight
    }));
    expect(overflow.x).toBeLessThanOrEqual(1);
    expect(overflow.y).toBeLessThanOrEqual(1);
    await expect(page).toHaveScreenshot('quest-map.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: 80,
      maxDiffPixelRatio: 0.00015,
    });
  });
});
