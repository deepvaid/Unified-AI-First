import { defineConfig, devices } from 'playwright/test'

export default defineConfig({
  testDir: './tests/onboarding',
  timeout: 60_000,
  expect: {
    timeout: 20_000,
  },
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'output/playwright/onboarding-results',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4178',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
