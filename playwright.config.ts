import { defineConfig } from '@playwright/test';

const PORT = 4319;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // CI has no GPU: SwiftShader draws a garden frame in seconds, and every click waits for one.
  timeout: process.env.CI ? 180_000 : 30_000,
  expect: { timeout: process.env.CI ? 60_000 : 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // System Chrome is on every GitHub runner, so there's no browser download. SwiftShader gives it WebGL without a GPU.
    channel: 'chrome',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    viewport: { width: 1280, height: 800 },
  },
  // Tests the production build, so run `vite build` first (the test:e2e script does).
  webServer: { command: `vite preview --port ${PORT} --strictPort`, port: PORT, reuseExistingServer: !process.env.CI },
});
