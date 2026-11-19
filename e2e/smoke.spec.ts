import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any uncaught error, so a broken scene can't pass just because the DOM rendered. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const WORKSHOPS = [
  { ws: 'pc', guide: 'install-windows', spot: 'gpu' },
  { ws: 'garage', guide: 'oil-change', spot: 'battery' },
  { ws: 'home', guide: 'running-toilet', spot: 'toilet' },
  { ws: 'garden', guide: 'hot-compost', spot: 'compost' },
];

test('hub links to every workshop', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./');
  await expect(page.locator('#loader')).toHaveClass(/done/);
  for (const { ws } of WORKSHOPS) await expect(page.locator(`.nav-link[href="./${ws}/"]`)).toBeVisible();
  expect(errors).toEqual([]);
});

for (const { ws, guide, spot } of WORKSHOPS) {
  test.describe(ws, () => {
    test('scene loads and the quick-fix bar opens a guide', async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(`./${ws}/`);
      await expect(page.locator('#loader')).toHaveClass(/done/);
      const box = await page.locator('canvas').first().boundingBox();
      expect(box?.width).toBeGreaterThan(0);

      await page.locator('#quick-fixes .quick-chip:not(.more)').first().click();
      await expect(page.locator('#panel')).toHaveClass(/open/);
      await expect(page.locator('.guide-card.open')).toBeVisible();
      expect(new URL(page.url()).hash).not.toBe('');

      await page.locator('#panel .icon-btn').first().click();
      await expect(page.locator('#panel')).not.toHaveClass(/open/);
      expect(new URL(page.url()).hash).toBe('');
      expect(errors).toEqual([]);
    });

    test('deep links open a guide or a spot', async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(`./${ws}/#${guide}`);
      await expect(page.locator('.guide-card.open')).toBeVisible();
      await page.evaluate((s) => (location.hash = s), spot);
      await expect(page.locator('#panel')).toHaveClass(/open/);
      await expect(page.locator('.guide-card.open')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });
}

test('garden: #plant= opens the plant guide', async ({ page }) => {
  await page.goto('./garden/#plant=pawpaw');
  await expect(page.locator('.modal')).toBeVisible();
});

test('garage: switching rides swaps the quick fixes', async ({ page }) => {
  await page.goto('./garage/');
  const chips = page.locator('#quick-fixes .quick-chip:not(.more)');
  const car = await chips.allTextContents();
  await page.locator('.ride-switch button').nth(1).click();
  await expect.poll(() => chips.allTextContents()).not.toEqual(car);
});
