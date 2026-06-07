import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://zetor-prohlaseni-vyrobce-8572.rostiapp.cz/',
  },
});
