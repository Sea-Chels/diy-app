import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any uncaught error, so a broken scene can't pass just because the DOM rendered. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** The stage sets this once a frame with the whole rig has drawn (see stage.ts). */
const READY = 'canvas[data-scene="ready"]';

/**
 * Share of the canvas's pixels that differ from the page behind it: shots with the canvas shown and hidden,
 * compared in the page, since that has a PNG decoder and Node doesn't without a new dependency.
 */
async function drawnShare(page: Page): Promise<number> {
  const canvas = page.locator(READY);
  // A clipped page shot, since an element shot waits for the element to be visible.
  const clip = await canvas.boundingBox();
  if (!clip) throw new Error('canvas has no box');
  const shown = await page.screenshot({ clip });
  await canvas.evaluate((c) => (c.style.visibility = 'hidden'));
  const hidden = await page.screenshot({ clip });
  await canvas.evaluate((c) => (c.style.visibility = ''));
  return page.evaluate(async ([a, b]) => {
    const pixels = async (b64: string) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, img.width, img.height).data;
    };
    const [p, q] = await Promise.all([pixels(a), pixels(b)]);
    let differ = 0;
    for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 24) differ++;
    return differ / (p.length / 4);
  }, [shown.toString('base64'), hidden.toString('base64')]);
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
    test('scene draws and the quick-fix bar opens a guide', async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(`./${ws}/`);
      await expect(page.locator(READY)).toBeAttached();
      await expect(page.locator('#loader')).toHaveClass(/done/);
      expect(await drawnShare(page)).toBeGreaterThan(0.05);

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
      await expect(page.locator(READY)).toBeAttached();
      await expect(page.locator('.guide-card.open')).toBeVisible();
      await page.evaluate((s) => (location.hash = s), spot);
      await expect(page.locator('#panel')).toHaveClass(/open/);
      await expect(page.locator('.guide-card.open')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });
}

test('garden: #plant= opens the plant guide', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./garden/#plant=pawpaw');
  await expect(page.locator(READY)).toBeAttached();
  await expect(page.locator('.modal')).toBeVisible();
  expect(errors).toEqual([]);
});

test('garage: switching rides swaps the quick fixes', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./garage/');
  await expect(page.locator(READY)).toBeAttached();
  const chips = page.locator('#quick-fixes .quick-chip:not(.more)');
  const car = await chips.allTextContents();
  await page.locator('.ride-switch button').nth(1).click();
  await expect.poll(() => chips.allTextContents()).not.toEqual(car);
  expect(errors).toEqual([]);
});

test.describe(() => {
  // The swap's shrink-and-pop only plays with motion on, and that's what holds the swapping state long enough to see.
  test.use({ reducedMotion: 'no-preference' });
  test('pc: a new cooler rebuilds the rig and draws it', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('./pc/');
    await expect(page.locator(READY)).toBeAttached();
    // A slow runner can pass through the swapping state between two polls, so record it as it happens.
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      new MutationObserver(() => {
        if (canvas?.dataset.scene === 'swapping') document.body.dataset.swapped = '';
      }).observe(canvas as HTMLCanvasElement, { attributeFilter: ['data-scene'] });
    });
    await page.locator('#rig-menu .menu-toggle').click();
    await page.locator('#rig-card .seg[aria-label="Cooling"] button[aria-pressed="false"]').first().click();
    await expect(page.locator('body[data-swapped]')).toBeAttached();
    await expect(page.locator(READY)).toBeAttached();
    expect(await drawnShare(page)).toBeGreaterThan(0.05);
    expect(errors).toEqual([]);
  });
});
