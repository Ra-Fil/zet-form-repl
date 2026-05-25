import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: 'list',
  use: {
    baseURL: 'https://zetor-prohlaseni-vyrobce-8572.rostiapp.cz/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'https://zetor-prohlaseni-vyrobce-8572.rostiapp.cz/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
