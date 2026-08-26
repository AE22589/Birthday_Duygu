const { test, expect } = require('@playwright/test');

test.describe('Quest Map visual regression', () => {
  test('quest map matches approved visual baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('webkit'), 'No separate WebKit golden master; WebKit is covered by functional mobile QA.');
    if (testInfo.project.name === 'mobile-390') await page.setViewportSize({ width: 390, height: 844 });
    if (testInfo.project.name === 'mobile-430') await page.setViewportSize({ width: 430, height: 932 });

    await page.goto('/index.html?qa=visual-map');
    await expect(page.locator('#questScreen')).toBeVisible();
    await expect.poll(async () => await page.evaluate(() => {
      const map = document.querySelector('#mapImage');
      if (!map) return false;
      return !!map.getAttribute('href') && !!map.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    })).toBeTruthy();
    await expect(page.locator('#mapImage')).toHaveAttribute('href', /quest-map-(desktop|mobile)\.webp/);

    // #mapImage is an SVG <image>, not an HTMLImageElement. It therefore does
    // not reliably expose .complete/.naturalWidth/.decode(). Preload the
    // resolved WebP as a normal Image and wait for its actual load event so the
    // screenshot is deterministic without hanging on a never-fired SVG event.
    const mapSrc = await page.locator('#mapImage').getAttribute('href');
    await page.evaluate(async src => {
      if (!src) throw new Error('Quest map source is missing');
      const url = new URL(src, location.href).href;
      const image = new Image();
      image.src = url;
      await new Promise((resolve, reject) => {
        if (image.complete && image.naturalWidth > 0) return resolve();
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error(`Failed to preload quest map: ${url}`)), { once: true });
      });
      if (typeof image.decode === 'function') await image.decode().catch(() => {});
    }, mapSrc);

    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });

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
      maxDiffPixels: 6500,
      maxDiffPixelRatio: 0.003,
    });
  });
});
