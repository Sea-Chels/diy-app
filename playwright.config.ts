import { defineConfig } from '@playwright/test';

// Overridable so two checkouts can run the suite at once.
const PORT = Number(process.env.E2E_PORT ?? 4319);
// vite preview serves dist/ under the same base it was built with, so a Pages build is tested at its real path.
const BASE = process.env.VITE_BASE ?? '/';

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // CI has no GPU. Under forced SwiftShader (two workers) the slowest test took 20 s and the longest wait, the garden's first frame, 12 s. A runner is slower than that machine, so the test limit is about 6× and the wait limit about 3×.
  timeout: process.env.CI ? 120_000 : 30_000,
  expect: { timeout: process.env.CI ? 30_000 : 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    // System Chrome is on every GitHub runner, so there's no browser download. SwiftShader gives it WebGL without a GPU.
    channel: 'chrome',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    viewport: { width: 1280, height: 800 },
    // Stills the idle spin and ambient loops, so the scene draws only when something changes: on SwiftShader a garden frame takes about a second.
    reducedMotion: 'reduce',
  },
  // Tests the production build, so run `vite build` first (the test:e2e script does).
  webServer: { command: `vite preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}${BASE}`, reuseExistingServer: !process.env.CI },
});
