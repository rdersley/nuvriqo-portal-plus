// Live multi-help-center checks against a real site, signed in as two
// different test customers. Configure with environment variables; see
// live-tests/README.md. Session files hold logins and must never be committed.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './live-tests',
  timeout: 90000,
  retries: 0,
  workers: 1,
  outputDir: 'live-test-results',
  use: {
    browserName: 'chromium',
    viewport: { width: 1366, height: 900 },
    screenshot: 'on',
    trace: 'retain-on-failure',
    acceptDownloads: true
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'live-test-report' }]]
});
