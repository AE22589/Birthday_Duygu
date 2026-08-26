const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 10000,
  },
  projects: [
    { name: 'desktop-1366', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'mobile-390', use: { ...devices['iPhone 12'], browserName: 'chromium' } },
    { name: 'mobile-430', use: { ...devices['iPhone 14 Pro Max'], browserName: 'chromium' } },
    { name: 'mobile-390-webkit', use: { ...devices['iPhone 12'], browserName: 'webkit' } },
  ],
});
